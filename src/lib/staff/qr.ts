// แปลงข้อความที่อ่านได้จาก QR ส่วนบุคคลให้เป็นรหัสผู้เข้าร่วม
//
// รองรับ 3 รูปแบบ:
//   1. รหัสตรง ๆ          CC26-0187
//   2. URL ที่มี ?code=    https://example.com/checkin?code=CC26-0187
//   3. JSON              {"code":"CC26-0187"}
//
// ถ้าระบบลงทะเบียนสร้าง QR ด้วยรูปแบบอื่น ให้แก้ฟังก์ชันนี้ที่เดียว

const CODE_RE = /^[A-Z0-9]{2,12}-[A-Z0-9]{2,12}$/;

export function parseAttendeeCode(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;

  let candidate = text;

  if (/^https?:\/\//i.test(text)) {
    try {
      const url = new URL(text);
      candidate = url.searchParams.get("code") ?? url.pathname.split("/").filter(Boolean).pop() ?? "";
    } catch {
      return null;
    }
  } else if (text.startsWith("{")) {
    try {
      const data = JSON.parse(text) as { code?: unknown };
      candidate = typeof data.code === "string" ? data.code : "";
    } catch {
      return null;
    }
  }

  try {
    const code = decodeURIComponent(candidate).trim().toUpperCase();
    const [event, ticket] = code.split(":");
    if (ticket) {
      return code === `${event}:${ticket}` && ticket.startsWith(`${event}-`) && CODE_RE.test(ticket) ? ticket : null;
    }
    return CODE_RE.test(code) ? code : null;
  } catch {
    return null;
  }
}
