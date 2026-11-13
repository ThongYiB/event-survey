"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { ScreenHeading } from "../shell";
import styles from "../manager.module.css";
import qrStyles from "./qr-center.module.css";

const registrationPath = "/attendee/register";

export function QrCenter() {
  const [registration, setRegistration] = useState(null);
  const [copyStatus, setCopyStatus] = useState("");

  useEffect(() => {
    let active = true;
    const url = new URL(registrationPath, window.location.origin);

    async function loadQr() {
      let image = "";
      try {
        image = await QRCode.toDataURL(url.href, { width: 600 });
      } catch {
        // Keep the registration link available if QR generation fails.
      }
      if (active) setRegistration({ url, image });
    }

    void loadQr();
    return () => { active = false; };
  }, []);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(registration.url.href);
      setCopyStatus("คัดลอกลิงก์แล้ว");
    } catch {
      setCopyStatus("คัดลอกอัตโนมัติไม่ได้ เลือกและคัดลอกลิงก์จากช่องด้านบนได้");
    }
  }

  const local = registration && ["localhost", "127.0.0.1", "[::1]"].includes(registration.url.hostname);

  return (
    <>
      <ScreenHeading title="QR Center" description="QR สาธารณะสำหรับลงทะเบียนและตอบแบบสอบถาม" />

      {local && (
        <p className={qrStyles.notice}>
          QR นี้ใช้ลิงก์ของเครื่องที่กำลังเปิดเว็บอยู่ หากจะให้มือถือสแกน ให้เปิด QR Center จาก URL ที่มือถือเข้าถึงได้ก่อน
        </p>
      )}

      <div className={`${styles.fields} ${qrStyles.cards}`}>
        <section className={styles.panel} aria-labelledby="registration-qr">
          <h2 id="registration-qr">QR ลงทะเบียน</h2>
          <span className={qrStyles.badge}>ก่อนเข้างาน</span>
          <div className={qrStyles.preview}>
            {registration?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={registration.image} alt="QR ลงทะเบียนเข้าร่วมงาน" width={220} height={220} />
            ) : (
              <p role="status">{registration ? "สร้าง QR ไม่สำเร็จ ใช้ลิงก์ลงทะเบียนได้" : "กำลังสร้าง QR…"}</p>
            )}
          </div>
          <p>เปิดฟอร์มลงทะเบียนสำหรับผู้เข้าร่วมงาน</p>
          <label>
            ลิงก์ลงทะเบียน
            <input readOnly value={registration?.url.href ?? ""} onFocus={(event) => event.currentTarget.select()} />
          </label>
          <div className={styles.item}>
            {registration?.image && (
              <a className={qrStyles.action} href={registration.image} download="event-survey-registration-qr.png">
                ดาวน์โหลด QR
              </a>
            )}
            {registration && <button className={styles.secondary} onClick={copyLink}>คัดลอกลิงก์</button>}
            <Link className={qrStyles.action} href={registrationPath}>เปิดฟอร์ม</Link>
          </div>
          {copyStatus && <p className={styles.muted} role="status">{copyStatus}</p>}
        </section>

        <section className={styles.panel} aria-labelledby="survey-qr">
          <h2 id="survey-qr">QR แบบสอบถาม</h2>
          <span className={qrStyles.badge}>หลังจบงาน</span>
          <div className={qrStyles.preview}>
            <p>รอเปิดหน้าตอบแบบสอบถาม</p>
          </div>
          <p className={styles.muted}>สร้าง QR ได้เมื่อมีหน้าตอบแบบสอบถามสำหรับผู้เข้าร่วม</p>
        </section>
      </div>

      <section className={styles.panel}>
        <h2>QR ส่วนตัวสำหรับเช็กอิน</h2>
        <p className={styles.muted}>ผู้เข้าร่วมจะได้รับ QR ส่วนตัวที่หน้าตั๋วของฉันหลังยืนยันการลงทะเบียน</p>
      </section>
    </>
  );
}
