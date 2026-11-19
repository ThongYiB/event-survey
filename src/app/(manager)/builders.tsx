"use client";

import { useState, type PointerEvent } from "react";
import { ScreenHeading } from "./shell";
import { useSaveSetting, useSaved } from "./store";
import Link from "next/link";
import { defaultSurveyFields } from "@/lib/public-event";
import styles from "./manager.module.css";

const registrationTypes = { text: "ข้อความสั้น", email: "อีเมล", tel: "โทรศัพท์" };
const surveyTypes = { radio: "เลือกข้อเดียว", checkbox: "เลือกหลายข้อ", text: "ข้อความสั้น", textarea: "ข้อความยาว" };

type Field = { id: string; label: string; type: string; help: string; required: boolean; options: string };

const registration: Field[] = [
  { id: "name", label: "ชื่อ-นามสกุล", type: "text", help: "", required: true, options: "" },
  { id: "email", label: "อีเมล", type: "email", help: "ใช้ยืนยันข้อมูลการลงทะเบียน", required: true, options: "" },
  { id: "phone", label: "โทรศัพท์", type: "tel", help: "", required: false, options: "" },
];
const survey: Field[] = defaultSurveyFields;

function isChoice(type: string) {
  return type === "radio" || type === "checkbox";
}

function optionsFor(field: Field) {
  return [...new Set(field.options.split("\n").map((item) => item.trim()).filter(Boolean))];
}

function PreviewField({ field }: { field: Field }) {
  const label = field.label || "ยังไม่ได้ตั้งชื่อ";
  if (isChoice(field.type)) {
    return (
      <fieldset>
        <legend>{label}{field.required ? " *" : ""}</legend>
        {optionsFor(field).map((item) => (
          <label className={styles.check} key={item}><input type={field.type} name={field.id} />{item}</label>
        ))}
        {field.help && <small>{field.help}</small>}
      </fieldset>
    );
  }
  return (
    <label>
      {label}{field.required ? " *" : ""}
      {field.type === "textarea" ? <textarea rows={3} /> : <input type={field.type} />}
      {field.help && <small>{field.help}</small>}
    </label>
  );
}

