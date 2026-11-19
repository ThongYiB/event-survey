import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export type AppRole = "system_admin" | "event_manager" | "staff";
export type Profile = { id: string; email: string; name: string; role: AppRole; suspended: boolean; must_change_password: boolean; deleted_at: string | null };

export class CloudError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export const roleHome = (role: AppRole) => role === "system_admin" ? "/admin/accounts" : role === "event_manager" ? "/manager" : "/staff";

export async function requireCloudProfile(roles?: AppRole[], allowPasswordChange = false, existingClient?: SupabaseClient) {
  const client = existingClient ?? await createSupabaseServerClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) throw new CloudError("กรุณาเข้าสู่ระบบ", 401);
  const { data, error: profileError } = await client.from("profiles").select("id,email,name,role,suspended,must_change_password,deleted_at").eq("id", user.id).single();
  if (profileError || !data) throw new CloudError("ยังไม่ได้ตั้งค่าตารางและสิทธิ์บัญชีใน Supabase", 503);
  const profile = data as Profile;
  if (profile.suspended || profile.deleted_at) throw new CloudError("บัญชีนี้ถูกระงับหรือปิดใช้งาน กรุณาติดต่อผู้ดูแลระบบ", 403);
  if (!allowPasswordChange && profile.must_change_password) throw new CloudError("กรุณาตั้งรหัสผ่านใหม่ก่อนใช้งาน", 428);
  if (roles && !roles.includes(profile.role)) throw new CloudError("บัญชีนี้ไม่มีสิทธิ์เข้าถึงส่วนนี้", 403);
  return { client, profile, user };
}

export function cloudErrorResponse(error: unknown) {
  return Response.json({ message: error instanceof CloudError ? error.message : "ดำเนินการกับ Supabase ไม่สำเร็จ กรุณาตรวจการตั้งค่าแล้วลองอีกครั้ง" }, { status: error instanceof CloudError ? error.status : 503, headers: { "Cache-Control": "no-store" } });
}
