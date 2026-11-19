import { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { CloudError, cloudErrorResponse } from "@/server/cloud/auth";
import { publishedEvent, requireEventId, ticketCookie } from "@/server/cloud/registration";

export async function GET(request: NextRequest) {
  try {
    const eventId = requireEventId(request.nextUrl.searchParams.get("event") || request.cookies.get("es-last-event")?.value);
    const secret = request.cookies.get(ticketCookie(eventId))?.value;
    if (!secret || !/^[a-f0-9]{32}$/.test(secret)) throw new CloudError("ยังไม่มีตั๋วของงานนี้ในเบราว์เซอร์นี้", 404);
    const pub = await publishedEvent(eventId);
    const { data, error } = await createSupabaseAdminClient().from("registrations").select("name,ticket_code,created_at").eq("event_id", eventId).eq("ticket_code", secret).maybeSingle();
    if (error) throw new CloudError("โหลดตั๋วไม่ได้ กรุณาลองอีกครั้ง", 503);
    if (!data) throw new CloudError("ไม่พบตั๋วนี้", 404);
    return Response.json({ eventId, details: pub.details, name: data.name, ticketCode: data.ticket_code, registeredAt: data.created_at }, { headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } });
  } catch (error) { return cloudErrorResponse(error); }
}
