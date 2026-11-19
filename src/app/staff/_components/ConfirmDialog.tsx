"use client";

import { useEffect, useRef } from "react";
import s from "../staff.module.css";
import { Button, Tag } from "./ui";

export default function ConfirmDialog({
  open,
  busy = false,
  name,
  code,
  eventName,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  busy?: boolean;
  name: string;
  code: string;
  eventName: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={s.dialog}
      aria-labelledby="confirm-title"
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel(); // คลิกพื้นหลัง
      }}
    >
      <div className={s.dialogBody}>
        <Tag>ยืนยันตัวตน</Tag>
        <h2 id="confirm-title" className={s.dialogTitle}>
          ยืนยันเช็กอิน{name}?
        </h2>
        <p className={s.dialogMeta}>
          {code} • {eventName}
        </p>
        <p className={s.dialogHint}>ตรวจสอบชื่อและโทรศัพท์กับผู้เข้าร่วมก่อนยืนยัน</p>
        <div className={s.dialogActions}>
          <Button variant="ghost" onClick={onCancel}>
            ยกเลิก
          </Button>
          <Button onClick={onConfirm} disabled={busy} autoFocus>
            {busy ? "กำลังบันทึก…" : "ยืนยันเช็กอิน"}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
