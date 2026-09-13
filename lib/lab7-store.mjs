import { mkdir, readFile, writeFile, rename, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createBoard, rowErrors } from "./lab7-address.mjs";

export class BoardError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}

// One queue per local server; an atomic rename keeps readers from seeing partial JSON.
export function createBoardStore(directory) {
  let pending = Promise.resolve();
  const file = path.join(directory, "board.json");
  async function read() {
    try {
      const board = JSON.parse(await readFile(file, "utf8"));
      if (board.rows?.length && board.rows.every((row) => !row.ip && !row.prefix && !row.port)) return createBoard();
      return board;
    }
    catch (error) { if (error.code === "ENOENT") return createBoard(); throw error; }
  }
  async function update(input) {
    const run = async () => {
      if (!input || typeof input !== "object" || typeof input.id !== "string" || !Number.isInteger(input.revision)) throw new BoardError("ข้อมูลที่ส่งมาไม่ถูกต้อง", 400);
      const board = await read();
      const current = board.rows.find((r) => r.id === input.id);
      if (!current) throw new BoardError("ไม่พบ interface นี้", 404);
      if (current.revision !== input.revision) throw new BoardError("มีคนแก้ interface นี้แล้ว โหลดค่าล่าสุดก่อนแก้อีกครั้ง", 409);
      const changes = {};
      for (const [field, max] of [["port", 50], ["ip", 15], ["prefix", 2], ["note", 300]]) {
        if (typeof input[field] !== "string" || input[field].length > max) throw new BoardError(`ข้อมูล ${field} ไม่ถูกต้อง`, 400);
        changes[field] = input[field].trim();
      }
      const next = { ...current, ...changes, revision: current.revision + 1 };
      const errors = rowErrors(next);
      if (errors.length) throw new BoardError(errors.join(" · "), 422);
      const duplicate = next.ip && board.rows.find((r) => r.id !== next.id && r.ip === next.ip);
      if (duplicate) throw new BoardError(`IP ${next.ip} ถูกใช้แล้วที่ G${duplicate.group} · R${duplicate.router} · ${duplicate.label}`, 422);
      const samePort = next.port && board.rows.find((r) => r.id !== next.id && r.group === next.group && r.router === next.router && r.port.toLowerCase() === next.port.toLowerCase());
      if (samePort) throw new BoardError(`ชื่อ interface ${next.port} ถูกใช้กับ ${samePort.label} แล้ว`, 422);
      board.rows = board.rows.map((r) => r.id === next.id ? next : r);
      board.revision += 1;
      board.updatedAt = new Date().toISOString();
      await mkdir(directory, { recursive: true });
      const temporary = path.join(directory, `${randomUUID()}.tmp`);
      try {
        await writeFile(temporary, JSON.stringify(board, null, 2), { mode: 0o600 });
        await rename(temporary, file);
      } finally { await unlink(temporary).catch(() => {}); }
      return board;
    };
    const result = pending.then(run, run);
    pending = result.catch(() => {});
    return result;
  }
  return { read, update };
}

const key = Symbol.for("my-hub.lab7.store");
export function getBoardStore() {
  globalThis[key] ??= createBoardStore(path.join(process.cwd(), ".data", "lab7"));
  return globalThis[key];
}
