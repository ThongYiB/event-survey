"use client";

import { formatDateLong, formatTimeRange } from "@/lib/staff/format";
import s from "../staff.module.css";
import { ButtonLink, PageHeader, Tag } from "../_components/ui";
import WithSession from "../_components/WithSession";
import { LinkQr } from "@/components/public/link-qr";

export default function SurveyQrPage() {
  return (
    <WithSession>
      {({ event }) => (
        <>
          <PageHeader eyebrow="STAFF / QR แบบประเมิน" title="แสดง QR แบบประเมิน" />

          <section className={`${s.card} ${s.qrCard}`}>
            <Tag>QR แบบประเมินหลังจบงาน</Tag>
            <h2 className={s.qrEvent}>{event.name}</h2>
            <p className={s.meta}>
              {formatDateLong(event.startsAt)} • {formatTimeRange(event.startsAt, event.endsAt)}
            </p>

            <LinkQr path="/attendee/survey" label="แบบสอบถาม" downloadName="event-survey-survey-qr.png" />

            <p className={s.meta}>QR กลางของงาน • สำหรับผู้เข้าร่วมทุกคน</p>
          </section>

          <ButtonLink href="/staff" variant="ghost">
            กลับไปเลือกงาน
          </ButtonLink>
          <p className={`${s.meta} ${s.spacer12}`}>Staff แสดง QR ของงานที่ได้รับมอบหมายเท่านั้น</p>
        </>
      )}
    </WithSession>
  );
}
