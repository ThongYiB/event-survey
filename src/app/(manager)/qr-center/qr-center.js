"use client";

import { ScreenHeading } from "../shell";
import { PublicSettings } from "../public-settings";
import { LinkQr } from "@/components/public/link-qr";
import { usePublicEvent } from "@/components/public/use-public-event";
import styles from "../manager.module.css";

export function QrCenter() {
  const { configuration, error, refresh } = usePublicEvent();
  return <>
    <ScreenHeading title="QR Center" description="QR สาธารณะสำหรับลงทะเบียนและตอบแบบสอบถาม" />
    {configuration ? <PublicSettings configuration={configuration} refresh={refresh} /> : <p role={error ? "alert" : "status"}>{error || "กำลังโหลดการตั้งค่า…"}{error && <button onClick={refresh}>ลองอีกครั้ง</button>}</p>}
    <p className={styles.notice}>หากให้มือถือหรือเครื่องอื่นสแกน ให้เปิดหน้านี้จาก URL ที่เครื่องนั้นเข้าถึงได้ก่อน QR จะใช้ที่อยู่เดียวกับเว็บที่กำลังเปิด</p>
    <div className={styles.fields}>
      <section className={styles.panel}><h2>QR ลงทะเบียน</h2><p className={styles.muted}>ก่อนเข้างาน · {configuration?.registrationOpen ? "เปิดรับลงทะเบียน" : configuration ? "ปิดรับลงทะเบียน" : "กำลังโหลด…"}</p><LinkQr path="/attendee/register" label="ฟอร์มลงทะเบียน" downloadName="event-survey-registration-qr.png" /></section>
      <section className={styles.panel}><h2>QR แบบสอบถาม</h2><p className={styles.muted}>หลังจบงาน · {configuration?.surveyOpen ? "เปิดรับคำตอบ" : configuration ? "ปิดรับความคิดเห็น" : "กำลังโหลด…"}</p><LinkQr path="/attendee/survey" label="แบบสอบถาม" downloadName="event-survey-survey-qr.png" /></section>
    </div>
    <section className={styles.panel}><h2>QR ส่วนตัวสำหรับเช็กอิน</h2><p className={styles.muted}>ผู้เข้าร่วมจะได้รับ QR ส่วนตัวที่หน้าตั๋วของฉันหลังยืนยันการลงทะเบียน QR ส่วนตัวใช้แสดงต่อ Staff เท่านั้น</p></section>
  </>;
}
