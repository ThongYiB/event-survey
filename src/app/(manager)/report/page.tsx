import ReportsPage from "../report";
import { supabaseEnabled } from "@/lib/supabase/config";
import { CloudFeaturePending } from "@/components/cloud/pending";

export default function Page() {
  if (supabaseEnabled()) return <CloudFeaturePending title="รายงานผลอีเวนต์" />;
  return <ReportsPage />;
}
