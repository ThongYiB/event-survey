import { randomUUID } from "node:crypto";
import { defaultPublicEvent, defaultEventDetails, surveyOptions, type PublicEvent, type SurveyField } from "@/lib/public-event";
import { getDb, transaction } from "./staff/db";

// CREATE IF NOT EXISTS also supports a dev server whose existing database connection is reused.
function database() {
  const db = getDb();
  db.exec(`CREATE TABLE IF NOT EXISTS public_event_configuration (
    event_id TEXT PRIMARY KEY REFERENCES events(id), configuration TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS survey_responses (
    id TEXT PRIMARY KEY, event_id TEXT NOT NULL REFERENCES events(id),
    request_key TEXT NOT NULL UNIQUE, revision INTEGER NOT NULL,
    questions TEXT NOT NULL, answers TEXT NOT NULL, created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS survey_responses_event_idx ON survey_responses(event_id);`);
  return db;
}

export function getPublicEvent(): PublicEvent {
  const db = database();
  const row = db.prepare("SELECT configuration FROM public_event_configuration WHERE event_id = ?").get("CC26");
  const config: PublicEvent = row ? JSON.parse(String(row.configuration)) : structuredClone(defaultPublicEvent);
  const event = db.prepare("SELECT status FROM events WHERE id = ?").get(config.id);
  return { ...config, registrationOpen: config.registrationOpen && event?.status === "open" };
}

function validateConfiguration(value: unknown): Omit<PublicEvent, "revision"> | null {
  if (!value || typeof value !== "object") return null;
  const config = value as PublicEvent;
  if (typeof config.registrationOpen !== "boolean" || typeof config.surveyOpen !== "boolean" || !config.details || !Array.isArray(config.surveyFields) || config.surveyFields.length < 1 || config.surveyFields.length > 30) return null;
  const details = config.details;
  for (const key of ["name", "description", "venue", "startDate", "endDate", "startTime", "endTime", "color", "logo", "banner"] as const) {
    if (typeof details[key] !== "string") return null;
  }
  if (!details.name.trim() || details.name.length > 200 || !details.venue.trim() || details.venue.length > 300 || details.description.length > 5000 || !/^#[0-9a-f]{6}$/i.test(details.color)) return null;
  const date = /^\d{4}-\d{2}-\d{2}$/, time = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
  if (!date.test(details.startDate) || !date.test(details.endDate) || !time.test(details.startTime) || !time.test(details.endTime)) return null;
  const start = new Date(`${details.startDate}T${details.startTime}:00+07:00`).getTime();
  const end = new Date(`${details.endDate}T${details.endTime}:00+07:00`).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || new Date(`${details.startDate}T12:00:00+07:00`).toISOString().slice(0, 10) !== details.startDate || new Date(`${details.endDate}T12:00:00+07:00`).toISOString().slice(0, 10) !== details.endDate) return null;
  if ([details.logo, details.banner].some((image) => image && (image.length > 1500000 || !/^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(image)))) return null;
  const ids = new Set<string>();
  for (const field of config.surveyFields) {
    if (!field || typeof field.id !== "string" || !/^[\w-]{1,80}$/.test(field.id) || ids.has(field.id) || typeof field.label !== "string" || !field.label.trim() || field.label.length > 300 || typeof field.help !== "string" || field.help.length > 1000 || typeof field.required !== "boolean" || typeof field.options !== "string" || field.options.length > 8000 || !["radio", "checkbox", "text", "textarea"].includes(field.type)) return null;
    ids.add(field.id);
    if (["radio", "checkbox"].includes(field.type)) {
      const options = surveyOptions(field);
      if (options.length < 2 || options.length > 30 || options.some((option) => option.length > 250)) return null;
    }
  }
  const cleanDetails = Object.fromEntries(Object.keys(defaultEventDetails).map((key) => [key, details[key as keyof typeof defaultEventDetails]])) as typeof defaultEventDetails;
  return { id: "CC26", details: { ...cleanDetails, name: details.name.trim() }, registrationOpen: config.registrationOpen, surveyOpen: config.surveyOpen, surveyFields: config.surveyFields.map((field) => ({ id: field.id, label: field.label.trim(), help: field.help, required: field.required, options: field.options, type: field.type })) };
}

export function publishPublicEvent(value: unknown) {
  const clean = validateConfiguration(value);
  if (!clean) return { status: 400, message: "ตรวจสอบรายละเอียดงานและคำถาม ให้มีชื่อและตัวเลือกครบก่อนเผยแพร่" };
  const db = database();
  return transaction(db, () => {
    const old = getPublicEvent();
    const fingerprint = (fields: SurveyField[]) => JSON.stringify(fields.map((field) => [field.id, field.label, field.type, field.help, field.required, field.options]));
    const config = { ...clean, revision: old.revision + (fingerprint(old.surveyFields) !== fingerprint(clean.surveyFields) ? 1 : 0) };
    db.prepare("INSERT INTO public_event_configuration (event_id, configuration) VALUES (?, ?) ON CONFLICT(event_id) DO UPDATE SET configuration = excluded.configuration").run(config.id, JSON.stringify(config));
    db.prepare("UPDATE events SET name = ?, starts_at = ?, ends_at = ?, place = ? WHERE id = ?").run(config.details.name, `${config.details.startDate}T${config.details.startTime}:00+07:00`, `${config.details.endDate}T${config.details.endTime}:00+07:00`, config.details.venue, config.id);
    return { status: 200, configuration: config };
  });
}

