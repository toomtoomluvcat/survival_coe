"use client";

// เครื่องมือคำนวณว่า Host A ping ไปหา Host B ได้ไหม และ Host B ping กลับมาได้ไหม
// รับ IP + subnet mask (dotted decimal หรือ CIDR ก็ได้) ของสองเครื่อง แล้วเทียบ network address
// ตามมุมมองของแต่ละเครื่อง (เครื่องแต่ละตัวใช้ mask ของตัวเองคำนวณ ไม่ได้ใช้ mask ร่วมกัน)
// ถ้ามุมมองไม่ตรงกัน (เช่น เครื่องหนึ่งคิดว่าอีกเครื่องอยู่ subnet เดียวกัน แต่อีกเครื่องคิดว่าไม่ใช่)
// จะอธิบายว่า reply กลับไม่ได้ถ้าไม่มี default gateway ตั้งไว้
// หน้านี้ไม่มี CSS แต่งเพิ่ม ตามธรรมเนียมของโปรเจกต์นี้

import Link from "next/link";
import { useState } from "react";

function ipToInt(ip) {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) return null;
    const v = Number(p);
    if (v < 0 || v > 255) return null;
    n = (n << 8) | v;
  }
  return n >>> 0;
}

function intToIp(n) {
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
}

// รับ mask เป็น "255.255.255.0" หรือ "/24" หรือ "24" ก็ได้ คืนค่า { prefix, maskInt } หรือ null
function parseMask(input) {
  const raw = input.trim();
  if (raw.startsWith("/")) {
    const prefix = Number(raw.slice(1));
    if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) return null;
    const maskInt = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
    return { prefix, maskInt };
  }
  if (/^\d+$/.test(raw)) {
    const prefix = Number(raw);
    if (prefix < 0 || prefix > 32) return null;
    const maskInt = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
    return { prefix, maskInt };
  }
  const maskInt = ipToInt(raw);
  if (maskInt === null) return null;
  // ต้องเป็น mask ที่ถูกต้อง คือบิต 1 ต่อกันจากซ้าย ไม่มีสลับ 0-1
  const inverted = ~maskInt >>> 0;
  if (((inverted + 1) & inverted) !== 0 && inverted !== 0xffffffff) return null;
  let prefix = 0;
  let m = maskInt;
  for (let i = 0; i < 32; i++) {
    if (m & 0x80000000) prefix++;
    m = (m << 1) >>> 0;
  }
  return { prefix, maskInt };
}

// เครื่อง viewer มองว่า target อยู่ subnet เดียวกันไหม ใช้ mask ของ viewer เอง
function sameSubnetFromViewerPerspective(viewerIpInt, viewerMaskInt, targetIpInt) {
  return (viewerIpInt & viewerMaskInt) === (targetIpInt & viewerMaskInt);
}

// วิเคราะห์ทิศทางเดียว: from -> to
function analyzeOneWay(from, to) {
  const fromLocal = sameSubnetFromViewerPerspective(from.ipInt, from.maskInt, to.ipInt);
  if (fromLocal) {
    return {
      ok: true,
      reason: `${from.name} มองว่า ${to.name} อยู่ subnet เดียวกัน (จาก mask ของ ${from.name} เอง) จึงส่ง packet ตรงบน LAN ได้เลยโดยไม่ต้องผ่าน gateway`,
    };
  }
  if (from.gateway.trim()) {
    return {
      ok: true,
      reason: `${from.name} มองว่า ${to.name} อยู่คนละ subnet แต่มี default gateway ตั้งไว้ (${from.gateway.trim()}) จึงส่ง packet ผ่าน gateway ออกไปได้ สมมติว่า gateway มีเส้นทางไปหา ${to.name} จริง`,
    };
  }
  return {
    ok: false,
    reason: `${from.name} มองว่า ${to.name} อยู่คนละ subnet และไม่ได้ตั้ง default gateway ไว้ จึงส่ง packet ออกไปไม่ได้เลย`,
  };
}

function buildHost(name, ipStr, maskStr, gatewayStr) {
  const ipInt = ipToInt(ipStr);
  const maskParsed = parseMask(maskStr);
  if (ipInt === null) return { error: `${name}: รูปแบบ IP address ไม่ถูกต้อง` };
  if (maskParsed === null) return { error: `${name}: รูปแบบ subnet mask ไม่ถูกต้อง` };
  return {
    name,
    ip: ipStr.trim(),
    ipInt,
    mask: maskStr.trim(),
    maskInt: maskParsed.maskInt,
    prefix: maskParsed.prefix,
    network: intToIp(ipInt & maskParsed.maskInt),
    gateway: gatewayStr,
  };
}

