# My Hub

หน้าเว็บส่วนตัวสำหรับรวมลิงก์ เครื่องมือ และไฟล์ PDF
ไม่มี backend / ไม่มีฐานข้อมูล — ข้อมูลทั้งหมดอยู่ในเบราว์เซอร์ของเครื่องที่เปิดใช้งานเท่านั้น

แนวคิดหน้าตา อ้างอิงจาก [MIT Integration Bee page](https://math.mit.edu/~yyao1/integrationbee.html):
เรียบ อ่านง่าย ไม่มีการ์ด/เงา/ไอคอนหรูหรา ใช้แค่ typography, การเว้นวรรค และเส้นคั่น (`<hr>`)

## Stack

- [Next.js](https://nextjs.org/) (App Router)
- SCSS (`app/globals.scss`) — มีไฟล์ไว้ตาม stack แต่ **ตั้งใจเว้นว่างไว้** ไม่เขียนกฎ CSS ใด ๆ
  หน้าเว็บใช้สไตล์ default ของเบราว์เซอร์ล้วน ๆ (ดูหัวข้อ "ห้ามมี CSS" ด้านล่าง)
- [Redux Toolkit](https://redux-toolkit.js.org/) + `react-redux` — เก็บ state ของลิงก์และรายการ PDF
- ไม่มี backend: ไม่มี API route, ไม่มีฐานข้อมูลภายนอก

## หน้าเว็บเป็นแบบกดดูอย่างเดียว

ส่วน **Links** ไม่มีฟอร์มเพิ่ม/ปุ่มลบในหน้าเว็บ — ตั้งใจให้เป็นแบบกดดูอย่างเดียว
ต้องการเพิ่ม/ลบ/แก้ไขลิงก์ ให้แก้ไฟล์ [`store/slices/linksSlice.js`](store/slices/linksSlice.js)
โดยตรง (แก้ `initialState.sections`) แล้ว `npm run build` + restart service ใหม่

ส่วน **Documents (PDF)** ยังอัปโหลด/เปิด/ลบไฟล์ผ่านหน้าเว็บได้ตามปกติ (เป็นฟีเจอร์หลักที่ขอไว้)

## เก็บข้อมูลไว้ที่ไหน

| ข้อมูล | เก็บที่ | หมายเหตุ |
| --- | --- | --- |
| หมวดหมู่ / ลิงก์ | โค้ดตรง ๆ ใน `store/slices/linksSlice.js` | ไม่มี UI แก้ไข ต้องแก้โค้ดเอง |
| ไฟล์ PDF (เนื้อไฟล์จริง) | `IndexedDB` (`lib/pdfDb.js`, DB ชื่อ `my-hub-pdfs`) | เก็บเป็น Blob ทั้งไฟล์ในเบราว์เซอร์ |
| เมทาดาทาไฟล์ PDF (ชื่อ/ขนาด/วันที่) | Redux store (`store/slices/pdfsSlice.js`) | โหลดจาก IndexedDB ตอนเปิดหน้า |

⚠️ ไฟล์ PDF เก็บใน browser storage ล้วน ๆ: ถ้าเปิดจากเบราว์เซอร์/โปรไฟล์อื่น หรือล้าง site data ไฟล์จะหายไปด้วย — ไม่มีการ sync ข้ามเครื่อง

## โครงสร้างโปรเจกต์

```
app/
  layout.js         ครอบด้วย ReduxProvider + import globals.scss (ว่างเปล่า)
  page.js           หน้าหลัก (Links + Documents section)
  globals.scss      ไฟล์ scss เปล่า — ไม่มีการเขียนสไตล์ใด ๆ
components/
  ReduxProvider.js  สร้าง redux store แล้วส่งต่อผ่าน Provider
  LinkSections.js   UI แสดงหมวดหมู่และลิงก์ (อ่านอย่างเดียว กดเปิดลิงก์ได้)
  PdfManager.js     UI อัปโหลด/เปิด/ลบไฟล์ PDF (ผ่าน IndexedDB)
public/
store/
  store.js          configureStore
  slices/linksSlice.js   หมวดหมู่ + ลิงก์ (แก้ไขได้เฉพาะในโค้ดไฟล์นี้)
  slices/pdfsSlice.js    เมทาดาทาไฟล์ PDF
lib/
  pdfDb.js          เปิด/อ่าน/เขียน/ลบไฟล์ PDF ใน IndexedDB (ผ่านไลบรารี idb)
```

## วิธีใช้งานหน้าเว็บ

- **Links**: กดชื่อลิงก์เพื่อเปิดในแท็บใหม่ได้อย่างเดียว ไม่มีปุ่มเพิ่ม/ลบในหน้าเว็บ
  ต้องการเพิ่ม/ลบ/แก้ไข ให้แก้ `store/slices/linksSlice.js` โดยตรง
- **Documents (PDF)**: กด "เลือกไฟล์ PDF" เพื่ออัปโหลด (เลือกได้หลายไฟล์พร้อมกัน) คลิกชื่อไฟล์ในตาราง
  เพื่อเปิดดู (เปิดแท็บใหม่จาก Blob URL ชั่วคราว) กด "ลบ" เพื่อลบไฟล์ออกจาก IndexedDB

## รันแบบ dev

```bash
npm install
npm run dev
```

เปิดที่ http://localhost:6144 (ตั้ง port ไว้ที่ 6144 ใน `package.json` ทั้ง `dev` และ `start`)

## Build / รันจริง

```bash
npm run build
npm run start
```

## รันอัตโนมัติทุกครั้งที่เปิดเครื่อง (systemd user service)

โปรเจกต์นี้ตั้งค่าให้รันเป็น systemd user service ชื่อ `my-hub.service` ไว้แล้ว ที่:

```
~/.config/systemd/user/my-hub.service
```

คำสั่งที่ใช้ตรวจ/ควบคุมบริการ:

```bash
systemctl --user status my-hub.service    # ดูสถานะ
systemctl --user restart my-hub.service   # รีสตาร์ท (เช่น หลังแก้โค้ด + build ใหม่)
systemctl --user stop my-hub.service      # หยุดชั่วคราว
journalctl --user -u my-hub.service -f    # ดู log แบบ real-time
```

บริการนี้ตั้ง `enable` ไว้แล้ว จึงเริ่มทำงานอัตโนมัติทุกครั้งที่ **login เข้าเครื่อง** (systemd user session
เริ่มพร้อมกับ session ของผู้ใช้) โดยไม่ต้องรันคำสั่งใด ๆ เอง

ถ้าต้องการให้รันได้แม้ยังไม่ login (เช่น ทันทีที่เปิดคอมแล้วบูตเสร็จ โดยไม่ต้อง login ก่อน) ต้องเปิด
"linger" ให้ user นี้ — ต้องใช้สิทธิ์ sudo และเป็นการเปลี่ยนพฤติกรรมของระบบ จึงไม่ได้ทำให้อัตโนมัติ
รันเองถ้าต้องการ:

```bash
sudo loginctl enable-linger $(whoami)
```

## หมายเหตุเรื่องดีไซน์ ("ห้ามมี CSS")

คีย์หลักของเว็บนี้คือ **ไม่มี CSS จริง ๆ** — ไม่ใช่แค่ minimal แต่คือปล่อยให้เบราว์เซอร์ render
ด้วยสไตล์ default ล้วน ๆ (font, สี, ขนาดหัวข้อ, ปุ่ม, ลิงก์สีน้ำเงินขีดเส้นใต้ ฯลฯ) เหมือนหน้า
[MIT Integration Bee](https://math.mit.edu/~yyao1/integrationbee.html) ที่ใช้เป็นต้นแบบ
ไฟล์ `app/globals.scss` จึงเว้นว่างไว้โดยตั้งใจ และไม่มี `style={{...}}` หรือ `className` ที่ผูกกับ
กฎ CSS ใด ๆ อยู่ใน component เลย
