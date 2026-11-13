import Link from "next/link";
import { event } from "./event";

export default function EventPage() {
  return (
    <main className="flex-1 space-y-5 px-4 py-5">
      <h1 className="text-xl font-bold">กิจกรรมที่เปิดรับสมัคร</h1>

      {/* ภาพปกกิจกรรม */}
      <div className="relative h-44 overflow-hidden rounded-2xl bg-brand-dark p-5 text-white">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full border-[28px] border-cyan-400/80" />
        <div className="absolute -left-6 bottom-0 h-40 w-24 -skew-x-12 bg-brand/80" />
        <div className="relative flex h-full flex-col justify-end">
          <p className="text-[10px] uppercase tracking-widest text-cyan-200">
            University Event • 2026
          </p>
          <p className="text-2xl font-bold">Creative Campus</p>
          <p className="text-sm text-white/80">2026 • {event.tagline}</p>
        </div>
      </div>

      <div className="space-y-2">
        <span className="inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
          เปิดรับลงทะเบียน
        </span>
        <h2 className="text-lg font-bold">{event.name}</h2>
        <p className="text-sm text-muted">
          {event.date} • {event.time}
        </p>
        <p className="flex items-center gap-1.5 text-sm text-muted">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
          {event.location}
        </p>
      </div>

      <Link
        href="/attendee/register"
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 font-semibold text-white transition hover:bg-brand-dark"
      >
        + ลงทะเบียนเข้าร่วม
      </Link>

      <p className="text-sm leading-relaxed text-muted">{event.description}</p>

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

