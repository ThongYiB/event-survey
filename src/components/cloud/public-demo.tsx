"use client";
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {useState} from 'react';
import {demoEvent} from '@/lib/demo-data';
import {defaultSurveyFields,surveyOptions,eventDateLabel} from '@/lib/public-event';
import {DemoLabel} from './demo-label';
import s from '@/app/attendee/feedback.module.css';
import f from './registration.module.css';
export function PublicDemo({mode}:{mode:string}){
 const router=useRouter(),[confirm,setConfirm]=useState(false);
 const href=(path:string)=>`${path}?demo=1`;
 return <main className={s.page}><DemoLabel/>
 {mode==='event'&&<><h1>{demoEvent.name}</h1><section className={s.panel}><h2>รายละเอียดอีเวนต์</h2><p>{demoEvent.details.description}</p><p>{eventDateLabel(demoEvent.details)}</p><p>{demoEvent.details.venue}</p></section><Link className={s.primary} href={href('/attendee/register')}>ดูฟอร์มลงทะเบียนตัวอย่าง</Link></>}
 {mode==='register'&&<><h1>{confirm?'ตรวจสอบข้อมูลตัวอย่าง':'ลงทะเบียนเข้าร่วมงาน'}</h1><h2>{demoEvent.name}</h2><form className={s.panel} onSubmit={e=>{e.preventDefault();if(confirm)router.push(href('/attendee/ticket'));else setConfirm(true);}}>{[['ชื่อ-นามสกุล','ปภาวี ตัวอย่าง'],['อีเมล','guest@example.test'],['โทรศัพท์','0890000000']].map(([label,value])=><label key={label} className={f.field}>{label}<input defaultValue={value} readOnly={confirm}/></label>)}<button className={s.primary}>{confirm?'ดูบัตรตัวอย่าง':'ตรวจสอบข้อมูล'}</button></form></>}
 {mode==='ticket'&&<><h1>บัตรเข้าร่วมงานตัวอย่าง</h1><section className={`${s.panel} ${s.hero}`}><h2>{demoEvent.name}</h2><div style={{height:220,width:220,display:'grid',placeItems:'center',border:'2px dashed #00838a',color:'#00838a',fontSize:26}}>QR ตัวอย่าง</div><strong>ปภาวี ตัวอย่าง</strong><p>ตัวอย่างตำแหน่ง QR ส่วนบุคคล</p></section><Link className={s.primary} href={href('/attendee/survey')}>ดูแบบประเมินตัวอย่าง</Link></>}
 {mode==='survey'&&<><h1>แบ่งปันประสบการณ์</h1><h2>{demoEvent.name}</h2><form className={s.form} onSubmit={e=>{e.preventDefault();router.push(href('/attendee/survey/thanks'));}}>{defaultSurveyFields.map(field=><fieldset key={field.id} className={s.question}><legend>{field.label}</legend>{['radio','checkbox'].includes(field.type)?surveyOptions(field).map((option,i)=><label className={s.option} key={option}><input name={field.id} type={field.type} defaultChecked={i===0}/>{option}</label>):<textarea aria-label={field.label} rows={3} defaultValue="กิจกรรมน่าสนใจและทีมงานดูแลดี"/>}</fieldset>)}<button className={s.primary}>ดูหน้าขอบคุณตัวอย่าง</button></form></>}
 {mode==='thanks'&&<><h1>ขอบคุณสำหรับความคิดเห็น</h1><div className={s.success}>ตัวอย่างหน้าหลังส่งแบบประเมิน</div><section className={s.panel}><h2>ทุกความคิดเห็นมีความหมาย</h2><p>{demoEvent.name}</p></section></>}
 {mode==='closed'&&<><h1>ปิดรับความคิดเห็นแล้ว</h1><section className={s.panel}><h2>{demoEvent.name}</h2><p>ตัวอย่างเมื่อสิ้นสุดช่วงรับแบบประเมิน</p><button className={s.primary} disabled>ปิดรับแบบประเมิน</button></section></>}
 <Link className={s.secondary} href={href('/attendee')}>กลับรายละเอียดงานตัวอย่าง</Link>
 </main>;
}
