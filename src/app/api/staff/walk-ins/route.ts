import { isApiError, registerWalkIn } from "@/server/staff/service";
import type { WalkInInput } from "@/lib/staff/types";

/**
 * POST /api/staff/walk-ins
 * body: { name, email, phone?, verified }
 * 400 = ข้อมูลไม่ครบ, 409 = มีรายชื่อในงานนี้แล้ว
 */
export async function POST(request: Request) {
  const body = ((await request.json().catch(() => null)) ?? {}) as Partial<WalkInInput>;
  const result = registerWalkIn(body);
  if (isApiError(result)) {
    return Response.json(result, { status: result.error === "duplicate" ? 409 : 400 });
  }
  return Response.json(result, { status: 201 });
}
