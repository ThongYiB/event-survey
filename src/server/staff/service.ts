// Logic หลักของระบบเช็กอิน (ฝั่ง server)
// API route ทุกตัวเรียกฟังก์ชันในไฟล์นี้ ถ้าจะย้ายไปฐานข้อมูลอื่น ให้แก้แค่ไฟล์นี้กับ db.ts

import { randomBytes } from "node:crypto";
import { getPublicEvent } from "../public-event";
import { getDb, transaction } from "./db";
import { parseAttendeeCode } from "@/lib/staff/qr";
import type {
  Attendee,
  CheckInResult,
  CheckInVia,
  EventStats,
  StaffEvent,
  StaffSession,
  StaffUser,
  WalkInInput,
  ApiError,
} from "@/lib/staff/types";

type SQLValue = null | number | bigint | string | Uint8Array;
type Row = Record<string, SQLValue>;

/** อีเวนต์ที่ Staff กำลังดูแล — ตอนนี้กำหนดผ่าน env STAFF_EVENT_ID (ค่าเริ่มต้น CC26) */
export function getCurrentEventId() {
  return process.env.STAFF_EVENT_ID ?? "CC26";
}

/**
 * Staff ที่ล็อกอินอยู่
 * TODO(auth): ยังไม่มีระบบล็อกอิน — ต่อระบบ auth แล้วคืนค่าผู้ใช้จริงจากตรงนี้
 * และตรวจสิทธิ์ว่า Staff คนนี้ได้รับมอบหมายงาน getCurrentEventId() หรือไม่
 */
export function getCurrentStaff(): StaffUser {
  return { name: "ธนกฤต", accountLabel: "บัญชี Staff สมมติ" };
}

// ---------- mapping ----------

const str = (v: SQLValue) => (v == null ? "" : String(v));

function toEvent(r: Row): StaffEvent {
  return {
    id: str(r.id),
    name: str(r.name),
    startsAt: str(r.starts_at),
    endsAt: str(r.ends_at),
    place: str(r.place),
    status: str(r.status) as StaffEvent["status"],
    capacity: Number(r.capacity),
    permissions: str(r.permissions),
  };
}

function toAttendee(r: Row): Attendee {
  return {
    code: str(r.code),
    eventId: str(r.event_id),
    firstName: str(r.first_name),
    lastName: str(r.last_name),
    email: str(r.email),
    phone: r.phone == null ? null : str(r.phone),
    ticketType: str(r.ticket_type),
    source: str(r.source) as Attendee["source"],
    checkIn: r.checked_in_at
      ? { at: str(r.checked_in_at), by: str(r.checked_in_by), via: str(r.via) as CheckInVia }
      : null,
  };
}

const ATTENDEE_SELECT = `
  SELECT a.*, c.checked_in_at, c.checked_in_by, c.via
  FROM attendees a LEFT JOIN checkins c ON c.attendee_code = a.code`;

// ---------- queries ----------

export function getEvent(id: string): StaffEvent | null {
  const row = getDb().prepare("SELECT * FROM events WHERE id = ?").get(id);
  return row ? toEvent(row) : null;
}

function requireCurrentEvent(): StaffEvent {
  const event = getEvent(getCurrentEventId());
  if (!event) throw new Error(`ไม่พบอีเวนต์ ${getCurrentEventId()} ในฐานข้อมูล`);
  return event;
}

export function getStats(eventId: string): EventStats {
  const db = getDb();
  const registered = Number(db.prepare("SELECT COUNT(*) AS n FROM attendees WHERE event_id = ?").get(eventId)?.n ?? 0);
  const checkedIn = Number(db.prepare("SELECT COUNT(*) AS n FROM checkins WHERE event_id = ?").get(eventId)?.n ?? 0);
  return { registered, checkedIn, remaining: Math.max(0, registered - checkedIn) };
}

export function getAttendee(code: string): Attendee | null {
  const row = getDb().prepare(`${ATTENDEE_SELECT} WHERE a.code = ?`).get(code);
  return row ? toAttendee(row) : null;
}

export function getStaffSession(): StaffSession {
  const event = requireCurrentEvent();
  return { staff: getCurrentStaff(), event, stats: getStats(event.id) };
}

