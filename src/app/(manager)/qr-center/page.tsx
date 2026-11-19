import type { Metadata } from "next";
import { QrCenter } from "./qr-center";
import { supabaseEnabled } from "@/lib/supabase/config";
import { CloudRegistrationQr } from "@/components/cloud/registration-manager";

export const metadata: Metadata = { title: "QR Center | Event Survey" };

export default function Page() {
  if (supabaseEnabled()) return <CloudRegistrationQr />;
  return <QrCenter />;
}
