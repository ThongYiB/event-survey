# เว็บไซต์ Event Survey

เว็บไซต์จริง: https://event-survey-one.vercel.app

Vercel project: `thong-yib/event-survey`

เผยแพร่เมื่อ 19 พฤศจิกายน 2026 จากโค้ดปัจจุบันในเครื่อง ใช้ Next.js และ Node.js 24.x โดยเชื่อม Supabase โปรเจกต์ `nstdlvkfvkugqttafyou` เดียวกับแอปในเครื่อง

## อัปเดตเว็บครั้งถัดไป

จากโฟลเดอร์โปรเจกต์ หลังตรวจการแก้ไขแล้ว รัน:

```powershell
npx --yes vercel@66.2.0 deploy --prod --yes --scope thong-yib
```

เครื่องนี้ผูกกับโปรเจกต์แล้ว เครื่องอื่นต้องเข้าสู่ระบบ Vercel และผูกโปรเจกต์ก่อน:

```powershell
npx --yes vercel@66.2.0 login
npx --yes vercel@66.2.0 link --yes --scope thong-yib --project event-survey
```

การเผยแพร่ครั้งนี้ผ่าน CLI ยังไม่ได้เปิดให้ GitHub deploy อัตโนมัติ การกด Save หรือ Commit ในเครื่องจึงไม่อัปเดตเว็บไซต์เอง

## ค่าการเชื่อมต่อ

Vercel ตั้ง `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` และ `SUPABASE_SECRET_KEY` สำหรับ Production และ Preview แล้ว โดยเก็บ Secret key เป็น Secret บน Vercel

ไฟล์ `.vercelignore` ไม่รวม `.env*`, ฐานข้อมูล `data`, `.git`, `node_modules` และไฟล์ build ในเครื่องลงในชุดอัปโหลด

## ผลตรวจหลังเผยแพร่

- หน้า `/login` เปิดได้โดยไม่ต้องเข้าสู่บัญชี Vercel
- หน้าจัดการ Admin ส่งผู้ที่ยังไม่เข้าสู่ระบบกลับ `/login`
- API ข้อมูล Admin และ Manager ตอบ 401 หากไม่มีเซสชัน
- API เข้าสู่ระบบตอบข้อผิดพลาดบัญชีจากระบบจริง
- Build และ TypeScript บน Vercel ผ่านครบ 57 หน้า

## การปรับปรุงหลังเผยแพร่

- เมนู Admin สลับระหว่างหน้าที่ใช้ข้อมูลชุดเดียวกันด้วย History API ไม่ต้องรอคำขอหน้าใหม่ และยังรองรับ Back/Forward กับการเปิดลิงก์ตรง
- ตัดการตรวจบัญชีซ้ำใน Proxy เฉพาะ Cloud API 4 เส้นทางที่ตรวจ Auth และสิทธิ์ในตัวเองอยู่แล้ว แต่ละ API ยังใช้ `getUser()` และอ่านสถานะบัญชีจริงทุกครั้ง
- การตรวจหน้าเว็บใช้ `getClaims()` ตรวจลายเซ็น JWT ผ่าน Supabase SDK และยังอ่านบทบาท/สถานะระงับจากฐานข้อมูล ไม่มีการแคชสิทธิ์ข้ามผู้ใช้
- หลังเข้าสู่ระบบ เปิดหน้าปลายทางครั้งเดียวหลังบันทึกคุกกี้แล้ว
- ข้อผิดพลาดสร้างบัญชีอยู่ใต้ช่องรหัสผ่านในกล่องแจ้งเตือน ล้างเมื่อแก้ข้อมูล และตรวจอีเมลที่มีอยู่แล้วก่อนส่งคำขอสร้างบัญชี
- ตรวจ `node scripts/test-cloud-proxy.mjs`, `node scripts/test-supabase-policies.mjs`, lint, build และทดสอบเมนู/ข้อความแจ้งเตือนบนเว็บไซต์จริงแล้ว

ส่วนลงทะเบียน เช็กอิน คำตอบแบบสอบถาม และรายงานยังเป็นขอบเขตการเชื่อม Supabase ขั้นถัดไปตาม `supabase/SETUP.md`
