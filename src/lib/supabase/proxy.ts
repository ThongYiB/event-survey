import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { supabasePublicConfig } from "./config";
import type { Profile } from "@/server/cloud/auth";

const managerPages = ["/manager", "/dashboard", "/details", "/form", "/team", "/survey", "/qr-center", "/registration", "/report", "/kiosk"];
// These handlers verify the session and current database role themselves.
// Do not repeat their database round trips in the routing proxy.
const authenticatedHandlers = new Set(["/api/admin/workspace", "/api/manager/events", "/api/manager/active-event", "/api/staff/cloud-events"]);
export async function supabaseProxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const finish = (next: NextResponse) => {
    for (const cookie of response.cookies.getAll()) next.cookies.set(cookie);
    next.headers.set("Cache-Control", "private, no-store");
    return next;
  };
  const path = request.nextUrl.pathname;
  const pending = () => NextResponse.json({ message: "ส่วนลงทะเบียน เช็กอิน แบบสอบถาม และรายงานกำลังเชื่อม Supabase ในขั้นถัดไป ข้อมูลตัวอย่างในเครื่องยังถูกเก็บไว้" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  if (path.startsWith("/api/public/") || path.startsWith("/api/attendee/")) return pending();
  if (path.startsWith("/api/auth/") || path === "/login") return response;
  if (authenticatedHandlers.has(path)) return finish(response);
  try {
    const { url, key } = supabasePublicConfig();
    const client = createServerClient(url, key, { cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (values) => {
        for (const { name, value } of values) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of values) response.cookies.set(name, value, options);
      },
    } });
    // Verify the JWT signature with Supabase's cached public signing keys.
    // The profile below still checks current role and account restrictions.
    const { data: identity, error } = await client.auth.getClaims();
    if (error || !identity?.claims.sub) return finish(path.startsWith("/api/") ? NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 }) : NextResponse.redirect(new URL("/login", request.url)));
    const { data, error: profileError } = await client.from("profiles").select("id,email,name,role,suspended,must_change_password,deleted_at").eq("id", identity.claims.sub).single();
    if (profileError || !data) return finish(new NextResponse("ยังไม่ได้ตั้งค่าตารางและสิทธิ์บัญชีใน Supabase", { status: 503 }));
    const profile = data as Profile;
    if (profile.suspended || profile.deleted_at) return finish(path.startsWith("/api/") ? NextResponse.json({ message: "บัญชีถูกระงับหรือปิดใช้งาน" }, { status: 403 }) : NextResponse.redirect(new URL("/login", request.url)));
    if (profile.must_change_password && path !== "/set-password") return finish(path.startsWith("/api/") ? NextResponse.json({ message: "กรุณาตั้งรหัสผ่านใหม่ก่อนใช้งาน" }, { status: 428 }) : NextResponse.redirect(new URL("/set-password", request.url)));
    const required = path.startsWith("/admin") || path.startsWith("/api/admin/") ? "system_admin" : path.startsWith("/staff") || path.startsWith("/api/staff/") ? "staff" : managerPages.includes(path) || path.startsWith("/api/manager/") ? "event_manager" : null;
    if (required && profile.role !== required) {
      const home = profile.role === "system_admin" ? "/admin/accounts" : profile.role === "staff" ? "/staff" : "/manager";
      return finish(path.startsWith("/api/") ? NextResponse.json({ message: "บัญชีนี้ไม่มีสิทธิ์เข้าถึงส่วนนี้" }, { status: 403 }) : NextResponse.redirect(new URL(home, request.url)));
    }
    if ((path.startsWith("/api/staff/") && path !== "/api/staff/cloud-events") || ["/api/manager/public-event", "/api/manager/survey-results", "/api/manager/sign-in"].includes(path)) return finish(pending());
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch { return finish(path.startsWith("/api/") ? NextResponse.json({ message: "ติดต่อ Supabase ไม่ได้ กรุณาตรวจการตั้งค่า" }, { status: 503 }) : new NextResponse("ติดต่อ Supabase ไม่ได้ กรุณาตรวจการตั้งค่า", { status: 503 })); }
}
