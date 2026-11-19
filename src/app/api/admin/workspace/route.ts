import { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { CloudError, cloudErrorResponse, requireCloudProfile } from "@/server/cloud/auth";
import { isSameOrigin } from "@/server/manager-session";

export async function GET() {
  try {
    const { client } = await requireCloudProfile(["system_admin"]);
    const [profiles, events, audit] = await Promise.all([
      client.from("profiles").select("id,name,email,role,suspended,must_change_password,deleted_at").is("deleted_at", null).order("created_at"),
      client.from("events").select("id,name,owner_id,suspended,status").order("created_at", { ascending: false }),
      client.from("audit_log").select("id,action,target,created_at").order("created_at", { ascending: false }).limit(200),
    ]);
    if (profiles.error || events.error || audit.error) throw new CloudError("อ่านข้อมูล Admin จาก Supabase ไม่สำเร็จ", 503);
    return Response.json({ accounts: profiles.data, events: events.data, audit: audit.data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return cloudErrorResponse(error); }
}

export async function POST(request: NextRequest) {
  try {
    if (!isSameOrigin(request)) throw new CloudError("ไม่สามารถสร้างบัญชีจากเว็บไซต์อื่น", 403);
    const { profile } = await requireCloudProfile(["system_admin"]);
    const admin = createSupabaseAdminClient();
    const body = await request.json().catch(() => null);
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!name || name.length > 120 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof body?.password !== "string" || body.password.length < 8 || body.password.length > 128) throw new CloudError("กรอกชื่อ อีเมล และรหัสผ่านชั่วคราวอย่างน้อย 8 ตัวอักษรให้ครบ");
    const { data, error } = await admin.auth.admin.createUser({ email, password: body.password, email_confirm: true, user_metadata: { name } });
    if (error || !data.user) throw new CloudError("สร้างบัญชีไม่ได้ อีเมลอาจมีอยู่แล้ว หรือรหัสผ่านไม่ผ่านเงื่อนไขของโปรเจกต์", 409);
    const { error: setupError } = await admin.rpc("admin_account_action", { p_actor: profile.id, p_target: data.user.id, p_action: "initialize_manager", p_name: name });
    if (setupError) { await admin.auth.admin.deleteUser(data.user.id); throw new CloudError("กำหนดสิทธิ์บัญชีไม่สำเร็จ กรุณาตรวจโครงสร้างฐานข้อมูล", 503); }
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) { return cloudErrorResponse(error); }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!isSameOrigin(request)) throw new CloudError("ไม่สามารถแก้ไขบัญชีจากเว็บไซต์อื่น", 403);
    const { profile } = await requireCloudProfile(["system_admin"]);
    const body = await request.json().catch(() => null);
    if (!body || !["toggle_account", "delete_account", "toggle_event"].includes(body.action) || typeof body.id !== "string" || !/^[a-f0-9-]{36}$/i.test(body.id)) throw new CloudError("ข้อมูลรายการไม่ถูกต้อง");
    const admin = createSupabaseAdminClient();
    const { error } = await admin.rpc("admin_account_action", { p_actor: profile.id, p_target: body.id, p_action: body.action });
    if (error) throw new CloudError("เปลี่ยนแปลงรายการไม่ได้ บัญชีผู้ดูแลถูกป้องกันและรายการอาจถูกเปลี่ยนแล้ว", 409);
    return Response.json({ ok: true });
  } catch (error) { return cloudErrorResponse(error); }
}
