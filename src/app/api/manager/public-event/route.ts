import { NextRequest } from "next/server";
import { isManagerSession, isSameOrigin, managerCookie } from "@/server/manager-session";
import { publishPublicEvent } from "@/server/public-event";

export async function PUT(request: NextRequest) {
  if (!isManagerSession(request.cookies.get(managerCookie)?.value)) return Response.json({ message: "เข้าสู่ระบบ Event Manager ก่อนเผยแพร่การตั้งค่า" }, { status: 401 });
  if (!isSameOrigin(request)) return Response.json({ message: "ไม่สามารถบันทึกจากเว็บไซต์อื่น" }, { status: 403 });
  const text = await request.text();
  if (text.length > 3200000) return Response.json({ message: "สื่อมีขนาดใหญ่เกินไป กรุณาลดขนาดรูป" }, { status: 413 });
  let payload: unknown;
  try { payload = JSON.parse(text); } catch { return Response.json({ message: "ข้อมูลไม่ถูกต้อง" }, { status: 400 }); }
  const { status, ...result } = publishPublicEvent(payload);
  return Response.json(result, { status, headers: { "Cache-Control": "no-store" } });
}
