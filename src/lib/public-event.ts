export type SurveyField = {
  id: string;
  label: string;
  type: string;
  help: string;
  required: boolean;
  options: string;
};

export const defaultEventDetails = {
  name: "Creative Campus 2026",
  description: "พื้นที่แลกเปลี่ยนไอเดียสร้างสรรค์ของนักศึกษา ร่วมฟังเสวนา ทดลองเวิร์กช็อป และชมผลงานจากชุมชนมหาวิทยาลัย",
  venue: "หอประชุมมหาวิทยาลัย",
  startDate: "2026-11-25",
  endDate: "2026-11-25",
  startTime: "09:00",
  endTime: "16:00",
  color: "#007f82",
  logo: "",
  banner: "",
};

export const defaultSurveyFields: SurveyField[] = [
  { id: "satisfaction", label: "ความพึงพอใจโดยรวม", type: "radio", help: "เลือกได้ 1 ข้อ", required: true, options: "ดีมาก\nดี\nพอใช้\nควรปรับปรุง" },
  { id: "activities", label: "กิจกรรมที่คุณชอบ", type: "checkbox", help: "เลือกได้มากกว่า 1 ข้อ (ไม่บังคับ)", required: false, options: "เสวนาสร้างแรงบันดาลใจ\nเวิร์กช็อปสร้างสรรค์\nนิทรรศการนักศึกษา" },
  { id: "comments", label: "ข้อเสนอแนะเพิ่มเติม", type: "textarea", help: "เล่าให้เราฟัง (ไม่บังคับ)", required: false, options: "" },
];

export type PublicEvent = {
  id: string;
  details: typeof defaultEventDetails;
  registrationOpen: boolean;
  surveyOpen: boolean;
  surveyFields: SurveyField[];
  revision: number;
};

export const defaultPublicEvent: PublicEvent = {
  id: "CC26", details: defaultEventDetails, registrationOpen: true,
  surveyOpen: true, surveyFields: defaultSurveyFields, revision: 1,
};

export function surveyOptions(field: SurveyField) {
  return [...new Set(field.options.split("\n").map((value) => value.trim()).filter(Boolean))];
}

export function eventDateLabel(details: typeof defaultEventDetails) {
  const format = (value: string) => new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Bangkok" }).format(new Date(`${value}T12:00:00+07:00`));
  return `${format(details.startDate)}${details.endDate !== details.startDate ? ` – ${format(details.endDate)}` : ""} · ${details.startTime}–${details.endTime} น.`;
}
