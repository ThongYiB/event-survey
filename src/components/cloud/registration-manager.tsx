"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useCloudManager } from "./manager-context";
import { LinkQr } from "@/components/public/link-qr";
import { ScreenHeading } from "@/app/(manager)/shell";
import s from "@/app/(manager)/manager.module.css";
import {CloudSurveyPublication} from './survey-manager';

export function CloudRegistrationQr() {
  const cloud = useCloudManager();
  const id = cloud?.data.event?.id;
  const [publication, setPublication] = useState<{ registration_open: boolean; capacity: number; revision: number } | null>(null);
  const [open, setOpen] = useState(false);
  const [capacity, setCapacity] = useState(0);
  const [version, setVersion] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    void fetch("/api/manager/public-event", { signal: controller.signal, cache: "no-store" }).then(async (response) => {
      const data = await response.json(); if (!response.ok) throw new Error(data.message); return data;
    }).then((data) => { if (!controller.signal.aborted) { setPublication(data.publication); setOpen(data.publication?.registration_open ?? false); setCapacity(data.publication?.capacity ?? 0); setLoaded(true); } }).catch((error) => { if (!controller.signal.aborted) setError(error.message); });
    return () => controller.abort();
  }, [id, version]);
  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/manager/public-event", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ open, capacity }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.message);
      setVersion((v) => v + 1); setMessage("เผยแพร่รายละเอียด ฟอร์ม และสถานะลงทะเบียนแล้ว");
      if (id) void cloud?.select(id);
    } catch (error) { setError(error instanceof Error ? error.message : "เผยแพร่ไม่ได้"); }
    finally { setBusy(false); }
  }
  if (!id) return null;
  return <div className={s.stack}>
    <ScreenHeading title="QR Center" description="จัดการ QR และลิงก์สำหรับผู้เข้าร่วมงาน"><Link href={`/display?event=${id}`} target="_blank" rel="noreferrer" className={s.outlineLink}>เปิดจอประชาสัมพันธ์</Link></ScreenHeading>
    {error&&<p className={s.error} role="alert">{error}</p>}{message&&<p className={s.notice} role="status">{message}</p>}
    <form className={s.panel} onSubmit={publish}><h2>ตั้งค่าการรับลงทะเบียน</h2><p className={s.muted}>ผู้เข้าร่วมกรอกข้อมูลได้โดยไม่ต้องสร้างบัญชี</p><div className={s.fields}><label className={s.check}><input type="checkbox" checked={open} onChange={e=>setOpen(e.target.checked)}/>เปิดรับลงทะเบียน</label><label>จำนวนที่รับ (0 คือไม่จำกัด)<input type="number" min={0} max={100000} required value={capacity} onChange={e=>setCapacity(Number(e.target.value))}/></label></div><p className={s.muted}>บันทึกรายละเอียดงานและฟอร์มก่อน แล้วเผยแพร่เพื่อให้ผู้เข้าร่วมเห็นฉบับล่าสุด</p><div><button disabled={!loaded||busy}>{busy?"กำลังเผยแพร่…":"เผยแพร่การตั้งค่า"}</button></div></form>
    <div className={s.fields}>
      <section className={s.panel}><h2>QR ลงทะเบียน</h2>{publication?<><span className={`${s.badge} ${publication.registration_open?s.badgeOpen:s.badgeClosed}`}>{publication.registration_open?"เปิดรับลงทะเบียน":"ปิดรับลงทะเบียน"} · ฉบับที่ {publication.revision}</span><LinkQr path={`/attendee/register?event=${id}`} label="ลงทะเบียนเข้าร่วมงาน" downloadName="event-registration-qr.png"/><Link className={s.outlineLink} href={`/attendee?event=${id}`} target="_blank" rel="noreferrer">ดูหน้ารายละเอียดงาน</Link></>:<p className={s.notice}>{loaded?"งานนี้ยังไม่เผยแพร่ กดเผยแพร่การตั้งค่าเพื่อรับ QR":"กำลังโหลด QR…"}</p>}</section>
      <section className={s.panel}><h2>QR แบบประเมิน</h2><span className={`${s.badge} ${s.badgeDraft}`}>ตั้งค่าการเผยแพร่ด้านล่าง</span><p className={s.muted}>บันทึกคำถามจากเมนูแบบสอบถาม แล้วใช้ส่วนเผยแพร่ด้านล่างเพื่อเปิด–ปิดรับคำตอบ</p><Link className={s.outlineLink} href="/survey">จัดการคำถามแบบประเมิน</Link><h2>ติดตามผู้เข้าร่วม</h2><p className={s.muted}>Staff สแกน QR ส่วนบุคคลเพื่อเช็กอิน ตรวจยอดและรายชื่อได้จากหน้าผู้ลงทะเบียน</p><Link className={s.outlineLink} href="/registration">ดูรายชื่อและสถานะเช็กอิน</Link></section>
    </div>
    <CloudSurveyPublication/>
  </div>;
}

