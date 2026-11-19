"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import s from "../staff.module.css";
import { STAFF_RESULT_KEY } from "../_lib/store";
import {
  ArrowLeftIcon,
  CalendarIcon,
  ScanIcon,
  SearchIcon,
  UserPlusIcon,
} from "./icons";

const BACK: { match: RegExp; href: string; label: string }[] = [
  { match: /^\/staff\/walk-in/, href: "/staff/search", label: "กลับไปค้นหารายชื่อ" },
  { match: /^\/staff\/(result|search)/, href: "/staff/scan", label: "กลับไปหน้าสแกน" },
  { match: /^\/staff\/.+/, href: "/staff", label: "กลับไปเลือกงาน" },
];

const TABS = [
  { href: "/staff", label: "งาน", icon: CalendarIcon, match: /^\/staff\/?$/ },
  { href: "/staff/scan", label: "สแกน", icon: ScanIcon, match: /^\/staff\/(scan|result|survey-qr)/ },
  { href: "/staff/search", label: "ค้นหา", icon: SearchIcon, match: /^\/staff\/search/ },
  { href: "/staff/walk-in", label: "Walk-in", icon: UserPlusIcon, match: /^\/staff\/walk-in/ },
];

export default function StaffShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/staff";
  const back = BACK.find((b) => b.match.test(pathname));
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState(false);

  async function signOut() {
    setSigningOut(true);
    setSignOutError(false);
    try {
      const response = await fetch("/api/staff/sign-in", { method: "DELETE" });
      if (!response.ok) throw new Error("Sign-out failed");
    } catch {
      setSignOutError(true);
      setSigningOut(false);
      return;
    }
    try {
      sessionStorage.removeItem(STAFF_RESULT_KEY);
    } catch {
      // Signing out still works when storage is unavailable.
    }
    window.location.replace("/login");
  }

  return (
    <div className={s.app}>
      <header className={s.topbar}>
        <div className={s.topRow}>
          <span className={s.logo} aria-hidden="true">ES</span>
          <span className={s.brand}>Event Survey</span>
          <span className={s.staffBadge}>Staff</span>
          <button type="button" className={s.signOut} disabled={signingOut} onClick={signOut}>ออกจากระบบ</button>
        </div>
        {back && (
          <Link href={back.href} className={s.backLink}>
            <ArrowLeftIcon size={14} />
            {back.label}
          </Link>
        )}
        {signOutError && <p role="alert">ออกจากระบบไม่สำเร็จ กรุณาลองอีกครั้ง</p>}
      </header>

      <main className={s.main}>{children}</main>

      <nav className={s.tabbar} aria-label="เมนู Staff">
        <div className={s.tabbarInner}>
          {TABS.map(({ href, label, icon: Icon, match }) => {
            const active = match.test(pathname);
            return (
              <Link
                key={href}
                href={href}
                className={`${s.tab} ${active ? s.tabActive : ""}`}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={20} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
