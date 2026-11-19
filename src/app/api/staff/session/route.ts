import { connection } from "next/server";
import { getStaffSession } from "@/server/staff/service";
import { supabaseEnabled } from "@/lib/supabase/config";
import { cloudStaffSession,staffErrorResponse } from "@/server/cloud/staff";

/** GET /api/staff/session — ข้อมูล Staff, อีเวนต์ที่ดูแล และยอดเช็กอิน */
export async function GET() {
  if(supabaseEnabled()) {
    try { const {session}=await cloudStaffSession(); return Response.json(session,{headers:{"Cache-Control":"private, no-store"}}); }
    catch(error){return staffErrorResponse(error);}
  }
  await connection(); // อ่านฐานข้อมูลตอนมี request เท่านั้น ไม่ prerender
  return Response.json(getStaffSession());
}
