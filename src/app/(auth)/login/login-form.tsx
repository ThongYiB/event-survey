"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import styles from "../auth.module.css";

const demoEmail = "manager@example.com";
const demoPassword = "1234";
const demoAdminEmail = "admin@example.com";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email")).trim().toLowerCase();
    if (email === demoAdminEmail && form.get("password") === demoPassword) {
      router.push("/admin/accounts");
      return;
    }
    if (email !== demoEmail || form.get("password") !== demoPassword) {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      return;
    }
    router.push("/set-password");
  }

  return (
    <form method="post" className={styles.card} onSubmit={submit}>
      <h2>ข้อมูลเข้าสู่ระบบ</h2>
      <p>กรอกอีเมลและรหัสผ่านเพื่อเริ่มจัดการงาน</p>
      <label className={styles.field}>
        อีเมล *
        <input type="email" name="email" autoComplete="username" placeholder="name@example.com" required />
      </label>
      <label className={styles.field}>
        รหัสผ่าน *
        <input type="password" name="password" autoComplete="current-password" required />
      </label>
      <p>ลืมรหัสผ่าน? ติดต่อผู้ดูแลระบบ</p>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <button type="submit"><span aria-hidden="true">→</span> เข้าสู่ระบบ</button>
    </form>
  );
}

