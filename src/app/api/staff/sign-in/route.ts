import { NextRequest, NextResponse } from "next/server";
import { startStaffSession, staffSessionCookie, staffSessionSeconds } from "@/server/staff/demo-session";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const { status, token } = startStaffSession(body?.password);
  if (!token) {
    return NextResponse.json({
      message: status === 503 ? "บัญชี Staff ทดลองยังไม่ได้เปิดใช้งาน" : "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
    }, { status });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(staffSessionCookie, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
    path: "/",
    maxAge: staffSessionSeconds,
  });
  return response;
}

export function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(staffSessionCookie);
  return response;
}
