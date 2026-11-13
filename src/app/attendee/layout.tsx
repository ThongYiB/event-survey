import type { Metadata } from "next";
import Header from "./header";
import BottomNav from "./bottom-nav";
import "./attendee.css";

export const metadata: Metadata = { title: "ผู้เข้าร่วมงาน | Event Survey" };

export default function AttendeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="attendee-stage">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-surface shadow-xl">
        <Header />
        {children}
        <BottomNav />
      </div>
    </div>
  );
}
