import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { defaultEventDetails, surveyOptions, type SurveyField } from "@/lib/public-event";
import type { CloudManagerData, CloudManagerEvent } from "@/lib/cloud-manager";
import { CloudError, type Profile } from "./auth";
import {cleanKiosk} from '@/lib/kiosk';

export const activeEventCookie = "event-survey-active-event";

export async function getCloudManagerData(client: SupabaseClient, profile: Profile, requested?: string): Promise<CloudManagerData> {
  const { data, error } = await client.from("events").select("id,name,status,details,settings").eq("owner_id", profile.id).eq("suspended", false).order("created_at", { ascending: false });
  if (error) throw new CloudError("โหลดอีเวนต์ไม่ได้ กรุณาตรวจโครงสร้างตารางใน Supabase", 503);
  const events = (data || []).map((event) => ({ ...event, details: { ...defaultEventDetails, ...event.details, name: event.name }, settings: event.settings || {} })) as CloudManagerEvent[];
  const selected = requested ?? (await cookies()).get(activeEventCookie)?.value;
  const event = events.find((event) => event.id === selected) ?? events[0] ?? null;
  const team: CloudManagerData["team"] = [];
  if (event) {
    const { data: members, error: memberError } = await client.from("event_members").select("user_id,permissions").eq("event_id", event.id);
    if (memberError) throw new CloudError("โหลดทีมงานไม่ได้", 503);
    if (members?.length) {
      const { data: staff, error: staffError } = await client.from("profiles").select("id,name,email").in("id", members.map((member) => member.user_id));
      if (staffError) throw new CloudError("โหลดบัญชีทีมงานไม่ได้", 503);
      for (const member of members) { const person = staff?.find((person) => person.id === member.user_id); if (person) team.push({ name: person.name, email: person.email, access: member.permissions }); }
    }
  }
  return { profile: { id: profile.id, name: profile.name }, events, event, team };
}

export function validateEventSetting(key: unknown, value: unknown) {
  if (typeof key !== "string" || !["details", "form", "survey", "team", "kiosk"].includes(key)) throw new CloudError("ส่วนตั้งค่าไม่ถูกต้อง");
  if (JSON.stringify(value ?? null).length > 3200000) throw new CloudError("ข้อมูลมีขนาดใหญ่เกินไป กรุณาลดขนาดสื่อ");
  if (key === "details") {
    const details = value as typeof defaultEventDetails;
    if (!details || Object.keys(defaultEventDetails).some((name) => typeof details[name as keyof typeof details] !== "string")) throw new CloudError("ข้อมูลอีเวนต์ไม่ครบ");
    if (!details.name.trim() || details.name.length > 200 || !details.venue.trim() || details.venue.length > 300 || details.description.length > 5000 || !/^#[0-9a-f]{6}$/i.test(details.color)) throw new CloudError("ตรวจชื่อ รายละเอียด สถานที่ และสีของงาน");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(details.startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(details.endDate) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(details.startTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(details.endTime)) throw new CloudError("วันเวลาของงานไม่ถูกต้อง");
    const start = new Date(`${details.startDate}T${details.startTime}:00+07:00`).getTime(), end = new Date(`${details.endDate}T${details.endTime}:00+07:00`).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) throw new CloudError("เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่ม");
    if ([details.logo, details.banner].some((image) => image && !/^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(image))) throw new CloudError("รูปภาพไม่รองรับ");
    return Object.fromEntries(Object.keys(defaultEventDetails).map((name) => [name, details[name as keyof typeof details]]));
  }
  if (key === "form" || key === "survey") {
    if (!Array.isArray(value) || !value.length || value.length > 50) throw new CloudError("กำหนดคำถามหรือฟิลด์ 1–50 ข้อ");
    const ids = new Set();
    for (const field of value as SurveyField[]) {
      if (!field || typeof field.id !== "string" || !/^[\w-]{1,80}$/.test(field.id) || ids.has(field.id) || typeof field.label !== "string" || !field.label.trim() || field.label.length > 300 || typeof field.help !== "string" || field.help.length > 1000 || typeof field.required !== "boolean" || typeof field.options !== "string" || field.options.length > 8000 || !(key === "survey" ? ["text", "textarea", "radio", "checkbox"] : ["text", "email", "tel"]).includes(field.type)) throw new CloudError("ตรวจชื่อ ประเภท และคำอธิบายของทุกข้อ");
      ids.add(field.id);
      if (["radio", "checkbox"].includes(field.type) && (surveyOptions(field).length < 2 || surveyOptions(field).length > 30)) throw new CloudError("คำถามแบบเลือกต้องมีตัวเลือก 2–30 ข้อ");
    }
    return value;
  }
  if (key === "team") {
    if (!Array.isArray(value) || value.length > 100 || value.some((member) => !member || typeof member.email !== "string" || member.email.length > 254 || !Array.isArray(member.access) || member.access.some((permission: unknown) => !["ค้นหาผู้ลงทะเบียน", "เช็กอิน", "ลงทะเบียน Walk-in", "แสดง QR แบบสอบถาม"].includes(String(permission))))) throw new CloudError("ข้อมูลทีมงานไม่ถูกต้อง");
    return value;
  }
  try{return cleanKiosk(value);}catch(error){throw new CloudError(error instanceof Error?error.message:'ข้อมูลตั้งค่าจอไม่ถูกต้อง');}
}