export function submitSurvey(payload: unknown) {
  if (!payload || typeof payload !== "object") return { status: 400, message: "ข้อมูลคำตอบไม่ถูกต้อง" };
  const input = payload as { requestKey?: unknown; revision?: unknown; answers?: unknown };
  if (typeof input.requestKey !== "string" || !/^[a-f0-9]{32}$/.test(input.requestKey) || !input.answers || typeof input.answers !== "object" || Array.isArray(input.answers)) return { status: 400, message: "ข้อมูลคำตอบไม่ถูกต้อง" };
  const requestKey = input.requestKey;
  const db = database();
  return transaction(db, () => {
    const existing = db.prepare("SELECT id FROM survey_responses WHERE request_key = ?").get(requestKey);
    if (existing) return { status: 200, id: String(existing.id) };
    const config = getPublicEvent();
    if (!config.surveyOpen) return { status: 409, code: "survey-closed", message: "ปิดรับความคิดเห็นแล้ว" };
    if (input.revision !== config.revision) return { status: 409, code: "survey-updated", message: "แบบสอบถามมีการเปลี่ยนแปลง กรุณาโหลดคำถามล่าสุดแล้วตอบอีกครั้ง" };
    const answers = input.answers as Record<string, unknown>;
    const errors: Record<string, string> = Object.create(null);
    const clean: Record<string, string | string[]> = Object.create(null);
    for (const field of config.surveyFields) {
      const value = answers[field.id];
      if (field.type === "checkbox") {
        if (value !== undefined && (!Array.isArray(value) || value.some((item) => typeof item !== "string") || value.length > 30)) { errors[field.id] = "เลือกคำตอบจากตัวเลือกที่กำหนด"; continue; }
        const selected = [...new Set((value ?? []) as string[])];
        if (selected.some((item) => !surveyOptions(field).includes(item))) errors[field.id] = "เลือกคำตอบจากตัวเลือกที่กำหนด";
        else if (field.required && !selected.length) errors[field.id] = "กรุณาเลือกอย่างน้อย 1 ข้อ";
        else clean[field.id] = selected;
      } else {
        if (value !== undefined && typeof value !== "string") { errors[field.id] = "รูปแบบคำตอบไม่ถูกต้อง"; continue; }
        const text = typeof value === "string" ? value.trim() : "";
        if (field.required && !text) errors[field.id] = "กรุณาตอบคำถามนี้";
        else if (text.length > (field.type === "textarea" ? 3000 : 500)) errors[field.id] = "คำตอบยาวเกินกำหนด";
        else if (field.type === "radio" && text && !surveyOptions(field).includes(text)) errors[field.id] = "เลือกคำตอบจากตัวเลือกที่กำหนด";
        else clean[field.id] = text;
      }
    }
    if (Object.keys(errors).length) return { status: 400, message: "ตรวจสอบคำถามที่ยังตอบไม่ครบ", errors };
    const id = randomUUID();
    db.prepare("INSERT INTO survey_responses (id, event_id, request_key, revision, questions, answers, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").run(id, config.id, requestKey, config.revision, JSON.stringify(config.surveyFields), JSON.stringify(clean), new Date().toISOString());
    return { status: 201, id };
  });
}

export function getSurveyResults() {
  const db = database(), config = getPublicEvent();
  const rows = db.prepare("SELECT questions, answers FROM survey_responses WHERE event_id = ? ORDER BY created_at DESC").all(config.id);
  const questions = new Map<string, { field: SurveyField; total: number; choices: Record<string, number>; texts: string[] }>();
  for (const row of rows) {
    const fields: SurveyField[] = JSON.parse(String(row.questions));
    const answers: Record<string, string | string[]> = JSON.parse(String(row.answers));
    for (const field of fields) {
      const key = JSON.stringify([field.id, field.label, field.type, surveyOptions(field)]);
      const question = questions.get(key) ?? { field, total: 0, choices: Object.fromEntries(surveyOptions(field).map((option) => [option, 0])), texts: [] };
      const value = answers[field.id];
      if (Array.isArray(value)) { if (value.length) question.total++; for (const option of value) question.choices[option]++; }
      else if (value) { question.total++; if (field.type === "radio") question.choices[value]++; else if (question.texts.length < 100) question.texts.push(value); }
      questions.set(key, question);
    }
  }
  const stats = db.prepare(`SELECT (SELECT count(*) FROM attendees WHERE event_id = ?1) AS registered,
    (SELECT count(*) FROM checkins WHERE event_id = ?1) AS checked_in`).get(config.id)!;
  return { eventName: config.details.name, registered: Number(stats.registered), checkedIn: Number(stats.checked_in), responses: rows.length, questions: [...questions.values()] };
}
