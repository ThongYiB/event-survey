"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { initialDetails, useSaved } from "./store";
import styles from "./manager.module.css";

const sections = [
  ["details", "รายละเอียดงาน"],
  ["form", "ฟอร์มลงทะเบียน"],
  ["team", "ทีมงาน"],
  ["survey", "แบบสอบถาม"],
] as const;

export function ManagerShell({ children }: { children: React.ReactNode }) {
  const segment = useSelectedLayoutSegment();
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}><span aria-hidden="true">ES</span>Event Survey</div>
        <p className={styles.role}>Event Manager</p>
        <nav aria-label="เมนู Event Manager">
          {sections.map(([id, label]) => (
            <Link key={id} href={`/${id}`} aria-current={segment === id ? "page" : undefined}>{label}</Link>
          ))}
        </nav>
        <Link className={styles.exit} href="/login">กลับหน้าเข้าสู่ระบบ</Link>
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

