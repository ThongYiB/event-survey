"use client";

import type { ReactNode } from "react";
import type { StaffSession } from "@/lib/staff/types";
import s from "../staff.module.css";
import { useStaff } from "../_lib/store";
import { AlertCircleIcon } from "./icons";
import { Button,ButtonLink, Notice } from "./ui";

/** แสดงหน้าเมื่อโหลดข้อมูล Staff เสร็จแล้ว พร้อมสถานะกำลังโหลด/ผิดพลาด */
export default function WithSession({ children,required=[] }: { children: (session: StaffSession) => ReactNode; required?: string[] }) {
  const { session, loading, error, refresh,cloudMode } = useStaff();

  if(session && cloudMode && required.some(p=>!session.access?.includes(p))) return <><Notice tone="bad" icon={<AlertCircleIcon />} title="ไม่มีสิทธิ์ในส่วนนี้">ติดต่อ Event Manager เพื่อขอสิทธิ์เพิ่มเติม</Notice><ButtonLink href="/staff">กลับไปเลือกงาน</ButtonLink></>;

  if (session) return <>{children(session)}</>;
  if (loading) return <p className={s.loading} role="status">กำลังโหลดข้อมูล…</p>;
  return (
    <>
      <Notice tone="bad" icon={<AlertCircleIcon />} title="โหลดข้อมูลไม่สำเร็จ">
        {error}
      </Notice>
      <Button onClick={() => void refresh()}>ลองอีกครั้ง</Button>
      <ButtonLink href="/staff" variant="ghost">เลือกงานที่ได้รับมอบหมาย</ButtonLink>
    </>
  );
}
