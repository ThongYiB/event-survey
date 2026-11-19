import ReportsPage from "../report";
import { supabaseEnabled } from "@/lib/supabase/config";
import { CloudReports } from "@/components/cloud/survey-manager";

export default function Page() {
  if (supabaseEnabled()) return <CloudReports />;
  return <ReportsPage />;
}
