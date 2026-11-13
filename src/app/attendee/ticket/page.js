"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { event, loadRegistration } from "../event";

export default function TicketPage() {
  const [ticket, setTicket] = useState(null);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(async () => {
      const reg = loadRegistration();
      let qr = "";
      if (reg) {
        try {
          qr = await QRCode.toDataURL(`${event.id}:${reg.ticketCode}`, { width: 400 });
        } catch {
          // Keep the ticket code visible if QR generation fails.
        }
      }
      if (active) setTicket({ reg, qr });
    });
    return () => { active = false; };
  }, []);

  if (!ticket) {
    return <main className="flex-1 px-4 py-5" role="status">กำลังโหลดตั๋ว…</main>;
  }

  const { reg, qr } = ticket;
  return (
    <main className="flex-1 space-y-4 px-4 py-5">
      {!reg ? (
        <div className="space-y-4 rounded-2xl bg-white p-6 text-center shadow-sm">
          <p className="font-semibold">ยังไม่มีตั๋ว</p>
          <p className="text-sm text-muted">ลงทะเบียนเข้าร่วมงานก่อน แล้วจะได้รับ QR Code ที่นี่</p>
          <Link
            href="/attendee/register"
            className="inline-block rounded-xl bg-brand px-6 py-2.5 font-semibold text-white"
          >
            ไปลงทะเบียน
          </Link>
        </div>
      ) : (
        <>
          <h1 className="text-xl font-bold">ลงทะเบียนสำเร็จ</h1>

          <div className="flex gap-2 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
            <span>✓</span>
            <div>
              <p className="font-semibold">พร้อมเช็กอินแล้ว</p>
              <p className="text-xs">แสดง QR Code นี้ให้เจ้าหน้าที่สแกนที่จุดลงทะเบียนหน้างาน</p>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl bg-white p-5 text-center shadow-sm">
            <span className="inline-block rounded-full bg-brand-light px-3 py-1 text-xs font-medium text-brand">
              ตั๋วเข้าร่วมงาน • 1 ท่าน
            </span>
            <p className="text-lg font-bold">{event.name}</p>
            <p className="text-xs text-muted">
              {event.date} • {event.time}
            </p>

            <div className="mx-auto w-52 rounded-xl border-2 border-brand/30 p-2">
              {qr ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qr} alt={`QR Code ${reg.ticketCode}`} className="w-full" />
              ) : (
                <p className="text-sm text-muted">สร้าง QR Code ไม่สำเร็จ</p>
              )}
            </div>

            <p className="text-2xl font-bold tracking-wider text-brand">{reg.ticketCode}</p>
            <p className="text-xs text-muted">รหัสผู้เข้าร่วม</p>

            <hr className="border-black/5" />

            <p className="text-lg font-semibold">{reg.name}</p>
            <p className="text-xs text-muted">{reg.faculty}</p>
            <span className="inline-block rounded-full bg-brand-light px-3 py-1 text-xs text-brand">
              สถานะ: รอเช็กอิน
            </span>
          </div>

          <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
            ⚠ กรุณาแคปหน้าจอนี้เก็บไว้ หรือเปิดหน้านี้ไว้ก่อนเข้างาน
          </div>
        </>
      )}
    </main>
  );
}

