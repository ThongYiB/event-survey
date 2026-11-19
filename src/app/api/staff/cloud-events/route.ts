import { cloudErrorResponse, requireCloudProfile, CloudError } from "@/server/cloud/auth";

export async function GET() {
  try {
    const { client, profile } = await requireCloudProfile(["staff"]);
    const { data, error } = await client.from("events").select("id,name,status,details").eq("suspended", false).order("created_at", { ascending: false });
    if (error) throw new CloudError("โหลดงานที่ได้รับมอบหมายไม่ได้", 503);
    return Response.json({ name: profile.name, events: data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return cloudErrorResponse(error); }
}
