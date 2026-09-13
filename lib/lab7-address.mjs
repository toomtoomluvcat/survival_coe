export const GROUPS = [1, 2, 3, 4, 5];

const IP_BASE = "192.4";

const LAN_BLOCKS = {
  1: [11, 12, 13],
  2: [21, 22, 23],
  3: [31, 32, 33],
  4: [41, 42, 43],
  5: [51, 52, 53],
};

const LINK_BLOCKS = {
  "LINK-1-2": 101,
  "LINK-2-3": 102,
  "LINK-3-4": 103,
  "LINK-4-5": 104,
  "EXTRA-3-4": 105,
};

function defaultAddress(group, router, slot) {
  const [lan1, transit, lan2] = LAN_BLOCKS[group];
  if (slot === "pc") return { device: "pc", port: "Ethernet", ip: `${IP_BASE}.${router === 1 ? lan1 : lan2}.2`, prefix: "24" };
  if (router === 1 && slot === "lan") return { port: "GigabitEthernet0/0", ip: `${IP_BASE}.${lan1}.1`, prefix: "24" };
  if (router === 1 && slot === "transit") return { port: "GigabitEthernet0/1", ip: `${IP_BASE}.${transit}.1`, prefix: "24" };
  if (router === 2 && slot === "transit") return { port: "GigabitEthernet0/1", ip: `${IP_BASE}.${transit}.2`, prefix: "24" };
  if (router === 2 && slot === "lan") return { port: "GigabitEthernet0/0", ip: `${IP_BASE}.${lan2}.1`, prefix: "24" };
  if (router === 2 && slot === "extra") {
    const side = group === 3 ? 1 : 2;
    return { port: "Serial0/1/0", ip: `${IP_BASE}.105.${side}`, prefix: "24" };
  }
  if (router === 1 && (slot === "left" || slot === "right")) {
    const segment = slot === "left" ? `LINK-${group - 1}-${group}` : `LINK-${group}-${group + 1}`;
    const block = LINK_BLOCKS[segment];
    const side = slot === "left" ? 2 : 1;
    return { port: slot === "left" ? "Serial0/0/0" : "Serial0/0/1", ip: `${IP_BASE}.${block}.${side}`, prefix: "24" };
  }
  return {};
}

export function createBoard() {
  const rows = [];
  const add = (group, router, slot, label, segment, peer, extension = false) => rows.push({
    id: `g${group}-r${router}-${slot}`, group, router, label, segment, peer, extension,
    device: "router", note: "", ...defaultAddress(group, router, slot), revision: 0,
  });
  for (const g of GROUPS) {
    add(g, 1, "lan", "LAN → PC1", `G${g}-LAN1`, "PC1");
    add(g, 1, "transit", "ภายในกลุ่ม → R2", `G${g}-TRANSIT`, `G${g} · R2`);
    if (g > 1) add(g, 1, "left", `Serial → กลุ่ม ${g - 1}`, `LINK-${g - 1}-${g}`, `G${g - 1} · R1`);
    if (g < 5) add(g, 1, "right", `Serial → กลุ่ม ${g + 1}`, `LINK-${g}-${g + 1}`, `G${g + 1} · R1`);
    add(g, 2, "transit", "ภายในกลุ่ม → R1", `G${g}-TRANSIT`, `G${g} · R1`);
    add(g, 2, "lan", "LAN → PC2", `G${g}-LAN2`, "PC2");
    add(g, 1, "pc", "PC1", `G${g}-LAN1`, `G${g} · R1`);
    add(g, 2, "pc", "PC2", `G${g}-LAN2`, `G${g} · R2`);
    if (g === 3 || g === 4) add(g, 2, "extra", `สายเพิ่ม → กลุ่ม ${g === 3 ? 4 : 3}`, "EXTRA-3-4", `G${g === 3 ? 4 : 3} · R2`, true);
  }
  return { version: 2, revision: 0, updatedAt: null, rows };
}

export function gatewayFor(rows, pc) {
  return rows.find((r) => r.id === `g${pc.group}-r${pc.router}-lan`)?.ip || "";
}

export function nodeAddresses(rows, group, router, device) {
  return rows.filter((r) => r.id === `g${group}-r${router}-${device === "pc" ? "pc" : "lan"}`);
}

export function routerConfig(rows, group, router) {
  const ports = rows.filter((r) => r.group === group && r.router === router && r.device !== "pc");
  const lines = ["enable", "configure terminal", `hostname G${group}-R${router}`];
  for (const row of ports) {
    const subnet = subnetFor(row.ip, row.prefix);
    if (!subnet || !row.port) continue;
    lines.push(`interface ${row.port}`, `ip address ${row.ip} ${subnet.mask}`, "no shutdown", "exit");
  }
  lines.push("router rip", "version 1");
  for (const network of new Set(ports.map((r) => subnetFor(r.ip, r.prefix)?.start).filter((n) => n !== undefined))) {
    lines.push(`network ${formatIp(network)}`);
  }
  lines.push("end", "show ip interface brief", "show ip protocols", "show ip route");
  return lines.join("\n");
}

