"use client";

import { useRef } from "react";
import { Provider } from "react-redux";
import { makeStore } from "@/store/store";

// ลิงก์ถูกกำหนดตายตัวในโค้ด (store/slices/linksSlice.js) จึงไม่ต้อง
// persist ไปไหน — เหลือแค่สร้าง store แล้วส่งต่อผ่าน Provider
export default function ReduxProvider({ children }) {
  const storeRef = useRef(null);
  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  return <Provider store={storeRef.current}>{children}</Provider>;
}
