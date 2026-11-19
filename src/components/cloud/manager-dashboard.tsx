"use client";
import { useRouter } from "next/navigation";
import { useCloudManager } from "./manager-context";
import styles from "@/app/(manager)/manager.module.css";

export function CloudManagerDashboard() {
  const cloud = useCloudManager();
  const router = useRouter();
  if (!cloud) return <p role="status">กำลังโหลดอีเวนต์…</p>;
  return <>
    <header className={styles.heading}><div><h1>ภาพรวมอีเวนต์</h1><p>สวัสดี {cloud.data.profile.name} · อีเวนต์ของคุณ {cloud.data.events.length} งาน</p></div></header>
    <section className={styles.panel}><h2>อีเวนต์ของคุณ</h2><div className={styles.scroll}><table><thead><tr><th>ชื่องาน</th><th>สถานที่</th><th>สถานะ</th><th>จัดการ</th></tr></thead><tbody>{cloud.data.events.map((event) => <tr key={event.id}><td>{event.name}</td><td>{event.details.venue}</td><td>{{ draft: "ฉบับร่าง", open: "เปิดรับ", closed: "สิ้นสุดแล้ว" }[event.status]}</td><td><button disabled={cloud.busy} onClick={async () => { if (await cloud.select(event.id)) router.push("/details"); }}>จัดการอีเวนต์</button></td></tr>)}</tbody></table></div></section>
    <p className={styles.notice}>บัญชี อีเวนต์ รายละเอียด ฟอร์ม แบบสอบถาม และทีมงานเชื่อมกับ Supabase แล้ว ส่วนรับลงทะเบียน เช็กอิน รายงาน และเผยแพร่สื่อกำลังเชื่อมต่อเป็นขั้นถัดไป</p>
  </>;
}