export function parseIp(value) {
  if (typeof value !== "string" || !/^(0|[1-9]\d{0,2})(\.(0|[1-9]\d{0,2})){3}$/.test(value)) return null;
  const parts = value.split(".").map(Number);
  if (parts.some((v) => v > 255)) return null;
  return parts.reduce((n, v) => n * 256 + v, 0);
}

export function formatIp(number) {
  return [24, 16, 8, 0].map((bits) => (number >>> bits) & 255).join(".");
}

export function subnetFor(ip, prefix) {
  const address = parseIp(ip);
  if (address === null || !/^(\d|[12]\d|3[0-2])$/.test(String(prefix))) return null;
  const p = Number(prefix);
  const size = 2 ** (32 - p);
  const start = Math.floor(address / size) * size;
  return { address, prefix: p, start, end: start + size - 1, cidr: `${formatIp(start)}/${p}`, mask: formatIp(2 ** 32 - size) };
}

export function rowLabel(row) { return `G${row.group} · R${row.router} · ${row.label}`; }

export function rowErrors(row) {
  const errors = [];
  if (row.ip && parseIp(row.ip) === null) errors.push("รูปแบบ IPv4 ไม่ถูกต้อง เช่น 192.168.1.1");
  if (row.prefix && !/^(\d|[12]\d|3[0-2])$/.test(row.prefix)) errors.push("Prefix ต้องเป็นเลข 0–32");
  if (Boolean(row.ip) !== Boolean(row.prefix)) errors.push("กรอก IP และ prefix ให้ครบคู่กัน");
  if (parseIp(row.ip) !== null) {
    const first = Number(row.ip.split(".")[0]);
    if (first === 0 || first === 127 || first >= 224) errors.push("IP นี้ไม่ใช่ unicast address สำหรับ interface ในแลป");
  }
  const subnet = subnetFor(row.ip, row.prefix);
  if (subnet && subnet.prefix <= 30 && [subnet.start, subnet.end].includes(subnet.address)) {
    errors.push("IP นี้เป็น network หรือ broadcast address ใช้กับ interface ไม่ได้");
  }
  return errors;
}

export function analyzeBoard(rows) {
  const issues = [];
  for (const row of rows) {
    for (const message of rowErrors(row)) issues.push({ kind: "invalid", ids: [row.id], message: `${rowLabel(row)}: ${message}` });
  }
  for (let i = 0; i < rows.length; i++) {
    const a = rows[i];
    const sa = subnetFor(a.ip, a.prefix);
    for (const b of rows.slice(i + 1)) {
      const ids = [a.id, b.id];
      const names = `${rowLabel(a)} ↔ ${rowLabel(b)}`;
      if (a.ip && parseIp(a.ip) !== null && a.ip === b.ip) issues.push({ kind: "duplicate", ids, message: `IP ${a.ip} ซ้ำ: ${names}` });
      const sb = subnetFor(b.ip, b.prefix);
      if (!sa || !sb) continue;
      if (a.segment === b.segment && (sa.start !== sb.start || sa.prefix !== sb.prefix)) {
        issues.push({ kind: "mismatch", ids, message: `สายเดียวกัน แต่ subnet ไม่ตรงกัน: ${names} (${sa.cidr} / ${sb.cidr})` });
      } else if (a.segment !== b.segment && sa.start <= sb.end && sb.start <= sa.end) {
        issues.push({ kind: "overlap", ids, message: `คนละวงใช้ subnet ทับกัน: ${names} (${sa.cidr} / ${sb.cidr})` });
      }
    }
  }
  return issues;
}

export function toCsv(rows) {
  const cell = (value) => {
    const s = String(value ?? "");
    return `"${(/^[=+@\-\t\r\n]/.test(s) ? "'" + s : s).replaceAll('"', '""')}"`;
  };
  const records = [["Group", "Router", "Connection", "Interface", "IP", "Prefix", "Subnet mask", "Network", "Segment", "Note"]];
  for (const r of rows) {
    const s = subnetFor(r.ip, r.prefix);
    records.push([r.group, `R${r.router}`, r.label, r.port, r.ip, r.prefix, s?.mask, s?.cidr, r.segment, r.note]);
  }
  return "\uFEFF" + records.map((r) => r.map(cell).join(",")).join("\r\n");
}
