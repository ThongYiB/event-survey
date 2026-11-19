"use client";

import { Suspense, useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import { registrationAnswers, type PublishedRegistration, type RegistrationTicket } from "@/lib/registration";
import { eventDateLabel } from "@/lib/public-event";
import s from "@/app/attendee/feedback.module.css";
import formStyles from "./registration.module.css";

function useResource<T>(url: string | null) {
  const [result, setResult] = useState<{ url: string; data?: T; error?: string }>();
  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    void fetch(url, { cache: "no-store", signal: controller.signal }).then(async (response) => {
      const data = await response.json(); if (!response.ok) throw new Error(data.message || "โหลดข้อมูลไม่ได้"); return data as T;
    }).then((data) => { if (!controller.signal.aborted) setResult({ url, data }); }).catch((error) => { if (!controller.signal.aborted) setResult({ url, error: error.message }); });
    return () => controller.abort();
  }, [url]);
  return result?.url === url ? result : undefined;
}

function Ticket({ eventId }: { eventId: string }) {
  const result = useResource<RegistrationTicket>(`/api/attendee/ticket${eventId ? `?event=${eventId}` : ""}`);
  const ticket = result?.data;
  const [qr, setQr] = useState("");
  useEffect(() => {
    let active = true;
    if (ticket) void QRCode.toDataURL(`ES1:${ticket.eventId}:${ticket.ticketCode}`, { width: 500, margin: 3 }).then((value) => { if (active) setQr(value); }).catch(() => { if (active) setQr(""); });
    return () => { active = false; };
  }, [ticket]);
  if (!ticket) return <main className={s.page}><h1>ตั๋วของฉัน</h1><p role={result?.error ? "alert" : "status"}>{result?.error || "กำลังโหลดตั๋ว…"}</p>{result?.error && <Link className={s.secondary} href={`/attendee${eventId ? `?event=${eventId}` : ""}`}>กลับไปดูอีเวนต์</Link>}</main>;
  return <main className={s.page}><h1>ลงทะเบียนสำเร็จ</h1><div className={s.success}>บันทึกการลงทะเบียนไว้แล้ว</div><section className={`${s.panel} ${s.hero}`}><span className={s.badge}>ตั๋วเข้าร่วมงาน · 1 ท่าน</span><h2>{ticket.details.name}</h2><p className={s.muted}>{eventDateLabel(ticket.details)}</p>{qr ? <img src={qr} width={240} height={240} alt="QR ส่วนบุคคลสำหรับแสดงต่อเจ้าหน้าที่" /> /* eslint-disable-line @next/next/no-img-element */ : <p role="status">กำลังสร้าง QR…</p>}<strong>{ticket.name}</strong><p className={s.muted}>ลงทะเบียนเมื่อ {new Date(ticket.registeredAt).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}</p>{qr && <a className={s.primary} href={qr} download="event-survey-ticket.png">บันทึก QR เป็นรูปภาพ</a>}</section><p className={s.notice}>เก็บ QR นี้ไว้แสดงต่อเจ้าหน้าที่ และเก็บเป็นส่วนตัว ตั๋วเปิดซ้ำได้ในเบราว์เซอร์นี้ หากเปลี่ยนเครื่องหรือล้างคุกกี้ ให้ใช้รูป QR ที่บันทึกไว้</p><Link className={s.secondary} href={`/attendee?event=${ticket.eventId}`}>กลับไปดูรายละเอียดงาน</Link></main>;
}

function PublicRegistration({ mode }: { mode: string }) {
  const params = useSearchParams();
  const eventId = params.get("event") || "";
  const href = (path: string) => `${path}${eventId ? `?event=${eventId}` : ""}`;
  return mode === "ticket" ? <Ticket eventId={eventId} /> : mode === "pending" ? <main className={s.page}><h1>แบบสอบถามหลังจบงาน</h1><p>ส่วนรับคำตอบแบบสอบถามกำลังเชื่อมข้อมูลในขั้นถัดไป</p><Link href={href("/attendee")}>กลับไปดูอีเวนต์</Link></main> : !eventId ? <main className={s.page}><h1>เข้าร่วมอีเวนต์</h1><p>เปิดจากลิงก์หรือสแกน QR ลงทะเบียนของอีเวนต์ที่ต้องการ เพื่อให้ลงทะเบียนถูกงาน</p><Link className={s.secondary} href="/attendee/ticket">ตั๋วของฉัน</Link></main> : <RegistrationForm eventId={eventId} mode={mode} />;
}

