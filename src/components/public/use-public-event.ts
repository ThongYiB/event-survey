"use client";

import { useCallback, useEffect, useState } from "react";
import type { PublicEvent } from "@/lib/public-event";

export function usePublicEvent() {
  const [configuration, setConfiguration] = useState<PublicEvent | null>(null);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((value) => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/public/event", { cache: "no-store", signal: controller.signal })
      .then(async (response) => { const result = await response.json(); if (!response.ok) throw new Error(result.message || "โหลดข้อมูลอีเวนต์ไม่ได้"); return result as PublicEvent; })
      .then((value) => { if (!controller.signal.aborted) { setConfiguration(value); setError(""); } })
      .catch((reason) => { if (!controller.signal.aborted) setError(reason instanceof Error && reason.message ? reason.message : "โหลดข้อมูลอีเวนต์ไม่ได้ กรุณาลองอีกครั้ง"); });
    return () => controller.abort();
  }, [version]);
  return { configuration, error, refresh };
}
