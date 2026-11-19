"use client";

import { useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { ScreenHeading } from "./shell";
import { initialDetails, useSaveSetting, useSaved } from "./store";
import styles from "./manager.module.css";

const dateFields = [
  ["startDate", "วันเริ่ม", "date"],
  ["endDate", "วันสิ้นสุด", "date"],
  ["startTime", "เวลาเริ่ม", "time"],
  ["endTime", "เวลาสิ้นสุด", "time"],
] as const;

export function EventDetails() {
  const saveSetting = useSaveSetting();
  const saved = useSaved("details", initialDetails);
  const [draft, setDraft] = useState<typeof initialDetails | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [reading, setReading] = useState(false);
  const logoInput = useRef<HTMLInputElement>(null);
  const details = draft ?? saved;

  function update(key: keyof typeof initialDetails, value: string) {
    setDraft((previous) => ({ ...(previous ?? saved), [key]: value }));
    setMessage("");
  }

  async function readImage(key: "logo" | "banner", file?: File) {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 1024 * 1024) {
      setError("เลือกรูป PNG, JPEG หรือ WebP ขนาดไม่เกิน 1 MB");
      return;
    }
    setError("");
    setReading(true);
    try {
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      update(key, data);
    } catch {
      setError("อ่านไฟล์รูปไม่ได้ กรุณาเลือกไฟล์ใหม่");
    } finally {
      setReading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (!details.name.trim() || !details.description.trim() || !details.venue.trim()) {
      setError("กรุณากรอกชื่อ รายละเอียด และสถานที่");
      return;
    }
    if (`${details.endDate}T${details.endTime}` <= `${details.startDate}T${details.startTime}`) {
      setError("วันและเวลาสิ้นสุดต้องอยู่หลังวันและเวลาเริ่ม");
      return;
    }
    if (!await saveSetting("details", { ...details, name: details.name.trim() })) {
      setError("บันทึกรายละเอียดไม่สำเร็จ กรุณาตรวจข้อความด้านบนแล้วลองอีกครั้ง");
      return;
    }
    setDraft(null);
    setError("");
    setMessage("บันทึกรายละเอียดงานแล้ว");
  }

  return (
    <form className={styles.stack} onSubmit={submit}>
      <ScreenHeading title="รายละเอียดงาน" description="สร้างหรือแก้ไขข้อมูลและภาพลักษณ์ของงาน">
        <button disabled={reading}>บันทึกการเปลี่ยนแปลง</button>
      </ScreenHeading>
      {error && <p className={styles.error} role="alert">{error}</p>}
      {message && <p className={styles.notice} role="status">{message}</p>}
      <div className={styles.columns}>
        <section className={styles.panel}>
          <h2>ข้อมูลทั่วไป</h2>
          <label>ชื่ออีเวนต์ *<input required value={details.name} onChange={(e) => update("name", e.target.value)} /></label>
          <label>รายละเอียด *<textarea rows={4} required value={details.description} onChange={(e) => update("description", e.target.value)} /></label>
          <label>สถานที่ *<input required value={details.venue} onChange={(e) => update("venue", e.target.value)} /></label>
          <div className={styles.fields}>
            {dateFields.map(([key, label, type]) => (
              <label key={key}>{label} *<input type={type} required value={details[key]} onChange={(e) => update(key, e.target.value)} /></label>
            ))}
          </div>
          <p className={styles.muted}>เวลาไทย (ICT)</p>
        </section>
        <section className={styles.panel}>
          <h2>ธีมและสื่อของงาน</h2>
          <label>สีหลักของงาน<input type="color" value={details.color} onChange={(e) => update("color", e.target.value)} /></label>
          {details.logo && (
            <div className={styles.item}>
              <Image className={styles.logo} src={details.logo} alt="โลโก้อีเวนต์" width={80} height={80} unoptimized />
              <button type="button" className={styles.secondary} disabled={reading} onClick={() => {
                update("logo", "");
                setError("");
                if (logoInput.current) logoInput.current.value = "";
                logoInput.current?.focus();
              }}>ลบโลโก้</button>
            </div>
          )}
          <label>โลโก้<input ref={logoInput} type="file" accept="image/png,image/jpeg,image/webp" disabled={reading} onChange={(e) => void readImage("logo", e.target.files?.[0])} /></label>
          <div className={styles.banner} style={{ backgroundColor: details.color }}>
            {details.banner ? <Image src={details.banner} alt="แบนเนอร์อีเวนต์" width={640} height={240} unoptimized /> : <strong>{details.name}</strong>}
          </div>
          <label>แบนเนอร์<input type="file" accept="image/png,image/jpeg,image/webp" disabled={reading} onChange={(e) => void readImage("banner", e.target.files?.[0])} /></label>
        </section>
      </div>
    </form>
  );
}

