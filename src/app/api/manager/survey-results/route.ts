import { NextRequest } from "next/server";
import { isManagerSession, managerCookie } from "@/server/manager-session";
import { getSurveyResults } from "@/server/public-event";

export function GET(request: NextRequest) {
  if (!isManagerSession(request.cookies.get(managerCookie)?.value)) return Response.json({ message: "เข้าสู่ระบบ Event Manager เพื่อดูคำตอบ" }, { status: 401 });
  return Response.json(getSurveyResults(), { headers: { "Cache-Control": "no-store" } });
}
