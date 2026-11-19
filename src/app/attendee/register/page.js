"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveRegistration } from "../event";
import { usePublicEvent } from "@/components/public/use-public-event";
import { eventDateLabel } from "@/lib/public-event";
import { ClosedEvent, PublicLoadState } from "../event-state";
import { supabaseEnabled } from "@/lib/supabase/config";
import { CloudAttendeeRegistration } from "@/components/cloud/attendee-registration";

const faculties = [
  "คณะวิศวกรรมศาสตร์",
  "คณะวิทยาศาสตร์",
  "คณะบริหารธุรกิจ",
  "คณะมนุษยศาสตร์",
  "คณะศิลปกรรมศาสตร์",
  "อื่น ๆ",
];

const emptyForm = { name: "", email: "", phone: "", studentId: "", faculty: "" };

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = "กรุณากรอกชื่อ-นามสกุล";
  if (!form.email.trim()) errors.email = "กรุณากรอกอีเมล";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errors.email = "รูปแบบอีเมลไม่ถูกต้อง เช่น name@example.com";
  if (!form.phone.trim()) errors.phone = "กรุณากรอกเบอร์โทรศัพท์";
  else if (!/^0\d{9}$/.test(form.phone.replace(/-/g, "")))
    errors.phone = "เบอร์โทรต้องเป็นตัวเลข 10 หลัก ขึ้นต้นด้วย 0";
  if (form.studentId && !/^\d{8,10}$/.test(form.studentId))
    errors.studentId = "รหัสนักศึกษาต้องเป็นตัวเลข 8-10 หลัก";
  if (!form.faculty) errors.faculty = "กรุณาเลือกคณะ";
  return errors;
}

function Field({ label, required, error, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
      {error && <span className="block text-xs text-red-500">{error}</span>}
    </label>
  );
}

const inputClass = (hasError) =>
  `w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:ring-2 ${
    hasError
      ? "border-red-400 bg-red-50 focus:ring-red-200"
      : "border-black/10 bg-white focus:border-brand focus:ring-brand/20"
  }`;

function RegisterPage() {
  const { configuration, error: configError, refresh } = usePublicEvent();
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState("form"); // "form" | "confirm"
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const requestKey = useRef("");

  function update(field, value) {
    requestKey.current = "";
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function handleNext(e) {
    e.preventDefault();
    setSaveError("");
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length === 0) setStep("confirm");
  }

  async function handleConfirm() {
    setSaveError("");
    setSaving(true);
    try {
      requestKey.current ||= Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) =>
        byte.toString(16).padStart(2, "0"),
      ).join("");
      const response = await fetch("/api/attendee/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, requestKey: requestKey.current }),
      });
      const result = await response.json();
      if (result.code === "registration-closed") { router.replace("/attendee/registration-closed"); return; }
      if (!response.ok) {
        setSaveError(result.message ?? "ลงทะเบียนไม่สำเร็จ กรุณาลองอีกครั้ง");
        return;
      }
      try {
        saveRegistration({ ...form, ticketCode: result.ticketCode, registeredAt: result.registeredAt });
      } catch {
        setSaveError("ลงทะเบียนแล้ว แต่เบราว์เซอร์เปิดตั๋วไม่ได้ กรุณาอนุญาตการจัดเก็บข้อมูลแล้วกดยืนยันอีกครั้ง");
        return;
      }
      router.push("/attendee/ticket");
    } catch {
      setSaveError("เชื่อมต่อระบบลงทะเบียนไม่ได้ กรุณาลองอีกครั้ง");
    } finally {
      setSaving(false);
    }
  }

  if (!configuration) return <PublicLoadState error={configError} retry={refresh} />;
  if (!configuration.registrationOpen) return <ClosedEvent kind="registration" details={configuration.details} />;

  return (
    <main className="flex-1 space-y-4 px-4 py-5">
      <h1 className="text-xl font-bold">
        {step === "form" ? "ลงทะเบียนเข้าร่วมงาน" : "ตรวจสอบข้อมูลของคุณ"}
      </h1>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="font-semibold">{configuration.details.name}</p>
        <p className="text-xs text-muted">
          {eventDateLabel(configuration.details)}
        </p>
      </div>

      {step === "form" ? (
        <form onSubmit={handleNext} noValidate className="space-y-4 rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="font-semibold">ข้อมูลส่วนตัว</h2>

          <Field label="ชื่อ-นามสกุล" required error={errors.name}>
            <input
              className={inputClass(errors.name)}
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="เช่น สมชาย ใจดี"
            />
          </Field>

          <Field label="อีเมล" required error={errors.email}>
            <input
              type="email"
              className={inputClass(errors.email)}
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="name@example.com"
            />
          </Field>

          <Field label="เบอร์โทรศัพท์" required error={errors.phone}>
            <input
              type="tel"
              className={inputClass(errors.phone)}
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="0891234567"
            />
          </Field>

          <Field label="รหัสนักศึกษา (ถ้ามี)" error={errors.studentId}>
            <input
              inputMode="numeric"
              className={inputClass(errors.studentId)}
              value={form.studentId}
              onChange={(e) => update("studentId", e.target.value)}
              placeholder="68xxxxxx"
            />
          </Field>

          <Field label="คณะ" required error={errors.faculty}>
            <select
              className={inputClass(errors.faculty)}
              value={form.faculty}
              onChange={(e) => update("faculty", e.target.value)}
            >
              <option value="">-- เลือกคณะ --</option>
              {faculties.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </Field>

          <button
            type="submit"
            className="w-full rounded-xl bg-brand py-3 font-semibold text-white transition hover:bg-brand-dark"
          >
            ถัดไป: ตรวจสอบข้อมูล
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3 rounded-2xl bg-white p-4 text-sm shadow-sm">
            {[
              ["ชื่อ-นามสกุล", form.name],
              ["อีเมล", form.email],
              ["เบอร์โทรศัพท์", form.phone],
              ["รหัสนักศึกษา", form.studentId || "-"],
              ["คณะ", form.faculty],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs text-muted">{label}</p>
                <p className="font-medium">{value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-brand-light px-4 py-3 text-sm text-brand">
            กรุณาตรวจสอบข้อมูลให้ถูกต้อง หลังยืนยันแล้วระบบจะออก QR Code สำหรับเช็กอิน
          </div>

          {saveError && <p role="alert" className="text-sm text-red-700">{saveError}</p>}
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="w-full rounded-xl bg-brand py-3 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
          >
            {saving ? "กำลังลงทะเบียน…" : "✓ ยืนยันการลงทะเบียน"}
          </button>
          <button
            onClick={() => setStep("form")}
            disabled={saving}
            className="w-full py-2 text-sm font-medium text-brand"
          >
            แก้ไขข้อมูล
          </button>
        </div>
      )}
    </main>
  );
}

export default function Page() {
  return supabaseEnabled() ? <CloudAttendeeRegistration mode="register" /> : <RegisterPage />;
}

