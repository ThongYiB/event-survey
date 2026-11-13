import type { Metadata } from "next";
import Link from "next/link";
import { AuthHeader } from "../auth-header";
import { LoginForm } from "./login-form";
import styles from "../auth.module.css";

export const metadata: Metadata = { title: "เข้าสู่ระบบ | Event Survey" };

export default function LoginPage() {
  return (
    <div className={styles.screen}>
      <AuthHeader />
      <main className={styles.content}>
        <p className={styles.eyebrow}>EVENT SURVEY / เข้าสู่ระบบ</p>
        <h1>ยินดีต้อนรับกลับ</h1>
        <section className={styles.intro} aria-labelledby="login-heading">
          <h2 id="login-heading">เข้าสู่ระบบ Event Survey</h2>
          <p>ใช้อีเมลและรหัสผ่านบัญชีที่ผู้ดูแลสร้างให้</p>
          <span className={styles.badge}>System Admin · Manager · Staff</span>
        </section>
        <LoginForm />
        <p className={styles.footer}>
          <Link className={styles.attendeeLink} href="/attendee">ดูงานและลงทะเบียนสำหรับผู้เข้าร่วม</Link>
        </p>
      </main>
    </div>
  );
}

