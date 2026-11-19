"use client";
import {useState} from 'react';
import {useCloudManager} from './manager-context';
import {LinkQr} from '@/components/public/link-qr';
import s from '@/app/(manager)/manager.module.css';
export function StaffInvite(){const cloud=useCloudManager(),[path,setPath]=useState(''),[expires,setExpires]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);if(!cloud)return null;
 async function create(){setBusy(true);setError('');try{const r=await fetch('/api/manager/staff-invite',{method:'POST'}),b=await r.json();if(!r.ok)throw new Error(b.message);setPath(b.path);setExpires(b.expires);}catch(e){setError(e instanceof Error?e.message:'สร้างคำเชิญไม่ได้');}finally{setBusy(false);}}
 return <section className={s.panel}><h2>สมัคร Staff ผ่าน QR</h2><p className={s.muted}>ผู้สมัครยืนยันอีเมลและขอเข้าร่วมทีม จากนั้นกำหนดสิทธิ์จากรายชื่อด้านล่าง ก่อน Staff ดูรายชื่อหรือเช็กอินได้</p><div className={s.item}><button disabled={busy} onClick={()=>void create()}>{path?'ออกคำเชิญใหม่ (ยกเลิก QR เดิม)':'สร้าง QR สมัคร Staff'}</button><button className={s.secondary} disabled={cloud.busy} onClick={()=>cloud.data.event&&void cloud.select(cloud.data.event.id)}>อัปเดตคำขอสมัคร</button></div>{error&&<p role="alert" className={s.error}>{error}</p>}{path&&<><p>คำเชิญหมดอายุ {new Date(expires).toLocaleString('th-TH',{timeZone:'Asia/Bangkok'})}</p><LinkQr path={path} label="สมัครทีมงานอีเวนต์" downloadName="staff-invite.png"/></>}</section>;
}
