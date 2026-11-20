"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useRouter,usePathname } from "next/navigation";
import Link from "next/link";
import type { CloudManagerData } from "@/lib/cloud-manager";
import { CloudManagerContext } from "./manager-context";
import { ManagerShell } from "@/app/(manager)/shell";
import styles from "@/app/(manager)/manager.module.css";
import {demoEvent,demoTeam} from '@/lib/demo-data';
import {DemoLabel} from './demo-label';

export function CloudManagerProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<CloudManagerData | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [version, setVersion] = useState(0);
  const [creating,setCreating]=useState(false);
  const router = useRouter();
  const needsMedia=usePathname()==='/kiosk';
  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/manager/events${needsMedia?'?media=1':''}`, { cache: "no-store", signal: controller.signal }).then(async (response) => {
      const result = await response.json(); if (!response.ok) throw new Error(result.message); return result as CloudManagerData;
    }).then((result) => { if (!controller.signal.aborted) { setData(result); setError(""); } }).catch((reason) => { if (!controller.signal.aborted) setError(reason.message || "โหลดอีเวนต์ไม่ได้"); });
    return () => controller.abort();
  }, [version,needsMedia]);

  async function save(key: string, value: unknown) {
    if (busy || !data) return false;
    if(!data.event){setError('หน้านี้ใช้ข้อมูลจำลอง สร้างอีเวนต์จริงก่อนบันทึก');return false;}
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/manager/events", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key, value,media:needsMedia }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.message);
      setData(result); return true;
    } catch (reason) { setError(reason instanceof Error ? reason.message : "บันทึกไม่ได้"); return false; }
    finally { setBusy(false); }
  }

  async function select(id: string) {
    if(id==='demo-event')return true;
    if (busy || !data) return false;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/manager/active-event", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id,media:needsMedia }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.message);
      setData(result); return true;
    } catch (reason) { setError(reason instanceof Error ? reason.message : "เลือกอีเวนต์ไม่ได้"); return false; }
    finally { setBusy(false); }
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const values = new FormData(form);
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/manager/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: values.get("name") }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.message);
      form.reset(); setCreating(false); setVersion((value) => value + 1); router.push("/details");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "สร้างอีเวนต์ไม่ได้"); }
    finally { setBusy(false); }
  }

  const pending: CloudManagerData = { profile: { id: "", name: "" }, events: [], event: null, team: [] };
  const preview=!!data&&!data.events.length;
  const shown:CloudManagerData=data&&preview?{...data,preview:true,mediaLoaded:true,events:[demoEvent],event:demoEvent,team:demoTeam}:data??pending;
  return <CloudManagerContext.Provider value={{ data:shown, busy: busy || !data, save, select }}><ManagerShell>
    {!data && <section className={styles.panel}><p role={error ? "alert" : "status"}>{error || "กำลังโหลดอีเวนต์จาก Supabase…"}</p>{error && <><button onClick={() => setVersion((value) => value + 1)}>ลองอีกครั้ง</button><Link href="/login">ไปหน้าเข้าสู่ระบบ</Link></>}</section>}
    {data && <>
      <div className={styles.eventToolbar}>
        {data.event && <label>อีเวนต์ที่กำลังจัดการ<select value={data.event.id} disabled={busy} onChange={(event) => void select(event.target.value)}>{data.events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}</select></label>}
        <button disabled={busy} aria-expanded={creating} onClick={()=>setCreating(!creating)}>＋ สร้างอีเวนต์ใหม่</button>
      </div>
      {(creating||!data.event)&&<form className={styles.panel} onSubmit={create}><h2>สร้างอีเวนต์ใหม่</h2><label>ชื่ออีเวนต์<input name="name" required maxLength={200} placeholder="ระบุชื่ออีเวนต์" disabled={busy} autoFocus /></label><div className={styles.item}><button disabled={busy}>สร้างอีเวนต์</button>{data.event&&<button type="button" className={styles.secondary} onClick={()=>setCreating(false)}>ยกเลิก</button>}</div></form>}
      {error&&<p role="alert" className={styles.error}>{error}</p>}
    </>}
    {preview&&<DemoLabel/>}
    {needsMedia&&data?.event&&!data.mediaLoaded&&<p role="status">กำลังโหลดสื่อของอีเวนต์…</p>}
    {/* Keep Next's page slot mounted during loading and empty states. */}
    <div key={shown.event?.id || "empty"} hidden={!shown.event||(needsMedia&&!shown.mediaLoaded)}>{children}</div>
  </ManagerShell></CloudManagerContext.Provider>;
}
