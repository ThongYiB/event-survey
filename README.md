# Event Survey

เว็บแอป Next.js (App Router) ใช้ TypeScript, JSX และ CSS ส่วน SQL ใช้สำหรับ PostgreSQL บน Supabase

## เริ่มบนเครื่อง

```sh
npm ci
npm run dev
```

เปิด http://localhost:3000 แล้วตรวจโค้ดด้วย `npm run lint` และ `npm run build`

## ตำแหน่งไฟล์

- `src/app` สำหรับหน้าจอและเส้นทาง API ของ Next.js
- `supabase/migrations` สำหรับไฟล์ SQL ที่เปลี่ยนโครงสร้างฐานข้อมูลตามลำดับ

## เส้นทางสำหรับพัฒนาต่อ

| เส้นทาง | ส่วนงาน |
| --- | --- |
| `/login` | เข้าสู่ระบบ |
| `/admin/accounts` | System Admin สร้างบัญชี Event Manager |
| `/manager/events` | Event Manager สร้างและจัดการอีเวนต์ |
| `/staff/invite/[token]` | สมัคร Staff จาก QR คำเชิญ |
| `/staff/events/[eventId]/check-in` | Staff เช็กอินในงานที่ได้รับอนุมัติ |
| `/events/[eventId]` | Attendee ลงทะเบียนและตอบแบบสอบถาม |
| `/manager/events/[eventId]/kiosk` | Manager ตั้งค่าจอประชาสัมพันธ์ |

## Supabase

เมื่อสร้างโปรเจกต์ Supabase แล้ว ให้คัดลอก `.env.example` เป็น `.env.local` และใส่ URL กับ publishable key ของโปรเจกต์ ค่าใน `.env.local` จะไม่ถูกเก็บใน Git

โครงนี้เปิดหน้าแรกได้โดยไม่ต้องตั้งค่า Supabase การเชื่อม Auth, Database และ Storage จะเพิ่มพร้อมฟีเจอร์ที่ใช้งานจริง

