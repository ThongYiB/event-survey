"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fullName } from "@/lib/staff/format";
import type { Attendee } from "@/lib/staff/types";
import s from "../staff.module.css";
import ConfirmDialog from "../_components/ConfirmDialog";
import { AlertCircleIcon, SearchIcon, UserPlusIcon, WarnIcon } from "../_components/icons";
import { Button, ButtonLink, Card, Notice, PageHeader, Tag } from "../_components/ui";
import WithSession from "../_components/WithSession";
import { staffApi, StaffApiError } from "../_lib/api";
import { useStaff } from "../_lib/store";

export default function SearchPage() {
  const router = useRouter();
  const { checkIn,cloudMode,session } = useStaff();
  const canCheckIn=!cloudMode||!!session?.access?.includes("เช็กอิน");
  const canWalkIn=canCheckIn&&(!cloudMode||!!session?.access?.includes("ลงทะเบียน Walk-in"));
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Attendee[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Attendee | null>(null);
  const [confirming, setConfirming] = useState(false);

  // ค้นหาหลังหยุดพิมพ์ 250ms
  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    const ctrl = new AbortController();
    const t = window.setTimeout(async () => {
      setSearching(true);
      try {
        const { attendees } = await staffApi.searchAttendees(q, ctrl.signal);
        if (ctrl.signal.aborted) return;
        setResults(attendees);
        setError(null);
      } catch (e) {
        if (!ctrl.signal.aborted) setError(e instanceof StaffApiError ? e.message : "ค้นหาไม่สำเร็จ");
      } finally {
        if (!ctrl.signal.aborted) setSearching(false);
      }
    }, 250);
    return () => {
      ctrl.abort();
      window.clearTimeout(t);
    };
  }, [query]);

  async function confirm() {
    if (!pending) return;
    setConfirming(true);
    try {
      const status = await checkIn(pending.code, "search");
      setPending(null);
      router.push(`/staff/result/${status}`);
    } catch (e) {
      setError(e instanceof StaffApiError ? e.message : "เช็กอินไม่สำเร็จ");
      setPending(null);
      setConfirming(false);
    }
  }

  const q = query.trim();
  const noMatch = q && results && results.length === 0;

  return (
    <WithSession required={["ค้นหาผู้ลงทะเบียน"]}>
      {({ event }) => (
        <>
          <PageHeader eyebrow="STAFF / ทางเลือกเมื่อใช้กล้องไม่ได้" title="ค้นหาผู้ลงทะเบียน" />
          <h2 className={s.sectionTitle}>{event.name}</h2>

          <Notice tone="warn" icon={<WarnIcon />} title="สแกน QR ไม่ได้?">
            ค้นหาด้วยชื่อ อีเมล เบอร์โทร หรือรหัสผู้เข้าร่วม
            <br />
            แล้วตรวจสอบตัวตนก่อนเช็กอิน
          </Notice>

          <label className={s.searchField}>
            <SearchIcon />
            <span className={s.srOnly}>ค้นหาด้วยชื่อหรือโทรศัพท์</span>
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setResults(null);
                setSearching(false);
                setError(null);
              }}
              placeholder="ปภาวี / 089-XXX-1234"
              autoComplete="off"
              autoFocus
            />
          </label>
          <p className={s.helper} aria-live="polite">
            ค้นหาด้วยชื่อหรือโทรศัพท์
            {searching ? " • กำลังค้นหา…" : results && q ? ` • พบ ${results.length} คน` : ""}
          </p>

          {error && (
            <Notice tone="bad" icon={<AlertCircleIcon />} title="เกิดข้อผิดพลาด">
              {error}
            </Notice>
          )}

          {results && results.length > 0 && (
            <Card title="ผลการค้นหา">
              <ul className={s.resultList}>
                {results.map((a) => (
                  <li key={a.code} className={s.resultItem}>
                    <p className={s.personName}>{fullName(a)}</p>
                    <p className={s.body}>{a.code}</p>
                    {a.phone && <p className={s.body}>{a.phone}</p>}
                    <p className={s.meta}>{a.email}</p>
                    <div className={s.spacer8}>
                      {a.checkIn ? <Tag tone="ok">เช็กอินแล้ว</Tag> : <Tag tone="warn">ยังไม่เช็กอิน</Tag>}
                    </div>
                    {canCheckIn&&<Button onClick={() => setPending(a)} disabled={!!a.checkIn}>
                      {a.checkIn ? "เช็กอินแล้ว" : "ตรวจสอบและเช็กอิน"}
                    </Button>}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card title={noMatch ? "ไม่พบรายชื่อ" : "ไม่พบชื่อในระบบ?"}>
            <p className={s.body}>
              {noMatch ? `ไม่พบผู้ลงทะเบียน “${q}” ในงานนี้` : "ผู้เข้าร่วมที่ยังไม่ได้ลงทะเบียนล่วงหน้า"}
            </p>
            <p className={s.meta}>ตรวจสอบตัวสะกด หรือลงทะเบียนหน้างานให้ผู้เข้าร่วม</p>
            {canWalkIn?<ButtonLink href="/staff/walk-in" variant="ghost">
              <UserPlusIcon /> ลงทะเบียน Walk-in
            </ButtonLink>:<p className={s.meta}>ติดต่อหัวหน้าทีมงานหากต้องลงทะเบียนหรือเช็กอินเพิ่มเติม</p>}
          </Card>

          <ConfirmDialog
            open={!!pending}
            busy={confirming}
            name={pending?.firstName ?? ""}
            code={pending?.code ?? ""}
            eventName={event.name}
            onCancel={() => setPending(null)}
            onConfirm={() => void confirm()}
          />
        </>
      )}
    </WithSession>
  );
}
