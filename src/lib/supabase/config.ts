export function supabaseEnabled() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

export function supabasePublicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("ตั้งค่า URL และ Publishable key ของ Supabase ให้ครบใน .env.local");
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(parsed.hostname)) throw new Error("URL ของ Supabase ไม่ถูกต้อง");
  return { url, key };
}
