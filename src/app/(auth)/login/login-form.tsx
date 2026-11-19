"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import styles from "../auth.module.css";
import { supabaseEnabled } from "@/lib/supabase/config";

const demoEmail = "manager@example.com";
const demoPassword = "1234";
const demoAdminEmail = "admin@example.com";
const demoStaffEmail = "staff@example.com";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email")).trim().toLowerCase();
    if (supabaseEnabled()) {
      setLoading(true);
      try {
        const response = await fetch("/api/auth/sign-in", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: form.get("password") }) });
        const result = await response.json();
        if (!response.ok) { setError(result.message || "เข้าสู่ระบบไม่สำเร็จ"); return; }
        // Start the authenticated page once, after the browser has stored the cookies.
        window.location.replace(result.next);
      } catch { setError("เชื่อมต่อระบบไม่ได้ กรุณาลองอีกครั้ง"); }
      finally { setLoading(false); }
      return;
    }
    if (email === demoStaffEmail) {
      setLoading(true);
      try {
        const response = await fetch("/api/staff/sign-in", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: form.get("password") }),
        });
        if (response.ok) {
          router.push("/staff");
          return;
        }
        const data = await response.json();
        setError(data.message ?? "เข้าสู่ระบบ Staff ไม่สำเร็จ");
      } catch {
        setError("เชื่อมต่อระบบ Staff ไม่ได้ กรุณาลองอีกครั้ง");
      } finally {
        setLoading(false);
      }
      return;
    }
    if (email === demoAdminEmail && form.get("password") === demoPassword) {
      router.push("/admin/accounts");
      return;
    }
    if (email !== demoEmail) {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/manager/sign-in", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: form.get("password") }) });
      if (!response.ok) { const result = await response.json(); setError(result.message || "เข้าสู่ระบบไม่สำเร็จ"); return; }
      router.push("/set-password");
    } catch { setError("เชื่อมต่อระบบไม่ได้ กรุณาลองอีกครั้ง"); }
    finally { setLoading(false); }
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
      <button type="submit" disabled={loading}><span aria-hidden="true">→</span> {loading ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}</button>
    </form>
  );
}

