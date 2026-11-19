"use client";
import { useState } from "react";
import Link from "next/link";
import { useCloudManager } from "./manager-context";
import { useCheckinSummary } from "./checkin-summary";
import { ScreenHeading } from "@/app/(manager)/shell";
import s from "@/app/(manager)/manager.module.css";
import chart from "@/app/(manager)/report.module.css";

export function CloudEventReport() {
  const event=useCloudManager()?.data.event;
  const [version,setVersion]=useState(0);
  const {data,error}=useCheckinSummary(version);
  const record=data?.find(row=>row.eventId===event?.id);
  const stats=record?.stats;
  function exportCsv() {
    if(!record||!event)return;
    const rows=[['อีเวนต์',event.name],['ลงทะเบียน',record.stats.registered],['เช็กอิน',record.stats.checkedIn],['รอเช็กอิน',record.stats.remaining],['Walk-in',record.walkin],['ช่วงเวลา (ประเทศไทย)','จำนวนเช็กอิน'],...record.timeline.map(row=>[row.time,row.count])];
    const csv=rows.map(row=>row.map(cell=>`"${String(cell).replace(/^[\s]*[=+@-]/,"'$&").replaceAll('"','""')}"`).join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob(['\uFEFF',csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='event-attendance-report.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  return <div className={`${s.stack} ${chart.report}`}>
    <ScreenHeading title="รายงานผลอีเวนต์" description="สรุปการลงทะเบียนและการเข้าร่วมงาน"><div className={s.item}><button className={s.secondary} onClick={()=>setVersion(v=>v+1)}>อัปเดตรายงาน</button><button className={s.secondary} disabled={!record} onClick={()=>window.print()}>พิมพ์ / บันทึก PDF</button><button disabled={!record} onClick={exportCsv}>ส่งออก CSV</button></div></ScreenHeading>
    {error&&<p role="alert" className={s.error}>{error}</p>}
    {!data&&!error&&<p role="status">กำลังโหลดรายงาน…</p>}
    {stats&&record&&<>
      <div className={s.metrics}>{[["ลงทะเบียน",stats.registered,"คน"],["เช็กอินแล้ว",stats.checkedIn,"คน"],["Walk-in",record.walkin,"รวมอยู่ในยอดลงทะเบียน"],["อัตราเข้าร่วม",`${stats.registered?(100*stats.checkedIn/stats.registered).toFixed(1):"0.0"}%`,`${stats.checkedIn} จาก ${stats.registered} คน`]].map(([label,value,note])=><div className={s.metricCard} key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></div>)}</div>
      <div className={s.fields}><section className={s.panel}><h2>การเข้าร่วมงาน</h2><progress className={chart.progress} value={stats.checkedIn} max={Math.max(1,stats.registered)} aria-label="สัดส่วนเช็กอิน"/><p>เช็กอินแล้ว {stats.checkedIn} คน · รอเช็กอิน {stats.remaining} คน</p><Link href="/registration">ดูรายชื่อผู้เข้าร่วม →</Link></section><section className={s.panel}><h2>ผลแบบประเมิน</h2><p className={s.muted}>ดูคะแนน กราฟ และความคิดเห็นจากแท็บ Dashboard แบบประเมิน</p><Link href="/survey">จัดการคำถามแบบประเมิน →</Link></section></div>
      <section className={s.panel}><h2>จำนวนเช็กอินตามช่วงเวลา</h2><p className={s.muted}>เวลาไทย (ICT) · สรุปทุก 1 ชั่วโมง</p>{record.timeline.length?record.timeline.map(row=><div className={chart.chartRow} key={row.time}><div className={chart.barLabel}><span>{row.time}</span><span>{row.count} คน</span></div><progress className={chart.progress} value={row.count} max={Math.max(...record.timeline.map(t=>t.count),1)} aria-label={`เช็กอินช่วง ${row.time}`}/></div>):<p>ยังไม่มีประวัติเช็กอิน</p>}</section>
    </>}
  </div>;
}
