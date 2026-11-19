import { getPublicEvent } from "@/server/public-event";
import { connection } from "next/server";

export async function GET() {
  await connection();
  return Response.json(getPublicEvent(), { headers: { "Cache-Control": "no-store" } });
}
