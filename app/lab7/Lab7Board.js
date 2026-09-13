"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GROUPS, analyzeBoard, rowErrors, rowLabel, subnetFor, nodeAddresses, gatewayFor, routerConfig } from "@/lib/lab7-address.mjs";
import s from "./board.module.css";

const API = "/api/lab7";
const COLORS = ["#437a5b", "#497cac", "#9372b1", "#bc8246", "#b3687b"];

function RouterIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="4" /><path d="M7 10h4m-2-2 2 2-2 2m8 2h-4m2-2-2 2 2 2" /></svg>;
}

function ipHint(rows, empty = "ยังไม่มี IP") {
  const values = rows.filter((row) => row.ip).map((row) => `${row.ip}/${row.prefix}`);
  return values.length ? values.join(" · ") : empty;
}

export default function Lab7Board() {
  const [board, setBoard] = useState(null);
  const [connection, setConnection] = useState("loading");
  const [query, setQuery] = useState("");
  const [extra, setExtra] = useState(false);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [focusRowId, setFocusRowId] = useState("");
  const [focusedRowId, setFocusedRowId] = useState("");
  const [focusedNodeId, setFocusedNodeId] = useState("");
  const [openTooltipId, setOpenTooltipId] = useState("");
  const [tooltip, setTooltip] = useState(null);
  const dialog = useRef(null);
  const ipInput = useRef(null);

  const accept = useCallback((next) => {
    setBoard((old) => !old || next.revision >= old.revision ? { ...next, shareUrls: next.shareUrls ?? old?.shareUrls ?? [] } : old);
    setConnection("connected");
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch(API, { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error();
        const data = await response.json();
        if (active) accept(data);
      } catch (e) { if (active && e.name !== "AbortError") setConnection("offline"); }
    };
    refresh();
    const timer = setInterval(refresh, 3000);
    return () => { active = false; controller.abort(); clearInterval(timer); };
  }, [accept]);

  useEffect(() => {
    if (!focusRowId) return;
    const target = document.querySelector(`[data-address-row="${focusRowId}"]`);
    if (!target) return;
    target.focus();
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    setFocusRowId("");
  }, [focusRowId, query, extra, board]);

  useEffect(() => {
    const warn = (event) => { if (draft) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [draft]);

  const rows = board?.rows ?? [];
  const issues = useMemo(() => analyzeBoard(board?.rows ?? []), [board]);
  const flagged = new Set(issues.flatMap((i) => i.ids));
  const activeRows = rows.filter((r) => !r.extension || extra);
  const draftIssues = draft ? analyzeBoard(rows.map((r) => r.id === draft.id ? draft : r)).filter((i) => i.ids.includes(draft.id)) : [];
  const blocked = draft && (rowErrors(draft).length > 0 || draftIssues.some((i) => i.kind === "duplicate"));
  const q = query.trim().toLowerCase();
  const visibleGroups = GROUPS.filter((g) => !q || activeRows.some((r) => r.group === g && `${rowLabel(r)} ${r.ip} ${r.port} ${r.segment} ${r.note}`.toLowerCase().includes(q)));

  function edit(row, focusIp = false) {
    setDraft({ ...row }); setError("");
    dialog.current.showModal();
    if (focusIp) setTimeout(() => ipInput.current?.focus(), 0);
  }
  function focusAddress(row) {
    if (!row) { setNotice("ยังไม่มีข้อมูล IP ของอุปกรณ์นี้"); return; }
    setQuery("");
    if (row.extension) setExtra(true);
    setFocusedRowId(row.id); setFocusedNodeId(topologyTarget(row));
    setFocusRowId(row.id);
  }
  function tapOrFocus(event, id, action) {
    const touch = event.nativeEvent.pointerType === "touch" || window.matchMedia("(pointer: coarse)").matches;
    if (!touch) { hideTooltip(id); action(); return; }
    if (openTooltipId !== id) { setOpenTooltipId(id); showTooltip(id, event.currentTarget.dataset.tooltip, event.currentTarget); return; }
    setOpenTooltipId(""); hideTooltip(id); action();
  }
  function showTooltip(id, text, element) {
    if (!text || !element) return;
    const rect = element.getBoundingClientRect();
    const left = Math.min(Math.max(rect.left + rect.width / 2, 140), window.innerWidth - 140);
    const top = rect.bottom + 10;
    setTooltip({ id, text, left, top });
  }
  function hideTooltip(id) {
    setTooltip((current) => current?.id === id ? null : current);
  }
  function handlePointerOver(event) {
    const target = event.target.closest?.("[data-tooltip]");
    if (!target || !event.currentTarget.contains(target)) return;
    if (event.relatedTarget && target.contains(event.relatedTarget)) return;
    showTooltip(target.id, target.dataset.tooltip, target);
  }
  function handlePointerOut(event) {
    const target = event.target.closest?.("[data-tooltip]");
    if (!target || !event.currentTarget.contains(target)) return;
    if (event.relatedTarget && target.contains(event.relatedTarget)) return;
    hideTooltip(target.id);
  }
  function handleFocus(event) {
    const target = event.target.closest?.("[data-tooltip]");
    if (target) showTooltip(target.id, target.dataset.tooltip, target);
  }
  function handleBlur(event) {
    const target = event.target.closest?.("[data-tooltip]");
    if (target) hideTooltip(target.id);
  }
  function topologyTarget(row) {
    if (row.device === "pc") return `topology-g${row.group}-pc${row.router}`;
    if (row.id.endsWith("-r1-lan")) return `topology-g${row.group}-r1`;
    if (row.id.endsWith("-r2-lan")) return `topology-g${row.group}-r2`;
    if (row.id.endsWith("-r1-transit")) return `topology-g${row.group}-r1`;
    if (row.id.endsWith("-r2-transit")) return `topology-g${row.group}-r2`;
    if (row.id.endsWith("-r1-left")) return `topology-link-${row.group - 1}-${row.group}-left`;
    if (row.id.endsWith("-r1-right")) return `topology-link-${row.group}-${row.group + 1}-right`;
    if (row.extension) return `topology-extra-3-4-${row.group === 3 ? "right" : "left"}`;
    return `topology-g${row.group}-r1`;
  }
  function focusTopology(row) {
    const targetId = topologyTarget(row);
    setFocusedRowId(row.id); setFocusedNodeId(targetId);
    const target = document.getElementById(targetId);
    target?.focus();
    target?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
  }
  function close() { if (saving) return; dialog.current.close(); setDraft(null); setError(""); }

  async function save(event) {
    event.preventDefault();
    if (saving || blocked) return;
    setSaving(true); setError("");
    try {
      const response = await fetch(API, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft), signal: AbortSignal.timeout(15000) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "บันทึกไม่สำเร็จ");
      accept(data); dialog.current.close(); setDraft(null);
      setNotice(`บันทึก ${rowLabel(draft)} แล้ว`);
    } catch (e) { setError(e.name === "TimeoutError" ? "การเชื่อมต่อหมดเวลา ตรวจค่าล่าสุดก่อนลองบันทึกอีกครั้ง" : e.message); }
    finally { setSaving(false); }
  }

  async function reloadDraft() {
    try {
      const response = await fetch(API, { cache: "no-store" });
      if (!response.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ");
      const data = await response.json(); accept(data);
      setDraft(data.rows.find((r) => r.id === draft.id)); setError("");
    } catch (e) { setError(e.message); }
  }

  return <main className={s.page}>
    <header className={s.topbar}>
      <Link href="/" className={s.brand}><span className={s.brandMark}>m.</span> my hub <span className={s.slash}>/</span> <span className={s.crumb}>network lab</span></Link>
      <span className={s.live} data-offline={connection === "offline"}><i />{connection === "loading" ? "กำลังเปิดกระดาน…" : connection === "offline" ? "ขาดการเชื่อมต่อ · กำลังลองใหม่" : "กระดานร่วม · อัปเดตทุก 3 วินาที"}</span>
    </header>

    <div className={s.content}>
      <section className={s.hero}>
        <div><div className={s.eyebrow}>COMPUTER NETWORK LABORATORY <span>07 / RIP</span></div>
          <h1>ถ้ากลับบ้านหลัง ทุ่ม 1<span> ให้ติด F ได้เลย</span></h1>
        </div>
      </section>

      <section className={s.topology} aria-label="Topology ข้อ 1.2" onPointerOver={handlePointerOver} onPointerOut={handlePointerOut} onFocusCapture={handleFocus} onBlurCapture={handleBlur}>
        <div className={s.sectionHead}><div><span className={s.kicker}>THE CONNECTION PLAN</span><h2>หนึ่งเส้นทาง · ห้ากลุ่ม</h2></div><label className={s.toggle}><input type="checkbox" checked={extra} onChange={(e) => setExtra(e.target.checked)} />แสดงสายเพิ่มข้อ 1.2.1</label></div>
        <div className={s.mapScroll}><div className={s.map}>
          {GROUPS.map((g) => <div key={g} className={s.mapGroup} style={{ "--group-color": COLORS[g - 1] }}>
            <span className={s.mapLabel}>GROUP {String(g).padStart(2, "0")}</span>
            <button id={`topology-g${g}-pc1`} data-tooltip={ipHint(nodeAddresses(rows, g, 1, "pc"), `PC1 กลุ่ม ${g} ยังไม่มี IP`)} className={`${s.pcNode} ${focusedNodeId === `topology-g${g}-pc1` ? s.focusedNode : ""} ${openTooltipId === `topology-g${g}-pc1` ? s.tooltipOpen : ""}`} onClick={(e) => tapOrFocus(e, `topology-g${g}-pc1`, () => focusAddress(rows.find((r) => r.id === `g${g}-r1-pc`)))} aria-label={`ไปที่ IP ของ PC1 กลุ่ม ${g}`}>PC1</button><span className={s.wire} />
            <button id={`topology-g${g}-r1`} data-tooltip={ipHint(nodeAddresses(rows, g, 1, "router"), `R1 กลุ่ม ${g} ยังไม่มี IP`)} className={`${s.routerNode} ${focusedNodeId === `topology-g${g}-r1` ? s.focusedNode : ""} ${openTooltipId === `topology-g${g}-r1` ? s.tooltipOpen : ""}`} onClick={(e) => tapOrFocus(e, `topology-g${g}-r1`, () => focusAddress(rows.find((r) => r.id === `g${g}-r1-lan`)))} aria-label={`ไปที่ IP ของ Router 1 กลุ่ม ${g}`}><RouterIcon /><span>R1</span></button>
            {g > 1 && <span id={`topology-link-${g - 1}-${g}-left`} role="button" tabIndex="0" data-tooltip={ipHint(rows.filter((r) => r.id === `g${g}-r1-left`), `Serial ฝั่งกลุ่ม ${g} ยังไม่มี IP`)} className={`${s.serialHalf} ${s.serialLeft} ${focusedNodeId === `topology-link-${g - 1}-${g}-left` ? s.focusedNode : ""} ${openTooltipId === `topology-link-${g - 1}-${g}-left` ? s.tooltipOpen : ""}`} onClick={(e) => tapOrFocus(e, `topology-link-${g - 1}-${g}-left`, () => focusAddress(rows.find((r) => r.id === `g${g}-r1-left`)))} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); focusAddress(rows.find((r) => r.id === `g${g}-r1-left`)); } }} aria-label={`ไปที่ IP ฝั่งกลุ่ม ${g} ของสาย Serial กลุ่ม ${g - 1} ถึง ${g}`}><span>G{g} · R1</span></span>}
            {g < 5 && <span id={`topology-link-${g}-${g + 1}-right`} role="button" tabIndex="0" data-tooltip={ipHint(rows.filter((r) => r.id === `g${g}-r1-right`), `Serial ฝั่งกลุ่ม ${g} ยังไม่มี IP`)} className={`${s.serialHalf} ${s.serialRight} ${focusedNodeId === `topology-link-${g}-${g + 1}-right` ? s.focusedNode : ""} ${openTooltipId === `topology-link-${g}-${g + 1}-right` ? s.tooltipOpen : ""}`} onClick={(e) => tapOrFocus(e, `topology-link-${g}-${g + 1}-right`, () => focusAddress(rows.find((r) => r.id === `g${g}-r1-right`)))} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); focusAddress(rows.find((r) => r.id === `g${g}-r1-right`)); } }} aria-label={`ไปที่ IP ฝั่งกลุ่ม ${g} ของสาย Serial กลุ่ม ${g} ถึง ${g + 1}`}><span>G{g} · R1</span></span>}
            <span className={s.wire} /><button className={s.switchNode} data-tooltip="Switch ไม่มี IP ใน address board" onClick={(e) => tapOrFocus(e, `topology-g${g}-switch`, () => setNotice("Switch ไม่มี IP ใน address board"))} aria-label={`ดูข้อมูล Switch กลุ่ม ${g}`}>SW <small>+ sniffer</small></button><span className={s.wire} />
            <button id={`topology-g${g}-r2`} data-tooltip={ipHint(nodeAddresses(rows, g, 2, "router"), `R2 กลุ่ม ${g} ยังไม่มี IP`)} className={`${s.routerNode} ${focusedNodeId === `topology-g${g}-r2` ? s.focusedNode : ""} ${openTooltipId === `topology-g${g}-r2` ? s.tooltipOpen : ""}`} onClick={(e) => tapOrFocus(e, `topology-g${g}-r2`, () => focusAddress(rows.find((r) => r.id === `g${g}-r2-lan`)))} aria-label={`ไปที่ IP ของ Router 2 กลุ่ม ${g}`}><RouterIcon /><span>R2</span></button>
            {extra && g === 3 && <span id="topology-extra-3-4-right" role="button" tabIndex="0" data-tooltip={ipHint(rows.filter((r) => r.id === "g3-r2-extra"), "สายเพิ่มฝั่งกลุ่ม 3 ยังไม่มี IP")} className={`${s.extraHalf} ${s.extraRight} ${focusedNodeId === "topology-extra-3-4-right" ? s.focusedNode : ""} ${openTooltipId === "topology-extra-3-4-right" ? s.tooltipOpen : ""}`} onClick={(e) => tapOrFocus(e, "topology-extra-3-4-right", () => focusAddress(rows.find((r) => r.id === "g3-r2-extra")))} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); focusAddress(rows.find((r) => r.id === "g3-r2-extra")); } }} aria-label="ไปที่ IP ฝั่งกลุ่ม 3 ของสายเพิ่มกลุ่ม 3 ถึง 4"><span>สายเพิ่ม 3–4</span></span>}
            {extra && g === 4 && <span id="topology-extra-3-4-left" role="button" tabIndex="0" data-tooltip={ipHint(rows.filter((r) => r.id === "g4-r2-extra"), "สายเพิ่มฝั่งกลุ่ม 4 ยังไม่มี IP")} className={`${s.extraHalf} ${s.extraLeft} ${focusedNodeId === "topology-extra-3-4-left" ? s.focusedNode : ""} ${openTooltipId === "topology-extra-3-4-left" ? s.tooltipOpen : ""}`} onClick={(e) => tapOrFocus(e, "topology-extra-3-4-left", () => focusAddress(rows.find((r) => r.id === "g4-r2-extra")))} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); focusAddress(rows.find((r) => r.id === "g4-r2-extra")); } }} aria-label="ไปที่ IP ฝั่งกลุ่ม 4 ของสายเพิ่มกลุ่ม 3 ถึง 4" />}
            <span className={s.wire} /><button id={`topology-g${g}-pc2`} data-tooltip={ipHint(nodeAddresses(rows, g, 2, "pc"), `PC2 กลุ่ม ${g} ยังไม่มี IP`)} className={`${s.pcNode} ${focusedNodeId === `topology-g${g}-pc2` ? s.focusedNode : ""} ${openTooltipId === `topology-g${g}-pc2` ? s.tooltipOpen : ""}`} onClick={(e) => tapOrFocus(e, `topology-g${g}-pc2`, () => focusAddress(rows.find((r) => r.id === `g${g}-r2-pc`)))} aria-label={`ไปที่ IP ของ PC2 กลุ่ม ${g}`}>PC2</button>
          </div>)}
        </div></div>
        <p className={s.mapNote}><span />สายสองฝั่งต้องอยู่ subnet เดียวกัน แต่ใช้คนละ IP <span className={s.grayDot} />LAN และสายเชื่อมคนละวง ต้องไม่ใช้ subnet ทับกัน</p>
      </section>

      <section id="address-board" className={s.boardSection}>
        <div className={s.sectionHead}><div><span className={s.kicker}>SHARED ADDRESS BOARD</span><h2>จดไว้ตรงนี้ ก่อนต่อสาย</h2></div><span className={s.hint}>Hover ที่ node เพื่อดู IP · คลิกเพื่อ Focus</span></div>
        <div className={s.toolbar}><input className={s.search} aria-label="ค้นหา IP หรือ interface" placeholder="ค้นหา IP, interface, หมายเหตุ…" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
        {!board ? <div className={s.empty}>{connection === "offline" ? "เปิดกระดานไม่ได้ กำลังเชื่อมต่อใหม่…" : "กำลังโหลด address ของทุกกลุ่ม…"}</div> : <div className={s.boardGrid}>
          {visibleGroups.map((g) => <article key={g} className={s.groupCard} style={{ "--group-color": COLORS[g - 1] }}>
            <div className={s.groupTitle}><div><span className={s.groupNumber}>{String(g).padStart(2, "0")}</span><h3>กลุ่ม {g}</h3></div><span>{activeRows.filter((r) => r.group === g && r.ip).length}/{activeRows.filter((r) => r.group === g).length} IP</span></div>
            {[1, 2].map((router) => <div key={router} className={s.routerSection}><div className={s.routerHeading}><RouterIcon /><h4>Router {router}</h4><span>G{g}-R{router}</span></div>
              {activeRows.filter((r) => r.group === g && r.router === router).map((r) => <div key={r.id} className={s.addressItem}>
                <button data-address-row={r.id} className={`${s.addressRow} ${r.ip ? s.filledRow : ""} ${flagged.has(r.id) ? s.flaggedRow : ""} ${focusedRowId === r.id ? s.focusedRow : ""}`} onClick={() => focusTopology(r)} aria-label={`ไปที่ ${rowLabel(r)} บน topology`}>
                  <span className={s.rowTop}>{r.label}<span>{flagged.has(r.id) ? "!" : r.ip ? "↗" : "+"}</span></span>
                  <span className={s.address}>{r.ip ? <>{r.ip}<small>/{r.prefix}</small></> : "ยังไม่ได้จด IP"}</span>
                  <span className={s.rowMeta}>{r.port || "ระบุ interface"}<span>{r.segment}</span></span>
                  {r.device === "pc" && <span className={s.rowNote}>Gateway {gatewayFor(rows, r)} · Mask {subnetFor(r.ip, r.prefix)?.mask}</span>}
                  {r.note && <span className={s.rowNote}>{r.note}</span>}
                </button>
              </div>)}
              <details className={s.config}><summary>Config G{g}-R{router}</summary><p>เปลี่ยนชื่อ Interface ให้ตรงกับอุปกรณ์จริง</p><pre>{routerConfig(activeRows, g, router)}</pre></details>
            </div>)}
          </article>)}
        </div>}
        {board && !visibleGroups.length && <div className={s.empty}>ไม่พบข้อมูลที่ค้นหา <button onClick={() => setQuery("")}>ดูทุกกลุ่ม</button></div>}
      </section>

      <section className={s.footnotes}>
        <div><span>01</span><p><b>Address Plan ตามรูปที่ 3</b>ทุกวงใช้ /24 · Router ฝั่ง LAN ใช้ .1 และ PC ใช้ .2 · Transit และ Serial แยก Network · รวม 19 Network ก่อนเพิ่มสาย และ 20 Network หลังเพิ่มสาย</p></div>
        <div><span>02</span><p><b>ก่อนทดสอบ Ping</b>ตั้ง IP และ Gateway ของ PC ตามตาราง เปิด Interface ทุกเส้นให้ up/up และให้พอร์ตบน Switch ระหว่าง R1–R2 อยู่ VLAN เดียวกัน สำหรับ Serial ตรวจฝั่ง DCE ด้วย show controllers serial แล้วตั้ง clock rate 64000 เฉพาะฝั่ง DCE</p></div>
        <div><span>03</span><p><b>เปิด RIP บน Router ทั้ง 10 ตัว</b>Config ใช้ RIPv1 ให้ตรงกับตัวอย่าง Broadcast ใน Lab Sheet และทุก Network เป็น /24 รอจน show ip route มี Route R ของปลายทาง แล้ว Ping PC1 ไป PC2 ทั้งในกลุ่มและข้ามกลุ่ม พร้อมทดสอบย้อนกลับ ต้องอนุญาต ICMP ที่ PC ด้วย เว็บนี้เป็นแผน Config ไม่ใช่ผล Ping จากอุปกรณ์จริง</p></div>
      </section>
      <div className={s.shareInfo}><span>ให้เพื่อนเปิดในวง LAN เดียวกัน</span>{board?.shareUrls?.map((url) => <a key={url} href={url}>{url}</a>)}<small>เครื่องที่รันเว็บต้องเปิดอยู่ · ถ้า Wi-Fi แยกเครื่องลูกข่ายออกจากกัน จะเข้าผ่าน LAN ไม่ได้</small></div>
      <footer className={s.footer}><span>LAB 07 · ROUTING INFORMATION PROTOCOL</span><span>บันทึกร่วมบนเซิร์ฟเวอร์ · ทุกคนที่เข้าถึงหน้านี้แก้ไขได้{board?.updatedAt && ` · ล่าสุด ${new Date(board.updatedAt).toLocaleTimeString("th-TH")}`}</span></footer>
    </div>
    {tooltip && <div className={s.floatingTooltip} role="tooltip" style={{ left: tooltip.left, top: tooltip.top }}>{tooltip.text}</div>}
    {notice && <div className={s.toast} role="status">{notice}<button onClick={() => setNotice("")} aria-label="ปิดข้อความ">×</button></div>}

    <dialog ref={dialog} className={s.dialog} onCancel={(event) => { event.preventDefault(); close(); }}>
      {draft && <form onSubmit={save}>
        <div className={s.dialogHead}><div><span className={s.kicker}>GROUP {draft.group} / ROUTER {draft.router}</span><h2>{draft.label}</h2></div><button type="button" onClick={close} disabled={saving} aria-label="ปิดหน้าต่าง">×</button></div>
        <p className={s.peer}>วง <b>{draft.segment}</b> · เชื่อมไป {draft.peer}</p>
        <label className={s.field}>ชื่อ interface<input autoFocus value={draft.port} maxLength={50} placeholder="เช่น GigabitEthernet0/0 หรือ Serial0/0" onChange={(e) => setDraft({ ...draft, port: e.target.value })} /></label>
        <div className={s.ipFields}><label className={s.field}>IPv4 address<input ref={ipInput} aria-label="IPv4 address" inputMode="decimal" value={draft.ip} maxLength={15} placeholder="เช่น 192.168.1.1" onChange={(e) => setDraft({ ...draft, ip: e.target.value.trim() })} /></label><label className={s.field}>Prefix / CIDR<input aria-label="Prefix / CIDR" inputMode="numeric" value={draft.prefix} maxLength={2} placeholder="24" onChange={(e) => setDraft({ ...draft, prefix: e.target.value.trim() })} /></label></div>
        <div className={s.subnetPreview}><span>Network <b>{subnetFor(draft.ip, draft.prefix)?.cidr || "—"}</b></span><span>Subnet mask <b>{subnetFor(draft.ip, draft.prefix)?.mask || "—"}</b></span></div>
        <label className={s.field}>หมายเหตุ / ผู้รับผิดชอบ<textarea rows={2} value={draft.note} maxLength={300} placeholder="ชื่อคนจด, ฝั่ง DCE, สถานะการทดสอบ…" onChange={(e) => setDraft({ ...draft, note: e.target.value })} /></label>
        {rows.filter((r) => r.segment === draft.segment && r.id !== draft.id).map((peer) => <div key={peer.id} className={s.peerInfo}><span>ปลายสายอีกฝั่ง · G{peer.group} R{peer.router}</span><b>{peer.ip ? `${peer.ip}/${peer.prefix}` : "ยังไม่ได้จด IP"}</b></div>)}
        {draftIssues.length > 0 && <div className={s.formWarning} aria-live="polite">{draftIssues.map((issue, i) => <p key={i}>{issue.message}</p>)}{!blocked && <small>บันทึกได้ แต่ควรตกลง subnet ให้ตรงกันก่อน config</small>}</div>}
        {error && <div className={s.formWarning} role="alert">{error}<button type="button" onClick={reloadDraft} disabled={saving}>โหลดค่าล่าสุด (แทนที่ค่าที่กำลังแก้)</button></div>}
        <div className={s.dialogActions}><button type="button" onClick={close} disabled={saving}>ยกเลิก</button><button type="submit" className={s.primary} disabled={saving || Boolean(blocked)}>{saving ? "กำลังบันทึก…" : "บันทึก address"}</button></div>
        <p className={s.saveHint}>บันทึกแล้วเพื่อนจะเห็นด้วย · ลบ IP ได้โดยล้างทั้ง IP และ prefix แล้วบันทึก</p>
      </form>}
    </dialog>
  </main>;
}
