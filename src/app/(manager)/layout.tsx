import type { Metadata } from "next";
import { ManagerShell } from "./shell";

export const metadata: Metadata = { title: "Event Manager | Event Survey" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ManagerShell>{children}</ManagerShell>;
}

