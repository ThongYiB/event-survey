import AttendeesPage from "../registration";
import { supabaseEnabled } from "@/lib/supabase/config";
import { CloudFeaturePending } from "@/components/cloud/pending";

export default function Page() {
  if (supabaseEnabled()) return <CloudFeaturePending title="ผู้ลงทะเบียน" />;
  return <AttendeesPage />;
}
