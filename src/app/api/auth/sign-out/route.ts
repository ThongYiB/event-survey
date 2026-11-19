import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CloudError, cloudErrorResponse } from "@/server/cloud/auth";
import { isSameOrigin } from "@/server/manager-session";

export async function POST(request: NextRequest) {
  try {
    if (!isSameOrigin(request)) throw new CloudError("ไม่สามารถออกจากระบบจากเว็บไซต์อื่น", 403);
    const client = await createSupabaseServerClient();
    const { error } = await client.auth.signOut();
    if (error) throw new CloudError("ออกจากระบบไม่สำเร็จ กรุณาลองอีกครั้ง", 503);
    const response = NextResponse.json({ ok: true });
    response.cookies.set("event-survey-active-event", "", { path: "/", maxAge: 0 });
    return response;
  } catch (error) { return cloudErrorResponse(error); }
}
