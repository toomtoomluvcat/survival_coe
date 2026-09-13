import LinkSections from "@/components/LinkSections";

export default function Home() {
  return (
    <main>
      <h1>My Hub</h1>
      <p>
        พื้นที่ส่วนตัวสำหรับรวมลิงก์ต่าง ๆ หน้านี้กดดูได้อย่างเดียว
        หากต้องการเพิ่ม ลบ หรือแก้ไขลิงก์ ให้แก้ที่โค้ดโดยตรง
      </p>

      <hr />

      <h1>Links</h1>
      <LinkSections />
    </main>
  );
}
