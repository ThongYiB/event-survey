import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabasePublicConfig } from "./config";

export function createSupabaseAdminClient() {
  const { url } = supabasePublicConfig();
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) throw new Error("ยังไม่ได้ตั้งค่า SUPABASE_SECRET_KEY บนเซิร์ฟเวอร์");
  return createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}
