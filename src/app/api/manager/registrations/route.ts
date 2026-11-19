import { NextRequest } from "next/server";
import { requireCloudProfile, CloudError, cloudErrorResponse } from "@/server/cloud/auth";
import { requireEventId } from "@/server/cloud/registration";

export async function GET(request: NextRequest) {
  try {
    const { client, profile } = await requireCloudProfile(["event_manager"]);
    const eventId = requireEventId(request.nextUrl.searchParams.get("event"));
    const { data: event } = await client.from("events").select("id").eq("id", eventId).eq("owner_id", profile.id).single();
    if (!event) throw new CloudError("ไม่พบงานหรือไม่มีสิทธิ์ดูรายชื่อ", 404);
    const page = Number(request.nextUrl.searchParams.get("page") || 0);
    const q = (request.nextUrl.searchParams.get("q") || "").trim();
    if (!Number.isInteger(page) || page < 0 || page > 10000 || !/^[\p{L}\p{N}\s@.+_-]{0,100}$/u.test(q)) throw new CloudError("คำค้นหาหรือหน้าที่เลือกไม่ถูกต้อง");
    let query = client.from("registrations").select("id,name,email,answers,form_fields,created_at,source,checkins(checked_at,via)", { count: "exact" }).eq("event_id", eventId).order("created_at", { ascending: false }).range(page * 25, page * 25 + 24);
    if (q) query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%`);
    const { data, error, count } = await query;
    if (error) throw new CloudError("โหลดรายชื่อไม่ได้", 503);
    return Response.json({ rows: data, total: count, page }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return cloudErrorResponse(error); }
}
