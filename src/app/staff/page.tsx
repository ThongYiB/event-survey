"use client";

import { formatDateLong, formatTimeRange } from "@/lib/staff/format";
import s from "./staff.module.css";
import { InfoIcon, PinIcon, QrMiniIcon, ScanIcon } from "./_components/icons";
import { ButtonLink, Card, Notice, PageHeader, Tag } from "./_components/ui";
import WithSession from "./_components/WithSession";

const STATUS_TAG = {
  open: <Tag tone="ok">เปิดรับลงทะเบียน</Tag>,
  upcoming: <Tag>เร็ว ๆ นี้</Tag>,
  ended: <Tag tone="muted">จบงานแล้ว</Tag>,
};

export default function StaffEventsPage() {

  return (
    <WithSession>
      {({ staff, event, stats }) => {
        const pct = stats.registered ? Math.min(100, (stats.checkedIn / stats.registered) * 100) : 0;
        return (
          <>
            <PageHeader
              eyebrow="STAFF / เลือกอีเวนต์"
              title="งานที่ได้รับมอบหมาย"
              subtitle={`สวัสดี ${staff.name} • ${staff.accountLabel}`}
            />

            <Card title="อีเวนต์ของคุณ">
              {STATUS_TAG[event.status]}
              <h3 className={s.eventName}>{event.name}</h3>
              <p className={s.meta}>
                {formatDateLong(event.startsAt)} • {formatTimeRange(event.startsAt, event.endsAt)}
              </p>
              <p className={s.meta}>
                <PinIcon size={15} /> {event.place}
              </p>

              <div className={s.spacer8} />
              <Tag tone="ok">ได้รับมอบหมายแล้ว</Tag>
              <p className={s.body}>สิทธิ์: {event.permissions}</p>

              <div className={s.statRow}>
                <span>
                  <b>เช็กอิน {stats.checkedIn}</b> / {stats.registered}
                </span>
                <span className={s.muted}>รอเช็กอิน {stats.remaining}</span>
              </div>
              <div
                className={s.bar}
                role="progressbar"
                aria-label="สัดส่วนผู้เช็กอิน"
                aria-valuenow={stats.checkedIn}
                aria-valuemin={0}
                aria-valuemax={stats.registered}
              >
                <i style={{ width: `${pct}%` }} />
              </div>

              <div className={s.stack}>
                <ButtonLink href="/staff/scan">
                  <ScanIcon /> เข้าสู่หน้าสแกน QR
                </ButtonLink>
                <ButtonLink href="/staff/survey-qr">
                  <QrMiniIcon /> แสดง QR แบบประเมิน
                </ButtonLink>
              </div>
            </Card>

            <Notice tone="info" icon={<InfoIcon />} title="ก่อนเริ่มงาน">
              เลือกอีเวนต์ให้ถูกต้อง แล้วใช้ QR ส่วนบุคคลของผู้เข้าร่วม ไม่ใช่ QR
              ลงทะเบียนหรือ QR แบบสอบถาม
            </Notice>

          </>
        );
      }}
    </WithSession>
  );
}
