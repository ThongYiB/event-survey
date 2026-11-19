import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { CloudError } from "./auth";
import { uuidPattern } from "@/lib/registration";

export function requireEventId(value: unknown): string {
  if (typeof value !== "string" || !uuidPattern.test(value)) throw new CloudError("กรุณาเปิดลิงก์ของอีเวนต์ที่ต้องการ", 400);
  return value;
}
export const ticketCookie = (eventId: string) => `es-ticket-${eventId}`;
export async function publishedEvent(eventId: string) {
  const admin = createSupabaseAdminClient();
  const { data: pub, error } = await admin.from("event_publications").select("event_id,details,form_fields,registration_open,capacity,revision,survey_open,survey_fields,survey_revision").eq("event_id", eventId).maybeSingle();
  if (error) throw new CloudError("โหลดอีเวนต์ไม่ได้ กรุณาลองอีกครั้ง", 503);
  if (!pub) throw new CloudError("ไม่พบอีเวนต์ที่เผยแพร่", 404);
  const { data: event } = await admin.from("events").select("owner_id,status,suspended").eq("id", eventId).single();
  const { data: owner } = event ? await admin.from("profiles").select("role,suspended,deleted_at,must_change_password").eq("id", event.owner_id).single() : { data: null };
  if (!event || event.suspended || !owner || owner.role !== "event_manager" || owner.suspended || owner.deleted_at || owner.must_change_password) throw new CloudError("อีเวนต์นี้ไม่พร้อมใช้งาน", 404);
  return { ...pub, id: eventId, registration_open: pub.registration_open && event.status === "open" };
}
