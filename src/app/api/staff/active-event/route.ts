import { NextRequest, NextResponse } from "next/server";
import { CloudError } from "@/server/cloud/auth";
import { cloudStaffWorkspace, staffErrorResponse, staffEventCookie, staffMutationBody } from "@/server/cloud/staff";

export async function POST(request:NextRequest) {
  try {
    const body=await staffMutationBody(request);
    const {events}=await cloudStaffWorkspace();
    if(typeof body.id!=="string" || !events.some(e=>e.id===body.id)) throw new CloudError("คุณไม่ได้รับมอบหมายให้ดูแลงานนี้",403);
    const response=NextResponse.json({ok:true},{headers:{"Cache-Control":"private, no-store"}});
    response.cookies.set(staffEventCookie,body.id,{httpOnly:true,secure:request.nextUrl.protocol==="https:",sameSite:"lax",path:"/",maxAge:30*86400});
    return response;
  }catch(error){return staffErrorResponse(error);}
}
