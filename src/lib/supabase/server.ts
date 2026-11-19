import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabasePublicConfig } from "./config";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const { url, key } = supabasePublicConfig();
  return createServerClient(url, key, { cookies: {
    getAll: () => cookieStore.getAll(),
    setAll: (values) => {
      try { for (const { name, value, options } of values) cookieStore.set(name, value, options); }
      catch { /* Server Components cannot write cookies; Proxy refreshes them before rendering. */ }
    },
  } });
}
