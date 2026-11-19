import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import StaffShell from "./_components/StaffShell";
import { StaffProvider } from "./_lib/store";
import s from "./staff.module.css";
import { supabaseEnabled } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Event Survey · Staff",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0d6e66",
};

export default function StaffLayout({ children }: { children: ReactNode }) {
  return (
    <div className={s.root}>
      <StaffProvider cloudMode={supabaseEnabled()}>
        <StaffShell>{children}</StaffShell>
      </StaffProvider>
    </div>
  );
}
