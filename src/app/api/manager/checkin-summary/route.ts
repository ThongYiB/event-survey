import { cloudErrorResponse,CloudError,requireCloudProfile } from "@/server/cloud/auth";

export async function GET() {
  try {
    const {client}=await requireCloudProfile(["event_manager"]);
    const {data,error}=await client.rpc("manager_checkin_summary");
    if(error) throw new CloudError("โหลดยอดลงทะเบียนและเช็กอินไม่ได้",503);
    return Response.json({events:data},{headers:{"Cache-Control":"private, no-store"}});
  }catch(error){return cloudErrorResponse(error);}
}
