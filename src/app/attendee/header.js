"use client";
import Link from "next/link";
import {useSearchParams} from 'next/navigation';

export default function Header() {
  const event=useSearchParams().get('event');
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-black/5 bg-white px-4 py-3">
      <Link href={event?`/attendee?event=${encodeURIComponent(event)}`:'/attendee'} className="flex items-center gap-2 text-sm font-semibold">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand text-xs font-bold text-white" aria-hidden="true">ES</span>
        Event Survey
      </Link>
      <span className="rounded-full bg-brand-light px-3 py-1 text-xs font-medium text-brand">
        ผู้เข้าร่วม
      </span>
    </header>
  );
}