export default function SubnetPingCalculatorPage() {
  const [aName, setAName] = useState("PC1");
  const [aIp, setAIp] = useState("10.4.106.100");
  const [aMask, setAMask] = useState("255.255.255.0");
  const [aGw, setAGw] = useState("");

  const [bName, setBName] = useState("PC4");
  const [bIp, setBIp] = useState("10.4.106.121");
  const [bMask, setBMask] = useState("255.255.255.240");
  const [bGw, setBGw] = useState("");

  const [result, setResult] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    const hostA = buildHost(aName || "Host A", aIp, aMask, aGw);
    if (hostA.error) {
      setResult({ error: hostA.error });
      return;
    }
    const hostB = buildHost(bName || "Host B", bIp, bMask, bGw);
    if (hostB.error) {
      setResult({ error: hostB.error });
      return;
    }
    const aToB = analyzeOneWay(hostA, hostB);
    const bToA = analyzeOneWay(hostB, hostA);
    setResult({ hostA, hostB, aToB, bToA });
  }

  return (
    <main>
      <h1>Subnet Ping Calculator</h1>
      <p>
        ใส่ IP address และ subnet mask ของสองเครื่อง เช็คว่า ping ไปได้ไหม
        และ ping กลับมาได้ไหม subnet mask ใส่แบบ 255.255.255.0 หรือ /24 หรือ 24 ก็ได้
      </p>

      <hr />

      <form onSubmit={handleSubmit}>
        <h2>Host A</h2>
        <p>
          <label>
            ชื่อเครื่อง{" "}
            <input value={aName} onChange={(e) => setAName(e.target.value)} />
          </label>
        </p>
        <p>
          <label>
            IP address{" "}
            <input value={aIp} onChange={(e) => setAIp(e.target.value)} />
          </label>
        </p>
        <p>
          <label>
            Subnet mask{" "}
            <input value={aMask} onChange={(e) => setAMask(e.target.value)} />
          </label>
        </p>
        <p>
          <label>
            Default gateway (ไม่ใส่ก็ได้){" "}
            <input value={aGw} onChange={(e) => setAGw(e.target.value)} />
          </label>
        </p>

        <h2>Host B</h2>
        <p>
          <label>
            ชื่อเครื่อง{" "}
            <input value={bName} onChange={(e) => setBName(e.target.value)} />
          </label>
        </p>
        <p>
          <label>
            IP address{" "}
            <input value={bIp} onChange={(e) => setBIp(e.target.value)} />
          </label>
        </p>
        <p>
          <label>
            Subnet mask{" "}
            <input value={bMask} onChange={(e) => setBMask(e.target.value)} />
          </label>
        </p>
        <p>
          <label>
            Default gateway (ไม่ใส่ก็ได้){" "}
            <input value={bGw} onChange={(e) => setBGw(e.target.value)} />
          </label>
        </p>

        <p>
          <button type="submit">คำนวณ</button>
        </p>
      </form>

      <hr />

      {result?.error && (
        <p>
          <strong>Error:</strong> {result.error}
        </p>
      )}

      {result && !result.error && (
        <>
          <h2>Network ของแต่ละเครื่อง</h2>
          <table border="1" cellPadding="6">
            <thead>
              <tr>
                <th>เครื่อง</th>
                <th>IP address</th>
                <th>Subnet mask</th>
                <th>Prefix</th>
                <th>Network address</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{result.hostA.name}</td>
                <td>{result.hostA.ip}</td>
                <td>{result.hostA.mask}</td>
                <td>/{result.hostA.prefix}</td>
                <td>{result.hostA.network}</td>
              </tr>
              <tr>
                <td>{result.hostB.name}</td>
                <td>{result.hostB.ip}</td>
                <td>{result.hostB.mask}</td>
                <td>/{result.hostB.prefix}</td>
                <td>{result.hostB.network}</td>
              </tr>
            </tbody>
          </table>

          <h2>
            {result.hostA.name} ping ไปหา {result.hostB.name}:{" "}
            {result.aToB.ok ? "ได้" : "ไม่ได้"}
          </h2>
          <p>{result.aToB.reason}</p>

          <h2>
            {result.hostB.name} ping กลับมาหา {result.hostA.name}:{" "}
            {result.bToA.ok ? "ได้" : "ไม่ได้"}
          </h2>
          <p>{result.bToA.reason}</p>

          <h2>สรุป</h2>
          {result.aToB.ok && result.bToA.ok && (
            <p>ping ได้สมบูรณ์ทั้งสองทิศทาง</p>
          )}
          {result.aToB.ok && !result.bToA.ok && (
            <p>
              {result.hostA.name} ส่ง echo request ไปถึง {result.hostB.name} ได้ แต่{" "}
              {result.hostB.name} ส่ง echo reply กลับไม่ได้ ผลคือ{" "}
              {result.hostA.name} จะเห็นเป็น request timed out เหมือน ping ไม่ผ่านทั้งคู่
            </p>
          )}
          {!result.aToB.ok && (
            <p>
              {result.hostA.name} ส่ง echo request ไปไม่ถึง {result.hostB.name} ตั้งแต่ต้น
              ping จึงไม่ผ่านแน่นอน ไม่ว่าฝั่ง {result.hostB.name} จะตอบกลับได้หรือไม่ก็ตาม
            </p>
          )}
        </>
      )}

      <hr />
      <p>
        <Link href="/">กลับหน้าแรก</Link>
      </p>
    </main>
  );
}
