import { submitSurvey } from "@/server/public-event";
import { supabaseEnabled } from '@/lib/supabase/config';
import { submitCloudSurvey } from '@/server/cloud/survey';

export async function POST(request: Request) {
  if(supabaseEnabled())return submitCloudSurvey(request);
  const text = await request.text();
  if (text.length > 100000) return Response.json({ message: "ข้อมูลคำตอบมีขนาดใหญ่เกินไป" }, { status: 413 });
  let payload: unknown;
  try { payload = JSON.parse(text); } catch { return Response.json({ message: "ข้อมูลคำตอบไม่ถูกต้อง" }, { status: 400 }); }
  const { status, ...result } = submitSurvey(payload);
  return Response.json(result, { status, headers: { "Cache-Control": "no-store" } });
}
