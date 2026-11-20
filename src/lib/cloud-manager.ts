import type { defaultEventDetails } from "./public-event";

export type CloudManagerEvent = { id: string; name: string; status: "draft" | "open" | "closed"; details: typeof defaultEventDetails; settings: Record<string, unknown> };
export type CloudManagerData = { preview?:boolean;mediaLoaded?:boolean;profile: { id: string; name: string }; events: CloudManagerEvent[]; event: CloudManagerEvent | null; team: { name: string; email: string; access: string[] }[] };
