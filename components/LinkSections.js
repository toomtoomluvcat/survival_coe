"use client";

import { useSelector } from "react-redux";

// หน้าเว็บส่วนนี้กดได้อย่างเดียว (ดู/เปิดลิงก์เท่านั้น)
// เพิ่ม/ลบ/แก้ไขลิงก์ ให้แก้ที่ store/slices/linksSlice.js โดยตรง
export default function LinkSections() {
  const sections = useSelector((s) => s.links.sections);

  return (
    <section>
      {sections.map((section) => (
        <div key={section.id}>
          <h2>{section.title}</h2>
          <ul>
            {section.links.map((link) => (
              <li key={link.id}>
                <a href={link.url} target="_blank" rel="noreferrer">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
