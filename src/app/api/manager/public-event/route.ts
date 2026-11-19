import { NextRequest } from "next/server";
import { isManagerSession, isSameOrigin, managerCookie } from "@/server/manager-session";
import { publishPublicEvent } from "@/server/public-event";
import { supabaseEnabled } from "@/lib/supabase/config";
import { requireCloudProfile, CloudError, cloudErrorResponse } from "@/server/cloud/auth";
import { getCloudManagerData, validateEventSetting } from "@/server/cloud/events";
import { defaultRegistrationFields } from "@/lib/registration";

export async function GET() {
  try {
    const { client, profile } = await requireCloudProfile(["event_manager"]);
    const { event } = await getCloudManagerData(client, profile);
    if (!event) throw new CloudError("เลือกอีเวนต์ก่อน", 404);
    const { data, error } = await client.from("event_publications").select("registration_open,capacity,revision,published_at").eq("event_id", event.id).maybeSingle();
    if (error) throw new CloudError("โหลดการเผยแพร่ไม่ได้", 503);
    return Response.json({ eventId: event.id, publication: data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return cloudErrorResponse(error); }
}

export async function PUT(request: NextRequest) {
  if (supabaseEnabled()) {
    try {
      if (!isSameOrigin(request)) throw new CloudError("ไม่สามารถบันทึกจากเว็บไซต์อื่น", 403);
      const { client, profile } = await requireCloudProfile(["event_manager"]);
      const { event } = await getCloudManagerData(client, profile);
      if (!event) throw new CloudError("เลือกอีเวนต์ก่อน", 404);
      const body = await request.json();
      if (typeof body.open !== "boolean" || !Number.isInteger(body.capacity) || body.capacity < 0 || body.capacity > 100000) throw new CloudError("กำหนดจำนวนผู้เข้าร่วม 0–100,000 คน (0 คือไม่จำกัด)");
      validateEventSetting("details", event.details);
      const fields = validateEventSetting("form", event.settings.form || defaultRegistrationFields) as typeof defaultRegistrationFields;
      if (!fields.some((f) => f.id === "name" && f.type === "text" && f.required) || !fields.some((f) => f.id === "email" && f.type === "email" && f.required)) throw new CloudError("ฟอร์มต้องมีช่อง name ชื่อ-นามสกุล และ email อีเมล เป็นช่องบังคับก่อนเผยแพร่");
      const { error } = await client.rpc("publish_registration", { p_event: event.id, p_open: body.open, p_capacity: body.capacity });
      if (error) throw new CloudError("เผยแพร่ไม่ได้ กรุณาตรวจรายละเอียด ฟอร์ม และสิทธิ์ของงาน", 409);
      return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
    } catch (error) { return cloudErrorResponse(error); }
  }
  if (!isManagerSession(request.cookies.get(managerCookie)?.value)) return Response.json({ message: "เข้าสู่ระบบ Event Manager ก่อนเผยแพร่การตั้งค่า" }, { status: 401 });
  if (!isSameOrigin(request)) return Response.json({ message: "ไม่สามารถบันทึกจากเว็บไซต์อื่น" }, { status: 403 });
  const text = await request.text();
  if (text.length > 3200000) return Response.json({ message: "สื่อมีขนาดใหญ่เกินไป กรุณาลดขนาดรูป" }, { status: 413 });
  let payload: unknown;
  try { payload = JSON.parse(text); } catch { return Response.json({ message: "ข้อมูลไม่ถูกต้อง" }, { status: 400 }); }
  const { status, ...result } = publishPublicEvent(payload);
  return Response.json(result, { status, headers: { "Cache-Control": "no-store" } });
}
