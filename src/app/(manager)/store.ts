"use client";

import { useSyncExternalStore } from "react";

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
  const raw = useSyncExternalStore(subscribe, () => {
    try {
      return localStorage.getItem(prefix + key);
    } catch {
      return null;
    }
  }, () => null);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
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

export const initialDetails = {
  name: "Creative Campus 2026",
  description: "พื้นที่แลกเปลี่ยนไอเดียสร้างสรรค์ของนักศึกษา ร่วมฟังเสวนา ทดลองเวิร์กช็อป และชมผลงานจากชุมชนมหาวิทยาลัย",
  venue: "หอประชุมมหาวิทยาลัย",
  startDate: "2026-11-25",
  endDate: "2026-11-25",
  startTime: "09:00",
  endTime: "16:00",
  color: "#007f82",
  logo: "",
  banner: "",
};

