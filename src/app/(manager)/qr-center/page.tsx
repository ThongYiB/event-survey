import type { Metadata } from "next";
import { QrCenter } from "./qr-center";

export const metadata: Metadata = { title: "QR Center | Event Survey" };

export default function Page() {
  return <QrCenter />;
}
