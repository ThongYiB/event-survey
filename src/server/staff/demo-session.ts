import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const staffSessionCookie = "event-survey-staff";
export const staffSessionSeconds = 8 * 60 * 60;

const devState = globalThis as typeof globalThis & { eventSurveyStaffSecret?: string };

function secret() {
  const configured = process.env.STAFF_DEMO_SESSION_SECRET;
  if (configured && configured.length >= 32) return configured;
  if (process.env.NODE_ENV === "development") {
    return (devState.eventSurveyStaffSecret ??= randomBytes(32).toString("hex"));
  }
}

function equal(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function startStaffSession(password: unknown) {
  const development = process.env.NODE_ENV === "development";
  const configured = process.env.STAFF_DEMO_PASSWORD;
  const expected = development ? configured || "1234" : configured;
  const key = secret();
  if (!key || !expected || (!development && expected.length < 16)) {
    return { status: 503 };
  }
  if (typeof password !== "string" || !equal(expected, password)) return { status: 401 };

  const expiry = String(Math.floor(Date.now() / 1000) + staffSessionSeconds);
  const signature = createHmac("sha256", key).update(expiry).digest("hex");
  return { status: 200, token: `${expiry}.${signature}` };
}

export function isStaffSession(token: string | undefined) {
  const key = secret();
  const match = token?.match(/^(\d{10})\.([a-f0-9]{64})$/);
  if (!key || !match || Number(match[1]) <= Math.floor(Date.now() / 1000)) return false;

  const signature = createHmac("sha256", key).update(match[1]).digest("hex");
  return equal(signature, match[2]);
}
