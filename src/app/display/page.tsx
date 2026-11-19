"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { usePublicEvent } from "@/components/public/use-public-event";
import { LinkQr } from "@/components/public/link-qr";
import { eventDateLabel } from "@/lib/public-event";
import styles from "./display.module.css";

export default function PublicDisplayPage() {
  const { configuration, error, refresh } = usePublicEvent();
  const [fullscreenError, setFullscreenError] = useState("");
  useEffect(() => { const timer = setInterval(refresh, 30000); return () => clearInterval(timer); }, [refresh]);
  if (!configuration) return <main className={styles.page}><p role={error ? "alert" : "status"}>{error || "กำลังโหลดจอประชาสัมพันธ์…"}</p>{error && <button onClick={refresh}>ลองอีกครั้ง</button>}</main>;
  const { details } = configuration;
  return <main className={styles.page} style={{ "--event-color": details.color } as CSSProperties}>
    <header className={styles.header}><span className={styles.brand}><span>ES</span>Event Survey</span><span className={styles.label}>จอประชาสัมพันธ์</span></header>
    <section className={styles.hero}>
      <div><p>CREATE · CONNECT · INSPIRE</p><h1>{details.name}</h1><p>{eventDateLabel(details)}</p><p>{details.venue}</p></div>
      {details.logo ? <img src={details.logo} alt={`โลโก้ ${details.name}`} className={styles.logo} /> : <span className={styles.emblem} aria-hidden="true">CC / 26</span> /* eslint-disable-line @next/next/no-img-element */}
    </section>
    <div className={styles.content}>
      <div className={styles.grid}>
        <section className={styles.card}><div><span className={styles.badge}>QR ลงทะเบียน</span><h2>ลงทะเบียนเข้าร่วมงาน</h2><p>สแกนเพื่อกรอกข้อมูล แล้วรับ QR ส่วนบุคคลสำหรับเช็กอิน</p></div>{configuration.registrationOpen ? <LinkQr path="/attendee/register" label="ฟอร์มลงทะเบียน" downloadName="registration-qr.png" showTools={false} /> : <div className={styles.closed}>ปิดรับลงทะเบียนแล้ว</div>}</section>
        <section className={styles.card}><div><span className={styles.badge}>QR แบบสอบถาม</span><h2>ร่วมตอบแบบสอบถาม</h2><p>แบ่งปันความคิดเห็นหลังร่วมงาน ใช้เวลาประมาณ 2 นาที</p></div>{configuration.surveyOpen ? <LinkQr path="/attendee/survey" label="แบบสอบถาม" downloadName="survey-qr.png" showTools={false} /> : <div className={styles.closed}>ปิดรับความคิดเห็นแล้ว</div>}</section>
      </div>
      <p className={styles.warning}>QR สองชุดนี้ใช้ลงทะเบียนและตอบแบบสอบถามเท่านั้น สำหรับเข้างาน โปรดแสดง QR ส่วนบุคคลให้ Staff สแกน</p>
      <footer className={styles.footer}><p>Event Survey · {details.name}</p><button type="button" onClick={async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); setFullscreenError(""); } catch { setFullscreenError("เปิดเต็มจอไม่ได้ กรุณาใช้ปุ่มเต็มจอของเบราว์เซอร์"); } }}>เต็มจอ / ออกจากเต็มจอ</button></footer>
      {(error || fullscreenError) && <p role="alert">{error || fullscreenError}</p>}
    </div>
  </main>;
}
