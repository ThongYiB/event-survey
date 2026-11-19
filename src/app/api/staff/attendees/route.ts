import { connection, type NextRequest } from "next/server";
import { getCurrentEventId, searchAttendees } from "@/server/staff/service";
import { supabaseEnabled } from "@/lib/supabase/config";
import { cloudStaffSession,staffErrorResponse,staffRpcError } from "@/server/cloud/staff";

/** GET /api/staff/attendees?q=คำค้น — ค้นหาผู้ลงทะเบียนในอีเวนต์ที่ดูแล */
export async function GET(request: NextRequest) {
  if(supabaseEnabled()) {
    try {
      const {client,event}=await cloudStaffSession();
      const {data,error}=await client.rpc("staff_search",{p_event:event.id,p_query:(request.nextUrl.searchParams.get("q")||"").slice(0,200)});
      if(error) staffRpcError(error);
      return Response.json({attendees:data},{headers:{"Cache-Control":"private, no-store"}});
    }catch(error){return staffErrorResponse(error);}
  }
  await connection();
  const q = request.nextUrl.searchParams.get("q") ?? "";
  return Response.json({ attendees: searchAttendees(getCurrentEventId(), q) });
}
