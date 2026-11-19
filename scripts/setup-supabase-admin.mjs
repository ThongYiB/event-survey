import { createClient } from "@supabase/supabase-js";

try {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SECRET_KEY;
  const email = process.argv[2]?.trim().toLowerCase();
  if (!url || !key || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("ตั้งค่า .env.local และระบุอีเมลบัญชี Auth ที่สร้างไว้แล้ว");
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await client.rpc("bootstrap_first_admin", { p_email: email });
  if (error) throw new Error("กำหนด Admin แรกไม่ได้ ตรวจว่ารัน SQL แล้ว มีบัญชี Auth อีเมลนี้ และยังไม่มี Admin คนอื่น");
  console.log(`ตั้ง ${email} เป็น System Admin แล้ว`);
} catch (error) { console.error(error.message); process.exitCode = 1; }
