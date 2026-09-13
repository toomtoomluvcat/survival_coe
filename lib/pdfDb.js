"use client";

import { openDB } from "idb";

const DB_NAME = "my-hub-pdfs";
const STORE = "pdfs";

function getDb() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    },
  });
}

export async function listPdfMeta() {
  const db = await getDb();
  const all = await db.getAll(STORE);
  return all
    .map(({ id, name, size, addedAt }) => ({ id, name, size, addedAt }))
    .sort((a, b) => b.addedAt - a.addedAt);
}

export async function putPdf({ id, name, size, addedAt, blob }) {
  const db = await getDb();
  await db.put(STORE, { id, name, size, addedAt, blob });
}

export async function getPdfBlob(id) {
  const db = await getDb();
  const record = await db.get(STORE, id);
  return record?.blob ?? null;
}

export async function deletePdf(id) {
  const db = await getDb();
  await db.delete(STORE, id);
}
