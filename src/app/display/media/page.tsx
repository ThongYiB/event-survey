"use client";
import {Suspense,useEffect,useState} from 'react';
import {useSearchParams} from 'next/navigation';
import Link from 'next/link';
import {currentMedia,type KioskSettings} from '@/lib/kiosk';
import {DemoLabel} from '@/components/cloud/demo-label';
import {demoEvent} from '@/lib/demo-data';
function Player(){const params=useSearchParams(),id=params.get('event')||'',screen=params.get('screen')||'';
 const [data,setData]=useState<{name:string;settings:KioskSettings|null}|null>(null),[error,setError]=useState(''),[now,setNow]=useState(0);
 useEffect(()=>{if(!id)return;const c=new AbortController();let busy=false;async function load(){if(busy)return;busy=true;try{const r=await fetch(`/api/public/kiosk?event=${encodeURIComponent(id)}`,{cache:'no-store',signal:c.signal});const b=await r.json();if(!r.ok)throw new Error(b.message);setData(b);setError('');}catch(e){if(!c.signal.aborted){setData(null);setError(e instanceof Error?e.message:'โหลดจอไม่ได้');}}finally{busy=false;}}void load();const refresh=setInterval(()=>void load(),15000),clock=setInterval(()=>setNow(Date.now()),500);return()=>{c.abort();clearInterval(refresh);clearInterval(clock);};},[id]);
 const chosen=data?.settings?currentMedia(data.settings,now,screen):null;
 if(!id)return <main style={{minHeight:'100dvh',display:'grid',placeContent:'center',gap:24,background:'#007f82',color:'white',textAlign:'center'}}><DemoLabel/><h1>{demoEvent.name}</h1><p>ตัวอย่างโปสเตอร์ประชาสัมพันธ์</p><p>{demoEvent.details.venue}</p></main>;
 return <main style={{minHeight:'100dvh',background:'#061d22',color:'white',display:'grid',placeItems:'center',textAlign:'center'}}>{chosen?<>{chosen.media.type==='video'?<video key={chosen.media.id} src={chosen.media.src} autoPlay muted playsInline loop onLoadedMetadata={e=>{if(Number.isFinite(e.currentTarget.duration)&&e.currentTarget.duration>0)e.currentTarget.currentTime=chosen.offset%e.currentTarget.duration;}} style={{width:'100vw',height:'100dvh',objectFit:'contain'}}/>:<img src={chosen.media.src} alt={chosen.media.name} style={{width:'100vw',height:'100dvh',objectFit:'contain'}}/> /* eslint-disable-line @next/next/no-img-element */}</>:<section><h1>{data?.name||'จอประชาสัมพันธ์'}</h1><p role={error?'alert':'status'}>{error||(!data?'กำลังโหลดคิวสื่อ…':!screen?'เลือกจอที่ต้องการแสดง':!data.settings?.screens.includes(screen)?'จอนี้ยังไม่ได้รับมอบหมายสื่อ':'ยังไม่ถึงเวลาแสดงสื่อ หรือยังไม่มีคิวที่เผยแพร่')}</p>{data?.settings?.screens.map(s=><p key={s}><Link style={{color:'#65dce0'}} href={`/display/media?event=${id}&screen=${encodeURIComponent(s)}`}>{s}</Link></p>)}<Link style={{color:'#65dce0'}} href={`/display?event=${id}`}>แสดง QR สำหรับผู้เข้าร่วม</Link></section>}</main>;
}
export default function Page(){return <Suspense fallback={<p>กำลังโหลดจอ…</p>}><Player/></Suspense>;}
