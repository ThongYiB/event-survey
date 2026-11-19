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
  cloudMode: boolean;
  clearResult: () => void;
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

export function StaffProvider({ children, cloudMode=false }: { children: ReactNode; cloudMode?: boolean }) {
  const [session, setSession] = useState<StaffSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<CheckInResult | null>(null);

  const refresh = useCallback(async () => {
    try {
      const current=await staffApi.getSession();
      setSession(current);
      try {
        const raw=sessionStorage.getItem(STAFF_RESULT_KEY);
        const saved=raw?JSON.parse(raw):null;
        const identity=`${current.staff.id || "demo"}:${current.event.id}`;
        setLastResult(saved?.identity===identity ? saved.result : null);
        if(saved?.identity!==identity) sessionStorage.removeItem(STAFF_RESULT_KEY);
      }catch {setLastResult(null);}
      setError(null);
    } catch (e) {
      setSession(null);
      setLastResult(null);
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
    const initialRefresh = window.setTimeout(() => void refresh(), 0);
    let refreshing=false;
    const timer=window.setInterval(()=>{if(!document.hidden&&!refreshing){refreshing=true;void refresh().finally(()=>{refreshing=false;});}},15000);
    return () => {window.clearTimeout(initialRefresh);window.clearInterval(timer);};
  }, [refresh]);

  const staffId=session?.staff.id || "demo";
  const applyResult = useCallback((result: CheckInResult) => {
    setLastResult(result);
    setSession((s) => (s ? { ...s, stats: result.stats as EventStats } : s));
    try {
      sessionStorage.setItem(STAFF_RESULT_KEY, JSON.stringify({identity:`${staffId}:${result.event.id}`,result}));
    } catch {
      /* ignore */
    }
    return result.status;
  }, [staffId]);

  const clearResult=useCallback(()=>{setLastResult(null);try{sessionStorage.removeItem(STAFF_RESULT_KEY);}catch{}},[]);

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
      value={{ cloudMode,clearResult,session, loading, error, lastResult, refresh, checkIn, registerWalkIn, simulateScan }}
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