function Builder({ mode }: { mode: "form" | "survey" }) {
  const saveSetting = useSaveSetting();
  const isSurvey = mode === "survey";
  const noun = isSurvey ? "คำถาม" : "ฟิลด์";
  const types: Record<string, string> = isSurvey ? surveyTypes : registrationTypes;
  const saved = useSaved(mode, isSurvey ? survey : registration);
  const [draft, setDraft] = useState<Field[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ source: string; target: string } | null>(null);
  const [orderMessage, setOrderMessage] = useState("");
  const [feedback, setFeedback] = useState<{ text: string; error?: boolean }>();
  const fields = draft ?? saved;
  const selected = fields.find((item) => item.id === selectedId) ?? fields[0];

  function change(next: Field[]) {
    setDraft(next);
    setFeedback(undefined);
  }

  function update(update: Partial<Field>) {
    change(fields.map((item) => item.id === selected?.id ? { ...item, ...update } : item));
  }

  function add() {
    const id = crypto.randomUUID();
    change([...fields, { id, label: "", type: "text", help: "", required: false, options: "" }]);
    setSelectedId(id);
  }

  function move(source: string, target: string) {
    const from = fields.findIndex((field) => field.id === source);
    const to = fields.findIndex((field) => field.id === target);
    if (from < 0 || to < 0 || from === to) return;

    const reordered = [...fields];
    const [field] = reordered.splice(from, 1);
    reordered.splice(to, 0, field);
    change(reordered);
    setOrderMessage(`ย้าย ${field.label || noun + "ใหม่"} ไปลำดับที่ ${to + 1}`);
  }

  function rowAt(event: PointerEvent<HTMLSpanElement>) {
    return document.elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>("[data-builder-field-id]")?.dataset.builderFieldId;
  }

  async function save() {
    if (fields.some((item) => !item.label.trim() || (isChoice(item.type) && optionsFor(item).length < 2))) {
      setFeedback({ text: "กรอกชื่อทุกช่อง และระบุตัวเลือกอย่างน้อยสองข้อสำหรับคำถามแบบเลือก", error: true });
      return;
    }
    if (!await saveSetting(mode, fields)) {
      setFeedback({ text: "บันทึกไม่สำเร็จ กรุณาตรวจข้อความด้านบน", error: true });
      return;
    }
    setDraft(null);
    setFeedback({ text: "บันทึกแล้ว" });
  }

  return (
    <>
      <ScreenHeading title={isSurvey ? "แบบสอบถามหลังจบงาน" : "ฟอร์มลงทะเบียน"} description={`จัดการ${noun}และดูตัวอย่าง`}>
        <button onClick={save}>บันทึก{isSurvey ? "แบบสอบถาม" : "ฟอร์ม"}</button>
      </ScreenHeading>
      <p className={styles.muted}>{fields.length} {noun} · บังคับ {fields.filter((item) => item.required).length}</p>
      {isSurvey && <p className={styles.notice}>หลังบันทึกคำถาม <Link href="/qr-center">ไป QR Center เพื่อเผยแพร่ให้ผู้เข้าร่วมตอบ</Link></p>}
      {feedback && <p className={feedback.error ? styles.error : styles.notice} role={feedback.error ? "alert" : "status"}>{feedback.text}</p>}
      <div className={styles.builder}>
        <section className={styles.panel}>
          <h2>{noun}ใน{isSurvey ? "แบบสอบถาม" : "ฟอร์ม"}</h2>
          <button onClick={add}>＋ เพิ่ม{noun}</button>
          <p className={styles.muted}>ลากที่จุดจับ หรือใช้ลูกศรเพื่อย้ายลำดับ</p>
          <ol className={styles.fieldList}>
            {fields.map((item, index) => {
              const label = item.label || noun + "ใหม่";
              return (
                <li key={item.id} className={styles.fieldRow} data-builder-field-id={item.id}
                  data-drop-target={drag?.target === item.id && drag.source !== item.id}
                  data-dragging={drag?.source === item.id}>
                  <span className={styles.grip} aria-hidden="true"
                    onPointerDown={(event) => {
                      if (!event.isPrimary || event.button !== 0) return;
                      event.currentTarget.setPointerCapture(event.pointerId);
                      setDrag({ source: item.id, target: item.id });
                    }}
                    onPointerMove={(event) => {
                      if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
                      const target = rowAt(event) ?? item.id;
                      setDrag({ source: item.id, target });
                    }}
                    onPointerUp={(event) => {
                      if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
                      const target = rowAt(event);
                      if (target) move(item.id, target);
                      setDrag(null);
                    }}
                    onLostPointerCapture={() => setDrag(null)}>
                    ⠿
                  </span>
                  <button type="button" className={styles.fieldTitle} aria-pressed={selected?.id === item.id} onClick={() => setSelectedId(item.id)}>
                    <span className={styles.fieldNumber}>{index + 1}.</span>{label}
                  </button>
                  <div className={styles.fieldActions}>
                    <button type="button" className={styles.secondary} aria-label={`เลื่อนขึ้น: ${label}`} disabled={index === 0} onClick={() => move(item.id, fields[index - 1].id)}>↑</button>
                    <button type="button" className={styles.secondary} aria-label={`เลื่อนลง: ${label}`} disabled={index === fields.length - 1} onClick={() => move(item.id, fields[index + 1].id)}>↓</button>
                    <button type="button" className={styles.secondary} aria-label={`ลบ ${label}`} onClick={() => change(fields.filter((field) => field.id !== item.id))}>ลบ</button>
                  </div>
                </li>
              );
            })}
          </ol>
          <span className={styles.srOnly} role="status">{orderMessage}</span>
        </section>
        <section className={styles.panel}>
          <h2>แก้ไข{noun}</h2>
          {selected ? <>
            <label>{isSurvey ? "คำถาม" : "ป้ายกำกับ"}<input value={selected.label} onChange={(e) => update({ label: e.target.value })} /></label>
            <label>ประเภท<select value={selected.type} onChange={(e) => update({ type: e.target.value })}>
              {Object.entries(types).map(([id, title]) => <option key={id} value={id}>{title}</option>)}
            </select></label>
            {isChoice(selected.type) && <label>ตัวเลือกคำตอบ (หนึ่งข้อต่อบรรทัด)<textarea rows={4} value={selected.options} onChange={(e) => update({ options: e.target.value })} /></label>}
            <label>คำอธิบาย<input value={selected.help} onChange={(e) => update({ help: e.target.value })} /></label>
            <label className={styles.check}><input type="checkbox" checked={selected.required} onChange={(e) => update({ required: e.target.checked })} />บังคับตอบ</label>
          </> : <p>เพิ่ม{noun}เพื่อเริ่มแก้ไข</p>}
        </section>
        <section className={styles.panel}>
          <h2>ตัวอย่างสำหรับ Attendee</h2>
          {fields.map((field) => <PreviewField key={field.id} field={field} />)}
          {!fields.length && <p>ยังไม่มี{noun}</p>}
        </section>
      </div>
    </>
  );
}

export function RegistrationBuilder() {
  return <Builder mode="form" />;
}

export function SurveyBuilder() {
  return <Builder mode="survey" />;
}

