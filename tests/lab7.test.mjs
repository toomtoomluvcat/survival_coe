import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createBoard, parseIp, subnetFor, rowErrors, analyzeBoard, toCsv } from "../lib/lab7-address.mjs";
import { createBoardStore } from "../lib/lab7-store.mjs";

test("topology has 28 base interfaces, with paired transit and serial links", () => {
  const rows = createBoard().rows;
  assert.equal(rows.filter((r) => !r.extension).length, 28);
  assert.equal(rows.filter((r) => r.extension).length, 2);
  for (const key of new Set(rows.filter((r) => !r.segment.includes("LAN")).map((r) => r.segment))) {
    assert.equal(rows.filter((r) => r.segment === key).length, 2);
  }
  assert.equal(rows.filter((r) => r.ip).length, 0);
});

test("IPv4 arithmetic and host validity cover edge cases", () => {
  assert.equal(subnetFor("192.168.1.129", "25").cidr, "192.168.1.128/25");
  assert.equal(subnetFor("192.168.1.129", "25").mask, "255.255.255.128");
  assert.equal(subnetFor("192.168.1.129", "0").cidr, "0.0.0.0/0");
  for (const ip of ["300.1.1.1", "1.2.3", "192.168.01.1", "1.2.3.-1"]) assert.equal(parseIp(ip), null);
  for (const ip of ["192.168.1.0", "192.168.1.255", "127.0.0.1", "224.0.0.9"]) assert.ok(rowErrors({ ip, prefix: "24" }).length);
  assert.deepEqual(rowErrors({ ip: "10.0.0.0", prefix: "31" }), []);
  assert.deepEqual(rowErrors({ ip: "10.0.0.1", prefix: "32" }), []);
  assert.deepEqual(rowErrors({ ip: "", prefix: "" }), []);
  assert.ok(rowErrors({ ip: "10.0.0.1", prefix: "" }).length);
});

test("same-link subnet is allowed; mismatches, overlaps and duplicate hosts are distinguished", () => {
  const a = { id: "a", group: 1, router: 1, label: "Serial", segment: "LINK", ip: "10.0.0.1", prefix: "30" };
  const b = { ...a, id: "b", group: 2, ip: "10.0.0.2" };
  assert.deepEqual(analyzeBoard([a, b]), []);
  assert.ok(analyzeBoard([a, { ...b, ip: "10.0.0.5" }]).some((i) => i.kind === "mismatch"));
  assert.ok(analyzeBoard([a, { ...b, segment: "OTHER" }]).some((i) => i.kind === "overlap"));
  assert.ok(analyzeBoard([a, { ...b, ip: a.ip }]).some((i) => i.kind === "duplicate"));
});

test("CSV escapes quotes, multiline notes and spreadsheet formulas", () => {
  const row = { ...createBoard().rows[0], note: '=CMD("x")\nline2' };
  assert.ok(toCsv([row]).includes('"\'=CMD(""x"")\nline2"'));
});

test("shared store persists, prevents concurrent duplicate IPs and protects concurrent edits", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "lab7-test-"));
  try {
    const store = createBoardStore(dir);
    const board = await store.read();
    const [first, second] = board.rows;
    const attempts = await Promise.allSettled([
      store.update({ ...first, ip: "10.10.1.1", prefix: "24" }),
      store.update({ ...second, ip: "10.10.1.1", prefix: "24" }),
    ]);
    assert.equal(attempts.filter((r) => r.status === "fulfilled").length, 1);
    assert.equal(attempts.find((r) => r.status === "rejected").reason.status, 422);
    await assert.rejects(store.update({ ...first, ip: "10.10.1.2", prefix: "24" }), (e) => e.status === 409);
    await store.update({ ...second, ip: "10.20.1.1", prefix: "24" });
    const reloaded = await createBoardStore(dir).read();
    assert.equal(reloaded.rows[0].ip, "10.10.1.1");
    assert.equal(reloaded.rows[1].ip, "10.20.1.1");
    assert.equal(reloaded.revision, 2);
    await assert.rejects(store.update({ ...reloaded.rows[0], ip: "10.0.0.255", prefix: "24" }), (e) => e.status === 422);
    await store.update({ ...reloaded.rows[0], ip: "", prefix: "" });
    assert.equal((await store.read()).rows[0].ip, "");
  } finally { await rm(dir, { recursive: true, force: true }); }
});
