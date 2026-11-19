// จัดรูปแบบวันเวลาเป็นภาษาไทย (ปี ค.ศ.) ตามเวลาประเทศไทย

const TZ = "Asia/Bangkok";

/** "25 พฤศจิกายน 2026" */
export function formatDateLong(iso: string) {
  return new Intl.DateTimeFormat("th-TH-u-ca-gregory", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TZ,
  }).format(new Date(iso));
}

/** "09:12" */
export function formatTime(iso: string) {
  return new Intl.DateTimeFormat("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TZ,
  }).format(new Date(iso));
}

/** "09:00–16:00" */
export function formatTimeRange(startIso: string, endIso: string) {
  return `${formatTime(startIso)}–${formatTime(endIso)}`;
}

/** "25 พ.ย. 2026 • 09:12" */
export function formatDateTimeShort(iso: string) {
  const date = new Intl.DateTimeFormat("th-TH-u-ca-gregory", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: TZ,
  }).format(new Date(iso));
  return `${date} • ${formatTime(iso)}`;
}

export const fullName = (a: { firstName: string; lastName: string }) =>
  `${a.firstName} ${a.lastName}`.trim();
