import { cloudErrorResponse } from "@/server/cloud/auth";
import { cloudStaffWorkspace } from "@/server/cloud/staff";

export async function GET() {
  try {
    const { profile,events } = await cloudStaffWorkspace();
    return Response.json({ name: profile.name, events }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return cloudErrorResponse(error); }
}
