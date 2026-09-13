import { configureStore } from "@reduxjs/toolkit";
import linksReducer from "./slices/linksSlice";
import pdfsReducer from "./slices/pdfsSlice";

export function makeStore() {
  return configureStore({
    reducer: {
      links: linksReducer,
      pdfs: pdfsReducer,
    },
  });
}

export const store = makeStore();
