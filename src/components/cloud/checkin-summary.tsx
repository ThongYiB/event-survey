"use client";
import { useEffect,useState } from "react";
import type { EventStats } from "@/lib/staff/types";

export type CheckinSummary={eventId:string;stats:EventStats;walkin:number;timeline:{time:string;count:number}[]};
export function useCheckinSummary(version=0) {
  const [pulse,setPulse]=useState(0);
  useEffect(()=>{const timer=setInterval(()=>{if(!document.hidden)setPulse(v=>v+1);},15000);return()=>clearInterval(timer);},[]);
  const [data,setData]=useState<CheckinSummary[]|null>(null);
  const [error,setError]=useState("");
  useEffect(()=>{
    const controller=new AbortController();
    void fetch("/api/manager/checkin-summary",{cache:"no-store",signal:controller.signal}).then(async response=>{const body=await response.json();if(!response.ok)throw new Error(body.message);return body.events as CheckinSummary[];}).then(result=>{if(!controller.signal.aborted){setData(result);setError("");}}).catch(error=>{if(!controller.signal.aborted)setError(error.message);});
    return()=>controller.abort();
  },[version,pulse]);
  return{data,error};
}
