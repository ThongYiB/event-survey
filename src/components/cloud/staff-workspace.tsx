"use client";
import { useCallback,useEffect,useState } from "react";
import { useRouter } from "next/navigation";
import type { EventStats,StaffEvent } from "@/lib/staff/types";
import { formatDateLong,formatTimeRange } from "@/lib/staff/format";
import { useStaff } from "@/app/staff/_lib/store";
import s from "@/app/staff/staff.module.css";
import {demoEvent,demoStats} from '@/lib/demo-data';
import {DemoLabel} from './demo-label';
import { Button,Card,Notice,PageHeader,Tag } from "@/app/staff/_components/ui";
import { AlertCircleIcon,InfoIcon,PinIcon,QrMiniIcon,ScanIcon } from "@/app/staff/_components/icons";

type Assigned=StaffEvent & {access:string[];stats:EventStats};
export function CloudStaffWorkspace() {
  const [data,setData]=useState<{name:string;events:Assigned[]}|null>(null);
  const [error,setError]=useState("");
  const [busy,setBusy]=useState("");
  const {refresh,clearResult}=useStaff();
  const router = useRouter();
  const demo=!!data&&!data.events.length;
  const events=demo?[{id:'demo-event',name:demoEvent.name,startsAt:`${demoEvent.details.startDate}T09:00:00+07:00`,endsAt:`${demoEvent.details.endDate}T16:00:00+07:00`,place:demoEvent.details.venue,status:'open' as const,capacity:100,permissions:'เช็กอิน · ค้นหาผู้ลงทะเบียน',access:['เช็กอิน','ค้นหาผู้ลงทะเบียน'],stats:demoStats}]:data?.events;
  const load=useCallback(async()=>{
    try {const response=await fetch("/api/staff/cloud-events",{cache:"no-store"});const body=await response.json();if(!response.ok)throw new Error(body.message);setData(body);setError("");}
    catch(error){setError(error instanceof Error?error.message:"โหลดงานไม่ได้");}
  },[]);
  useEffect(()=>{const timer=setTimeout(()=>void load(),0);return()=>clearTimeout(timer);},[load]);
  async function select(id:string,path:string) {
    if(id==='demo-event')return;
    setBusy(id);setError("");
    try {
      const response=await fetch("/api/staff/active-event",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});
      const body=await response.json();if(!response.ok)throw new Error(body.message);
      clearResult();await refresh();router.push(path);
    }catch(error){setError(error instanceof Error?error.message:"เลือกงานไม่ได้");}
    finally{setBusy("");}
  }
  return <>
    <PageHeader eyebrow="STAFF / เลือกอีเวนต์" title="งานที่ได้รับมอบหมาย" subtitle={data?`สวัสดี ${data.name} · บัญชี Staff`:"กำลังโหลดงานของคุณ…"}/>
    {error&&<Notice tone="bad" icon={<AlertCircleIcon/>} title="ดำเนินการไม่สำเร็จ">{error}<Button onClick={()=>void load()}>ลองอีกครั้ง</Button></Notice>}
    {demo&&<DemoLabel/>}
    {events?.map(event=><Card key={event.id} title="อีเวนต์ของคุณ">
      <Tag tone={event.status==="open"?"ok":"muted"}>{event.status==="open"?"เปิดรับเช็กอิน":event.status==="ended"?"สิ้นสุดแล้ว":"ฉบับร่าง"}</Tag>
      <h2 className={s.eventName}>{event.name}</h2>
      <p className={s.meta}>{formatDateLong(event.startsAt)} · {formatTimeRange(event.startsAt,event.endsAt)}</p>
      <p className={s.meta}><PinIcon size={15}/>{event.place}</p>
      <div className={s.spacer8}><Tag tone="ok">ได้รับมอบหมายแล้ว</Tag></div>
      <p className={s.body}>สิทธิ์: {event.permissions||"ยังไม่ได้กำหนดสิทธิ์"}</p>
      <div className={s.statRow}><span><b>เช็กอิน {event.stats.checkedIn}</b> / {event.stats.registered}</span><span className={s.muted}>รอเช็กอิน {event.stats.remaining}</span></div>
      <div className={s.bar} role="progressbar" aria-label={`ยอดเช็กอิน ${event.name}`} aria-valuenow={event.stats.checkedIn} aria-valuemin={0} aria-valuemax={event.stats.registered||1}><i style={{width:`${event.stats.registered?100*event.stats.checkedIn/event.stats.registered:0}%`}}/></div>
      <div className={s.stack}>
        {event.access.includes("เช็กอิน")&&<Button disabled={demo||!!busy||event.status!=="open"} onClick={()=>void select(event.id,"/staff/scan")}><ScanIcon/>{busy===event.id?"กำลังเปิดงาน…":"เข้าสู่หน้าสแกน QR"}</Button>}
        {event.access.includes("ค้นหาผู้ลงทะเบียน")&&<Button variant="ghost" disabled={demo||!!busy} onClick={()=>void select(event.id,"/staff/search")}>ค้นหาผู้ลงทะเบียน</Button>}
        {event.access.includes("แสดง QR แบบสอบถาม")&&<Button variant="ghost" disabled={demo||!!busy} onClick={()=>void select(event.id,"/staff/survey-qr")}><QrMiniIcon/>แสดง QR แบบประเมิน</Button>}
      </div>
    </Card>)}
    {data&&!data.events.length&&<Card title="ยังไม่มีงานที่ได้รับมอบหมาย"><p className={s.body}>ให้ Event Manager เพิ่มอีเมลบัญชีนี้ในหน้าทีมงาน แล้วกดโหลดใหม่</p><Button onClick={()=>void load()}>โหลดงานใหม่</Button></Card>}
    <Notice tone="info" icon={<InfoIcon/>} title="ก่อนเริ่มงาน">เลือกอีเวนต์ให้ถูกต้อง แล้วใช้ QR ส่วนบุคคลของผู้เข้าร่วม ไม่ใช่ QR ลงทะเบียนหรือ QR แบบสอบถาม</Notice>
  </>;
}
