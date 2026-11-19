// Ephemeral QA users/events only. No real accounts or attendee records are modified.
import { createClient } from "@supabase/supabase-js";
import { randomBytes,randomUUID } from "node:crypto";
import { readFile,writeFile,unlink } from "node:fs/promises";
import assert from "node:assert/strict";
const fixturePath=new URL('../.vercel/staff-qa.json',import.meta.url);
if(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname!=="nstdlvkfvkugqttafyou.supabase.co")throw new Error('Unexpected test project');
const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const base=process.env.STAFF_TEST_URL||'http://127.0.0.1:3000';
async function remove(fixture) {
  for(const id of fixture.events||[]) {const {data}=await admin.from('events').select('name').eq('id',id).maybeSingle();if(data?.name.startsWith('[QA Staff]')){const {error}=await admin.from('events').delete().eq('id',id);if(error)throw error;}}
  for(const user of fixture.users||[])if(user.id&&user.email?.endsWith('@example.test')){const {error}=await admin.auth.admin.deleteUser(user.id);if(error)throw error;}
  await unlink(fixturePath).catch(()=>{});
}
if(process.argv.includes('--cleanup')){await remove(JSON.parse(await readFile(fixturePath,'utf8')));console.log('Removed QA Staff events, check-ins, registrations and QA users only');}
else {
  const fixture={users:[],events:[]};
  async function call(path,method='GET',body,jar=new Map(),origin=base) {
    const response=await fetch(base+path,{method,headers:{Cookie:[...jar].map(([k,v])=>`${k}=${v}`).join('; '),...(method!=='GET'?{Origin:origin,'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),redirect:'manual'});
    for(const cookie of response.headers.getSetCookie()){const [entry]=cookie.split(';');const index=entry.indexOf('=');jar.set(entry.slice(0,index),entry.slice(index+1));}
    return {status:response.status,body:await response.json()};
  }
  async function user(role,name) {
    const u={email:`qa-staff-${randomUUID()}@example.test`,password:randomBytes(32).toString('hex'),name};
    const created=await admin.auth.admin.createUser({email:u.email,password:u.password,email_confirm:true,user_metadata:{name}});if(created.error)throw created.error;u.id=created.data.user.id;fixture.users.push(u);
    if(role!=='staff'){const {error}=await admin.from('profiles').update({role}).eq('id',u.id);if(error)throw error;}
    return u;
  }
  const login=async(u)=>{const jar=new Map();const r=await call('/api/auth/sign-in','POST',{email:u.email,password:u.password},jar);assert.equal(r.status,200,JSON.stringify(r.body));return jar;};
  try {
    const manager=await user('event_manager','ผู้จัดงานทดสอบ'),staff=await user('staff','ทีมงานทดสอบ'),outsider=await user('staff','ผู้ไม่มีสิทธิ์');
    fixture.staff=staff;fixture.manager=manager;
    const managerJar=await login(manager),staffJar=await login(staff),outsiderJar=await login(outsider);
    for(const name of ['Creative Campus — ตรวจระบบเช็กอิน','อีเวนต์อื่น']){
      const e=await call('/api/manager/events','POST',{name:`[QA Staff] ${name}`},managerJar);assert.equal(e.status,201,JSON.stringify(e.body));fixture.events.push(e.body.id);
      const publish=await call('/api/manager/public-event','PUT',{open:true,capacity:10},managerJar);assert.equal(publish.status,200,JSON.stringify(publish.body));
    }
    const [eventId,otherEvent]=fixture.events;fixture.eventId=eventId;
    const permissions=['ค้นหาผู้ลงทะเบียน','เช็กอิน','ลงทะเบียน Walk-in','แสดง QR แบบสอบถาม'];
    const {error:assignmentError}=await admin.from('event_members').insert({event_id:eventId,user_id:staff.id,permissions});if(assignmentError)throw assignmentError;
    assert.equal((await call('/api/staff/active-event','POST',{id:eventId},staffJar)).status,200);
    const workspace=await call('/api/staff/cloud-events','GET',undefined,staffJar);assert.equal(workspace.status,200,JSON.stringify(workspace.body));assert.equal(workspace.body.events.length,1);
    const session=await call('/api/staff/session','GET',undefined,staffJar);assert.equal(session.status,200,JSON.stringify(session.body));assert.equal(session.body.event.id,eventId);
    assert.equal((await call('/api/staff/active-event','POST',{id:otherEvent},staffJar)).status,403);
    assert.equal((await call('/api/staff/session')).status,401);
    assert.equal((await call('/api/staff/active-event','POST',{id:eventId},outsiderJar)).status,403);
    const register=async(event,email,name)=>{
      const config=await call(`/api/public/event?event=${event}`),jar=new Map();assert.equal(config.status,200);
      const r=await call('/api/attendee/registrations','POST',{eventId:event,revision:config.body.revision,requestKey:randomBytes(16).toString('hex'),answers:{name,email,phone:'0891234567'}},jar);assert.equal(r.status,201,JSON.stringify(r.body));
      const ticket=await call(`/api/attendee/ticket?event=${event}`,'GET',undefined,jar);assert.equal(ticket.status,200);return ticket.body.ticketCode;
    };
    const token=await register(eventId,'staff-guest@example.test','ผู้เข้าร่วม ทดสอบ');
    await register(eventId,'staff-search@example.test','ค้นหารายชื่อ ทดสอบ');
    const foreign=await register(otherEvent,'private@example.test','ข้อมูล อีกงาน');
    const scan=(code,via='qr')=>call('/api/staff/check-ins','POST',{code,via},staffJar);
    const wrong=await scan(`ES1:${otherEvent}:${foreign}`);assert.equal(wrong.status,200);assert.equal(wrong.body.status,'wrong-event');assert.equal(wrong.body.attendee,null);assert.ok(!JSON.stringify(wrong.body).includes('private@example.test'));
    assert.equal((await scan('invalid')).body.status,'not-found');
    const simultaneous=await Promise.all([scan(`ES1:${eventId}:${token}`),scan(`ES1:${eventId}:${token}`)]);
    assert.deepEqual(simultaneous.map(r=>r.body.status).sort(),['duplicate','success']);assert.equal(simultaneous[1].body.stats.checkedIn,1);
    assert.ok(!JSON.stringify(simultaneous).includes(token),'Scan responses must not expose ticket credentials');
    const search=await call('/api/staff/attendees?q=staff-search','GET',undefined,staffJar);assert.equal(search.status,200,JSON.stringify(search.body));assert.equal(search.body.attendees.length,1);assert.equal((await scan(search.body.attendees[0].code,'search')).body.status,'success');
    const walkin={name:'หน้างาน ทดสอบ',email:'staff-walkin@example.test',phone:'0891234567',verified:true};
    const wi=await call('/api/staff/walk-ins','POST',walkin,staffJar);assert.equal(wi.status,201,JSON.stringify(wi.body));assert.equal(wi.body.stats.checkedIn,3);assert.equal(wi.body.stats.registered,3);
    assert.equal((await call('/api/staff/walk-ins','POST',walkin,staffJar)).status,409);
    assert.equal((await call('/api/staff/check-ins','POST',{code:'invalid',via:'qr'},staffJar,'https://untrusted.example')).status,403);
    const list=await call(`/api/manager/registrations?event=${eventId}`,'GET',undefined,managerJar);assert.equal(list.status,200,JSON.stringify(list.body));assert.equal(list.body.total,3);assert.ok(list.body.rows.every(row=>row.checkins));
    const summary=await call('/api/manager/checkin-summary','GET',undefined,managerJar);assert.equal(summary.status,200,JSON.stringify(summary.body));assert.equal(summary.body.events.find(e=>e.eventId===eventId).stats.checkedIn,3);
    await admin.from('event_members').update({permissions:['ค้นหาผู้ลงทะเบียน']}).eq('event_id',eventId).eq('user_id',staff.id);
    assert.equal((await scan(`ES1:${eventId}:${token}`)).status,403);
    await admin.from('event_members').update({permissions}).eq('event_id',eventId).eq('user_id',staff.id);
    await admin.from('profiles').update({suspended:true}).eq('id',staff.id);assert.equal((await scan('invalid')).status,403);await admin.from('profiles').update({suspended:false}).eq('id',staff.id);
    // Select the tested event in the Manager browser session for follow-up UI review.
    await call('/api/manager/active-event','POST',{id:eventId},managerJar);
    await writeFile(fixturePath,JSON.stringify(fixture),'utf8');
    console.log('PASS: real Staff sign-in, assigned events, foreign QR privacy, concurrent duplicate protection, search confirmation, Walk-in, Manager status/report, CSRF and live permission revocation');
    console.log('QA fixtures ready for browser review; no actual attendee data was used');
  }catch(error){await remove(fixture);throw error;}
}
