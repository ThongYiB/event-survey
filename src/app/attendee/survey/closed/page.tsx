import { ClosedEventPage } from "../../event-state";
import {Suspense} from 'react';

export default function Page() { return <Suspense fallback={<p>กำลังโหลด…</p>}><ClosedEventPage kind="survey" /></Suspense>; }
