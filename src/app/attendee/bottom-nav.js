"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  {
    href: "/attendee",
    label: "หน้าหลัก",
    icon: <path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z" />,
  },
  {
    href: "/attendee/ticket",
    label: "ตั๋วของฉัน",
    icon: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3" />
      </>
    ),
  },
  {
    href: "/attendee/survey",
    label: "แบบสอบถาม",
    icon: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0116 0" />
      </>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 mt-auto grid grid-cols-3 border-t border-black/5 bg-white" aria-label="เมนูผู้เข้าร่วมงาน">
      {items.map((item) => {
        const active = pathname === item.href || (item.href === "/attendee/survey" && pathname.startsWith("/attendee/survey/"));
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex flex-col items-center gap-1 py-2.5 text-[11px] ${
              active ? "font-semibold text-brand" : "text-muted"
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              {item.icon}
            </svg>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

