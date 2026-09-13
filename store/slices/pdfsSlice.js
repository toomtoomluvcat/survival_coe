import { createSlice } from "@reduxjs/toolkit";

// เก็บเฉพาะ "เมทาดาทา" ของ PDF ไว้ใน redux (id, name, size, addedAt)
// ตัวไฟล์จริง (Blob) เก็บแยกไว้ใน IndexedDB ผ่าน lib/pdfDb.js
const initialState = {
  items: [], // { id, name, size, addedAt }
};

const pdfsSlice = createSlice({
  name: "pdfs",
  initialState,
  reducers: {
    setPdfs(state, action) {
      state.items = action.payload;
    },
    addPdfMeta(state, action) {
      state.items.unshift(action.payload);
    },
    removePdfMeta(state, action) {
      state.items = state.items.filter((p) => p.id !== action.payload);
    },
  },
});

export const { setPdfs, addPdfMeta, removePdfMeta } = pdfsSlice.actions;
export default pdfsSlice.reducer;
