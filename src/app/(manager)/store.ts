"use client";

import { useSyncExternalStore } from "react";
import { useCloudManager } from "@/components/cloud/manager-context";

const prefix = "event-survey:manager:";
const changed = "event-survey-manager-change";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(changed, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(changed, callback);
  };
}

export function useSaved<T>(key: string, fallback: T): T {
  const cloud = useCloudManager();
  const raw = useSyncExternalStore(subscribe, () => {
    if (cloud) return null;
    try {
      return localStorage.getItem(prefix + key);
    } catch {
      return null;
    }
  }, () => null);
  if (cloud) {
    if (key === "details") return (cloud.data.event?.details ?? fallback) as T;
    if (key === "team") return cloud.data.team as T;
    if (key === "manager") return { name: cloud.data.profile.name } as T;
    return (cloud.data.event?.settings[key] ?? fallback) as T;
  }
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function useSaveSetting() {
  const cloud = useCloudManager();
  return cloud?.save ?? (async (key: string, value: unknown) => saveLocal(key, value));
}

export function saveLocal<T>(key: string, value: T) {
  try {
    localStorage.setItem(prefix + key, JSON.stringify(value));
    window.dispatchEvent(new Event(changed));
    return true;
  } catch {
    return false;
  }
}

export { defaultEventDetails as initialDetails } from "@/lib/public-event";
import { defaultEventDetails as initialDetails } from "@/lib/public-event";


export type EventStatus = "open" | "draft" | "closed";

export type ManagerEvent = {
  id: string;
  name: string;
  startDate: string;
  status: EventStatus;
  registered: number;
  checkedIn: number;
  surveyed: number;
};

export const statusLabels: Record<EventStatus, string> = {
  open: "เปิดรับ",
  draft: "ฉบับร่าง",
  closed: "สิ้นสุดแล้ว",
};

export const initialManager = { name: "คุณมินตรา" };

export const initialEvents: ManagerEvent[] = [
  {
    id: "creative-campus-2026",
    name: initialDetails.name,
    startDate: initialDetails.startDate,
    status: "open",
    registered: 240,
    checkedIn: 186,
    surveyed: 124,
  },
  {
    id: "design-meetup",
    name: "Design Meetup (สมมติ)",
    startDate: "2026-12-12",
    status: "draft",
    registered: 0,
    checkedIn: 0,
    surveyed: 0,
  },
  {
    id: "tech-talk-night",
    name: "Tech Talk Night (สมมติ)",
    startDate: "2026-09-14",
    status: "closed",
    registered: 180,
    checkedIn: 150,
    surveyed: 98,
  },
];
