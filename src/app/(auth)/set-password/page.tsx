import type { Metadata } from "next";
import { AuthHeader } from "../auth-header";
import { PasswordForm } from "./password-form";
import styles from "../auth.module.css";

export const metadata: Metadata = { title: "ตั้งรหัสผ่านใหม่ | Event Survey" };

export default function SetPasswordPage() {
  return (
    <div className={styles.screen}>
      <AuthHeader firstLogin />
      <main className={styles.content}>
        <p className={styles.eyebrow}>เข้าสู่ระบบครั้งแรก</p>
        <h1>ตั้งรหัสผ่านใหม่</h1>
        <p className={styles.subtitle}>เปลี่ยนรหัสผ่านชั่วคราวเพื่อเริ่มใช้งานบัญชี</p>
        <PasswordForm />
      </main>
    </div>
  );
}

