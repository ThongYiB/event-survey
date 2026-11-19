import { registerAttendee } from "@/server/staff/service";
import { NextRequest, NextResponse } from "next/server";
import { supabaseEnabled } from "@/lib/supabase/config";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { publishedEvent, requireEventId, ticketCookie } from "@/server/cloud/registration";
import { CloudError, cloudErrorResponse } from "@/server/cloud/auth";
import { registrationAnswers } from "@/lib/registration";
import { isSameOrigin } from "@/server/manager-session";

export async function POST(request: NextRequest) {
  if (supabaseEnabled()) {
    try {
      if (!isSameOrigin(request)) throw new CloudError("กรุณาลงทะเบียนจากหน้าอีเวนต์", 403);
      const text = await request.text(); if (text.length > 40000) throw new CloudError("ข้อมูลยาวเกินกำหนด", 413);
      const body = JSON.parse(text);
      if (!body || !Number.isInteger(body.revision) || body.revision < 1) throw new CloudError("ข้อมูลแบบฟอร์มไม่ถูกต้อง กรุณาโหลดหน้าใหม่");
      const id = requireEventId(body.eventId);
      if (typeof body.requestKey !== "string" || !/^[a-f0-9]{32}$/.test(body.requestKey)) throw new CloudError("ข้อมูลการลงทะเบียนไม่ถูกต้อง");
      const pub = await publishedEvent(id);
      const { answers, errors } = registrationAnswers(pub.form_fields, body.answers);
      if (Object.keys(errors).length) return Response.json({ message: "ตรวจสอบข้อมูลที่กรอก", errors }, { status: 400, headers: { "Cache-Control": "no-store" } });
      const { data, error } = await createSupabaseAdminClient().rpc("register_event_attendee", { p_event: id, p_revision: body.revision, p_request: body.requestKey, p_answers: answers });
      if (error) {
        const messages: Record<string, string> = { REGISTRATION_CLOSED: "ปิดรับลงทะเบียนแล้ว", FORM_UPDATED: "แบบฟอร์มเปลี่ยนแปลง กรุณาโหลดใหม่ก่อนลงทะเบียน", ALREADY_REGISTERED: "อีเมลนี้ลงทะเบียนงานนี้แล้ว หากเคยลงทะเบียนจากเครื่องนี้ให้เปิดตั๋วของฉัน", EVENT_FULL: "จำนวนผู้เข้าร่วมเต็มแล้ว", EVENT_UNAVAILABLE: "อีเวนต์นี้ไม่พร้อมใช้งาน", RETRY_MISMATCH: "ข้อมูลเปลี่ยนแปลง กรุณาเริ่มลงทะเบียนใหม่" };
        const code = Object.keys(messages).find((key) => error.message.includes(key));
        throw new CloudError(code ? messages[code] : "ลงทะเบียนไม่สำเร็จ กรุณาลองอีกครั้ง", code ? 409 : 503);
      }
      const response = NextResponse.json({ ok: true, eventId: id, registeredAt: data.registeredAt }, { status: data.reused ? 200 : 201, headers: { "Cache-Control": "private, no-store" } });
      response.cookies.set(ticketCookie(id), data.ticketCode, { httpOnly: true, secure: request.nextUrl.protocol === "https:", sameSite: "lax", path: "/", maxAge: 30 * 86400 });
      response.cookies.set("es-last-event", id, { httpOnly: true, secure: request.nextUrl.protocol === "https:", sameSite: "lax", path: "/", maxAge: 30 * 86400 });
      return response;
    } catch (error) { return error instanceof SyntaxError ? Response.json({ message: "ข้อมูลไม่ถูกต้อง" }, { status: 400 }) : cloudErrorResponse(error); }
  }
  const payload: unknown = await request.json().catch(() => null);
  const { status, ...result } = registerAttendee(payload);
  return Response.json(result, { status, headers: { "Cache-Control": "no-store" } });
}
