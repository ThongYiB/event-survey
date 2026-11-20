"use client";

import { useCallback, useEffect, useState } from "react";
import type { PublicEvent } from "@/lib/public-event";
import type { PublishedRegistration } from "@/lib/registration";
import { supabaseEnabled } from "@/lib/supabase/config";

export function usePublicEvent(eventId?:string) {
  const [configuration, setConfiguration] = useState<PublicEvent | null>(null);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((value) => value + 1), []);
  useEffect(() => {
    if(supabaseEnabled()&&!eventId)return;
    const controller = new AbortController();
    void fetch(`/api/public/event${eventId?`?event=${encodeURIComponent(eventId)}`:""}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => { const result = await response.json(); if (!response.ok) throw new Error(result.message || "โหลดข้อมูลอีเวนต์ไม่ได้");
        if(supabaseEnabled()){const pub=result as PublishedRegistration;return {id:pub.id,details:pub.details,registrationOpen:pub.registration_open,surveyOpen:pub.survey_open,surveyFields:pub.survey_fields,revision:pub.survey_revision} as PublicEvent;}
        return result as PublicEvent; })
      .then((value) => { if (!controller.signal.aborted) { setConfiguration(value); setError(""); } })
      .catch((reason) => { if (!controller.signal.aborted) setError(reason instanceof Error && reason.message ? reason.message : "โหลดข้อมูลอีเวนต์ไม่ได้ กรุณาลองอีกครั้ง"); });
    return () => controller.abort();
  }, [version,eventId]);
  return { configuration, error, refresh };
}
