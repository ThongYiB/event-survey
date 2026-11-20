"use client";

import Link from "next/link";
import { defaultEventDetails, eventDateLabel } from "@/lib/public-event";
import { usePublicEvent } from "@/components/public/use-public-event";
import styles from "./feedback.module.css";
import {useSearchParams} from 'next/navigation';
import {PublicDemo} from '@/components/cloud/public-demo';
import {supabaseEnabled} from '@/lib/supabase/config';

export function PublicLoadState({ error, retry }: { error: string; retry: () => void }) {
  return <main className={styles.page}><p role={error ? "alert" : "status"}>{error || "กำลังโหลดข้อมูลอีเวนต์…"}</p>{error && <button className={styles.secondary} onClick={retry}>ลองอีกครั้ง</button>}</main>;
}

export function ClosedEvent({ kind, details }: { kind: "registration" | "survey"; details: typeof defaultEventDetails }) {
  const id=useSearchParams().get('event');
  const href=(path:string)=>id?`${path}?event=${encodeURIComponent(id)}`:path;
  const registration = kind === "registration";
  return <main className={styles.page}>
    <header className={styles.intro}>
      <p className={styles.eyebrow}>อีเวนต์ / {registration ? "ปิดรับลงทะเบียน" : "ปิดรับแบบสอบถาม"}</p>
      <h1>{registration ? "ปิดรับลงทะเบียนแล้ว" : "ปิดรับความคิดเห็นแล้ว"}</h1>
    </header>
    <section className={`${styles.panel} ${styles.hero}`}>
      <span className={styles.icon} aria-hidden="true"><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="7" y="7" width="18" height="21" rx="3" />{registration ? <><path d="M7 13h18M12 4v6M20 4v6M12 18l8 6M20 18l-8 6" /></> : <><rect x="12" y="4" width="8" height="6" rx="2" /><path d="m11 18 4 4 7-8" /></>}</svg></span>
      <span className={styles.badge}>{registration ? "ปิดรับลงทะเบียน" : "ปิดรับแบบสอบถาม"}</span>
      <h2>{details.name}</h2>
      {registration && <p className={styles.muted}>{eventDateLabel(details)}</p>}
      <p className={styles.muted}>{registration ? "ขณะนี้ไม่สามารถลงทะเบียนเพิ่มได้ ขอบคุณที่สนใจเข้าร่วมงาน" : "หมดช่วงเวลารับแบบสอบถามแล้ว จึงไม่สามารถส่งความคิดเห็นเพิ่มได้"}</p>
      <button className={styles.primary} disabled>{registration ? "ลงทะเบียน (ปิดรับแล้ว)" : "ส่งแบบสอบถาม (ปิดรับแล้ว)"}</button>
    </section>
    <aside className={styles.notice}><strong>{registration ? "ลงทะเบียนไว้แล้ว?" : "ขอบคุณสำหรับทุกความคิดเห็น"}</strong><p>{registration ? "ดู QR ส่วนบุคคลของคุณเพื่อแสดงต่อ Staff ในวันงาน สถานะนี้ไม่มีผลกับการลงทะเบียนเดิม" : "คำตอบที่ส่งไว้เรียบร้อยแล้วจะยังอยู่ในรายงานของงาน"}</p></aside>
    <div className={styles.actions}>
      {registration && <Link className={styles.secondary} href={href('/attendee/ticket')}>ดู QR ส่วนบุคคล</Link>}
      <Link className={styles.secondary} href={href('/attendee')}>กลับไปดูรายละเอียดงาน</Link>
    </div>
  </main>;
}

export function ClosedEventPage({ kind }: { kind: "registration" | "survey" }) {
  const eventId=useSearchParams().get('event')||undefined;
  const { configuration, error, refresh } = usePublicEvent(eventId);
  if(supabaseEnabled()&&!eventId)return <PublicDemo mode="closed"/>;
  if (!configuration) return <PublicLoadState error={error} retry={refresh} />;
  return <ClosedEvent kind={kind} details={configuration.details} />;
}
