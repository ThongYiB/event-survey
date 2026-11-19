"use client";

import Link from "next/link";
import { useRouter, useSelectedLayoutSegment } from "next/navigation";
import { useState } from "react";
import { initialDetails, useSaved } from "./store";
import styles from "./manager.module.css";
import { supabaseEnabled } from "@/lib/supabase/config";

const sections = [
  ["manager", "ภาพรวม"],
  ["details", "รายละเอียดงาน"],
  ["form", "ฟอร์มลงทะเบียน"],
  ["team", "ทีมงาน"],
  ["survey", "แบบสอบถาม"],
  ["qr-center", "QR Center"],
  ["registration", "ผู้ลงทะเบียน"],
  ["report", "รายงานผล"],
  ["kiosk", "จอประชาสัมพันธ์"],
] as const;

export function ManagerShell({ children }: { children: React.ReactNode }) {
  const segment = useSelectedLayoutSegment();
  const router = useRouter();
  const [menuOpen,setMenuOpen]=useState(false);
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar} data-menu-open={menuOpen} onKeyDown={event=>{if(event.key==="Escape")setMenuOpen(false);}}>
        <div className={styles.brand}><span aria-hidden="true">ES</span>Event Survey<button className={styles.menuToggle} aria-label={menuOpen?"ปิดเมนู":"เปิดเมนู Event Manager"} aria-expanded={menuOpen} aria-controls="manager-menu" onClick={()=>setMenuOpen(!menuOpen)}>{menuOpen?"ปิด ✕":"เมนู ☰"}</button></div>
        <p className={styles.role}>Event Manager</p>
        <nav id="manager-menu" aria-label="เมนู Event Manager">
          {sections.map(([id, label]) => (
            <Link key={id} href={`/${id}`} onNavigate={()=>setMenuOpen(false)} aria-current={segment === id || (segment === "dashboard" && id === "manager") ? "page" : undefined}>{label}</Link>
          ))}
        </nav>
        <Link className={styles.exit} href="/login" onClick={async (event) => {
          event.preventDefault();
          try { const response = await fetch(supabaseEnabled() ? "/api/auth/sign-out" : "/api/manager/sign-in", { method: supabaseEnabled() ? "POST" : "DELETE" }); if (!response.ok) throw new Error(); router.push("/login"); router.refresh(); }
          catch { window.alert("ออกจากระบบไม่สำเร็จ กรุณาลองอีกครั้ง"); }
        }}>กลับหน้าเข้าสู่ระบบ</Link>
      </aside>
      <main className={styles.main}>
        <div className={styles.topbar}>พื้นที่จัดการ / Event Manager</div>
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}

export function ScreenHeading({ title, description, children }: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  const details = useSaved("details", initialDetails);
  return (
    <header className={styles.heading}>
      <div><h1>{title}</h1><p>{details.name} / {description}</p></div>
      {children}
    </header>
  );
}

