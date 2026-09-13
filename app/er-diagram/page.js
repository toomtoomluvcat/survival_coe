import Link from "next/link";

// หน้านี้แสดง Conceptual ER Diagram (Chen shapes: entity = สี่เหลี่ยม, attribute = วงรี,
// relationship = เพชร) ของระบบยืมอุปกรณ์ แต่บอก cardinality ด้วยลูกศร (ชี้ฝั่งที่เป็น "1")
// + เส้นคู่ทึบ (total participation) ควบคู่กับตัวอักษร 1/M กำกับไว้ด้วย
// เป็นหน้า static ล้วน ๆ ไม่มี CSS แต่งเพิ่ม (ตามธรรมเนียมของโปรเจกต์นี้)
// พิกัดทุกเส้นคำนวณให้ตกขอบรูปทรงจริง (ellipse/rect/diamond boundary) ไม่มีเส้นลอย

export const metadata = {
  title: "ER Diagram: ระบบยืมอุปกรณ์ | My Hub",
};

export default function ErDiagramPage() {
  return (
    <main>
      <h1>Conceptual ER Diagram</h1>
      <p>ระบบยืมอุปกรณ์ (Equipment Borrowing System) — ลูกศร = ฝั่ง &quot;1&quot;, เส้นคู่ = total participation</p>

      <hr />

      <svg
        viewBox="0 0 1600 800"
        width="100%"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-labelledby="er-title er-desc"
      >
        <title id="er-title">Conceptual ER Diagram: Equipment Borrowing System</title>
        <desc id="er-desc">
          Chen notation ER diagram แสดง entity User, Borrowing Transaction, Tool, Staff
          พร้อม relationship Makes, Involves, Verified by ลูกศรชี้ฝั่งที่มี cardinality เท่ากับ 1
          เส้นคู่แสดง total participation และมีตัวอักษร 1/M กำกับไว้ด้วย
        </desc>

        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="#000" />
          </marker>
        </defs>

        {/* ===== เส้นเชื่อม entity <-> relationship (ลูกศร / เส้นคู่) ===== */}
        {/* Makes: User (1, partial) -- Transaction (M, total) */}
        <line x1="515" y1="295" x2="420" y2="295" stroke="#000" strokeWidth="1.5" markerEnd="url(#arrow)" />
        <line x1="605" y1="292" x2="700" y2="292" stroke="#000" strokeWidth="1.5" />
        <line x1="605" y1="298" x2="700" y2="298" stroke="#000" strokeWidth="1.5" />

        {/* Involves: Transaction (M, total) -- Tool (1, partial) */}
        <line x1="860" y1="292" x2="975" y2="292" stroke="#000" strokeWidth="1.5" />
        <line x1="860" y1="298" x2="975" y2="298" stroke="#000" strokeWidth="1.5" />
        <line x1="1065" y1="295" x2="1180" y2="295" stroke="#000" strokeWidth="1.5" markerEnd="url(#arrow)" />

        {/* Verified by: Transaction (M, total) -- Staff (1, partial) */}
        <line x1="777" y1="340" x2="777" y2="440" stroke="#000" strokeWidth="1.5" />
        <line x1="783" y1="340" x2="783" y2="440" stroke="#000" strokeWidth="1.5" />
        <line x1="780" y1="500" x2="780" y2="600" stroke="#000" strokeWidth="1.5" markerEnd="url(#arrow)" />

        {/* ===== เส้นเชื่อม attribute <-> entity (เส้นเดี่ยวธรรมดา) ===== */}
        <g stroke="#000" strokeWidth="1.5" fill="none">
          {/* User attributes */}
          <line x1="135.0" y1="169.5" x2="300.0" y2="261.5" />
          <line x1="148.7" y1="234.0" x2="300.0" y2="277.7" />
          <line x1="159.9" y1="291.2" x2="300.0" y2="293.8" />
          <line x1="150.9" y1="347.3" x2="300.0" y2="310.0" />

          {/* Transaction attributes */}
          <line x1="607.6" y1="144.2" x2="728.6" y2="250.0" />
          <line x1="788.5" y1="146.0" x2="782.6" y2="250.0" />
          <line x1="969.1" y1="144.6" x2="836.6" y2="250.0" />
          <line x1="1156.2" y1="141.9" x2="860.0" y2="262.4" />

          {/* Tool attributes */}
          <line x1="1419.9" y1="170.8" x2="1290.7" y2="260.0" />
          <line x1="1403.3" y1="236.7" x2="1300.0" y2="273.6" />
          <line x1="1385.1" y1="291.5" x2="1300.0" y2="293.6" />
          <line x1="1402.5" y1="345.3" x2="1300.0" y2="313.6" />

          {/* Staff attributes */}
          <line x1="927.9" y1="594.3" x2="840.0" y2="618.5" />
          <line x1="915.0" y1="635.0" x2="840.0" y2="635.0" />
          <line x1="927.9" y1="675.7" x2="840.0" y2="651.5" />
        </g>

        {/* ===== Entities ===== */}
        <g fill="#fff" stroke="#000" strokeWidth="2">
          <rect x="300" y="260" width="120" height="70" />
          <rect x="700" y="250" width="160" height="90" />
          <rect x="1180" y="260" width="120" height="70" />
          <rect x="720" y="600" width="120" height="70" />
        </g>
        <g fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="16" textAnchor="middle">
          <text x="360" y="300">User</text>
          <text x="780" y="290">Borrowing</text>
          <text x="780" y="310">Transaction</text>
          <text x="1240" y="300">Tool</text>
          <text x="780" y="640">Staff</text>
        </g>

        {/* ===== Relationships (diamonds) ===== */}
        <g fill="#fff" stroke="#000" strokeWidth="2">
          <polygon points="560,265 605,295 560,325 515,295" />
          <polygon points="1020,265 1065,295 1020,325 975,295" />
          <polygon points="780,440 825,470 780,500 735,470" />
        </g>
        <g fontFamily="system-ui, sans-serif" fontWeight="600" fontSize="13" textAnchor="middle">
          <text x="560" y="299">Makes</text>
          <text x="1020" y="299">Involves</text>
          <text x="780" y="474">Verified by</text>
        </g>

        {/* ===== Attribute ovals: User ===== */}
        <g fill="#fff" stroke="#000" strokeWidth="1.5">
          <ellipse cx="100" cy="150" rx="60" ry="24" />
          <ellipse cx="100" cy="220" rx="60" ry="24" />
          <ellipse cx="100" cy="290" rx="60" ry="24" />
          <ellipse cx="100" cy="360" rx="60" ry="24" />
        </g>
        <g fontFamily="system-ui, sans-serif" fontSize="12.5" textAnchor="middle">
          <text x="100" y="155" fontWeight="700" textDecoration="underline">UserID</text>
          <text x="100" y="225">FirstName</text>
          <text x="100" y="295">LastName</text>
          <text x="100" y="365">Phone</text>
        </g>

        {/* ===== Attribute ovals: Transaction ===== */}
        <g fill="#fff" stroke="#000" strokeWidth="1.5">
          <ellipse cx="580" cy="120" rx="75" ry="26" />
          <ellipse cx="790" cy="120" rx="85" ry="26" />
          <ellipse cx="1000" cy="120" rx="95" ry="26" />
          <ellipse cx="1210" cy="120" rx="100" ry="26" />
        </g>
        <g fontFamily="system-ui, sans-serif" fontSize="12.5" textAnchor="middle">
          <text x="580" y="125" fontWeight="700" textDecoration="underline">TransactionID</text>
          <text x="790" y="125">StartDateTime</text>
          <text x="1000" y="125">PlannedEndDateTime</text>
          <text x="1210" y="125">ActualReturnDateTime</text>
        </g>

        {/* ===== Attribute ovals: Tool ===== */}
        <g fill="#fff" stroke="#000" strokeWidth="1.5">
          <ellipse cx="1450" cy="150" rx="60" ry="24" />
          <ellipse cx="1450" cy="220" rx="65" ry="24" />
          <ellipse cx="1450" cy="290" rx="65" ry="24" />
          <ellipse cx="1450" cy="360" rx="60" ry="24" />
        </g>
        <g fontFamily="system-ui, sans-serif" fontSize="12.5" textAnchor="middle">
          <text x="1450" y="155" fontWeight="700" textDecoration="underline">ToolID</text>
          <text x="1450" y="225">ToolName</text>
          <text x="1450" y="295">Category</text>
          <text x="1450" y="365">Status</text>
        </g>

        {/* ===== Attribute ovals: Staff ===== */}
        <g fill="#fff" stroke="#000" strokeWidth="1.5">
          <ellipse cx="980" cy="580" rx="65" ry="24" />
          <ellipse cx="980" cy="635" rx="65" ry="24" />
          <ellipse cx="980" cy="690" rx="65" ry="24" />
        </g>
        <g fontFamily="system-ui, sans-serif" fontSize="12.5" textAnchor="middle">
          <text x="980" y="585" fontWeight="700" textDecoration="underline">StaffID</text>
          <text x="980" y="640">FirstName</text>
          <text x="980" y="695">LastName</text>
        </g>

        {/* ===== ตัวอักษรกำกับ cardinality (1 / M) คู่กับลูกศร/เส้นคู่ ===== */}
        <g fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="14">
          <text x="445" y="285">1</text>
          <text x="630" y="285">M</text>
          <text x="895" y="285">M</text>
          <text x="1090" y="285">1</text>
          <text x="795" y="375">M</text>
          <text x="795" y="535">1</text>
        </g>
      </svg>

      <hr />

      <h2>Legend</h2>
      <ul>
        <li>สี่เหลี่ยม = entity, วงรี = attribute (ข้อความ<u>ขีดเส้นใต้</u> = primary key), เพชร = relationship</li>
        <li>ลูกศร (→) ที่ปลายเส้น + เลข &quot;1&quot; = ฝั่งนั้นมี cardinality เท่ากับ 1</li>
        <li>เส้นคู่ทึบ + เลข &quot;M&quot; = ฝั่งนั้นมี cardinality หลายค่า และเป็น total participation (ต้องเข้าร่วม relationship เสมอ)</li>
      </ul>

      <h2>Integrity Constraints</h2>
      <p>กฎทางธุรกิจที่ cardinality/participation เพียงอย่างเดียวแสดงไม่ได้:</p>
      <ol>
        <li>ActualReturnDateTime อาจเกิดขึ้นก่อนหรือหลัง PlannedEndDateTime ก็ได้ (คืนนอกเวลาที่กำหนดได้)</li>
        <li>เครื่องมือ 1 ชิ้น มี transaction ที่ยังไม่คืน (ActualReturnDateTime เป็น null) ได้ไม่เกิน 1 รายการ ณ เวลาใดเวลาหนึ่ง (ป้องกันการยืมซ้อน)</li>
        <li>ต้องเก็บประวัติการยืมทั้งหมดไว้ตลอดไป แม้อุปกรณ์จะถูกคืนแล้ว เพื่อใช้อ้างอิงในอนาคต</li>
      </ol>
      <p>
        <em>
          หมายเหตุ: &quot;ยืมได้ครั้งละ 1 ชิ้น&quot; (Involves → Tool), &quot;ยืมได้หลายครั้งต่อวัน&quot; (Makes ← Transaction)
          และ &quot;ทุกการยืมต้องมีผู้ยืนยัน&quot; (Verified by = total participation ของ Transaction)
          ถูกสะท้อนแล้วด้วยลูกศร/เส้นคู่/ตัวอักษรในไดอะแกรมด้านบน
        </em>
      </p>

      <hr />
      <p>
        <Link href="/">กลับหน้าแรก</Link>
      </p>
    </main>
  );
}
