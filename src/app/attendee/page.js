"use client";

import Link from "next/link";
import { event } from "./event";
import { usePublicEvent } from "@/components/public/use-public-event";
import { eventDateLabel } from "@/lib/public-event";
import { PublicLoadState } from "./event-state";
import { supabaseEnabled } from "@/lib/supabase/config";
import { CloudAttendeeRegistration } from "@/components/cloud/attendee-registration";

function EventPage() {
  const { configuration, error, refresh } = usePublicEvent();
  if (!configuration) return <PublicLoadState error={error} retry={refresh} />;
  const { details } = configuration;
  return (
    <main className="flex-1 space-y-5 px-4 py-5">
      <h1 className="text-xl font-bold">รายละเอียดอีเวนต์</h1>

      {/* ภาพปกกิจกรรม */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {details.banner ? <img src={details.banner} alt={`แบนเนอร์ ${details.name}`} className="w-full rounded-2xl" /> : <div className="relative h-44 overflow-hidden rounded-2xl bg-brand-dark p-5 text-white">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full border-[28px] border-cyan-400/80" />
        <div className="absolute -left-6 bottom-0 h-40 w-24 -skew-x-12 bg-brand/80" />
        <div className="relative flex h-full flex-col justify-end">
          <p className="text-[10px] uppercase tracking-widest text-cyan-200">
            University Event • 2026
          </p>
          <p className="text-2xl font-bold">{details.name}</p>
          <p className="text-sm text-white/80">2026 • {event.tagline}</p>
        </div>
      </div>}

      <div className="space-y-2">
        <span className="inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
          {configuration.registrationOpen ? "เปิดรับลงทะเบียน" : "ปิดรับลงทะเบียนแล้ว"}
        </span>
        <h2 className="text-lg font-bold">{details.name}</h2>
        <p className="text-sm text-muted">
          {eventDateLabel(details)}
        </p>
        <p className="flex items-center gap-1.5 text-sm text-muted">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
          {details.venue}
        </p>
      </div>

      <Link
        href={configuration.registrationOpen ? "/attendee/register" : "/attendee/registration-closed"}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 font-semibold text-white transition hover:bg-brand-dark"
      >
        {configuration.registrationOpen ? "+ ลงทะเบียนเข้าร่วม" : "ดูสถานะปิดรับลงทะเบียน"}
      </Link>

      <Link href="/attendee/survey" className="flex w-full items-center justify-center rounded-xl border border-brand bg-white py-3 font-semibold text-brand">{configuration.surveyOpen ? "ตอบแบบสอบถามหลังจบงาน" : "ดูสถานะแบบสอบถาม"}</Link>
      <p className="text-sm leading-relaxed text-muted">{details.description}</p>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="mb-3 font-semibold">กำหนดการ</h3>
        <ul className="space-y-3">
          {event.schedule.map((s) => (
            <li key={s.time} className="flex gap-3 text-sm">
              <span className="w-12 font-medium text-brand">{s.time}</span>
              <span>{s.title}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex items-center gap-2 rounded-xl bg-brand-light px-4 py-3 text-sm text-brand">
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
        ลงทะเบียนแล้วจะได้รับ QR Code สำหรับเช็กอินหน้างาน
      </div>
    </main>
  );
}

export default function Page() {
  return supabaseEnabled() ? <CloudAttendeeRegistration mode="event" /> : <EventPage />;
}

