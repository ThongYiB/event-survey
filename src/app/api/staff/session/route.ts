import { connection } from "next/server";
import { getStaffSession } from "@/server/staff/service";

/** GET /api/staff/session — ข้อมูล Staff, อีเวนต์ที่ดูแล และยอดเช็กอิน */
export async function GET() {
  await connection(); // อ่านฐานข้อมูลตอนมี request เท่านั้น ไม่ prerender
  return Response.json(getStaffSession());
}
