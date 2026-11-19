"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type {
  CheckInResult,
  CheckInVia,
  EventStats,
  ScanStatus,
  StaffSession,
  WalkInInput,
} from "@/lib/staff/types";
import { staffApi, StaffApiError } from "./api";

export const IS_DEV = process.env.NODE_ENV !== "production";

export const STAFF_RESULT_KEY = "event-survey:staff:last-result";

interface StaffContextValue {
  session: StaffSession | null;
  loading: boolean;
  error: string | null;
  lastResult: CheckInResult | null;
  refresh: () => Promise<void>;
  /** เช็กอินด้วยรหัส/ข้อความจาก QR — คืนสถานะ หรือ throw StaffApiError */
  checkIn: (code: string, via: CheckInVia) => Promise<ScanStatus>;
  registerWalkIn: (input: WalkInInput) => Promise<ScanStatus>;
  /** dev: เช็กอินด้วยรหัสตัวอย่างของสถานะที่ต้องการ */
  simulateScan: (kind: ScanStatus) => Promise<ScanStatus>;
}

const StaffContext = createContext<StaffContextValue | null>(null);

export function StaffProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StaffSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<CheckInResult | null>(null);

  const refresh = useCallback(async () => {
    try {
      setSession(await staffApi.getSession());
      setError(null);
    } catch (e) {
      if (e instanceof StaffApiError && e.status === 401) {
        window.location.replace("/login");
        return;
      }
      setError(e instanceof StaffApiError ? e.message : "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // ผลการสแกนล่าสุด เก็บใน sessionStorage เพื่อให้รีเฟรชหน้าผลลัพธ์แล้วยังเห็นอยู่
    try {
      const raw = sessionStorage.getItem(STAFF_RESULT_KEY);
      if (raw) {
        const previous = JSON.parse(raw) as CheckInResult;
        queueMicrotask(() => setLastResult(previous));
      }
    } catch {
      /* ignore */
    }
    const initialRefresh = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(initialRefresh);
  }, [refresh]);

  const applyResult = useCallback((result: CheckInResult) => {
    setLastResult(result);
    setSession((s) => (s ? { ...s, stats: result.stats as EventStats } : s));
    try {
      sessionStorage.setItem(STAFF_RESULT_KEY, JSON.stringify(result));
    } catch {
      /* ignore */
    }
    return result.status;
  }, []);

  const checkIn = useCallback(
    async (code: string, via: CheckInVia) => applyResult(await staffApi.checkIn(code, via)),
    [applyResult],
  );

  const registerWalkIn = useCallback(
    async (input: WalkInInput) => applyResult(await staffApi.registerWalkIn(input)),
    [applyResult],
  );

  const simulateScan = useCallback(
    async (kind: ScanStatus) => {
      const { code } = await staffApi.devSampleCode(kind);
      return checkIn(code, "qr");
    },
    [checkIn],
  );

  return (
    <StaffContext.Provider
      value={{ session, loading, error, lastResult, refresh, checkIn, registerWalkIn, simulateScan }}
    >
      {children}
    </StaffContext.Provider>
  );
}

export function useStaff() {
  const ctx = useContext(StaffContext);
  if (!ctx) throw new Error("useStaff ต้องใช้ภายใน <StaffProvider>");
  return ctx;
}
