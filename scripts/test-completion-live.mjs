import {readFile,writeFile} from 'node:fs/promises';import {createClient} from '@supabase/supabase-js';import {randomBytes,randomUUID} from 'node:crypto';import assert from 'node:assert/strict';
const file=new URL('../.vercel/registration-qa.json',import.meta.url);
if(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname!=='nstdlvkfvkugqttafyou.supabase.co')throw new Error('Unexpected test project');
const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
let cleanupStaff;
if(process.argv.includes('--cleanup')){const f=JSON.parse(await readFile(file,'utf8'));cleanupStaff=f.extraStaff;}
await import('./test-survey-live.mjs');
if(cleanupStaff?.email?.endsWith('@example.test')){const {error}=await admin.auth.admin.deleteUser(cleanupStaff.id);if(error)throw error;}
if(!process.argv.includes('--cleanup')){
 const f=JSON.parse(await readFile(file,'utf8')),base=process.env.REGISTRATION_TEST_URL||'http://127.0.0.1:3000',manager=new Map(),staff=new Map();
 async function call(path,method='GET',body,jar=new Map()){const r=await fetch(base+path,{method,headers:{Cookie:[...jar].map(([k,v])=>`${k}=${v}`).join('; '),...(method!=='GET'?{Origin:base,'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),redirect:'manual'});for(const c of r.headers.getSetCookie()){const pair=c.split(';')[0],i=pair.indexOf('=');jar.set(pair.slice(0,i),pair.slice(i+1));}return{status:r.status,body:await r.json()};}
 assert.equal((await call('/api/auth/sign-in','POST',{email:f.email,password:f.password},manager)).status,200);
 const u={email:`qa-join-${randomUUID()}@example.test`,password:randomBytes(32).toString('hex')};const created=await admin.auth.admin.createUser({email:u.email,password:u.password,email_confirm:true,user_metadata:{name:'ทีมงานสมัครทดสอบ'}});if(created.error)throw created.error;f.extraStaff={...u,id:created.data.user.id};await writeFile(file,JSON.stringify(f));
 assert.equal((await call('/api/auth/sign-in','POST',u,staff)).status,200);
 const invite=await call('/api/manager/staff-invite','POST',{},manager);assert.equal(invite.status,200);let path=invite.body.path;let query=new URL(path,base).searchParams;
 assert.equal((await call(`/api/public/staff-signup?${query}`)).status,200);
 const join={event:f.eventId,invite:query.get('invite'),action:'join'};
 assert.equal((await call('/api/public/staff-signup','POST',join)).status,401);
 assert.equal((await call('/api/public/staff-signup','POST',join,staff)).status,200);
 assert.equal((await call('/api/staff/session','GET',undefined,staff)).status,409);
 const workspace=await call('/api/manager/events','GET',undefined,manager);assert.ok(workspace.body.team.some(m=>m.email===u.email&&m.access.length===0));
 assert.equal((await call('/api/manager/events','PUT',{key:'team',value:[{name:'ทีมงานสมัครทดสอบ',email:u.email,access:['ค้นหาผู้ลงทะเบียน','เช็กอิน','แสดง QR แบบสอบถาม']}]},manager)).status,200);
 assert.equal((await call('/api/staff/session','GET',undefined,staff)).status,200);
 assert.equal((await call('/api/public/staff-signup','POST',join,staff)).status,200);
 assert.equal((await call('/api/staff/session','GET',undefined,staff)).status,200);
 const next=await call('/api/manager/staff-invite','POST',{},manager);assert.equal(next.status,200);assert.equal((await call(`/api/public/staff-signup?${query}`)).status,404);f.invitePath=next.body.path;await writeFile(file,JSON.stringify(f));
 const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/ltsAAAAASUVORK5CYII=';
 const kiosk={published:true,screens:['ทางเข้าหลัก'],startsAt:'',endsAt:'',media:[{id:'qa-poster',name:'โปสเตอร์ทดสอบ',type:'image',src:png,seconds:10}]};
 assert.equal((await call('/api/manager/events','PUT',{key:'kiosk',value:kiosk},manager)).status,200);
 const published=await call(`/api/public/kiosk?event=${f.eventId}`);assert.equal(published.status,200);assert.equal(published.body.settings.media.length,1);
 assert.equal((await call('/api/manager/events','PUT',{key:'kiosk',value:{...kiosk,media:[{...kiosk.media[0],src:'javascript:alert(1)'}]}},manager)).status,400);
 await call('/api/manager/events','PUT',{key:'kiosk',value:{...kiosk,published:false}},manager);assert.equal((await call(`/api/public/kiosk?event=${f.eventId}`)).body.settings,null);
 await call('/api/manager/events','PUT',{key:'kiosk',value:kiosk},manager);
 console.log('PASS: live Staff invitation, anonymous denial, pending request, Manager permission assignment, repeated join, invite rotation, Kiosk publication, media validation and unpublish');
}
