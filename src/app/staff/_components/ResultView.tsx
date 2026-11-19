"use client";

import { formatDateLong, formatDateTimeShort, formatTime, formatTimeRange, fullName } from "@/lib/staff/format";
import type { Attendee, CheckInResult, ScanStatus, StaffEvent } from "@/lib/staff/types";
import s from "../staff.module.css";
import {
  AlertCircleIcon,
  CheckCircleIcon,
  CheckIcon,
  ScanIcon,
  SearchIcon,
  WarnIcon,
  XIcon,
} from "./icons";
import { ButtonLink, Card, Hero, Notice, PageHeader, Tag } from "./ui";
import { useStaff } from "../_lib/store";

const VIA_LABEL = { qr: "สแกน QR", search: "ค้นหาด้วยชื่อ", walkin: "ลงทะเบียนหน้างาน" } as const;

export default function ResultView({ status }: { status: ScanStatus }) {
  const { lastResult } = useStaff();
  const result = lastResult && lastResult.status === status ? lastResult : null;

  if (!result) {
    return (
      <>
        <PageHeader eyebrow="ผลการสแกน" title="ยังไม่มีผลการสแกน" />
        <Notice tone="info" icon={<ScanIcon />} title="สแกน QR เพื่อดูผล">
          หน้านี้แสดงผลหลังสแกนหรือค้นหาผู้เข้าร่วม
        </Notice>
        <ButtonLink href="/staff/scan">
          <ScanIcon /> ไปหน้าสแกน
        </ButtonLink>
      </>
    );
  }

  switch (result.status) {
    case "success":
      return <Success result={result} attendee={result.attendee!} />;
    case "duplicate":
      return <Duplicate result={result} attendee={result.attendee!} />;
    case "wrong-event":
      return <WrongEvent result={result} attendee={result.attendee!} />;
    case "not-found":
      return <NotFound result={result} />;
  }
}

function AttendeeHeader({ attendee, event }: { attendee: Attendee; event: StaffEvent }) {
  return (
    <>
      <p className={s.personName}>{fullName(attendee)}</p>
      <p className={s.meta}>รหัสผู้เข้าร่วม {attendee.code}</p>
      <hr className={s.divider} />
      <p className={s.strong}>{event.name}</p>
      <p className={s.meta}>
        {formatDateLong(event.startsAt)} • {formatTimeRange(event.startsAt, event.endsAt)}
      </p>
    </>
  );
}

type Props = { result: CheckInResult; attendee: Attendee };

function Success({ result, attendee }: Props) {
  const ci = attendee.checkIn!;
  return (
    <>
      <PageHeader eyebrow="ผลการสแกน / สำเร็จ" title="เช็กอินสำเร็จ" />
      <Hero tone="ok" icon={<CheckIcon size={30} />} title="ยินดีต้อนรับเข้างาน" caption="ยืนยันเช็กอินแล้ว 1 ครั้ง" />
      <Card title="ข้อมูลผู้เข้าร่วม">
        <AttendeeHeader attendee={attendee} event={result.event} />
        <div className={s.spacer8}>
          <Tag tone="ok">เช็กอินแล้ว</Tag>
        </div>
        <p className={s.body}>เวลาเช็กอิน: {formatDateTimeShort(ci.at)}</p>
        <p className={s.meta}>
          ผู้ยืนยัน: {ci.by} / Staff • {VIA_LABEL[ci.via]}
        </p>
      </Card>
      <Notice tone="ok" icon={<CheckCircleIcon />} title={`นับรวมในยอดเช็กอิน ${result.stats.checkedIn} คน`}>
        รอเช็กอินอีก {result.stats.remaining} คน จากผู้ลงทะเบียน {result.stats.registered} คน
      </Notice>
      <ButtonLink href="/staff/scan">
        <ScanIcon /> สแกนคนถัดไป
      </ButtonLink>
    </>
  );
}

