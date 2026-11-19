"use client";

import type { ReactNode } from "react";
import type { StaffSession } from "@/lib/staff/types";
import s from "../staff.module.css";
import { useStaff } from "../_lib/store";
import { AlertCircleIcon } from "./icons";
import { Button, Notice } from "./ui";

/** แสดงหน้าเมื่อโหลดข้อมูล Staff เสร็จแล้ว พร้อมสถานะกำลังโหลด/ผิดพลาด */
export default function WithSession({ children }: { children: (session: StaffSession) => ReactNode }) {
  const { session, loading, error, refresh } = useStaff();

  if (session) return <>{children(session)}</>;
  if (loading) return <p className={s.loading} role="status">กำลังโหลดข้อมูล…</p>;
  return (
    <>
      <Notice tone="bad" icon={<AlertCircleIcon />} title="โหลดข้อมูลไม่สำเร็จ">
        {error}
      </Notice>
      <Button onClick={() => void refresh()}>ลองอีกครั้ง</Button>
    </>
  );
}
