import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Event Survey",
  description: "ระบบจัดการอีเวนต์ ลงทะเบียน และเช็กอิน",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}

