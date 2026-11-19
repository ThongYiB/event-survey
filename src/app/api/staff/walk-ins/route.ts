import { isApiError, registerWalkIn } from "@/server/staff/service";
import type { WalkInInput } from "@/lib/staff/types";
import { supabaseEnabled } from "@/lib/supabase/config";
import { CloudError } from "@/server/cloud/auth";
import { cloudStaffSession,staffErrorResponse,staffMutationBody,staffRpcError } from "@/server/cloud/staff";

/**
 * POST /api/staff/walk-ins
 * body: { name, email, phone?, verified }
 * 400 = ข้อมูลไม่ครบ, 409 = มีรายชื่อในงานนี้แล้ว
 */
export async function POST(request: Request) {
  if(supabaseEnabled()) {
    try {
      const body=await staffMutationBody(request);
      if(typeof body.name!=="string" || typeof body.email!=="string" || (body.phone!==undefined && typeof body.phone!=="string") || body.verified!==true) throw new CloudError("กรอกข้อมูลและยืนยันการตรวจสอบกับผู้เข้าร่วม");
      if(typeof body.phone==="string"&&body.phone.trim()&&!/^[+\d][\d\s()-]{6,24}$/.test(body.phone.trim())) throw new CloudError("กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง");
      const {client,event}=await cloudStaffSession();
      const {data,error}=await client.rpc("staff_walkin",{p_event:event.id,p_name:body.name,p_email:body.email,p_phone:body.phone||"",p_verified:true});
      if(error) staffRpcError(error);
      return Response.json({...data,event,attendeeEvent:null},{status:201,headers:{"Cache-Control":"private, no-store"}});
    }catch(error){return staffErrorResponse(error);}
  }
  const body = ((await request.json().catch(() => null)) ?? {}) as Partial<WalkInInput>;
  const result = registerWalkIn(body);
  if (isApiError(result)) {
    return Response.json(result, { status: result.error === "duplicate" ? 409 : 400 });
  }
  return Response.json(result, { status: 201 });
}
