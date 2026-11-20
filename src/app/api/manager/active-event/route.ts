import { NextRequest, NextResponse } from "next/server";
import { CloudError, cloudErrorResponse, requireCloudProfile } from "@/server/cloud/auth";
import { activeEventCookie, getCloudManagerData } from "@/server/cloud/events";
import { isSameOrigin } from "@/server/manager-session";

export async function POST(request: NextRequest) {
  try {
    if (!isSameOrigin(request)) throw new CloudError("ไม่สามารถเปลี่ยนอีเวนต์จากเว็บไซต์อื่น", 403);
    const { client, profile } = await requireCloudProfile(["event_manager"]);
    const body = await request.json().catch(() => null);
    if (typeof body?.id !== "string") throw new CloudError("เลือกอีเวนต์");
    const state = await getCloudManagerData(client, profile, body.id,body.media===true);
    if (state.event?.id !== body.id) throw new CloudError("ไม่พบอีเวนต์ที่คุณมีสิทธิ์", 404);
    const response = NextResponse.json(state);
    response.cookies.set(activeEventCookie, body.id, { httpOnly: true, sameSite: "lax", secure: request.nextUrl.protocol === "https:", path: "/", maxAge: 30 * 86400 });
    return response;
  } catch (error) { return cloudErrorResponse(error); }
}
