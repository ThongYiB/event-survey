"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useCloudManager } from "./manager-context";
import { useCheckinSummary } from "./checkin-summary";
import styles from "@/app/(manager)/manager.module.css";

export function CloudManagerDashboard() {
  const cloud = useCloudManager();
  const router = useRouter();
  const [query,setQuery]=useState("");
  const [version,setVersion]=useState(0);
  const {data,error}=useCheckinSummary(version);
  if (!cloud) return <p role="status">กำลังโหลดอีเวนต์…</p>;
  const active=cloud.data.event;
  const stats=data?.find(e=>e.eventId===active?.id)?.stats;
  const labels={draft:"ฉบับร่าง",open:"กำลังเปิดรับ",closed:"สิ้นสุดแล้ว"};
  return <div className={styles.stack}>
    <header className={styles.heading}><div><h1>ภาพรวมอีเวนต์</h1><p>ยินดีต้อนรับ {cloud.data.profile.name} · จัดการทุกขั้นตอนของงานในพื้นที่เดียว</p></div><button className={styles.secondary} onClick={()=>setVersion(v=>v+1)}>อัปเดตข้อมูล</button></header>
    {error&&<p className={styles.error} role="alert">{error}</p>}
    <div className={styles.summary}>{[["อีเวนต์ทั้งหมด",cloud.data.events.length],...["open","draft","closed"].map(status=>[labels[status as keyof typeof labels],cloud.data.events.filter(e=>e.status===status).length])].map(([label,value])=><div className={styles.summaryCard} key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
    {active&&<><section className={styles.panel}><p className={styles.panelLabel}>อีเวนต์ที่กำลังดู</p><div className={styles.currentBody}><div className={styles.currentInfo}><span className={`${styles.badge} ${active.status==="open"?styles.badgeOpen:active.status==="closed"?styles.badgeClosed:styles.badgeDraft}`}>{labels[active.status]}</span><h2>{active.name}</h2><p className={styles.currentMeta}>{active.details.startDate} · {active.details.startTime}–{active.details.endTime} น.</p><p className={styles.currentMeta}>{active.details.venue}</p></div><Link href="/details" className={styles.outlineLink}>จัดการอีเวนต์ →</Link></div></section>
      <div className={styles.metrics}>{[["ลงทะเบียน",stats?.registered??"…","คน"],["เช็กอินแล้ว",stats?.checkedIn??"…","คน"],["รอเช็กอิน",stats?.remaining??"…","คน"],["อัตราเข้าร่วม",stats?`${stats.registered?(100*stats.checkedIn/stats.registered).toFixed(1):"0.0"}%`:"…","เทียบจำนวนลงทะเบียน"]].map(([label,value,note])=><div key={label} className={styles.metricCard}><span>{label}</span><strong>{value}</strong><small>{note}</small></div>)}</div>
    </>}
    <section className={styles.panel}><h2>อีเวนต์ของคุณ</h2><label>ค้นหาชื่องาน<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="ค้นหาชื่องาน…"/></label><div className={styles.scroll}><table className={styles.eventTable}><thead><tr><th>ชื่องาน</th><th>วันจัดงาน</th><th>สถานะ</th><th>ลงทะเบียน</th><th>การจัดการ</th></tr></thead><tbody>{cloud.data.events.filter(e=>e.name.toLowerCase().includes(query.toLowerCase())).map(event=><tr key={event.id}><td className={styles.eventName}>{event.name}</td><td>{event.details.startDate}</td><td>{labels[event.status]}</td><td>{data?.find(e=>e.eventId===event.id)?.stats.registered??"…"} คน</td><td><div className={styles.item}>{[["/details","แก้ไข"],["/report","รายงาน"]].map(([path,label])=><button className={styles.secondary} key={path} disabled={cloud.busy} onClick={async()=>{if(await cloud.select(event.id))router.push(path);}}>{label}</button>)}</div></td></tr>)}</tbody></table></div></section>
  </div>;
}
