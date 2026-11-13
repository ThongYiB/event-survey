import type { Metadata } from "next";
import { AdminWorkspace } from "./workspace";

export const metadata: Metadata = { title: "System Admin | Event Survey" };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminWorkspace>{children}</AdminWorkspace>;
}

