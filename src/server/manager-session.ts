import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const managerCookie = "event-survey-manager";
export const managerSessionSeconds = 8 * 60 * 60;
export function isSameOrigin(request: Request) {
  try {
    const origin = new URL(request.headers.get("origin") || "");
    const protocol = request.headers.get("x-forwarded-proto")?.split(",")[0].trim() || new URL(request.url).protocol.slice(0, -1);
    return ["http", "https"].includes(protocol) && origin.protocol === `${protocol}:` && origin.host === request.headers.get("host");
  } catch { return false; }
}
const state = globalThis as typeof globalThis & { eventSurveyManagerSecret?: string };

function secret() {
  const configured = process.env.MANAGER_DEMO_SESSION_SECRET;
  if (configured && configured.length >= 32) return configured;
  if (process.env.NODE_ENV === "development") return state.eventSurveyManagerSecret ??= randomBytes(32).toString("hex");
}

function equal(a: string, b: string) {
  const left = Buffer.from(a), right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function signInManager(email: unknown, password: unknown) {
  const development = process.env.NODE_ENV === "development";
  const expected = process.env.MANAGER_DEMO_PASSWORD || (development ? "1234" : "");
  const key = secret();
  if (!key || !expected || (!development && expected.length < 16)) return { status: 503 };
  if (email !== "manager@example.com" || typeof password !== "string" || !equal(password, expected)) return { status: 401 };
  const expires = String(Math.floor(Date.now() / 1000) + managerSessionSeconds);
  return { status: 200, token: `${expires}.${createHmac("sha256", key).update(expires).digest("hex")}` };
}

export function isManagerSession(token: string | undefined) {
  const key = secret(), match = token?.match(/^(\d{10})\.([a-f0-9]{64})$/);
  if (!key || !match || Number(match[1]) <= Date.now() / 1000) return false;
  return equal(createHmac("sha256", key).update(match[1]).digest("hex"), match[2]);
}
