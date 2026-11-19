import { NextRequest } from "next/server";
import { supabaseEnabled } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CloudError, cloudErrorResponse, requireCloudProfile, roleHome } from "@/server/cloud/auth";
import { isSameOrigin } from "@/server/manager-session";

export async function POST(request: NextRequest) {
  try {
    if (!supabaseEnabled()) throw new CloudError("ยังไม่ได้ตั้งค่า Supabase", 503);
    if (!isSameOrigin(request)) throw new CloudError("ไม่สามารถเข้าสู่ระบบจากเว็บไซต์อื่น", 403);
    const body = await request.json().catch(() => null);
    if (typeof body?.email !== "string" || typeof body?.password !== "string" || body.email.length > 254 || body.password.length > 1024) throw new CloudError("กรอกอีเมลและรหัสผ่านให้ครบ");
    const client = await createSupabaseServerClient();
    const { error } = await client.auth.signInWithPassword({ email: body.email.trim().toLowerCase(), password: body.password });
    if (error) throw new CloudError("อีเมลหรือรหัสผ่านไม่ถูกต้อง", 401);
    try {
      const { profile } = await requireCloudProfile(undefined, true, client);
      return Response.json({ next: profile.must_change_password ? "/set-password" : roleHome(profile.role) }, { headers: { "Cache-Control": "no-store" } });
    } catch (failure) { await client.auth.signOut(); throw failure; }
  } catch (error) { return cloudErrorResponse(error); }
}
