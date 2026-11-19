import type { Metadata } from "next";
import { ManagerShell } from "./shell";
import { supabaseEnabled } from "@/lib/supabase/config";
import { CloudManagerProvider } from "@/components/cloud/manager-provider";

export const metadata: Metadata = { title: "Event Manager | Event Survey" };

export default function Layout({ children }: { children: React.ReactNode }) {
  if (supabaseEnabled()) return <CloudManagerProvider>{children}</CloudManagerProvider>;
  return <ManagerShell>{children}</ManagerShell>;
}

