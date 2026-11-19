import { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { CloudError, cloudErrorResponse, requireCloudProfile, roleHome } from "@/server/cloud/auth";
import { isSameOrigin } from "@/server/manager-session";

export async function POST(request: NextRequest) {
  try {
    if (!isSameOrigin(request)) throw new CloudError("ไม่สามารถเปลี่ยนรหัสผ่านจากเว็บไซต์อื่น", 403);
    const { client, profile } = await requireCloudProfile(undefined, true);
    const admin = createSupabaseAdminClient();
    const body = await request.json().catch(() => null);
    if (typeof body?.password !== "string" || body.password.length < 8 || body.password.length > 128 || body.password !== body.confirmation) throw new CloudError("รหัสผ่านต้องตรงกันและยาว 8–128 ตัวอักษร");
    const { error } = await client.auth.updateUser({ password: body.password });
    if (error) throw new CloudError("เปลี่ยนรหัสผ่านไม่สำเร็จ กรุณาตรวจนโยบายรหัสผ่านของโปรเจกต์แล้วลองอีกครั้ง");
    const { error: saveError } = await admin.from("profiles").update({ must_change_password: false }).eq("id", profile.id);
    if (saveError) throw new CloudError("เปลี่ยนรหัสผ่านแล้ว แต่ปรับสถานะบัญชีไม่สำเร็จ กรุณาเข้าสู่ระบบด้วยรหัสใหม่และลองอีกครั้ง", 503);
    await admin.from("audit_log").insert({ actor_id: profile.id, action: "เปลี่ยนรหัสผ่าน", target: profile.email });
    return Response.json({ next: roleHome(profile.role) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return cloudErrorResponse(error); }
}
