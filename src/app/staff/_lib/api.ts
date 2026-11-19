// ตัวเรียก API ฝั่งหน้าเว็บ — ทุกการติดต่อ backend ผ่านไฟล์นี้ที่เดียว
// ถ้าย้าย backend ไปที่อื่น ให้เปลี่ยน API_BASE (หรือ env NEXT_PUBLIC_STAFF_API_BASE)

import type {
  ApiError,
  Attendee,
  CheckInResult,
  CheckInVia,
  ScanStatus,
  StaffSession,
  WalkInInput,
} from "@/lib/staff/types";

const API_BASE = process.env.NEXT_PUBLIC_STAFF_API_BASE ?? "/api/staff";

export class StaffApiError extends Error {
  constructor(
    public status: number,
    public body: ApiError,
  ) {
    super(body.message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
      cache: "no-store",
    });
  } catch {
    throw new StaffApiError(0, { error: "network", message: "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ตรวจสอบอินเทอร์เน็ตแล้วลองอีกครั้ง" });
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new StaffApiError(res.status, data ?? { error: "unknown", message: `เกิดข้อผิดพลาด (${res.status})` });
  }
  return data as T;
}

export const staffApi = {
  getSession: () => request<StaffSession>("/session"),

  searchAttendees: (q: string, signal?: AbortSignal) =>
    request<{ attendees: Attendee[] }>(`/attendees?q=${encodeURIComponent(q)}`, { signal }),

  checkIn: (code: string, via: CheckInVia) =>
    request<CheckInResult>("/check-ins", { method: "POST", body: JSON.stringify({ code, via }) }),

  registerWalkIn: (input: WalkInInput) =>
    request<CheckInResult>("/walk-ins", { method: "POST", body: JSON.stringify(input) }),

  // ใช้ตอนพัฒนาเท่านั้น
  devSampleCode: (kind: ScanStatus) => request<{ code: string }>(`/dev/sample-code?kind=${kind}`),
};
