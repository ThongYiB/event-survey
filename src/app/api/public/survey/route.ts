import { submitSurvey } from "@/server/public-event";

export async function POST(request: Request) {
  const text = await request.text();
  if (text.length > 100000) return Response.json({ message: "ข้อมูลคำตอบมีขนาดใหญ่เกินไป" }, { status: 413 });
  let payload: unknown;
  try { payload = JSON.parse(text); } catch { return Response.json({ message: "ข้อมูลคำตอบไม่ถูกต้อง" }, { status: 400 }); }
  const { status, ...result } = submitSurvey(payload);
  return Response.json(result, { status, headers: { "Cache-Control": "no-store" } });
}
