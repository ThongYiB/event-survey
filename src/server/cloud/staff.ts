import "server-only";
import { cookies } from "next/headers";
import type { PostgrestError } from "@supabase/supabase-js";
import type { CheckInResult, EventStats, StaffEvent, StaffSession } from "@/lib/staff/types";
import { CloudError, cloudErrorResponse, requireCloudProfile } from "./auth";
import { isSameOrigin } from "@/server/manager-session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const staffEventCookie = "event-survey-staff-event";
type AssignedEvent = StaffEvent & { access: string[]; stats: EventStats };
type RawEvent = { id: string; name: string; status: string; details: Record<string,string>; capacity: number; permissions: string[]; stats: EventStats };

export function staffRpcError(error: PostgrestError): never {
  const errors: Record<string, [string, number]> = {
    STAFF_FORBIDDEN: ["คุณไม่มีสิทธิ์ทำรายการนี้ หรือถูกถอนจากทีมงานแล้ว",403],
    CHECKIN_CLOSED: ["อีเวนต์นี้ยังไม่เปิดหรือปิดรับเช็กอินแล้ว",409],
    ALREADY_REGISTERED: ["อีเมลนี้ลงทะเบียนในงานแล้ว กรุณาค้นหารายชื่อเพื่อเช็กอิน",409],
    EVENT_FULL: ["จำนวนผู้ลงทะเบียนเต็มแล้ว",409],
    EVENT_UNAVAILABLE: ["อีเวนต์นี้ยังไม่พร้อมรับลงทะเบียน",409],
    INVALID_INPUT: ["ตรวจสอบชื่อ อีเมล และการยืนยันข้อมูลก่อนบันทึก",400],
  };
  for (const [code,[message,status]] of Object.entries(errors)) if(error.message.includes(code)) throw new CloudError(message,status);
  throw new CloudError("โหลดข้อมูลทีมงานไม่ได้ กรุณาลองอีกครั้ง",503);
}

export async function cloudStaffWorkspace() {
  const client=await createSupabaseServerClient();
  // The RPC enforces live membership itself, so these independent checks can run together.
  const [{profile},{data,error}]=await Promise.all([requireCloudProfile(["staff"],false,client),client.rpc("staff_workspace")]);
  if(error) staffRpcError(error);
  const events: AssignedEvent[] = ((data || []) as RawEvent[]).map(e=>({
    id:e.id,name:e.name,startsAt:`${e.details.startDate}T${e.details.startTime}:00+07:00`,
    endsAt:`${e.details.endDate}T${e.details.endTime}:00+07:00`,place:e.details.venue || "ยังไม่ระบุสถานที่",
    status:e.status==="open"?"open":e.status==="closed"?"ended":"upcoming",capacity:e.capacity,
    permissions:e.permissions.join(" · "),access:e.permissions,stats:e.stats,
  }));
  return {client,profile,events};
}

export async function cloudStaffSession() {
  const workspace = await cloudStaffWorkspace();
  const selected = (await cookies()).get(staffEventCookie)?.value;
  const event = selected ? workspace.events.find(e=>e.id===selected) : workspace.events[0];
  if(!event) throw new CloudError("กรุณาเลือกงานที่ได้รับมอบหมายก่อน หากไม่มีงานให้ติดต่อ Event Manager",409);
  const session: StaffSession = { staff:{name:workspace.profile.name,accountLabel:"บัญชี Staff",id:workspace.profile.id},event,stats:event.stats,access:event.access };
  return {...workspace,event,session};
}

export async function staffMutationBody(request: Request) {
  if(!isSameOrigin(request)) throw new CloudError("ไม่สามารถทำรายการจากเว็บไซต์อื่น",403);
  const raw = await request.text();
  if(raw.length>8000) throw new CloudError("ข้อมูลมีขนาดใหญ่เกินไป",413);
  try { const body=JSON.parse(raw); if(!body || typeof body!=="object" || Array.isArray(body)) throw new Error(); return body as Record<string, unknown>; }
  catch {throw new CloudError("ข้อมูลที่ส่งไม่ถูกต้อง");}
}

export async function cloudStaffCheckin(request: Request) {
  try {
    const body=await staffMutationBody(request);
    if(typeof body.code!=="string" || !["qr","search"].includes(String(body.via))) throw new CloudError("รูปแบบรหัสไม่ถูกต้อง");
    const {client,event}=await cloudStaffSession();
    const {data,error}=await client.rpc("staff_checkin",{p_event:event.id,p_code:body.code,p_via:body.via});
    if(error) staffRpcError(error);
    return Response.json({...data,event,attendeeEvent:null} as CheckInResult,{headers:{"Cache-Control":"private, no-store"}});
  } catch(error){return staffErrorResponse(error);}
}

export function staffErrorResponse(error: unknown) {
  return cloudErrorResponse(error);
}
