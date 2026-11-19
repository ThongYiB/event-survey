"use client";
import {useEffect,useState} from 'react';
import {useCloudManager} from './manager-context';
import {LinkQr} from '@/components/public/link-qr';
import ReportsPage from '@/app/(manager)/report';
import {CloudEventReport} from './event-report';
import s from '@/app/(manager)/manager.module.css';
export function CloudSurveyPublication(){
 const id=useCloudManager()?.data.event?.id;
 const [open,setOpen]=useState(false),[loaded,setLoaded]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{const c=new AbortController();void fetch('/api/manager/survey-publication',{cache:'no-store',signal:c.signal}).then(async r=>{const b=await r.json();if(!r.ok)throw new Error(b.message);return b;}).then(b=>{setOpen(b?.survey_open||false);setLoaded(true);}).catch(e=>{if(!c.signal.aborted)setMessage(e.message);});return()=>c.abort();},[id]);
 async function publish(){setBusy(true);setMessage('');try{const r=await fetch('/api/manager/survey-publication',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({open})});const b=await r.json();if(!r.ok)throw new Error(b.message);setMessage('เผยแพร่แบบประเมินแล้ว');}catch(e){setMessage(e instanceof Error?e.message:'เผยแพร่ไม่ได้');}finally{setBusy(false);}}
 return <section className={s.panel}><h2>QR แบบประเมิน</h2><p className={s.muted}>บันทึกคำถามในหน้าแบบสอบถามก่อน แล้วกดเผยแพร่ฉบับล่าสุด</p><label className={s.check}><input type="checkbox" checked={open} onChange={e=>setOpen(e.target.checked)}/>เปิดรับคำตอบ</label><button disabled={!loaded||busy} onClick={()=>void publish()}>{busy?'กำลังเผยแพร่…':'เผยแพร่แบบประเมิน'}</button>{message&&<p role="status">{message}</p>}{id&&loaded&&<LinkQr path={`/attendee/survey?event=${id}`} label="แบบประเมินหลังจบงาน" downloadName="event-survey-qr.png"/>}</section>;
}
export function CloudReports(){const [tab,setTab]=useState('attendance');return <div className={s.stack}><div className={s.item}><button className={tab==='attendance'?'':s.secondary} onClick={()=>setTab('attendance')}>การเข้าร่วมงาน</button><button className={tab==='survey'?'':s.secondary} onClick={()=>setTab('survey')}>Dashboard แบบประเมิน</button></div>{tab==='survey'?<ReportsPage/>:<CloudEventReport/>}</div>;}
