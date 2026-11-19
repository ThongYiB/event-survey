import type { SurveyField } from "./public-event";
import type { defaultEventDetails } from "./public-event";

export type PublishedRegistration = { id: string; details: typeof defaultEventDetails; form_fields: SurveyField[]; registration_open: boolean; revision: number; capacity: number;survey_open:boolean;survey_fields:SurveyField[];survey_revision:number };
export type RegistrationTicket = { eventId: string; details: typeof defaultEventDetails; name: string; ticketCode: string; registeredAt: string };

export const defaultRegistrationFields: SurveyField[] = [
  { id: "name", label: "ชื่อ-นามสกุล", type: "text", required: true, help: "", options: "" },
  { id: "email", label: "อีเมล", type: "email", required: true, help: "ใช้ลงทะเบียนได้หนึ่งครั้งต่ออีเวนต์", options: "" },
  { id: "phone", label: "โทรศัพท์", type: "tel", required: false, help: "", options: "" },
];
export const uuidPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export function registrationAnswers(fields: SurveyField[], input: unknown) {
  const errors: Record<string, string> = {};
  const answers: Record<string, string> = Object.create(null);
  const values = input && typeof input === "object" && !Array.isArray(input) ? input as Record<string, unknown> : {};
  for (const field of fields) {
    const raw = values[field.id];
    if (raw !== undefined && typeof raw !== "string") { errors[field.id] = "รูปแบบข้อมูลไม่ถูกต้อง"; continue; }
    const value = typeof raw === "string" ? raw.trim() : "";
    if (field.required && !value) errors[field.id] = "กรุณากรอกข้อมูลช่องนี้";
    else if (value.length > (field.id === "name" ? 200 : field.type === "email" ? 254 : 500)) errors[field.id] = "ข้อมูลยาวเกินกำหนด";
    else if (value && field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors[field.id] = "กรุณากรอกอีเมลให้ถูกต้อง";
    else if (value && field.type === "tel" && !/^[+\d][\d\s()-]{6,24}$/.test(value)) errors[field.id] = "กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง";
    answers[field.id] = field.type === "email" ? value.toLowerCase() : value;
  }
  return { answers, errors };
}
