// การเชื่อมต่อ SQLite (ใช้ node:sqlite ที่มากับ Node.js ไม่ต้องติดตั้งแพ็กเกจเพิ่ม)
// ไฟล์ฐานข้อมูล: data/event-survey.db (เปลี่ยนได้ด้วย env SQLITE_PATH)
// ใช้เฉพาะฝั่ง server เท่านั้น ห้าม import จาก client component

import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { seedDemoData } from "./seed";

const DB_PATH = process.env.SQLITE_PATH ?? path.join(process.cwd(), "data", "event-survey.db");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS events (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  starts_at   TEXT NOT NULL,
  ends_at     TEXT NOT NULL,
  place       TEXT NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('open','upcoming','ended')),
  capacity    INTEGER NOT NULL DEFAULT 0,
  permissions TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS attendees (
  code        TEXT PRIMARY KEY,
  event_id    TEXT NOT NULL REFERENCES events(id),
  first_name  TEXT NOT NULL,
  last_name   TEXT NOT NULL,
  email       TEXT NOT NULL,
  phone       TEXT,
  ticket_type TEXT NOT NULL DEFAULT 'ผู้เข้าร่วมทั่วไป',
  source      TEXT NOT NULL DEFAULT 'preregistered' CHECK (source IN ('preregistered','walkin')),
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS attendees_event_idx ON attendees(event_id);
CREATE UNIQUE INDEX IF NOT EXISTS attendees_event_email_idx ON attendees(event_id, lower(email));

CREATE TABLE IF NOT EXISTS attendee_registration_details (
  attendee_code TEXT PRIMARY KEY REFERENCES attendees(code),
  request_key   TEXT NOT NULL UNIQUE,
  student_id    TEXT,
  faculty       TEXT NOT NULL
);

-- เช็กอินได้ครั้งเดียวต่อคน (UNIQUE กันการเช็กอินซ้ำแม้กดพร้อมกันหลายเครื่อง)
CREATE TABLE IF NOT EXISTS checkins (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  attendee_code  TEXT NOT NULL UNIQUE REFERENCES attendees(code),
  event_id       TEXT NOT NULL REFERENCES events(id),
  checked_in_at  TEXT NOT NULL,
  checked_in_by  TEXT NOT NULL,
  via            TEXT NOT NULL CHECK (via IN ('qr','search','walkin'))
);
CREATE INDEX IF NOT EXISTS checkins_event_idx ON checkins(event_id);
`;

const globalForDb = globalThis as unknown as { eventSurveyDb?: DatabaseSync };

export function getDb(): DatabaseSync {
  if (!globalForDb.eventSurveyDb) {
    mkdirSync(path.dirname(DB_PATH), { recursive: true });
    const db = new DatabaseSync(DB_PATH);
    try {
      db.exec("PRAGMA busy_timeout = 3000; PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
      db.exec(SCHEMA);
      const row = db.prepare("SELECT COUNT(*) AS n FROM events").get();
      if (Number(row?.n ?? 0) === 0) seedDemoData(db);
      globalForDb.eventSurveyDb = db;
    } catch (error) {
      db.close();
      throw error;
    }
  }
  return globalForDb.eventSurveyDb;
}

/** รันหลายคำสั่งแบบ all-or-nothing */
export function transaction<T>(db: DatabaseSync, fn: () => T): T {
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

