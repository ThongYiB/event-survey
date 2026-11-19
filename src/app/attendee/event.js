// ข้อมูลจำลอง (mock) — ภายหลังค่อยเปลี่ยนไปดึงจากฐานข้อมูล (เช่น Supabase)
export const event = {
  id: "CC26",
  name: "Creative Campus 2026",
  tagline: "พื้นที่ของความคิดสร้างสรรค์",
  category: "กิจกรรมนักศึกษา",
  date: "25 พฤศจิกายน 2569",
  time: "09:00 - 16:00 น.",
  location: "หอประชุมมหาวิทยาลัย",
  description:
    "กิจกรรมเปิดพื้นที่ให้นักศึกษาได้แสดงผลงานสร้างสรรค์ ร่วมเวิร์กช็อป และพบปะเพื่อนต่างคณะ พร้อมแบบประเมินหลังจบงานเพื่อนำไปพัฒนากิจกรรมครั้งต่อไป",
  schedule: [
    { time: "09:00", title: "ลงทะเบียนและเช็กอิน" },
    { time: "10:00", title: "พิธีเปิดและกล่าวต้อนรับ" },
    { time: "13:00", title: "เวิร์กช็อปความคิดสร้างสรรค์" },
    { time: "15:30", title: "สรุปกิจกรรมและทำแบบประเมิน" },
  ],
};

const STORAGE_KEY = "event-survey-registration";

export function saveRegistration(data) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadRegistration() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

