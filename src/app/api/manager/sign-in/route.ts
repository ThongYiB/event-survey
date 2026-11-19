import { NextRequest, NextResponse } from "next/server";
import { isSameOrigin, managerCookie, managerSessionSeconds, signInManager } from "@/server/manager-session";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ message: "ไม่สามารถเข้าสู่ระบบจากเว็บไซต์อื่น" }, { status: 403 });
  const body = await request.json().catch(() => null);
  const result = signInManager(body?.email, body?.password);
  if (!result.token) return NextResponse.json({ message: result.status === 503 ? "ยังไม่ได้เปิดบัญชี Manager สำหรับสภาพแวดล้อมนี้" : "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }, { status: result.status });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(managerCookie, result.token, { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/", maxAge: managerSessionSeconds });
  return response;
}

export function DELETE(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({}, { status: 403 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(managerCookie, "", { path: "/", maxAge: 0 });
  return response;
}