function Duplicate({ result, attendee }: Props) {
  const ci = attendee.checkIn!;
  return (
    <>
      <PageHeader eyebrow="ผลการสแกน / เช็กอินซ้ำ" title="เช็กอินล่วงหน้าแล้ว" />
      <Hero tone="warn" icon={<WarnIcon size={28} />} title="ไม่เช็กอินซ้ำ" caption="ผู้เข้าร่วมคนนี้มีประวัติเข้างานแล้ว" />
      <Card title="ข้อมูลการเช็กอินเดิม">
        <AttendeeHeader attendee={attendee} event={result.event} />
        <div className={s.spacer8}>
          <Tag tone="warn">เช็กอินเดิม {formatTime(ci.at)}</Tag>
        </div>
        <p className={s.body}>{formatDateTimeShort(ci.at)}</p>
        <p className={s.meta}>ผู้ยืนยันเดิม: {ci.by} / Staff</p>
      </Card>
      <Notice tone="warn" icon={<WarnIcon />} title="ไม่นับจำนวนผู้เข้าร่วมเพิ่ม">
        ยอดเช็กอินยังคง {result.stats.checkedIn} คน ไม่บันทึกการเข้างานซ้ำ
      </Notice>
      <ButtonLink href="/staff/scan">
        <ScanIcon /> กลับไปสแกนคนถัดไป
      </ButtonLink>
    </>
  );
}

function WrongEvent({ result, attendee }: Props) {
  const other = result.attendeeEvent;
  return (
    <>
      <PageHeader eyebrow="ผลการสแกน / QR ผิดงาน" title="QR ไม่ตรงกับอีเวนต์" />
      <Hero tone="bad" icon={<XIcon size={28} />} title="ยังไม่ได้เช็กอิน" caption="QR นี้เป็นของอีเวนต์อื่น" />
      <Card title="ตรวจสอบอีเวนต์">
        <p className={s.meta}>งานที่ Staff กำลังเช็กอิน</p>
        <p className={s.strong}>{result.event.name}</p>
        <hr className={s.divider} />
        <p className={s.meta}>งานที่ระบุใน QR</p>
        <p className={`${s.strong} ${s.textBad}`}>
          {other?.name ?? "ไม่พบอีเวนต์"}
          {other?.status === "ended" ? " (จบงานแล้ว)" : ""}
        </p>
        <p className={s.meta}>
          {fullName(attendee)} • รหัส {attendee.code} • ไม่ใช่ {result.event.id}
        </p>
      </Card>
      <Notice tone="bad" icon={<AlertCircleIcon />} title="ไม่มีการเช็กอินหรือเพิ่มยอด">
        ขอ QR ของ {result.event.name} หรือค้นหาชื่อผู้ลงทะเบียนในงานนี้
      </Notice>
      <div className={s.stack}>
        <ButtonLink href="/staff/scan">
          <ScanIcon /> สแกน QR ใหม่
        </ButtonLink>
        <ButtonLink href="/staff/search" variant="ghost">
          <SearchIcon /> ค้นหาด้วยชื่อ
        </ButtonLink>
      </div>
    </>
  );
}

function NotFound({ result }: { result: CheckInResult }) {
  return (
    <>
      <PageHeader eyebrow="ผลการสแกน / ไม่พบในระบบ" title="ไม่พบ QR นี้ในระบบ" />
      <Hero tone="bad" icon={<XIcon size={28} />} title="ยังไม่ได้เช็กอิน" caption={`ไม่มีผู้ลงทะเบียนรหัส ${result.code}`} />
      <Notice tone="bad" icon={<AlertCircleIcon />} title="ตรวจสอบกับผู้เข้าร่วม">
        QR อาจหมดอายุหรือพิมพ์ผิด ลองค้นหาด้วยชื่อ หรือลงทะเบียน Walk-in ให้ผู้เข้าร่วม
      </Notice>
      <div className={s.stack}>
        <ButtonLink href="/staff/scan">
          <ScanIcon /> สแกน QR ใหม่
        </ButtonLink>
        <ButtonLink href="/staff/search" variant="ghost">
          <SearchIcon /> ค้นหาด้วยชื่อ
        </ButtonLink>
      </div>
    </>
  );
}
