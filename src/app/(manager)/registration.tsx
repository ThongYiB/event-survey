"use client";

import Link from "next/link";
import { useState } from "react";
import { ScreenHeading } from "./shell";
import styles from "./manager.module.css";

const attendees = [
  { id: "CC26-0187", name: "ปภาวี ใจดี", email: "pa***@example.com", phone: "089-XXX-1234", checkedIn: true, time: "25 พ.ย. 09:12" },
  { id: "CC26-0188", name: "กวิน สร้างสรรค์", email: "ka***@example.com", phone: "081-XXX-4421", checkedIn: false, time: "" },
  { id: "CC26-0189", name: "ณัฐชา มีสุข", email: "na***@example.com", phone: "086-XXX-8901", checkedIn: true, time: "25 พ.ย. 09:16" },
  { id: "CC26-0190", name: "วรินทร์ แสงดี", email: "wa***@example.com", phone: "", checkedIn: false, time: "" },
  { id: "CC26-0191", name: "ภูวดล คิดดี", email: "ph***@example.com", phone: "092-XXX-5577", checkedIn: true, time: "25 พ.ย. 09:25" },
];

export default function AttendeesPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<(typeof attendees)[number] | null>(null);
  const keyword = query.trim().toLowerCase();
  const rows = attendees.filter((row) =>
    [row.id, row.name, row.email, row.phone].join(" ").toLowerCase().includes(keyword) &&
    (status === "all" || row.checkedIn === (status === "checked")),
  );
  return (
    <>
      <ScreenHeading title="ผู้ลงทะเบียน" description="ตรวจสอบรายชื่อและสถานะเช็กอิน">
        <Link href="/report" className={styles.outlineLink}>ดูรายงาน</Link>
      </ScreenHeading>
      <p className={styles.notice}>ข้อมูลตัวอย่างสำหรับตรวจหน้าจอ จำนวน 5 รายการ</p>
      <div className={styles.metrics}>
        {[["รายชื่อในตัวอย่าง", attendees.length], ["เช็กอินแล้ว", attendees.filter((r) => r.checkedIn).length], ["ยังไม่เช็กอิน", attendees.filter((r) => !r.checkedIn).length]].map(([label, value]) =>
          <div key={label} className={styles.metricCard}><span>{label}</span><strong>{value}</strong><small>คน</small></div>,
        )}
      </div>
      <section className={styles.panel}>
        <div className={styles.fields}>
          <label>ค้นหาผู้ลงทะเบียน<input type="search" placeholder="ชื่อ รหัส อีเมล หรือโทรศัพท์" value={query} onChange={(e) => setQuery(e.target.value)} /></label>
          <label>สถานะเช็กอิน<select value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">ทุกสถานะ</option><option value="checked">เช็กอินแล้ว</option><option value="waiting">ยังไม่เช็กอิน</option></select></label>
        </div>
        <div className={styles.scroll}>
          <table><thead><tr><th>รหัส / ชื่อ</th><th>ข้อมูลติดต่อ</th><th>สถานะ</th><th>เวลาเช็กอิน</th><th>จัดการ</th></tr></thead>
            <tbody>{rows.map((row) => <tr key={row.id}>
              <td><small>{row.id}</small><strong>{row.name}</strong></td><td>{row.email}<small>{row.phone || "ไม่ระบุโทรศัพท์"}</small></td>
              <td><span className={`${styles.badge} ${row.checkedIn ? styles.badgeOpen : styles.badgeDraft}`}>{row.checkedIn ? "เช็กอินแล้ว" : "ยังไม่เช็กอิน"}</span></td><td>{row.time || "—"}</td>
              <td><button className={styles.secondary} onClick={() => setSelected(row)}>ดูข้อมูล</button></td>
            </tr>)}{!rows.length && <tr><td colSpan={5} className={styles.empty}>ไม่พบรายชื่อที่ตรงกับเงื่อนไข</td></tr>}</tbody>
          </table>
        </div><p className={styles.muted}>แสดง {rows.length} จาก {attendees.length} รายการตัวอย่าง</p>
      </section>
      {selected && <section className={styles.panel} aria-labelledby="attendee-info">
        <div className={styles.heading}><h2 id="attendee-info">ข้อมูลผู้ลงทะเบียน</h2><button className={styles.secondary} onClick={() => setSelected(null)}>ปิดข้อมูล</button></div>
        <p><strong>{selected.name}</strong> · {selected.id}</p><p>{selected.email} · {selected.phone || "ไม่ระบุโทรศัพท์"}</p><p>สถานะ {selected.checkedIn ? `เช็กอินแล้ว ${selected.time}` : "ยังไม่เช็กอิน"}</p>
      </section>}
    </>
  );
}
