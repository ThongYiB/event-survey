import { connection, type NextRequest } from "next/server";
import { getCurrentEventId, searchAttendees } from "@/server/staff/service";

/** GET /api/staff/attendees?q=คำค้น — ค้นหาผู้ลงทะเบียนในอีเวนต์ที่ดูแล */
export async function GET(request: NextRequest) {
  await connection();
  const q = request.nextUrl.searchParams.get("q") ?? "";
  return Response.json({ attendees: searchAttendees(getCurrentEventId(), q) });
}
