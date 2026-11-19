"use client";

import Link from "next/link";
import { usePublicEvent } from "@/components/public/use-public-event";
import { PublicLoadState } from "../../event-state";
import styles from "../../feedback.module.css";

export default function Page() {
  const { configuration, error, refresh } = usePublicEvent();
  if (!configuration) return <PublicLoadState error={error} retry={refresh} />;
  return <main className={styles.page}>
    <h1>ขอบคุณสำหรับความคิดเห็น</h1>
    <div className={styles.success} role="status"><span className={styles.icon} aria-hidden="true"><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M16 26S5 19 5 12a6 6 0 0 1 11-3 6 6 0 0 1 11 3c0 7-11 14-11 14Z" /><path d="m11 15 4 4 7-8" /></svg></span><p>ส่งแบบสอบถามเรียบร้อย</p></div>
    <section className={styles.panel}><h2>ทุกความคิดเห็นมีความหมาย</h2><strong>{configuration.details.name}</strong><p className={styles.muted}>ขอบคุณที่ร่วมเป็นส่วนหนึ่งของงาน เราจะนำความคิดเห็นไปพัฒนาประสบการณ์ครั้งต่อไป</p></section>
    <div className={styles.actions}><Link className={styles.primary} href="/attendee">กลับไปดูรายละเอียดงาน</Link><Link className={styles.secondary} href="/attendee/ticket">ดู QR ส่วนบุคคล</Link></div>
  </main>;
}