function RegistrationForm({ eventId, mode }: { eventId: string; mode: string }) {
  const result = useResource<PublishedRegistration>(`/api/public/event?event=${eventId}`);
  const configuration = result?.data;
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState("form");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const requestKey = useRef("");
  const href = (path: string) => `${path}?event=${eventId}`;
  function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configuration) return;
    const found = registrationAnswers(configuration.form_fields, values);
    setErrors(found.errors); setError("");
    if (!Object.keys(found.errors).length) setStep("confirm");
  }
  async function register() {
    if (!configuration || busy) return;
    setBusy(true); setError("");
    try {
      const storageKey = `es-registration-request:${eventId}`;
      const raw = JSON.stringify(registrationAnswers(configuration.form_fields, values).answers);
      const fingerprint = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw))), (byte) => byte.toString(16).padStart(2, "0")).join("");
      if (!requestKey.current) {
        let previous; try { previous = JSON.parse(sessionStorage.getItem(storageKey) || "null"); } catch { /* Retry still works in memory if browser storage is unavailable. */ }
        requestKey.current = previous?.fingerprint === fingerprint ? previous.key : crypto.randomUUID().replaceAll("-", "");
        try { sessionStorage.setItem(storageKey, JSON.stringify({ fingerprint, key: requestKey.current })); } catch { /* The ticket itself is stored securely by the server. */ }
      }
      const response = await fetch("/api/attendee/registrations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventId, revision: configuration.revision, requestKey: requestKey.current, answers: values }) });
      const data = await response.json();
      if (!response.ok) { if (data.errors) { setErrors(data.errors); setStep("form"); } throw new Error(data.message); }
      window.location.replace(href("/attendee/ticket"));
    } catch (error) { setError(error instanceof Error ? error.message : "เชื่อมต่อไม่ได้ กรุณาลองอีกครั้ง"); }
    finally { setBusy(false); }
  }
  if (!configuration) return <main className={s.page}><p role={result?.error ? "alert" : "status"}>{result?.error || "กำลังโหลดรายละเอียดงาน…"}</p><Link href="/attendee/ticket">ดูตั๋วที่ลงทะเบียนไว้</Link></main>;
  if (mode === "event") return <main className={s.page}><p className={s.eyebrow}>EVENT SURVEY / อีเวนต์</p><section className={s.panel}>{configuration.details.banner && <img src={configuration.details.banner} alt="ภาพอีเวนต์" className={formStyles.banner} /> /* eslint-disable-line @next/next/no-img-element */}<h1>{configuration.details.name}</h1><span className={s.badge}>{configuration.registration_open ? "เปิดรับลงทะเบียน" : "ปิดรับลงทะเบียน"}</span><p className={s.muted}>{eventDateLabel(configuration.details)}</p><p>{configuration.details.venue}</p><p className={formStyles.description}>{configuration.details.description}</p><Link className={s.primary} href={href("/attendee/register")}>{configuration.registration_open ? "ลงทะเบียนเข้าร่วมงาน" : "ดูสถานะการลงทะเบียน"}</Link></section><Link className={s.secondary} href={href("/attendee/ticket")}>ตั๋วของฉัน</Link></main>;
  if (!configuration.registration_open) return <main className={s.page}><h1>ปิดรับลงทะเบียนแล้ว</h1><section className={s.panel}><h2>{configuration.details.name}</h2><p>สถานะนี้ไม่มีผลกับตั๋วที่ลงทะเบียนไว้แล้ว</p></section><Link className={s.primary} href={href("/attendee/ticket")}>ดูตั๋วของฉัน</Link></main>;
  return <main className={s.page}><h1>{step === "form" ? "ลงทะเบียนเข้าร่วมงาน" : "ตรวจสอบข้อมูลก่อนยืนยัน"}</h1><section className={s.panel}><h2>{configuration.details.name}</h2><p className={s.muted}>{eventDateLabel(configuration.details)}</p></section>{step === "form" ? <form className={s.panel} onSubmit={confirm} noValidate>{configuration.form_fields.map((field) => <label className={formStyles.field} key={field.id}>{field.label}{field.required && " *"}<input name={field.id} type={field.type} required={field.required} maxLength={field.id === "name" ? 200 : field.type === "email" ? 254 : 500} value={values[field.id] || ""} aria-invalid={!!errors[field.id]} aria-describedby={errors[field.id] ? `error-${field.id}` : undefined} onChange={(event) => { requestKey.current = ""; setValues({ ...values, [field.id]: event.target.value }); setErrors({ ...errors, [field.id]: "" }); setError(""); }} />{field.help && <small className={s.muted}>{field.help}</small>}{errors[field.id] && <small id={`error-${field.id}`} className={s.error}>{errors[field.id]}</small>}</label>)}<p className={s.muted}>ข้อมูลนี้ใช้สำหรับลงทะเบียนและจัดการเข้าร่วมอีเวนต์ โดยผู้จัดงานเป็นผู้ดูแลข้อมูล</p><button className={s.primary}>ถัดไป: ตรวจสอบข้อมูล</button></form> : <section className={s.panel}>{configuration.form_fields.map((field) => <div key={field.id}><small className={s.muted}>{field.label}</small><p>{values[field.id] || "—"}</p></div>)}<button className={s.primary} disabled={busy} onClick={register}>{busy ? "กำลังลงทะเบียน…" : "ยืนยันการลงทะเบียน"}</button><button className={s.secondary} disabled={busy} onClick={() => setStep("form")}>แก้ไขข้อมูล</button></section>}{error && <p className={s.error} role="alert">{error}</p>}<Link className={s.secondary} href={href("/attendee/ticket")}>ลงทะเบียนไว้แล้ว? ดูตั๋วของฉัน</Link><button type="button" className={s.secondary} onClick={() => router.push(href("/attendee"))}>กลับไปดูรายละเอียดงาน</button></main>;
}

export function CloudAttendeeRegistration({ mode }: { mode: "event" | "register" | "ticket" | "pending" }) {
  return <Suspense fallback={<main className={s.page}>กำลังโหลด…</main>}><PublicRegistration mode={mode} /></Suspense>;
}
