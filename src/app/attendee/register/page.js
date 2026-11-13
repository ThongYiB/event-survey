"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { event, saveRegistration, generateTicketCode } from "../event";

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

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState("form"); // "form" | "confirm"
  const [saveError, setSaveError] = useState("");

  function update(field, value) {
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

  function handleConfirm() {
    try {
      saveRegistration({
        ...form,
        ticketCode: generateTicketCode(),
        registeredAt: new Date().toISOString(),
      });
    } catch {
      setSaveError("บันทึกการลงทะเบียนไม่ได้ กรุณาตรวจสอบว่าเบราว์เซอร์อนุญาตให้จัดเก็บข้อมูล");
      return;
    }
    router.push("/attendee/ticket");
  }

  return (
    <main className="flex-1 space-y-4 px-4 py-5">
      <h1 className="text-xl font-bold">
        {step === "form" ? "ลงทะเบียนเข้าร่วมงาน" : "ตรวจสอบข้อมูลของคุณ"}
      </h1>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="font-semibold">{event.name}</p>
        <p className="text-xs text-muted">
          {event.date} • {event.time}
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
            className="w-full rounded-xl bg-brand py-3 font-semibold text-white transition hover:bg-brand-dark"
          >
            ✓ ยืนยันการลงทะเบียน
          </button>
          <button
            onClick={() => setStep("form")}
            className="w-full py-2 text-sm font-medium text-brand"
          >
            แก้ไขข้อมูล
          </button>
        </div>
      )}
    </main>
  );
}

