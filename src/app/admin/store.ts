"use client";

import { useMemo, useSyncExternalStore } from "react";

export type Account = {
  name: string;
  email: string;
  role: "System Admin" | "Event Manager" | "Staff";
  status: "ใช้งาน" | "รอเปลี่ยนรหัสผ่าน";
  suspended?: boolean;
  event: string;
};
export type AdminEvent = { id: string; name: string; owner: string; suspended: boolean };
export type AuditEntry = { action: string; target: string; time: string };
export type AdminSnapshot = { version: 1; accounts: Account[]; events: AdminEvent[]; audit: AuditEntry[] };

const initial: AdminSnapshot = {
  version: 1,
  accounts: [
    { name: "อรุณ", email: "arun@example.com", role: "System Admin", status: "ใช้งาน", event: "ทุกอีเวนต์" },
    { name: "มินตรา", email: "min@example.com", role: "Event Manager", status: "ใช้งาน", event: "Creative Campus 2026" },
    { name: "ภาคิน", email: "pakin@example.com", role: "Event Manager", status: "ใช้งาน", event: "Design Meetup" },
    { name: "ธนกฤต", email: "tan@example.com", role: "Staff", status: "ใช้งาน", event: "Creative Campus 2026" },
    { name: "ณิชา", email: "nicha@example.com", role: "Staff", status: "ใช้งาน", event: "Creative Campus 2026" },
  ],
  events: [
    { id: "campus", name: "Creative Campus 2026", owner: "มินตรา", suspended: false },
    { id: "meetup", name: "Design Meetup", owner: "ภาคิน", suspended: false },
  ],
  audit: [],
};

const storageKey = "event-survey:admin:workspace:v1";
const changed = "event-survey-admin-change";
const unavailable = "storage-unavailable";

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function valid(value: unknown): value is AdminSnapshot {
  if (!object(value) || value.version !== 1 || !Array.isArray(value.accounts) || !Array.isArray(value.events) || !Array.isArray(value.audit)) return false;
  const accounts = value.accounts.every((item: unknown) => object(item) &&
    typeof item.name === "string" && typeof item.email === "string" && typeof item.event === "string" &&
    ["System Admin", "Event Manager", "Staff"].includes(String(item.role)) &&
    ["ใช้งาน", "รอเปลี่ยนรหัสผ่าน"].includes(String(item.status)) &&
    (item.suspended === undefined || typeof item.suspended === "boolean"));
  const events = value.events.every((item: unknown) => object(item) &&
    typeof item.id === "string" && typeof item.name === "string" && typeof item.owner === "string" && typeof item.suspended === "boolean");
  const audit = value.audit.every((item: unknown) => object(item) &&
    typeof item.action === "string" && typeof item.target === "string" && typeof item.time === "string" && Number.isFinite(Date.parse(item.time)));
  return accounts && events && audit &&
    new Set(value.accounts.map((item) => item.email)).size === value.accounts.length &&
    new Set(value.events.map((item) => item.id)).size === value.events.length;
}

function read() {
  try { return window.localStorage.getItem(storageKey); }
  catch { return unavailable; }
}

function decode(raw: string | null): { snapshot: AdminSnapshot; error: string } {
  if (raw === null) return { snapshot: initial, error: "" };
  if (raw === unavailable) return { snapshot: initial, error: "เบราว์เซอร์ไม่อนุญาตให้บันทึกข้อมูล กรุณาเปิดการจัดเก็บข้อมูลของเว็บไซต์ก่อน" };
  try {
    const snapshot: unknown = JSON.parse(raw);
    if (valid(snapshot)) return { snapshot, error: "" };
  } catch { /* Retain unreadable data instead of overwriting it with demo data. */ }
  return { snapshot: initial, error: "อ่านข้อมูล Admin ที่บันทึกไว้ไม่ได้ ระบบยังเก็บข้อมูลเดิมไว้และจะไม่เขียนทับ" };
}

function subscribe(callback: () => void) {
  const onStorage = (event: StorageEvent) => { if (event.key === storageKey || event.key === null) callback(); };
  window.addEventListener("storage", onStorage);
  window.addEventListener(changed, callback);
  return () => { window.removeEventListener("storage", onStorage); window.removeEventListener(changed, callback); };
}

export function useAdminSnapshot() {
  const raw = useSyncExternalStore(subscribe, read, () => null);
  return useMemo(() => decode(raw), [raw]);
}

// Write the changed data and its audit entry together; never persist passwords.
export function updateAdminSnapshot(change: (current: AdminSnapshot) => AdminSnapshot) {
  const current = decode(read());
  if (current.error) throw new Error(current.error);
  const next = change(current.snapshot);
  if (!valid(next)) throw new Error("ข้อมูล Admin ไม่ถูกต้อง จึงยังไม่ได้บันทึก");
  const snapshot: AdminSnapshot = {
    version: 1,
    accounts: next.accounts.map(({ name, email, role, status, suspended, event }) => ({ name, email, role, status, suspended, event })),
    events: next.events.map(({ id, name, owner, suspended }) => ({ id, name, owner, suspended })),
    audit: next.audit.map(({ action, target, time }) => ({ action, target, time })),
  };
  try { window.localStorage.setItem(storageKey, JSON.stringify(snapshot)); }
  catch { throw new Error("บันทึกไม่ได้ พื้นที่เบราว์เซอร์อาจเต็มหรือถูกปิดกั้น ข้อมูลยังไม่ได้เปลี่ยนแปลง กรุณาลองอีกครั้ง"); }
  window.dispatchEvent(new Event(changed));
}
