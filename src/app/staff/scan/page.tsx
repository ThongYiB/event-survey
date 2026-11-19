"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { formatDateLong } from "@/lib/staff/format";
import type { ScanStatus } from "@/lib/staff/types";
import s from "../staff.module.css";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  SearchIcon,
  WarnIcon,
  XCircleIcon,
} from "../_components/icons";
import QrScanner from "../_components/QrScanner";
import { ButtonLink, Notice, PageHeader, Tag } from "../_components/ui";
import WithSession from "../_components/WithSession";
import { StaffApiError } from "../_lib/api";
import { IS_DEV, useStaff } from "../_lib/store";

const SIMS: { status: ScanStatus; label: string; tone: "ok" | "warn" | "bad"; Icon: typeof CheckCircleIcon }[] = [
  { status: "success", label: "จำลอง: สำเร็จ", tone: "ok", Icon: CheckCircleIcon },
  { status: "duplicate", label: "จำลอง: เช็กอินซ้ำ", tone: "warn", Icon: WarnIcon },
  { status: "wrong-event", label: "จำลอง: QR ผิดงาน", tone: "bad", Icon: XCircleIcon },
];

export default function ScanPage() {
  const router = useRouter();
  const { checkIn, simulateScan } = useStaff();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastTextRef = useRef<{ text: string; at: number } | null>(null);

  const run = useCallback(
    async (task: () => Promise<ScanStatus>) => {
      setBusy(true);
      setError(null);
      try {
        const status = await task();
        router.push(`/staff/result/${status}`);
      } catch (e) {
        setError(e instanceof StaffApiError ? e.message : "เช็กอินไม่สำเร็จ ลองอีกครั้ง");
        setBusy(false);
      }
    },
    [router],
  );

  const handleScan = useCallback(
    (text: string) => {
      // กันอ่าน QR อันเดิมซ้ำทันทีหลังแจ้ง error
      const last = lastTextRef.current;
      if (last && last.text === text && Date.now() - last.at < 3000) return;
      lastTextRef.current = { text, at: Date.now() };
      void run(() => checkIn(text, "qr"));
    },
    [checkIn, run],
  );

  return (
    <WithSession>
      {({ event }) => (
        <>
          <PageHeader eyebrow="STAFF / QR SCANNER" title="สแกนเพื่อเช็กอิน" />
          <h2 className={s.sectionTitle}>{event.name}</h2>
          <p className={s.meta}>{formatDateLong(event.startsAt)} • สิทธิ์ Staff</p>
          <Tag>สแกนเฉพาะ QR ส่วนบุคคล</Tag>

          <QrScanner onScan={handleScan} paused={busy} />

          {error && (
            <Notice tone="bad" icon={<XCircleIcon />} title="อ่าน QR ไม่สำเร็จ">
              {error}
            </Notice>
          )}

          <p className={s.meta}>
            วาง QR ส่วนบุคคลในกรอบ{IS_DEV ? " หรือเลือกผลลัพธ์จำลองด้านล่าง" : ""}
          </p>

          <div className={s.stack}>
            {IS_DEV &&
              SIMS.map(({ status, label, tone, Icon }) => (
                <button
                  key={status}
                  type="button"
                  disabled={busy}
                  className={`${s.simRow} ${s[`sim_${tone}`]}`}
                  onClick={() => void run(() => simulateScan(status))}
                >
                  <Icon />
                  <span>{label}</span>
                  <ArrowRightIcon className={s.simArrow} />
                </button>
              ))}
            <ButtonLink href="/staff/search" variant="ghost">
              <SearchIcon /> ใช้กล้องไม่ได้ / ค้นหาผู้ลงทะเบียน
            </ButtonLink>
          </div>
        </>
      )}
    </WithSession>
  );
}
