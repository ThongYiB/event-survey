import type { Metadata } from "next";
import { QrCenter } from "./qr-center";
import { supabaseEnabled } from "@/lib/supabase/config";
import { CloudFeaturePending } from "@/components/cloud/pending";

export const metadata: Metadata = { title: "QR Center | Event Survey" };

export default function Page() {
  if (supabaseEnabled()) return <CloudFeaturePending title="QR Center" />;
  return <QrCenter />;
}
