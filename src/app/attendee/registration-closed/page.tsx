import { ClosedEventPage } from "../event-state";
import { supabaseEnabled } from "@/lib/supabase/config";
import { CloudAttendeeRegistration } from "@/components/cloud/attendee-registration";
import {Suspense} from 'react';

export default function Page() { return supabaseEnabled() ? <CloudAttendeeRegistration mode="register" /> : <Suspense fallback={<p>กำลังโหลด…</p>}><ClosedEventPage kind="registration" /></Suspense>; }
