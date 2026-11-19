import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import StaffShell from "./_components/StaffShell";
import { StaffProvider } from "./_lib/store";
import s from "./staff.module.css";
import { supabaseEnabled } from "@/lib/supabase/config";
import { CloudStaffWorkspace } from "@/components/cloud/staff-workspace";

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
  if (supabaseEnabled()) return <div className={s.root}><CloudStaffWorkspace /></div>;
  return (
    <div className={s.root}>
      <StaffProvider>
        <StaffShell>{children}</StaffShell>
      </StaffProvider>
    </div>
  );
}
