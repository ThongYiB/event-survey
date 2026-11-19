"use client";

import { useRef, useState, type FormEvent } from "react";
import { ScreenHeading } from "./shell";
import { initialDetails, useSaveSetting, useSaved } from "./store";
import Link from "next/link";
import styles from "./manager.module.css";
import kiosk from "./kiosk.module.css";
import { useCloudManager } from "@/components/cloud/manager-context";

type Media = { id: string; name: string; type: "image" | "video"; src: string; seconds: number };
type Settings = { published?:boolean;screens: string[]; startsAt: string; endsAt: string; media: Media[] };
const screenNames = ["ทางเข้าหลัก", "หน้าฮอลล์ A", "หน้าฮอลล์ B"];
const initial: Settings = { screens: ["ทางเข้าหลัก", "หน้าฮอลล์ A"], startsAt: "", endsAt: "", media: [] };

export default function KioskPage() {
  const cloud=useCloudManager();
  const saveSetting = useSaveSetting();
  const details = useSaved("details", initialDetails);
  const saved = useSaved("kiosk", initial);
  const [draft, setDraft] = useState<Settings | null>(null);
  const settings = draft ?? saved;
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const preview = useRef<HTMLDivElement>(null);
  const media = settings.media.find((item) => item.id === selected) ?? settings.media[0];

  function change(update: Partial<Settings>) {
    setDraft((previous) => ({ ...(previous ?? saved), ...update }));
    setMessage("");
    setError("");
  }

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    const added: Media[] = [];
    setLoading(true);
    setError("");
    try {
      for (const file of Array.from(files)) {
        if (!["image/png", "image/jpeg", "image/webp", "video/mp4", "video/webm"].includes(file.type) || file.size > 1024 * 1024) {
          throw new Error("เลือก PNG, JPEG, WebP, MP4 หรือ WebM ขนาดไม่เกิน 1 MB ต่อไฟล์");
        }
        const src = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error("อ่านไฟล์ไม่ได้ กรุณาลองอีกครั้ง"));
          reader.readAsDataURL(file);
        });
        added.push({ id: crypto.randomUUID(), name: file.name, type: file.type.startsWith("video/") ? "video" : "image", src, seconds: 10 });
      }
      setDraft((previous) => {
        const current = previous ?? saved;
        return { ...current, media: [...current.media, ...added] };
      });
      setMessage("");
      setSelected(added[0].id);
    } catch (error) {
      setError(error instanceof Error ? error.message : "อ่านไฟล์ไม่ได้");
    } finally {
      setLoading(false);
    }
  }

  function move(index: number, offset: number) {
    const next = [...settings.media];
    const target = index + offset;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    change({ media: next });
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (!settings.screens.length) { setError("กรุณาเลือกจออย่างน้อยหนึ่งจอ"); return; }
    if ((settings.startsAt && !settings.endsAt) || (!settings.startsAt && settings.endsAt) ||
        (settings.startsAt && settings.endsAt <= settings.startsAt)) {
      setError("กรอกเวลาเริ่มและสิ้นสุดให้ครบ โดยเวลาสิ้นสุดอยู่หลังเวลาเริ่ม");
      return;
    }
    if (!await saveSetting("kiosk", settings)) { setError("บันทึกไม่ได้ กรุณาตรวจข้อความด้านบนและขนาดสื่อ"); return; }
    setDraft(null);
    setError("");
    setMessage("บันทึกการตั้งค่าจอแล้ว");
  }

  return (
    <form onSubmit={save} className={styles.stack}>
      <ScreenHeading title="จอประชาสัมพันธ์ (Kiosk)" description="จัดคิวสื่อ เลือกจอ และกำหนดเวลา">
        <Link href={cloud?.data.event?`/display?event=${cloud.data.event.id}`:"/display"} className={styles.outlineLink} target="_blank" rel="noreferrer">เปิดจอ QR สำหรับผู้เข้าร่วม</Link>
        <button disabled={loading}>บันทึกการตั้งค่า</button>
      </ScreenHeading>
      <p className={styles.notice}>ตั้งค่าและดูตัวอย่างจอในเบราว์เซอร์นี้</p>
      {message && <p className={styles.notice} role="status">{message}</p>}
      {error && <p className={styles.error} role="alert">{error}</p>}
      <div className={styles.columns}>
        <div className={styles.stack}>
          <section className={styles.panel}>
            <h2>คิวโฆษณา</h2>
            <label>เพิ่มรูปหรือวิดีโอ<input type="file" multiple accept="image/png,image/jpeg,image/webp,video/mp4,video/webm" disabled={loading} onChange={(e) => { void upload(e.currentTarget.files); e.currentTarget.value = ""; }} /></label>
            <small>ไฟล์ละไม่เกิน 1 MB · รองรับ PNG, JPEG, WebP, MP4 และ WebM</small>
            {loading && <p role="status">กำลังอ่านไฟล์…</p>}
            {!settings.media.length && <p className={styles.muted}>เพิ่มสื่อเพื่อจัดคิวการแสดงผล</p>}
            <ol className={kiosk.queue}>{settings.media.map((item, i) =>
              <li key={item.id} className={kiosk.queueRow}>
                <span>{i + 1}</span><button type="button" className={styles.secondary} onClick={() => setSelected(item.id)} aria-pressed={media?.id === item.id}>{item.name}</button>
                <label>วินาที<input type="number" min={1} max={600} required value={item.seconds} onChange={(e) => change({ media: settings.media.map((row) => row.id === item.id ? { ...row, seconds: Number(e.target.value) } : row) })} /></label>
                <div className={styles.item}>
                  <button type="button" className={styles.secondary} disabled={!i || loading} onClick={() => move(i, -1)} aria-label={`เลื่อน ${item.name} ขึ้น`}>ขึ้น</button>
                  <button type="button" className={styles.secondary} disabled={i === settings.media.length - 1 || loading} onClick={() => move(i, 1)} aria-label={`เลื่อน ${item.name} ลง`}>ลง</button>
                  <button type="button" className={styles.secondary} disabled={loading} onClick={() => change({ media: settings.media.filter((row) => row.id !== item.id) })} aria-label={`ลบ ${item.name}`}>ลบ</button>
                </div>
              </li>,
            )}</ol>
          </section>
          <div className={styles.fields}>
            <section className={styles.panel}><h2>จอที่จะแสดง</h2>
              <label className={styles.check}><input type="checkbox" checked={!!settings.published} onChange={e=>change({published:e.target.checked})}/>เผยแพร่คิวสื่อบนจอที่เลือก</label>
              {cloud?.data.event&&<Link className={styles.outlineLink} target="_blank" rel="noreferrer" href={`/display/media?event=${cloud.data.event.id}`}>เปิดเครื่องเล่นสื่อสำหรับจอ</Link>}
              {screenNames.map((name) => <label key={name} className={styles.check}>
                <input type="checkbox" checked={settings.screens.includes(name)} onChange={(e) => change({ screens: e.target.checked ? [...settings.screens, name] : settings.screens.filter((s) => s !== name) })} />{name}
              </label>)}<p className={styles.muted}>เลือกแล้ว {settings.screens.length} จอ</p>
            </section>
            <section className={styles.panel}><h2>กำหนดวันและเวลา</h2>
              <label>เริ่มแสดง<input type="datetime-local" value={settings.startsAt} onChange={(e) => change({ startsAt: e.target.value })} /></label>
              <label>สิ้นสุด<input type="datetime-local" value={settings.endsAt} onChange={(e) => change({ endsAt: e.target.value })} /></label><small>เวลาไทย (ICT)</small>
            </section>
          </div>
        </div>
        <section className={styles.panel}>
          <h2>ตัวอย่างบนจอ</h2>
          <div className={kiosk.preview} ref={preview}>
            {media ? media.type === "video" ? <video src={media.src} controls playsInline aria-label={media.name} /> :
              // eslint-disable-next-line @next/next/no-img-element
              <img src={media.src} alt={media.name} /> :
              <div className={kiosk.poster} style={{ backgroundColor: details.color }}><span>Event Survey</span><strong>{details.name}</strong><span>{details.venue}</span></div>}
          </div>
          <p className={styles.muted}>{media ? `${media.name} · แสดงผล ${media.seconds} วินาที` : "แสดงรายละเอียดอีเวนต์เมื่อยังไม่มีสื่อ"}</p>
          <button type="button" className={styles.secondary} onClick={async () => {
            try { await preview.current?.requestFullscreen(); } catch { setError("เปิดตัวอย่างเต็มจอไม่ได้"); }
          }}>ดูตัวอย่างเต็มจอ</button>
        </section>
      </div>
    </form>
  );
}