/** ค้นหาด้วยชื่อ นามสกุล อีเมล เบอร์โทร หรือรหัส (ไม่สนช่องว่างและขีด) */
export function searchAttendees(eventId: string, query: string, limit = 20): Attendee[] {
  const q = query.toLowerCase().replace(/[\s-]/g, "");
  if (!q) return [];
  const like = `%${q.replace(/[%_\\]/g, (m) => `\\${m}`)}%`;
  // ?1 = eventId, ?2 = คำค้น, ?3 = จำนวนสูงสุด
  const rows = getDb()
    .prepare(
      `${ATTENDEE_SELECT}
       WHERE a.event_id = ?1
         AND (
           lower(a.first_name || a.last_name) LIKE ?2 ESCAPE '\\'
           OR replace(lower(a.email), '-', '') LIKE ?2 ESCAPE '\\'
           OR replace(lower(coalesce(a.phone, '')), '-', '') LIKE ?2 ESCAPE '\\'
           OR replace(lower(a.code), '-', '') LIKE ?2 ESCAPE '\\'
         )
       ORDER BY (c.id IS NOT NULL), a.first_name
       LIMIT ?3`,
    )
    .all(eventId, like, limit);
  return rows.map(toAttendee);
}

// ---------- commands ----------

/** เช็กอินจากข้อความใน QR หรือรหัสผู้เข้าร่วม */
export function checkIn(rawCode: string, via: CheckInVia): CheckInResult | ApiError {
  const code = parseAttendeeCode(rawCode);
  if (!code) return { error: "invalid-code", message: "QR นี้ไม่ใช่ QR ส่วนบุคคลของผู้เข้าร่วม" };

  const db = getDb();
  const event = requireCurrentEvent();
  const staff = getCurrentStaff();

  const status = transaction(db, () => {
    const attendee = getAttendee(code);
    if (!attendee) return "not-found" as const;
    if (attendee.eventId !== event.id) return "wrong-event" as const;
    if (attendee.checkIn) return "duplicate" as const;
    db.prepare(
      "INSERT INTO checkins (attendee_code, event_id, checked_in_at, checked_in_by, via) VALUES (?, ?, ?, ?, ?)",
    ).run(code, event.id, new Date().toISOString(), staff.name, via);
    return "success" as const;
  });

  const attendee = getAttendee(code);
  return {
    status,
    code,
    attendee,
    attendeeEvent: attendee ? getEvent(attendee.eventId) : null,
    event,
    stats: getStats(event.id),
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function registerAttendee(payload: unknown) {
  const data = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  const text = (field: string) => typeof data[field] === "string" ? data[field].trim() : "";
  const name = text("name");
  const email = text("email").toLowerCase();
  const phone = text("phone").replace(/-/g, "");
  const faculty = text("faculty");
  const studentId = text("studentId");
  const requestKey = text("requestKey");
  if (!name || name.length > 120 || email.length > 254 || !EMAIL_RE.test(email) ||
      !/^0\d{9}$/.test(phone) || !faculty || faculty.length > 100 ||
      (studentId && !/^\d{8,10}$/.test(studentId)) || !/^[a-f0-9]{32}$/.test(requestKey)) {
    return { message: "ข้อมูลลงทะเบียนไม่ถูกต้อง กรุณาตรวจสอบและลองอีกครั้ง", status: 400 } as const;
  }

  const eventId = "CC26";
  const db = getDb();
  return transaction(db, () => {
    const saved = db.prepare(
      `SELECT a.code, a.created_at FROM attendee_registration_details d
       JOIN attendees a ON a.code = d.attendee_code
       WHERE d.request_key = ? AND a.event_id = ? AND lower(a.email) = ?`,
    ).get(requestKey, eventId, email);
    if (saved) {
      return { ticketCode: String(saved.code), registeredAt: String(saved.created_at), status: 200 } as const;
    }
    if (!getPublicEvent().registrationOpen) {
      return { code: "registration-closed", message: "อีเวนต์นี้ปิดรับลงทะเบียนแล้ว", status: 409 } as const;
    }
    const existing = db.prepare("SELECT 1 FROM attendees WHERE event_id = ? AND lower(email) = ?").get(eventId, email);
    const usedKey = db.prepare("SELECT 1 FROM attendee_registration_details WHERE request_key = ?").get(requestKey);
    if (existing || usedKey) {
      return { message: "มีรายการลงทะเบียนด้วยข้อมูลนี้แล้ว", status: 409 } as const;
    }

    const [firstName, ...lastName] = name.split(/\s+/);
    const ticketCode = `${eventId}-${randomBytes(6).toString("hex").toUpperCase()}`;
    const registeredAt = new Date().toISOString();
    db.prepare(
      `INSERT INTO attendees (code, event_id, first_name, last_name, email, phone, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(ticketCode, eventId, firstName, lastName.join(" "), email, phone, registeredAt);
    db.prepare(
      "INSERT INTO attendee_registration_details (attendee_code, request_key, student_id, faculty) VALUES (?, ?, ?, ?)",
    ).run(ticketCode, requestKey, studentId || null, faculty);
    return { ticketCode, registeredAt, status: 201 } as const;
  });
}

/** ลงทะเบียนหน้างานและเช็กอินในขั้นตอนเดียว */
export function registerWalkIn(input: Partial<WalkInInput>): CheckInResult | ApiError {
  const name = String(input.name ?? "").trim().replace(/\s+/g, " ");
  const email = String(input.email ?? "").trim().toLowerCase();
  const phone = String(input.phone ?? "").trim() || null;

  const fields: ApiError["fields"] = {};
  if (name.split(" ").length < 2) fields.name = "กรอกชื่อและนามสกุล";
  if (!EMAIL_RE.test(email)) fields.email = "กรอกอีเมลให้ถูกรูปแบบ";
  if (!input.verified) fields.verified = "ตรวจสอบข้อมูลกับผู้เข้าร่วมก่อนบันทึก";
  if (Object.keys(fields).length) {
    return { error: "validation", message: "กรอกข้อมูลให้ครบถ้วน", fields };
  }

  const db = getDb();
  const event = requireCurrentEvent();
  const staff = getCurrentStaff();
  const [firstName, ...rest] = name.split(" ");
  const lastName = rest.join(" ");

  const registration = transaction<ApiError | { code: string }>(db, () => {
    const existing = db
      .prepare(`${ATTENDEE_SELECT} WHERE a.event_id = ? AND (lower(a.email) = ? OR (a.first_name = ? AND a.last_name = ?))`)
      .get(event.id, email, firstName, lastName);
    if (existing) {
      const attendee = toAttendee(existing);
      return {
        error: "duplicate",
        message: `${attendee.firstName} ${attendee.lastName} (${attendee.code}) ลงทะเบียนในงานนี้แล้ว ให้ค้นหาและเช็กอินแทน`,
        attendee,
      } as const;
    }

    const prefix = `${event.id}-W`;
    const last = db
      .prepare("SELECT MAX(CAST(substr(code, ?) AS INTEGER)) AS last FROM attendees WHERE event_id = ? AND source = 'walkin' AND code LIKE ?")
      .get(prefix.length + 1, event.id, `${prefix}%`);
    const next = Number(last?.last ?? 0) + 1;
    const newCode = `${prefix}${String(next).padStart(3, "0")}`;
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO attendees (code, event_id, first_name, last_name, email, phone, ticket_type, source, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'Walk-in', 'walkin', ?)`,
    ).run(newCode, event.id, firstName, lastName, email, phone, now);
    db.prepare(
      "INSERT INTO checkins (attendee_code, event_id, checked_in_at, checked_in_by, via) VALUES (?, ?, ?, ?, 'walkin')",
    ).run(newCode, event.id, now, staff.name);
    return { code: newCode };
  });

  if ("error" in registration) return registration;
  const { code } = registration;
  return {
    status: "success",
    code,
    attendee: getAttendee(code),
    attendeeEvent: event,
    event,
    stats: getStats(event.id),
  };
}

// ---------- dev only ----------

/** หารหัสตัวอย่างสำหรับปุ่ม "จำลอง" ในหน้าสแกน */
export function getSampleCode(kind: "success" | "duplicate" | "wrong-event" | "not-found"): string | null {
  const db = getDb();
  const eventId = getCurrentEventId();
  if (kind === "not-found") return `${eventId}-9999`;
  const sql = {
    success: `SELECT a.code FROM attendees a LEFT JOIN checkins c ON c.attendee_code = a.code
              WHERE a.event_id = ? AND c.id IS NULL AND a.code IN ('CC26-0187','CC26-0203','CC26-0115') ORDER BY a.code LIMIT 1`,
    duplicate: `SELECT a.code FROM attendees a JOIN checkins c ON c.attendee_code = a.code
                WHERE a.event_id = ? AND a.code = 'CC26-0042' LIMIT 1`,
    "wrong-event": "SELECT code FROM attendees WHERE event_id <> ? AND code = 'DM26-0012' LIMIT 1",
  }[kind];
  const row = db.prepare(sql).get(eventId);
  return row ? String(row.code) : null;
}

export function isApiError(v: unknown): v is ApiError {
  return typeof v === "object" && v !== null && "error" in v;
}
