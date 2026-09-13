import { BoardError, getBoardStore } from "@/lib/lab7-store.mjs";
import { networkInterfaces } from "node:os";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function failure(error) {
  if (error instanceof BoardError) return Response.json({ error: error.message }, { status: error.status });
  console.error("Lab 7 board:", error);
  return Response.json({ error: "บันทึกหรืออ่านกระดานไม่ได้ ลองใหม่อีกครั้ง" }, { status: 500 });
}

export async function GET(request) {
  try {
    const port = new URL(request.url).port;
    const shareUrls = Object.entries(networkInterfaces())
      .filter(([name]) => !/^(docker|br-|veth|lo$)/.test(name))
      .flatMap(([, addresses]) => addresses.filter((a) => !a.internal && a.family === "IPv4"))
      .map((a) => `http://${a.address}${port ? `:${port}` : ""}/path_lab7`);
    return Response.json({ ...await getBoardStore().read(), shareUrls }, { headers: { "Cache-Control": "no-store" } });
  }
  catch (error) { return failure(error); }
}

export async function PATCH(request) {
  const origin = request.headers.get("origin");
  try {
    if (origin && origin !== new URL(request.url).origin && new URL(origin).host !== request.headers.get("host")) throw new Error();
  } catch { return Response.json({ error: "กรุณาบันทึกจากหน้ากระดาน" }, { status: 403 }); }
  let input;
  try {
    const body = await request.text();
    if (body.length > 4096) return Response.json({ error: "ข้อมูลยาวเกินไป" }, { status: 413 });
    input = JSON.parse(body);
  } catch { return Response.json({ error: "อ่านข้อมูลที่ส่งมาไม่ได้" }, { status: 400 }); }
  try { return Response.json(await getBoardStore().update(input)); }
  catch (error) { return failure(error); }
}
