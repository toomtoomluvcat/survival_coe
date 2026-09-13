"use client";

import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addPdfMeta, removePdfMeta, setPdfs } from "@/store/slices/pdfsSlice";
import { deletePdf, getPdfBlob, listPdfMeta, putPdf } from "@/lib/pdfDb";

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(ts) {
  return new Date(ts).toLocaleString("th-TH");
}

export default function PdfManager() {
  const items = useSelector((s) => s.pdfs.items);
  const dispatch = useDispatch();
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listPdfMeta().then((list) => dispatch(setPdfs(list)));
  }, [dispatch]);

  async function onFileChange(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setBusy(true);
    for (const file of files) {
      if (file.type !== "application/pdf") continue;
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const meta = { id, name: file.name, size: file.size, addedAt: Date.now() };
      await putPdf({ ...meta, blob: file });
      dispatch(addPdfMeta(meta));
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function onOpen(id, name) {
    const blob = await getPdfBlob(id);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  async function onRemove(id) {
    await deletePdf(id);
    dispatch(removePdfMeta(id));
  }

  return (
    <section>
      <h2>ไฟล์ PDF</h2>
      <p>
        <label>
          เลือกไฟล์ PDF:{" "}
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            multiple
            onChange={onFileChange}
            disabled={busy}
          />
        </label>
        {busy && <span> กำลังบันทึก…</span>}
      </p>

      {items.length === 0 ? (
        <p>(ยังไม่มีไฟล์ — ไฟล์จะถูกเก็บไว้ในเบราว์เซอร์นี้เท่านั้น ไม่มีการอัปโหลดขึ้นเซิร์ฟเวอร์)</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th align="left">ชื่อไฟล์</th>
              <th align="left">ขนาด</th>
              <th align="left">เพิ่มเมื่อ</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <a href="#" onClick={(e) => { e.preventDefault(); onOpen(item.id, item.name); }}>
                    {item.name}
                  </a>
                </td>
                <td>{formatSize(item.size)}</td>
                <td>{formatDate(item.addedAt)}</td>
                <td>
                  <button onClick={() => onRemove(item.id)}>ลบ</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