type Checkin={checked_at:string;via:string};
type RegistrationRow = { id: string; name: string; email: string; answers: Record<string, string>; form_fields: { id: string; label: string }[]; created_at: string;source:string;checkins:Checkin|Checkin[]|null };
const checkedIn=(row:RegistrationRow)=>Array.isArray(row.checkins)?row.checkins[0]:row.checkins;
export function CloudRegistrationList() {
  const id = useCloudManager()?.data.event?.id;
  const [data, setData] = useState<{ rows: RegistrationRow[]; total: number }>();
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [version, setVersion] = useState(0);
  const [selected, setSelected] = useState<RegistrationRow | null>(null);
  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    void fetch(`/api/manager/registrations?event=${id}&page=${page}&q=${encodeURIComponent(search)}`, { signal: controller.signal, cache: "no-store" }).then(async (response) => {
      const value = await response.json(); if (!response.ok) throw new Error(value.message); return value;
    }).then((value) => { if (!controller.signal.aborted) { setData(value); setError(""); } }).catch((error) => { if (!controller.signal.aborted) setError(error.message); });
    return () => controller.abort();
  }, [id, search, page, version]);
  return <div className={s.stack}>
    <ScreenHeading title="ผู้ลงทะเบียน" description="รายชื่อและสถานะเช็กอินของผู้เข้าร่วมงาน"><div className={s.item}><button onClick={() => setVersion(v => v+1)}>อัปเดตรายชื่อ</button><Link className={s.outlineLink} href="/qr-center">QR ลงทะเบียน</Link></div></ScreenHeading>
    {error&&<p className={s.error} role="alert">{error}</p>}
    <section className={s.panel}><h2>ผู้ลงทะเบียน {data?.total??"…"} คน</h2>
      <form className={s.item} onSubmit={e=>{e.preventDefault();setSearch(query);setPage(0);}}><label>ค้นหาชื่อหรืออีเมล<input type="search" value={query} maxLength={100} onChange={e=>setQuery(e.target.value)} placeholder="ชื่อ / name@example.com"/></label><button>ค้นหา</button></form>
      <div className={s.scroll}><table><thead><tr><th>ชื่อ-นามสกุล / อีเมล</th><th>ช่องทาง</th><th>เวลาลงทะเบียน</th><th>สถานะเช็กอิน</th><th>จัดการ</th></tr></thead><tbody>{data?.rows.map(row=><tr key={row.id}><td><strong>{row.name}</strong><small>{row.email}</small></td><td>{row.source==="walkin"?"Walk-in":"ลงทะเบียนล่วงหน้า"}</td><td>{new Date(row.created_at).toLocaleString("th-TH",{timeZone:"Asia/Bangkok"})}</td><td><span className={`${s.badge} ${checkedIn(row)?s.badgeOpen:s.badgeDraft}`}>{checkedIn(row)?"เช็กอินแล้ว":"รอเช็กอิน"}</span></td><td><button className={s.secondary} onClick={()=>setSelected(row)}>ดูข้อมูล</button></td></tr>)}{data&&!data.rows.length&&<tr><td colSpan={5}>ยังไม่มีรายชื่อที่ตรงกับเงื่อนไข</td></tr>}</tbody></table></div>
      <div className={s.heading}><p className={s.muted}>แสดงครั้งละ 25 รายชื่อ</p><div className={s.item}><button className={s.secondary} disabled={!page} onClick={()=>setPage(page-1)}>ก่อนหน้า</button><span>หน้า {page+1}</span><button className={s.secondary} disabled={!data||(page+1)*25>=data.total} onClick={()=>setPage(page+1)}>ถัดไป</button></div></div>
    </section>
    {selected&&<section className={s.panel}><div className={s.heading}><h2>{selected.name}</h2><button className={s.secondary} onClick={()=>setSelected(null)}>ปิดข้อมูล</button></div>{Object.entries(selected.answers).map(([key,value])=><p key={key}><strong>{selected.form_fields.find(field=>field.id===key)?.label||"ข้อมูลเพิ่มเติม"}</strong>: {value||"—"}</p>)}<p>เช็กอิน: {checkedIn(selected)?new Date(checkedIn(selected)!.checked_at).toLocaleString("th-TH",{timeZone:"Asia/Bangkok"}):"ยังไม่เช็กอิน"}</p></section>}
  </div>;
}
