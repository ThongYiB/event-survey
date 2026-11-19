// Creates only clearly marked QA fixtures; run --cleanup to remove these exact fixtures.
import { createClient } from "@supabase/supabase-js";
import { randomBytes, randomUUID } from "node:crypto";
import { readFile, writeFile, unlink } from "node:fs/promises";
import assert from "node:assert/strict";

const fixturePath = new URL("../.vercel/registration-qa.json", import.meta.url);
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
if (new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname !== "nstdlvkfvkugqttafyou.supabase.co") throw new Error("Unexpected test project");
const base = process.env.REGISTRATION_TEST_URL || "http://127.0.0.1:3000";
async function remove(fixture) {
  if (fixture.eventId) { const { data } = await admin.from("events").select("name").eq("id", fixture.eventId).maybeSingle(); if (data && data.name.startsWith("[QA registration]")) { const { error } = await admin.from("events").delete().eq("id", fixture.eventId); if (error) throw error; } }
  if (fixture.userId && fixture.email?.endsWith("@example.test")) { const { error } = await admin.auth.admin.deleteUser(fixture.userId); if (error) throw error; }
  await unlink(fixturePath).catch(() => {});
}
if (process.argv.includes("--cleanup")) {
  await remove(JSON.parse(await readFile(fixturePath, "utf8"))); console.log("Removed the QA event, registrations and QA account only");
} else {
  const fixture = { email: `qa-registration-${randomUUID()}@example.test`, password: randomBytes(32).toString("hex") };
  const manager = new Map(), guest = new Map();
  async function call(path, method="GET", body, jar=new Map()) {
    const response = await fetch(base+path, { method, headers: { Cookie: [...jar].map(([k,v]) => `${k}=${v}`).join("; "), ...(method!=="GET" ? {Origin:base,"Content-Type":"application/json"} : {}) }, ...(body ? {body:JSON.stringify(body)} : {}), redirect:"manual" });
    for (const cookie of response.headers.getSetCookie()) { const [entry] = cookie.split(";"); const index = entry.indexOf("="); if (/max-age=0/i.test(cookie)) jar.delete(entry.slice(0,index)); else jar.set(entry.slice(0,index),entry.slice(index+1)); }
    return { status:response.status, body:await response.json() };
  }
  try {
    const user = await admin.auth.admin.createUser({ email:fixture.email,password:fixture.password,email_confirm:true,user_metadata:{name:"QA registration"} });
    if (user.error) throw user.error; fixture.userId=user.data.user.id;
    const role = await admin.from("profiles").update({ role:"event_manager" }).eq("id",fixture.userId); if(role.error)throw role.error;
    assert.equal((await call("/api/auth/sign-in","POST",{email:fixture.email,password:fixture.password},manager)).status,200);
    const event = await call("/api/manager/events","POST",{name:"[QA registration] ทดสอบลงทะเบียนและ QR"},manager);
    assert.equal(event.status,201,JSON.stringify(event.body)); fixture.eventId=event.body.id;
    let pub = await call("/api/manager/public-event","PUT",{open:true,capacity:1},manager); assert.equal(pub.status,200,JSON.stringify(pub.body));
    let config = await call(`/api/public/event?event=${fixture.eventId}`); assert.equal(config.status,200); assert.equal(config.body.registration_open,true);
    const input = {eventId:fixture.eventId,revision:config.body.revision,requestKey:randomBytes(16).toString("hex"),answers:{name:"ผู้ทดสอบระบบ",email:"qa-guest@example.test",phone:""}};
    assert.equal((await call("/api/attendee/registrations","POST",{...input,answers:{...input.answers,email:"invalid"}},guest)).status,400);
    let registered = await call("/api/attendee/registrations","POST",input,guest); assert.equal(registered.status,201,JSON.stringify(registered.body));
    assert.equal((await call("/api/attendee/registrations","POST",input,guest)).status,200);
    assert.equal((await call("/api/attendee/registrations","POST",{...input,requestKey:randomBytes(16).toString("hex")},guest)).status,409);
    assert.equal((await call("/api/attendee/registrations","POST",{...input,requestKey:randomBytes(16).toString("hex"),answers:{...input.answers,email:"other@example.test"}},guest)).status,409);
    assert.equal((await call(`/api/attendee/ticket?event=${fixture.eventId}`)).status,404);
    const ticket = await call(`/api/attendee/ticket?event=${fixture.eventId}`,"GET",undefined,guest); assert.equal(ticket.status,200); assert.match(ticket.body.ticketCode,/^[a-f0-9]{32}$/);
    const list = await call(`/api/manager/registrations?event=${fixture.eventId}`,"GET",undefined,manager); assert.equal(list.status,200,JSON.stringify(list.body)); assert.equal(list.body.total,1); assert.equal(list.body.rows[0].ticket_code,undefined);
    assert.equal((await call(`/api/manager/registrations?event=${fixture.eventId}`)).status,401);
    await call("/api/manager/public-event","PUT",{open:false,capacity:3},manager);
    assert.equal((await call(`/api/attendee/ticket?event=${fixture.eventId}`,"GET",undefined,guest)).status,200);
    config=await call(`/api/public/event?event=${fixture.eventId}`); assert.equal(config.body.registration_open,false);
    assert.equal((await call("/api/attendee/registrations","POST",{...input,revision:config.body.revision,requestKey:randomBytes(16).toString("hex"),answers:{...input.answers,email:"closed@example.test"}},guest)).status,409);
    assert.equal((await call("/api/manager/public-event","PUT",{open:true,capacity:3},manager)).status,200);
    await writeFile(fixturePath,JSON.stringify(fixture),"utf8");
    console.log("PASS: real Supabase sign-in, event publication, validation, registration, retry, capacity, ticket cookie, Manager list, private data and closed-event behavior");
    console.log("QA fixture prepared for browser review; no real attendee data was used");
  } catch(error) { await remove(fixture); throw error; }
}
