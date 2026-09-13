import Link from "next/link";

export const metadata = {
  title: "SageMath | My Hub",
  description: "หน้ารวมทางเข้า SageMath และ SageCell",
};

export default function SageMathPage() {
  return (
    <main>
      <h1>SageMath</h1>
      <p>พื้นที่ทางเข้าสำหรับใช้งาน SageMath โดยเฉพาะ</p>

      <hr />

      <h2>ทางเข้าใช้งาน</h2>
      <ul>
        <li>
          <a href="https://sagecell.sagemath.org/" target="_blank" rel="noreferrer">
            เปิด SageCell ออนไลน์
          </a>
          <span> — เขียนและรันโค้ด SageMath ผ่านเบราว์เซอร์</span>
        </li>
        <li>
          <a href="https://www.sagemath.org/" target="_blank" rel="noreferrer">
            เว็บไซต์ SageMath
          </a>
          <span> — ดาวน์โหลดและดูข้อมูลโครงการ</span>
        </li>
        <li>
          <a href="https://doc.sagemath.org/" target="_blank" rel="noreferrer">
            SageMath Documentation
          </a>
          <span> — เอกสารอ้างอิงและคู่มือการใช้งาน</span>
        </li>
      </ul>

      <hr />

      <p>
        <Link href="/">กลับหน้าแรก</Link>
      </p>
    </main>
  );
}
