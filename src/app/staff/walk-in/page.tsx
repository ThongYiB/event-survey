"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { ApiError } from "@/lib/staff/types";
import s from "../staff.module.css";
import { AlertCircleIcon } from "../_components/icons";
import { Button, ButtonLink, Notice, PageHeader } from "../_components/ui";
import WithSession from "../_components/WithSession";
import { StaffApiError } from "../_lib/api";
import { useStaff } from "../_lib/store";

type Fields = NonNullable<ApiError["fields"]>;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function WalkInPage() {
  const router = useRouter();
  const { registerWalkIn } = useStaff();
  const [form, setForm] = useState({ name: "", email: "", phone: "", verified: false });
  const [fields, setFields] = useState<Fields>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    // ตรวจเบื้องต้นฝั่งหน้าเว็บ (server ตรวจซ้ำอีกรอบ)
    const next: Fields = {};
    if (form.name.trim().split(/\s+/).length < 2) next.name = "กรอกชื่อและนามสกุล";
    if (!EMAIL_RE.test(form.email.trim())) next.email = "กรอกอีเมลให้ถูกรูปแบบ";
    if (!form.verified) next.verified = "ตรวจสอบข้อมูลกับผู้เข้าร่วมก่อนบันทึก";
    setFields(next);
    setFormError(null);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      const status = await registerWalkIn(form);
      router.push(`/staff/result/${status}`);
    } catch (err) {
      if (err instanceof StaffApiError) {
        setFields(err.body.fields ?? {});
        setFormError(err.body.message);
      } else {
        setFormError("บันทึกไม่สำเร็จ ลองอีกครั้ง");
      }
      setSaving(false);
    }
  }

  const set = (k: keyof typeof form) => (v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <WithSession>
      {({ event }) => (
        <>
          <PageHeader eyebrow="STAFF / ลงทะเบียนหน้างาน" title="ลงทะเบียน Walk-in" />
          <h2 className={s.sectionTitle}>{event.name}</h2>
          <p className={s.meta}>สำหรับผู้ที่ยังไม่ลงทะเบียน ตรวจสอบว่าไม่มีรายชื่อซ้ำก่อนบันทึก</p>

          <form className={`${s.card} ${s.spacer12}`} onSubmit={submit} noValidate>
            <h2 className={s.cardTitle}>ข้อมูลผู้เข้าร่วม</h2>

            <label className={s.label} htmlFor="wi-name">ชื่อ-นามสกุล *</label>
            <input
              id="wi-name"
              className={`${s.input} ${fields.name ? s.inputError : ""}`}
              value={form.name}
              onChange={(e) => set("name")(e.target.value)}
              placeholder="ปภาวี ใจดี"
              autoComplete="name"
              aria-invalid={!!fields.name}
              aria-describedby={fields.name ? "wi-name-err" : undefined}
            />
            {fields.name && <p id="wi-name-err" className={s.errorText}>{fields.name}</p>}

            <label className={s.label} htmlFor="wi-email">อีเมล *</label>
            <input
              id="wi-email"
              type="email"
              className={`${s.input} ${fields.email ? s.inputError : ""}`}
              value={form.email}
              onChange={(e) => set("email")(e.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
              aria-invalid={!!fields.email}
              aria-describedby="wi-email-help"
            />
            {fields.email ? (
              <p className={s.errorText}>{fields.email}</p>
            ) : (
              <p id="wi-email-help" className={s.helper}>ใช้ยืนยันข้อมูลการลงทะเบียน</p>
            )}

            <label className={s.label} htmlFor="wi-phone">โทรศัพท์ (ไม่บังคับ)</label>
            <input
              id="wi-phone"
              type="tel"
              className={s.input}
              value={form.phone}
              onChange={(e) => set("phone")(e.target.value)}
              placeholder="089-XXX-1234"
              autoComplete="tel"
            />

            <label className={`${s.checkbox} ${fields.verified ? s.checkboxError : ""}`}>
              <input
                type="checkbox"
                checked={form.verified}
                onChange={(e) => set("verified")(e.target.checked)}
              />
              <span>ตรวจสอบข้อมูลกับผู้เข้าร่วมแล้ว</span>
            </label>
            {fields.verified ? (
              <p className={s.errorText}>{fields.verified}</p>
            ) : (
              <p className={s.helper}>บันทึกข้อมูลและยืนยันเช็กอินโดย Staff ในขั้นตอนเดียว</p>
            )}

            <div className={s.stack}>
              <Button type="submit" disabled={saving}>
                {saving ? "กำลังบันทึก…" : "ลงทะเบียนและเช็กอิน"}
              </Button>
              <ButtonLink href="/staff/search" variant="ghost">
                กลับไปค้นหารายชื่อ
              </ButtonLink>
            </div>
          </form>

          {formError && (
            <Notice tone="bad" icon={<AlertCircleIcon />} title="บันทึกไม่สำเร็จ">
              {formError}
            </Notice>
          )}
        </>
      )}
    </WithSession>
  );
}
