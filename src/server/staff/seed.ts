// ข้อมูลตัวอย่างสำหรับทดสอบ — ใส่ให้อัตโนมัติเมื่อฐานข้อมูลยังว่าง
// งาน Creative Campus 2026: ลงทะเบียน 240 คน เช็กอินแล้ว 185 คน

import type { DatabaseSync } from "node:sqlite";

const EVENT_DAY = "2026-11-25";
const at = (time: string) => `${EVENT_DAY}T${time}:00+07:00`;

const FIRST = ["อรุณี", "กิตติพัฒน์", "ชนิดา", "ปวริศ", "สุภาวดี", "ธนวัฒน์", "พิมพ์ชนก", "ณัฐวุฒิ", "วรรณิศา", "ภาคิน", "ศิริพร", "จิรายุ"];
const LAST = ["สุขสวัสดิ์", "ทองดี", "ศรีอ่อน", "แก้วมณี", "บุญมา", "จันทร์เพ็ญ", "รุ่งเรือง", "พรหมมา", "ใจงาม", "ชัยวัฒน์"];

export function seedDemoData(db: DatabaseSync) {
  const now = new Date().toISOString();

  const insertEvent = db.prepare(
    `INSERT INTO events (id, name, starts_at, ends_at, place, status, capacity, permissions)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const insertAttendee = db.prepare(
    `INSERT INTO attendees (code, event_id, first_name, last_name, email, phone, ticket_type, source, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'preregistered', ?)`,
  );
  const insertCheckIn = db.prepare(
    `INSERT INTO checkins (attendee_code, event_id, checked_in_at, checked_in_by, via) VALUES (?, ?, ?, ?, 'qr')`,
  );

  db.exec("BEGIN IMMEDIATE");
  try {
    if (db.prepare("SELECT 1 FROM events LIMIT 1").get()) {
      db.exec("COMMIT");
      return;
    }
    insertEvent.run(
      "CC26",
      "Creative Campus 2026",
      at("09:00"),
      at("16:00"),
      "หอประชุมมหาวิทยาลัย",
      "open",
      240,
      "ค้นหาผู้ลงทะเบียน เช็กอิน และลงทะเบียน Walk-in เฉพาะงานนี้",
    );
    insertEvent.run(
      "DM26",
      "Design Meetup (สมมติ)",
      "2026-10-14T18:00:00+07:00",
      "2026-10-14T20:30:00+07:00",
      "Co-working Space ชั้น 1",
      "ended",
      80,
      "",
    );

    // รายชื่อที่ใช้ทดสอบแต่ละสถานะ
    const named: [string, string, string, string, string, string, string | null][] = [
      ["CC26-0187", "CC26", "ปภาวี", "ใจดี", "paphawee@example.com", "089-XXX-1234", null],
      ["CC26-0042", "CC26", "ธีรภัทร", "ศรีสุข", "theerapat@example.com", "081-XXX-0042", "09:12"],
      ["CC26-0203", "CC26", "กมลชนก", "วงศ์ไทย", "kamonchanok@example.com", "062-XXX-7781", null],
      ["CC26-0115", "CC26", "ณัฐพล", "มั่นคง", "nattapon@example.com", "095-XXX-2290", null],
      ["DM26-0012", "DM26", "วรเมธ", "อินทร์แก้ว", "woramet@example.com", "080-XXX-5512", null],
    ];
    for (const [code, eventId, first, last, email, phone, checkedAt] of named) {
      insertAttendee.run(code, eventId, first, last, email, phone, "ผู้เข้าร่วมทั่วไป", now);
      if (checkedAt) insertCheckIn.run(code, eventId, at(checkedAt), "ธนกฤต");
    }

    // ผู้ลงทะเบียนอื่น ๆ ให้ครบ 240 คน (184 คนเช็กอินแล้ว + 52 คนยังไม่เช็กอิน)
    for (let i = 0; i < 236; i++) {
      const n = 1001 + i;
      const code = `CC26-${n}`;
      const first = FIRST[i % FIRST.length];
      const last = LAST[Math.floor(i / FIRST.length) % LAST.length];
      insertAttendee.run(code, "CC26", first, last, `guest${n}@example.com`, `08X-XXX-${n}`, "ผู้เข้าร่วมทั่วไป", now);
      if (i < 184) {
        const minutes = 8 * 60 + 30 + Math.floor((i * 90) / 184); // 08:30–10:00
        const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
        const mm = String(minutes % 60).padStart(2, "0");
        insertCheckIn.run(code, "CC26", at(`${hh}:${mm}`), "Staff หน้างาน");
      }
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}
