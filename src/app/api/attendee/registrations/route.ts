import { registerAttendee } from "@/server/staff/service";

export async function POST(request: Request) {
  const payload: unknown = await request.json().catch(() => null);
  const { status, ...result } = registerAttendee(payload);
  return Response.json(result, { status, headers: { "Cache-Control": "no-store" } });
}
