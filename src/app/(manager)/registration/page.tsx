import AttendeesPage from "../registration";
import { supabaseEnabled } from "@/lib/supabase/config";
import { CloudRegistrationList } from "@/components/cloud/registration-manager";

export default function Page() {
  if (supabaseEnabled()) return <CloudRegistrationList />;
  return <AttendeesPage />;
}
