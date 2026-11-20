"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { SurveyField } from "@/lib/public-event";
import { ScreenHeading } from "./shell";
import styles from "./manager.module.css";
import reports from "./report.module.css";
import {useCloudManager} from '@/components/cloud/manager-context';
import {demoSurvey} from '@/lib/demo-data';
import {DemoLabel} from '@/components/cloud/demo-label';

type Results = { eventName: string; registered: number; checkedIn: number; responses: number; questions: { field: SurveyField; total: number; choices: Record<string, number>; texts: string[] }[] };
const percentage = (value: number, total: number) => total ? ((value / total) * 100).toFixed(1) : "0.0";

export default function ReportsPage() {
  const [liveData, setData] = useState<Results | null>(null);
  const preview=useCloudManager()?.data.preview;
  const demo=!!preview||liveData?.responses===0;
  const data=demo?demoSurvey:liveData;
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [version, setVersion] = useState(0);
  useEffect(()=>{const timer=setInterval(()=>{if(!document.hidden)setVersion(v=>v+1);},15000);return()=>clearInterval(timer);},[]);
  useEffect(() => {
    if(preview)return;
    const controller = new AbortController();
    void fetch("/api/manager/survey-results", { cache: "no-store", signal: controller.signal }).then(async (response) => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "โหลดรายงานไม่ได้");
      return result as Results;
    }).then((result) => { if (!controller.signal.aborted) { setData(result); setError(""); } }).catch((reason) => { if (!controller.signal.aborted) setError(reason.message || "โหลดรายงานไม่ได้"); });
    return () => controller.abort();
  }, [version,preview]);

  function exportCsv() {
    if (!data) return;
    const rows: (string | number)[][] = [
      ["ชนิดข้อมูล", demo ? "ข้อมูลจำลอง" : "ข้อมูลจริง"], ["อีเวนต์", data.eventName], ["ลงทะเบียน", data.registered], ["เช็กอิน", data.checkedIn], ["คำตอบทั้งหมด", data.responses],
      ["คำถาม", "ประเภท", "คำตอบ / ตัวเลือก", "จำนวนคำตอบ", "ร้อยละของผู้ตอบคำถามนี้"],
      ...data.questions.flatMap((question) => [
        ...Object.entries(question.choices).map(([label, count]) => [question.field.label, question.field.type, label, count, percentage(count, question.total)]),
        ...question.texts.map((text) => [question.field.label, question.field.type, text, "", ""]),
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/^[\s]*[=+@-]/, "'$&").replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "event-survey-report.csv"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000); setNotice("ส่งออกรายงานแล้ว");
  }

  const scores: Record<string, number> = { "ดีมาก": 4, "ดี": 3, "พอใช้": 2, "ควรปรับปรุง": 1 };
  const satisfaction = data?.questions.filter((question) => question.field.id === "satisfaction" && question.field.type === "radio" && Object.keys(question.choices).every((option) => scores[option])) || [];
  const scored = satisfaction.reduce((sum, question) => sum + question.total, 0);
  const points = satisfaction.reduce((sum, question) => sum + Object.entries(question.choices).reduce((total, [label, count]) => total + scores[label] * count, 0), 0);
  const positive = satisfaction.reduce((sum, question) => sum + (question.choices["ดีมาก"] || 0) + (question.choices["ดี"] || 0), 0);

  return <div className={`${styles.stack} ${reports.report}`}>
    <ScreenHeading title="รายงานผลอีเวนต์" description="ยอดเข้าร่วมและผลแบบสอบถามที่บันทึกในระบบ">
      <div className={styles.item}><button type="button" className={styles.secondary} onClick={() => setVersion((value) => value + 1)}>อัปเดตรายงาน</button><button type="button" className={styles.secondary} disabled={!data} onClick={() => window.print()}>พิมพ์ / บันทึก PDF</button><button type="button" disabled={!data} onClick={exportCsv}>ส่งออก CSV</button></div>
    </ScreenHeading>
    {error && <p role="alert" className={styles.error}>{error} · <Link href="/login">ไปหน้าเข้าสู่ระบบ</Link></p>}
    {!data && !error && <p role="status">กำลังโหลดรายงาน…</p>}
    {notice && <p role="status" className={styles.notice}>{notice}</p>}
    {demo&&<DemoLabel/>}
    {data && <>
      <p className={styles.notice}>{data.eventName} · {data.responses} คำตอบที่บันทึกแล้ว</p>
      <div className={styles.metrics}>{[
        ["ลงทะเบียน", data.registered, "คน"], ["เช็กอินแล้ว", data.checkedIn, "คน"], ["ตอบแบบสอบถาม", data.responses, "คำตอบ"], ["อัตราเข้าร่วม", `${percentage(data.checkedIn, data.registered)}%`, `${data.checkedIn} จาก ${data.registered} คน`],
      ].map(([label, value, help]) => <div key={label} className={styles.metricCard}><span>{label}</span><strong>{value}</strong><small>{help}</small></div>)}</div>
      <div className={styles.fields}>
        <section className={styles.panel}><h2>การเข้าร่วมงาน</h2><strong>{percentage(data.checkedIn, data.registered)}%</strong><progress className={reports.progress} value={data.checkedIn} max={Math.max(1, data.registered)} aria-label="สัดส่วนผู้เช็กอิน" /><p className={styles.muted}>เช็กอินแล้ว {data.checkedIn} คน · ยังไม่เช็กอิน {Math.max(0, data.registered - data.checkedIn)} คน</p></section>
        <section className={styles.panel}><h2>สรุปผลแบบประเมิน</h2><p>คะแนนเฉลี่ย <strong>{scored ? `${(points / scored).toFixed(2)} / 4` : "ยังไม่มีคะแนน"}</strong></p><p>พึงพอใจระดับดีและดีมาก <strong>{scored ? `${percentage(positive, scored)}%` : "—"}</strong></p><p>จำนวนคำตอบเทียบยอดเช็กอิน <strong>{percentage(data.responses, data.checkedIn)}%</strong></p><p className={styles.muted}>แบบสอบถามไม่ระบุตัวตนและเปิดให้ทุกคนตอบ ยอดคำตอบอาจมากกว่ายอดเช็กอิน</p></section>
      </div>
      {!data.responses && <section className={styles.panel}><h2>ยังไม่มีคำตอบแบบสอบถาม</h2><p className={styles.muted}>เมื่อผู้เข้าร่วมส่งคำตอบแล้ว กดอัปเดตรายงานเพื่อดูผล</p><Link href="/qr-center">เปิด QR แบบสอบถาม</Link></section>}
      <div className={styles.fields}>{data.questions.filter((question) => ["radio", "checkbox"].includes(question.field.type)).map((question, index) => <section key={`${question.field.id}-${index}`} className={styles.panel}>
        <h2>{question.field.label}</h2><p className={styles.muted}>{question.total} คำตอบ{question.field.type === "checkbox" ? " · เลือกได้หลายข้อ ร้อยละรวมอาจเกิน 100%" : " · เลือกข้อเดียว"}</p>
        {Object.entries(question.choices).map(([label, count]) => <div className={reports.chartRow} key={label}><div className={reports.barLabel}><span>{label}</span><span>{count} / {percentage(count, question.total)}%</span></div><progress className={reports.progress} value={count} max={Math.max(1, question.total)} aria-label={label} /></div>)}
      </section>)}</div>
      {data.questions.filter((question) => ["text", "textarea"].includes(question.field.type)).map((question, index) => <section key={`${question.field.id}-${index}`} className={styles.panel}><h2>{question.field.label}</h2><p className={styles.muted}>{question.total} คำตอบ · แสดงและส่งออกข้อความล่าสุดไม่เกิน 100 รายการต่อคำถาม</p><div className={reports.comments}>{question.texts.map((text, textIndex) => <blockquote key={textIndex}>{text}</blockquote>)}</div></section>)}
    </>}
  </div>;
}
