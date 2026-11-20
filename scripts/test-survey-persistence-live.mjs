// Reuses disposable registration QA only; never changes real events.
import {readFile,writeFile} from 'node:fs/promises';
import {createClient} from '@supabase/supabase-js';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
const path=new URL('../.vercel/registration-qa.json',import.meta.url);
if(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname!=='nstdlvkfvkugqttafyou.supabase.co')throw Error('Unexpected QA project');
const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false}});
const f=JSON.parse(await readFile(path,'utf8'));
if(!f.email.endsWith('@example.test'))throw Error('QA fixture required');
if(process.argv.includes('--cleanup')){
 if(f.surveyExtraEvent){const {data}=await admin.from('events').select('name,owner_id').eq('id',f.surveyExtraEvent).maybeSingle();if(data?.name==='[QA registration] Survey persistence B'&&data.owner_id===f.userId){const {error}=await admin.from('events').delete().eq('id',f.surveyExtraEvent);if(error)throw error;}}
 await import('./test-survey-live.mjs');
}else{
 const base=process.env.REGISTRATION_TEST_URL||'http://127.0.0.1:3003',jar=new Map();
 async function call(path,method='GET',body){const r=await fetch(base+path,{method,headers:{Cookie:[...jar].map(([k,v])=>`${k}=${v}`).join('; '),...(method==='GET'?{}:{Origin:base,'Content-Type':'application/json'})},...(body?{body:JSON.stringify(body)}:{})});for(const c of r.headers.getSetCookie()){const pair=c.split(';')[0],i=pair.indexOf('=');jar.set(pair.slice(0,i),pair.slice(i+1));}return{status:r.status,body:await r.json()};}
 assert.equal((await call('/api/auth/sign-in','POST',{email:f.email,password:f.password})).status,200);
 if(!f.surveyExtraEvent){const b=await call('/api/manager/events','POST',{name:'[QA registration] Survey persistence B'});assert.equal(b.status,201);f.surveyExtraEvent=b.body.id;await writeFile(path,JSON.stringify(f));}
 const a=f.eventId,b=f.surveyExtraEvent;
 await call('/api/manager/active-event','POST',{id:a});
 assert.equal((await call('/api/manager/survey-publication','PUT',{open:true,eventId:a})).status,200);
 await call('/api/manager/active-event','POST',{id:b});
 assert.equal((await call('/api/manager/public-event','PUT',{open:true,capacity:10})).status,200);
 // Another tab changed the cookie to B; saving the visible A must still target A.
 const saved=await call('/api/manager/survey-publication','PUT',{open:false,eventId:a});
 assert.equal(saved.status,200,JSON.stringify(saved.body));
 const publicA=await call(`/api/public/event?event=${a}`);
 assert.equal(publicA.body.survey_open,false,'Saving visible event A must persist to A even while the active cookie points at B');
 assert.equal(saved.body.eventId,a);assert.equal(saved.body.survey_open,false);
 for(let i=0;i<2;i++){const refreshed=await call(`/api/manager/survey-publication?event=${a}`);assert.equal(refreshed.status,200);assert.equal(refreshed.body.eventId,a);assert.equal(refreshed.body.survey_open,false);}
 assert.equal((await call(`/api/public/event?event=${b}`)).body.survey_open,false,'Other event must remain unchanged');
 const missing=await call('/api/manager/survey-publication','PUT',{open:true,eventId:b});assert.equal(missing.status,409);assert.match(missing.body.message,/บันทึก.*แบบสอบถาม/);
 const reopened=await call('/api/manager/survey-publication','PUT',{open:true,eventId:a});assert.equal(reopened.status,200);assert.equal(reopened.body.survey_open,true);
 assert.equal((await call(`/api/manager/survey-publication?event=${a}`)).body.survey_open,true);
 assert.equal((await call(`/api/manager/survey-publication?event=${randomUUID()}`)).status,404);
 assert.equal((await call('/api/manager/survey-publication','PUT',{eventId:randomUUID(),open:true})).status,404);
 assert.equal((await call('/api/manager/survey-publication?event=invalid')).status,400);
 await call('/api/manager/active-event','POST',{id:a});
 console.log('PASS: explicit event saves, database readback, repeated fresh reads, cookie changed by another tab, open/close persistence, missing questions and invalid event isolation');
}
