"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import s from "@/app/staff/staff.module.css";
import { Card, PageHeader } from "@/app/staff/_components/ui";

export function CloudStaffWorkspace() {
  const [data, setData] = useState<{ name: string; events: { id: string; name: string; status: string; details: { venue?: string; startDate?: string } }[] } | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/staff/cloud-events", { cache: "no-store", signal: controller.signal }).then(async (response) => { const result = await response.json(); if (!response.ok) throw new Error(result.message); return result; }).then((result) => { if (!controller.signal.aborted) setData(result); }).catch(() => { if (!controller.signal.aborted) setError("โหลดงานไม่ได้ กรุณาลองรีเฟรชอีกครั้ง"); });
    return () => controller.abort();
  }, []);
  return <div className={s.app}><header className={s.topbar}><div className={s.topRow}><span className={s.logo}>ES</span><span className={s.brand}>Event Survey</span><button className={s.signOut} onClick={async () => { const response = await fetch("/api/auth/sign-out", { method: "POST" }); if (response.ok) { router.replace("/login"); router.refresh(); } else setError("ออกจากระบบไม่ได้"); }}>ออกจากระบบ</button></div></header><main className={s.main}>
    <PageHeader eyebrow="STAFF / อีเวนต์" title="งานที่ได้รับมอบหมาย" subtitle={data ? `สวัสดี ${data.name}` : "กำลังโหลด…"} />
    {error && <p role="alert">{error}</p>}
    {data?.events.map((event) => <Card key={event.id} title={event.name}><p>{event.details.venue}</p><p>{event.details.startDate}</p></Card>)}
    {data && !data.events.length && <p>ยังไม่มีงานที่ได้รับมอบหมาย โปรดติดต่อ Event Manager</p>}
    <p>บัญชีและการมอบหมายงานเชื่อม Supabase แล้ว ส่วนสแกนเช็กอินและ Walk-in กำลังเชื่อมในขั้นถัดไป</p>
  </main></div>;
}
