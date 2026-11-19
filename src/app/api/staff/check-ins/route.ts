import { checkIn, isApiError } from "@/server/staff/service";
import type { CheckInVia } from "@/lib/staff/types";

const VIA: CheckInVia[] = ["qr", "search"];

/**
 * POST /api/staff/check-ins
 * body: { code: string; via: "qr" | "search" }
 * code รับได้ทั้งรหัสตรง ๆ หรือข้อความดิบจาก QR (ดู lib/staff/qr.ts)
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { code?: unknown; via?: unknown } | null;
  const code = typeof body?.code === "string" ? body.code : "";
  const via = VIA.includes(body?.via as CheckInVia) ? (body!.via as CheckInVia) : "qr";

  const result = checkIn(code, via);
  if (isApiError(result)) return Response.json(result, { status: 400 });
  return Response.json(result);
}
