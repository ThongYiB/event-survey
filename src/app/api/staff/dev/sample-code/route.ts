import { connection, type NextRequest } from "next/server";
import { getSampleCode } from "@/server/staff/service";

const KINDS = ["success", "duplicate", "wrong-event", "not-found"] as const;
type Kind = (typeof KINDS)[number];

/** GET /api/staff/dev/sample-code?kind=success — ใช้กับปุ่มจำลองตอนพัฒนาเท่านั้น */
export async function GET(request: NextRequest) {
  await connection();
  if (process.env.NODE_ENV === "production") return new Response(null, { status: 404 });
  const kind = request.nextUrl.searchParams.get("kind") as Kind;
  if (!KINDS.includes(kind)) return Response.json({ error: "bad-kind" }, { status: 400 });
  const code = getSampleCode(kind);
  if (!code) {
    return Response.json(
      { error: "no-sample", message: "ไม่มีรหัสตัวอย่างสำหรับสถานะนี้แล้ว" },
      { status: 404 },
    );
  }
  return Response.json({ code });
}
