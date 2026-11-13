"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import styles from "../auth.module.css";

export function PasswordForm() {
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (form.get("password") !== form.get("confirmation")) {
      setError("รหัสผ่านทั้งสองช่องต้องตรงกัน");
      return;
    }
    event.currentTarget.reset();
    setComplete(true);
  }

  if (complete) {
    return (
      <section className={styles.card} aria-label="ผลการทดลองตั้งรหัสผ่าน">
        <h2 role="status">ทดลองตั้งรหัสผ่านสำเร็จ</h2>
        <p>หน้านี้เป็นตัวอย่าง รหัสผ่านจะไม่ถูกบันทึก</p>
        <Link className={styles.returnLink} href="/login">กลับไปหน้าเข้าสู่ระบบ</Link>
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
      <button type="submit" className={styles.save}>บันทึกรหัสผ่านและเข้าสู่ระบบ</button>
      <p>ใช้รหัสผ่านตัวอย่างอย่างน้อย 8 ตัวอักษร</p>
    </form>
  );
}

