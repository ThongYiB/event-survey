"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import styles from "../auth.module.css";
import { supabaseEnabled } from "@/lib/supabase/config";

export function PasswordForm() {
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [next, setNext] = useState("/details");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (form.get("password") !== form.get("confirmation")) {
      setError("รหัสผ่านทั้งสองช่องต้องตรงกัน");
      return;
    }
    if (supabaseEnabled()) {
      setSaving(true); setError("");
      try {
        const response = await fetch("/api/auth/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: form.get("password"), confirmation: form.get("confirmation") }) });
        const result = await response.json();
        if (!response.ok) { setError(result.message || "เปลี่ยนรหัสผ่านไม่สำเร็จ"); return; }
        setNext(result.next); setComplete(true);
      } catch { setError("เชื่อมต่อระบบไม่ได้ กรุณาลองอีกครั้ง"); }
      finally { setSaving(false); }
      return;
    }
    event.currentTarget.reset();
    setComplete(true);
  }

  if (complete) {
    return (
      <section className={styles.card} aria-label="ผลการทดลองตั้งรหัสผ่าน">
        <h2 role="status">{supabaseEnabled() ? "ตั้งรหัสผ่านใหม่สำเร็จ" : "ทดลองตั้งรหัสผ่านสำเร็จ"}</h2>
        <p>{supabaseEnabled() ? "ใช้รหัสผ่านใหม่สำหรับเข้าสู่ระบบครั้งถัดไปได้แล้ว" : "หน้านี้เป็นตัวอย่าง รหัสผ่านจะไม่ถูกบันทึก"}</p>
        <Link className={styles.returnLink} href={next}>ไปหน้าจัดการงาน</Link>
      </section>
    );
  }

  return (
    <form method="post" className={styles.card} onSubmit={submit}>
      <label className={styles.field}>
        รหัสผ่านใหม่ *
        <input type="password" name="password" autoComplete="new-password" placeholder="กรอกรหัสผ่านใหม่" minLength={8} required />
      </label>
      <label className={styles.field}>
        ยืนยันรหัสผ่านใหม่ *
        <input type="password" name="confirmation" autoComplete="new-password" placeholder="กรอกรหัสผ่านใหม่อีกครั้ง" minLength={8} required />
      </label>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <button type="submit" className={styles.save} disabled={saving}>{saving ? "กำลังบันทึก…" : "บันทึกรหัสผ่านและเข้าสู่ระบบ"}</button>
      <p>ใช้รหัสผ่านอย่างน้อย 8 ตัวอักษร</p>
    </form>
  );
}

