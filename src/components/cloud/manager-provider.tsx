"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { CloudManagerData } from "@/lib/cloud-manager";
import { CloudManagerContext } from "./manager-context";
import { ManagerShell } from "@/app/(manager)/shell";
import styles from "@/app/(manager)/manager.module.css";

export function CloudManagerProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<CloudManagerData | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [version, setVersion] = useState(0);
  const router = useRouter();
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/manager/events", { cache: "no-store", signal: controller.signal }).then(async (response) => {
      const result = await response.json(); if (!response.ok) throw new Error(result.message); return result as CloudManagerData;
    }).then((result) => { if (!controller.signal.aborted) { setData(result); setError(""); } }).catch((reason) => { if (!controller.signal.aborted) setError(reason.message || "โหลดอีเวนต์ไม่ได้"); });
    return () => controller.abort();
  }, [version]);

  async function save(key: string, value: unknown) {
    if (busy) return false;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/manager/events", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key, value }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.message);
      setData(result); return true;
    } catch (reason) { setError(reason instanceof Error ? reason.message : "บันทึกไม่ได้"); return false; }
    finally { setBusy(false); }
  }

  async function select(id: string) {
    if (busy) return false;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/manager/active-event", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
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
      form.reset(); setVersion((value) => value + 1); router.push("/details");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "สร้างอีเวนต์ไม่ได้"); }
    finally { setBusy(false); }
  }

  if (!data) return <div className={styles.content}><p role={error ? "alert" : "status"}>{error || "กำลังโหลดอีเวนต์จาก Supabase…"}</p>{error && <><button onClick={() => setVersion((value) => value + 1)}>ลองอีกครั้ง</button><Link href="/login">ไปหน้าเข้าสู่ระบบ</Link></>}</div>;
  return <CloudManagerContext.Provider value={{ data, busy, save, select }}>
    <div className={styles.content}>
      <section className={styles.panel}>
        {data.event && <label>อีเวนต์ที่กำลังจัดการ<select value={data.event.id} disabled={busy} onChange={(event) => void select(event.target.value)}>{data.events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}</select></label>}
        <form className={styles.item} onSubmit={create}><label>สร้างอีเวนต์ใหม่<input name="name" required maxLength={200} placeholder="ชื่ออีเวนต์" disabled={busy} /></label><button disabled={busy}>＋ สร้างอีเวนต์</button></form>
        {error && <p role="alert" className={styles.error}>{error}</p>}
      </section>
    </div>
    <div key={data.event?.id || "empty"}>{data.event ? children : <ManagerShell><h1>ยังไม่มีอีเวนต์</h1><p>สร้างอีเวนต์แรกจากแบบฟอร์มด้านบนได้เลย</p></ManagerShell>}</div>
  </CloudManagerContext.Provider>;
}
