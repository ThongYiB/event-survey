"use client";

import { Suspense, useRef, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePublicEvent } from "@/components/public/use-public-event";
import { surveyOptions } from "@/lib/public-event";
import { ClosedEvent, PublicLoadState } from "../event-state";
import styles from "../feedback.module.css";
import {PublicDemo} from '@/components/cloud/public-demo';
import {supabaseEnabled} from '@/lib/supabase/config';



function SurveyPage() {
  const router = useRouter();
  const eventId=useSearchParams().get("event")||undefined;
  const { configuration, error: loadError, refresh } = usePublicEvent(eventId);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [updated, setUpdated] = useState(false);
  const [saving, setSaving] = useState(false);
  const requestKey = useRef("");
  if(supabaseEnabled()&&!eventId)return <PublicDemo mode="survey"/>;
  if (!configuration) return <PublicLoadState error={loadError} retry={refresh} />;
  if (!configuration.surveyOpen) return <ClosedEvent kind="survey" details={configuration.details} />;

  function change(id: string, value: string | string[]) {
    setError("");
    setAnswers((previous) => ({ ...previous, [id]: value }));
    setErrors((previous) => ({ ...previous, [id]: "" }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configuration || saving || updated) return;
    setError("");
    const missing = Object.fromEntries(configuration.surveyFields.filter((field) => field.required && !(answers[field.id]?.length)).map((field) => [field.id, "กรุณาตอบคำถามนี้"]));
    setErrors(missing);
    if (Object.keys(missing).length) { setError("กรุณาตอบคำถามที่มีเครื่องหมาย * ให้ครบ"); return; }
    setSaving(true);
    try {
      if (!requestKey.current) {
        try { requestKey.current = localStorage.getItem(`event-survey:survey-key:${configuration.id}`) || ""; } catch { /* Per-tab key still protects retries when storage is unavailable. */ }
        requestKey.current ||= Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, "0")).join("");
        try { localStorage.setItem(`event-survey:survey-key:${configuration.id}`, requestKey.current); } catch { /* Keep the key in memory. */ }
      }
      const response = await fetch("/api/public/survey", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventId: configuration.id, requestKey: requestKey.current, revision: configuration.revision, answers }) });
      const result = await response.json();
      if (result.code === "survey-closed") { router.replace(`/attendee/survey/closed?event=${configuration.id}`); return; }
      if (!response.ok) { setError(result.message || "ส่งคำตอบไม่สำเร็จ กรุณาลองอีกครั้ง"); setErrors(result.errors || {}); setUpdated(result.code === "survey-updated"); return; }
      router.replace(`/attendee/survey/thanks?event=${configuration.id}`);
    } catch { setError("เชื่อมต่อระบบไม่ได้ คำตอบยังอยู่ในหน้านี้ กรุณาลองส่งอีกครั้ง"); }
    finally { setSaving(false); }
  }

  return <main className={styles.page}>
    <header className={styles.intro}><h1>แบ่งปันประสบการณ์</h1><h2>{configuration.details.name}</h2><p>ใช้เวลาประมาณ 2 นาที ความคิดเห็นของคุณช่วยให้เราจัดงานครั้งต่อไปได้ดียิ่งขึ้น</p><span className={styles.badge}>เปิดรับคำตอบ</span></header>
    <form className={styles.form} onSubmit={submit} noValidate>
      {configuration.surveyFields.map((field) => <fieldset className={styles.question} key={field.id} aria-describedby={errors[field.id] ? `error-${field.id}` : undefined}>
        <legend>{field.label}{field.required && <span aria-label="จำเป็น"> *</span>}</legend>
        {field.help && <p className={styles.muted}>{field.help}</p>}
        {["radio", "checkbox"].includes(field.type) ? surveyOptions(field).map((option) => <label key={option} className={styles.option}>
          <input type={field.type} name={field.id} value={option} disabled={saving || updated}
            checked={field.type === "radio" ? answers[field.id] === option : Array.isArray(answers[field.id]) && answers[field.id].includes(option)}
            onChange={(event) => {
              if (field.type === "radio") change(field.id, option);
              else { const chosen = Array.isArray(answers[field.id]) ? answers[field.id] as string[] : []; change(field.id, event.target.checked ? [...chosen, option] : chosen.filter((value) => value !== option)); }
            }} />{option}
        </label>) : field.type === "textarea" ? <textarea aria-label={field.label} rows={4} maxLength={3000} value={String(answers[field.id] || "")} disabled={saving || updated} onChange={(event) => change(field.id, event.target.value)} placeholder="พิมพ์ความคิดเห็นของคุณ" /> : <input type="text" aria-label={field.label} maxLength={500} value={String(answers[field.id] || "")} disabled={saving || updated} onChange={(event) => change(field.id, event.target.value)} />}
        {errors[field.id] && <p className={styles.error} id={`error-${field.id}`}>{errors[field.id]}</p>}
      </fieldset>)}
      {error && <p role="alert" className={styles.error}>{error}</p>}
      {updated ? <button type="button" className={styles.secondary} onClick={() => { setAnswers({}); setErrors({}); setError(""); setUpdated(false); refresh(); }}>โหลดแบบสอบถามล่าสุด</button> : <button className={styles.primary} disabled={saving}>{saving ? "กำลังส่งคำตอบ…" : "ส่งแบบสอบถาม"}</button>}
      <p className={styles.muted}>ไม่ต้องเข้าสู่ระบบ · ไม่ต้องระบุชื่อในแบบสอบถาม</p>
    </form>
  </main>;
}

export default function Page() {
  return <Suspense fallback={<p>กำลังโหลดแบบประเมิน…</p>}><SurveyPage /></Suspense>;
}
