"use client";

import Link from "next/link";
import { useState } from "react";
import { defaultSurveyFields, type PublicEvent } from "@/lib/public-event";
import { initialDetails, useSaved } from "./store";
import styles from "./manager.module.css";

export function PublicSettings({ configuration, refresh }: { configuration: PublicEvent; refresh: () => void }) {
  const details = useSaved("details", initialDetails);
  const fields = useSaved("survey", defaultSurveyFields);
  const [draft, setDraft] = useState<{ registrationOpen: boolean; surveyOpen: boolean } | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [unauthorized, setUnauthorized] = useState(false);
  const [saving, setSaving] = useState(false);
  const flags = draft ?? configuration;

  async function save(publish: boolean) {
    if (saving) return;
    setSaving(true); setMessage(""); setError(""); setUnauthorized(false);
    try {
      const response = await fetch("/api/manager/public-event", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...configuration, registrationOpen: flags.registrationOpen, surveyOpen: flags.surveyOpen, ...(publish ? { details, surveyFields: fields } : {}) }) });
      const result = await response.json();
      if (!response.ok) { setError(result.message || "บันทึกไม่สำเร็จ"); setUnauthorized(response.status === 401); return; }
      setDraft(null); setMessage(publish ? "เผยแพร่รายละเอียดงานและแบบสอบถามแล้ว" : "บันทึกสถานะเปิด–ปิดรับแล้ว"); refresh();
    } catch { setError("เชื่อมต่อระบบไม่ได้ กรุณาลองอีกครั้ง"); }
    finally { setSaving(false); }
  }

  return <section className={styles.panel}>
    <h2>สถานะสำหรับผู้เข้าร่วม</h2>
    <p className={styles.muted}>เปิด–ปิดรับมีผลกับ QR ทั้ง Manager, Staff และจอประชาสัมพันธ์</p>
    <label className={styles.check}><input type="checkbox" checked={flags.registrationOpen} disabled={saving} onChange={(event) => setDraft({ registrationOpen: event.target.checked, surveyOpen: flags.surveyOpen })} />เปิดรับลงทะเบียน</label>
    <label className={styles.check}><input type="checkbox" checked={flags.surveyOpen} disabled={saving} onChange={(event) => setDraft({ registrationOpen: flags.registrationOpen, surveyOpen: event.target.checked })} />เปิดรับแบบสอบถาม</label>
    <div className={styles.item}><button type="button" disabled={saving} onClick={() => save(false)}>บันทึกสถานะ</button><button type="button" className={styles.secondary} disabled={saving} onClick={() => save(true)}>เผยแพร่รายละเอียดและแบบสอบถามที่บันทึกไว้</button></div>
    <p className={styles.muted}>คำถามที่เผยแพร่ {configuration.surveyFields.length} ข้อ · ฉบับที่ {configuration.revision} · <Link href="/survey">แก้ไขคำถาม</Link></p>
    {message && <p className={styles.notice} role="status">{message}</p>}
    {error && <p className={styles.error} role="alert">{error} {unauthorized && <Link href="/login">ไปหน้าเข้าสู่ระบบ</Link>}</p>}
    <div className={styles.item}><Link className={styles.outlineLink} href="/display" target="_blank" rel="noreferrer">เปิดจอประชาสัมพันธ์</Link><Link className={styles.outlineLink} href="/attendee/survey">เปิดหน้าตอบแบบสอบถาม</Link></div>
  </section>;
}
