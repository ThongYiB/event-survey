// Type ที่ใช้ร่วมกันระหว่างหน้าเว็บ (client) และ API (server)
// เป็น "สัญญา" ของ API — ถ้าเปลี่ยน backend ให้คง shape นี้ไว้ หน้าเว็บจะไม่ต้องแก้

export type EventStatus = "open" | "upcoming" | "ended";

export interface StaffEvent {
  id: string;
  name: string;
  startsAt: string; // ISO 8601
  endsAt: string; // ISO 8601
  place: string;
  status: EventStatus;
  capacity: number;
  permissions: string;
}

export type CheckInVia = "qr" | "search" | "walkin";

export interface CheckIn {
  at: string; // ISO 8601
  by: string; // ชื่อ Staff ที่ยืนยัน
  via: CheckInVia;
}

export interface Attendee {
  code: string; // รหัสผู้เข้าร่วม = ข้อความใน QR ส่วนบุคคล เช่น CC26-0187
  eventId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  ticketType: string;
  source: "preregistered" | "walkin";
  checkIn: CheckIn | null;
}

export interface EventStats {
  registered: number; // ลงทะเบียนทั้งหมด (รวม walk-in)
  checkedIn: number;
  remaining: number; // รอเช็กอิน
}

export interface StaffUser {
  name: string;
  accountLabel: string;
}

/** GET /api/staff/session */
export interface StaffSession {
  staff: StaffUser;
  event: StaffEvent;
  stats: EventStats;
}

export type ScanStatus = "success" | "duplicate" | "wrong-event" | "not-found";

/** POST /api/staff/check-ins และ POST /api/staff/walk-ins */
export interface CheckInResult {
  status: ScanStatus;
  code: string;
  attendee: Attendee | null; // null เมื่อ not-found
  attendeeEvent: StaffEvent | null; // อีเวนต์ของ QR (ใช้ตอน wrong-event)
  event: StaffEvent; // อีเวนต์ที่ Staff กำลังเช็กอิน
  stats: EventStats;
}

export interface WalkInInput {
  name: string;
  email: string;
  phone?: string;
  verified: boolean;
}

/** รูปแบบ error ของ API ทุกตัว */
export interface ApiError {
  error: string; // รหัส error เช่น "validation", "duplicate", "invalid-code"
  message: string; // ข้อความภาษาไทยสำหรับแสดงผล
  fields?: Partial<Record<keyof WalkInInput, string>>;
  attendee?: Attendee;
}
