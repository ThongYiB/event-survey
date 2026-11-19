'use client';

import { Fragment, useState } from "react";
import Link from "next/link";
import {
  initialDetails,
  initialEvents,
  initialManager,
  statusLabels,
  useSaved,
  type EventStatus,
} from "./store";
import styles from "./manager.module.css";
import { supabaseEnabled } from "@/lib/supabase/config";
import { CloudManagerDashboard } from "@/components/cloud/manager-dashboard";

type IconName = "plus" | "map-pin" | "search" | "arrow-right";

const iconPaths: Record<IconName, React.ReactNode> = {
  plus: <path d="M12 5v14M5 12h14" />,
  "map-pin": <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  "arrow-right": <path d="M5 12h14M12 5l7 7-7 7" />,
};

function Icon({ name }: { name: IconName }) {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      {iconPaths[name]}
    </svg>
  );
}

const monthsLong = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
const monthsShort = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

// "2026-11-25" -> "25 พฤศจิกายน 2026" (หรือ "25 พ.ย. 2026" เมื่อ short = true)
function formatDate(value: string, short = false) {
  const [year, month, day] = (value || "").split("-");
  const name = (short ? monthsShort : monthsLong)[Number(month) - 1];
  if (!year || !day || !name) return "";
  return `${Number(day)} ${name} ${year}`;
}

const count = (value: number) => value.toLocaleString("en-US");

const badgeClass: Record<EventStatus, string> = {
  open: styles.badgeOpen,
  draft: styles.badgeDraft,
  closed: styles.badgeClosed,
};

function DemoEventDashboard() {
  const details = useSaved("details", initialDetails);
  const manager = useSaved("manager", initialManager);
  const events = useSaved("events", initialEvents);
  const [query, setQuery] = useState("");

  // อีเวนต์ที่กำลังดู = อีเวนต์แรกที่เปิดรับอยู่ (ถ้าไม่มีให้ใช้อันแรกสุด)
  const active = events.find((event) => event.status === "open") ?? events[0];

  // ชื่อและวันที่ของอีเวนต์ที่กำลังดู มาจากหน้า "รายละเอียดงาน" เพื่อให้แก้แล้วอัปเดตตรงกัน
  const nameOf = (event: (typeof events)[number]) => (event.id === active?.id ? details.name : event.name);
  const dateOf = (event: (typeof events)[number]) => (event.id === active?.id ? details.startDate : event.startDate);

  const countBy = (status: EventStatus) => events.filter((event) => event.status === status).length;
  const summary: [string, number][] = [
    ["อีเวนต์ทั้งหมด", events.length],
    ["กำลังเปิดรับ", countBy("open")],
    ["ฉบับร่าง", countBy("draft")],
    ["สิ้นสุดแล้ว", countBy("closed")],
  ];

  const start = formatDate(details.startDate);
  const end = formatDate(details.endDate);
  const times = details.startTime && details.endTime ? `${details.startTime}–${details.endTime}` : "";
  const dateLine =
    [end && end !== start ? `${start} – ${end}` : start, times].filter(Boolean).join(" • ") || "ยังไม่ระบุวันที่";

  const rate = active && active.registered > 0 ? (active.checkedIn / active.registered) * 100 : 0;
  const metrics = active
    ? [
        { label: "ลงทะเบียน", value: count(active.registered), note: "คน" },
        { label: "เช็กอินแล้ว", value: count(active.checkedIn), note: "คน" },
        { label: "ตอบแบบสอบถาม", value: count(active.surveyed), note: "คน" },
        {
          label: "อัตราเข้าร่วม",
          value: `${rate.toFixed(1)}%`,
          note: `${count(active.checkedIn)} จาก ${count(active.registered)} คน`,
        },
      ]
    : [];

  const keyword = query.trim().toLowerCase();
  const rows = events.filter((event) => nameOf(event).toLowerCase().includes(keyword));

  return (
    <div className={styles.stack}>
      <header className={styles.heading}>
        <div>
          <h1>ภาพรวมอีเวนต์</h1>
          <p>ยินดีต้อนรับ {manager.name} • จัดการทุกขั้นตอนของงานในพื้นที่เดียว</p>
        </div>
        <Link href="/details" className={styles.outlineLink}>
          แก้ไขรายละเอียดอีเวนต์
        </Link>
      </header>

      <p className={styles.notice}>ภาพรวมข้อมูลตัวอย่าง · รายละเอียดงานปัจจุบันอ้างจากหน้ารายละเอียดงาน</p>
      <div className={styles.summary}>
        {summary.map(([label, value]) => (
          <div key={label} className={styles.summaryCard}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      {active && (
        <>
          <section className={styles.panel}>
            <p className={styles.panelLabel}>อีเวนต์ที่กำลังดู</p>
            <div className={styles.currentBody}>
              <div className={styles.currentInfo}>
                <span className={`${styles.badge} ${badgeClass[active.status]}`}>
                  {active.status === "open" ? "เปิดรับลงทะเบียน" : statusLabels[active.status]}
                </span>
                <h2>{details.name}</h2>
                <p className={styles.currentMeta}>{dateLine}</p>
                {details.venue && (
                  <p className={styles.currentMeta}>
                    <Icon name="map-pin" />
                    <span>{details.venue}</span>
                  </p>
                )}
              </div>
              <Link href="/details" className={styles.outlineLink}>
                <Icon name="arrow-right" /> จัดการอีเวนต์
              </Link>
            </div>
          </section>

          <div className={styles.metrics}>
            {metrics.map((metric) => (
              <div key={metric.label} className={styles.metricCard}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                <small>{metric.note}</small>
              </div>
            ))}
          </div>
        </>
      )}

      <section className={styles.panel}>
        <h2>อีเวนต์ของคุณ</h2>

        <div className={styles.searchBox}>
          <Icon name="search" />
          <input
            type="search"
            className={styles.searchInput}
            placeholder="ค้นหาชื่องาน..."
            aria-label="ค้นหาชื่องาน"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className={styles.scroll}>
          <table className={styles.eventTable}>
            <thead>
              <tr>
                <th>ชื่องาน / ข้อมูลจำลอง</th>
                <th>วันจัดงาน</th>
                <th>สถานะ</th>
                <th>ลงทะเบียน</th>
                <th>การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((event) => {
                const links = [
                  event.status !== "closed" && { href: "/details", label: "แก้ไข" },
                  event.status !== "draft" && { href: "/report", label: "รายงาน" },
                ].filter(Boolean) as { href: string; label: string }[];

                return (
                  <tr key={event.id}>
                    <td className={styles.eventName}>{nameOf(event)}</td>
                    <td>{formatDate(dateOf(event), true)}</td>
                    <td>{statusLabels[event.status]}</td>
                    <td>{count(event.registered)} คน</td>
                    <td>
                      <div className={styles.rowLinks}>
                        {links.map((link, index) => (
                          <Fragment key={link.href}>
                            {index > 0 && <span aria-hidden="true">·</span>}
                            <Link href={link.href}>{link.label}</Link>
                          </Fragment>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className={styles.empty}>ไม่พบอีเวนต์ที่ตรงกับคำค้นหา</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default function EventDashboard() {
  return supabaseEnabled() ? <CloudManagerDashboard /> : <DemoEventDashboard />;
}
