import { createSlice, nanoid } from "@reduxjs/toolkit";

// รายการลิงก์ทั้งหมดกำหนดตรงนี้ในโค้ด — หน้าเว็บเป็นแบบกดดูอย่างเดียว
// ต้องการเพิ่ม/ลบ/แก้ไข ให้แก้ไฟล์นี้โดยตรงแล้ว build/restart ใหม่
const initialState = {
  sections: [
    {
      id: "projects",
      title: "Projects",
      links: [
        {
          id: nanoid(),
          label: "shied step",
          url: "https://github.com/shiedstep/doctor-mobile-frontend",
        },
      ],
    },
    {
      id: "diagrams",
      title: "Diagrams",
      links: [
        {
          id: nanoid(),
          label: "ER Diagram: ระบบยืมอุปกรณ์",
          url: "/er-diagram",
        },
      ],
    },
    {
      id: "tools",
      title: "Tools",
      links: [
        {
          id: "lab7-address-board",
          label: "Lab 7 — RIP Address Board",
          url: "/path_lab7",
        },
        {
          id: nanoid(),
          label: "Subnet Ping Calculator",
          url: "/subnet-ping-calculator",
        },
        {
          id: nanoid(),
          label: "SageMath",
          url: "/sagemath",
        },
      ],
    },
  ],
};

const linksSlice = createSlice({
  name: "links",
  initialState,
  reducers: {},
});

export default linksSlice.reducer;
