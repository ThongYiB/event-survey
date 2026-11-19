import { getPublicEvent } from "@/server/public-event";
import { connection } from "next/server";
import { supabaseEnabled } from "@/lib/supabase/config";
import { publishedEvent, requireEventId } from "@/server/cloud/registration";
import { cloudErrorResponse } from "@/server/cloud/auth";

export async function GET(request: Request) {
  await connection();
  if (supabaseEnabled()) {
    try { return Response.json(await publishedEvent(requireEventId(new URL(request.url).searchParams.get("event"))), { headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } }); }
    catch (error) { return cloudErrorResponse(error); }
  }
  return Response.json(getPublicEvent(), { headers: { "Cache-Control": "no-store" } });
}
