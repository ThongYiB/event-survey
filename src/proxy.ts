import { NextRequest, NextResponse } from "next/server";
import { isStaffSession, staffSessionCookie } from "@/server/staff/demo-session";
import { supabaseEnabled } from "@/lib/supabase/config";
import { supabaseProxy } from "@/lib/supabase/proxy";

export function proxy(request: NextRequest) {
  if (supabaseEnabled()) return supabaseProxy(request);
  const pathname = request.nextUrl.pathname;
  if (!pathname.startsWith("/staff") && !pathname.startsWith("/api/staff/")) return NextResponse.next();
  if (pathname === "/api/staff/sign-in") return NextResponse.next();
  if (isStaffSession(request.cookies.get(staffSessionCookie)?.value)) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized", message: "กรุณาเข้าสู่ระบบด้วยบัญชี Staff" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = { matcher: ["/admin/:path*", "/staff/:path*", "/api/admin/:path*", "/api/staff/:path*", "/api/manager/:path*", "/api/auth/:path*", "/api/public/:path*", "/api/attendee/:path*", "/set-password", "/login", "/manager", "/dashboard", "/details", "/form", "/team", "/survey", "/qr-center", "/registration", "/report", "/kiosk"] };
