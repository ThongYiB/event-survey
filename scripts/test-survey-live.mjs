import {readFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import assert from 'node:assert/strict';
// Reuse the guarded, disposable Manager/event fixture and its cleanup workflow.
await import('./test-registration-live.mjs');
if(!process.argv.includes('--cleanup')){
 const fixture=JSON.parse(await readFile(new URL('../.vercel/registration-qa.json',import.meta.url),'utf8'));
 const base=process.env.REGISTRATION_TEST_URL||'http://127.0.0.1:3000',jar=new Map();
 async function call(path,method='GET',body,auth=false){const r=await fetch(base+path,{method,headers:{...(auth?{Cookie:[...jar].map(([k,v])=>`${k}=${v}`).join('; ')}:{}),...(method!=='GET'?{Origin:base,'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),redirect:'manual'});for(const c of r.headers.getSetCookie()){const pair=c.split(';')[0],i=pair.indexOf('=');jar.set(pair.slice(0,i),pair.slice(i+1));}return{status:r.status,body:await r.json()};}
 assert.equal((await call('/api/auth/sign-in','POST',{email:fixture.email,password:fixture.password},true)).status,200);
 const fields=[{id:'satisfaction',label:'ความพึงพอใจโดยรวม',type:'radio',required:true,options:'ดีมาก\nดี\nพอใช้\nควรปรับปรุง',help:'เลือก 1 ข้อ'},{id:'comments',label:'ข้อเสนอแนะ',type:'textarea',required:false,options:'',help:''}];
 assert.equal((await call('/api/manager/events','PUT',{key:'survey',value:fields},true)).status,200);
 let publish=await call('/api/manager/survey-publication','PUT',{open:true},true);assert.equal(publish.status,200,JSON.stringify(publish.body));
 const pub=await call(`/api/public/event?event=${fixture.eventId}`);assert.equal(pub.body.survey_open,true);assert.equal(pub.body.survey_fields.length,2);
 const payload={eventId:fixture.eventId,revision:pub.body.survey_revision,requestKey:randomBytes(16).toString('hex'),answers:{satisfaction:'ดีมาก',comments:'ทดสอบระบบแบบประเมิน'}};
 assert.equal((await call('/api/public/survey','POST',{...payload,answers:{satisfaction:'forged'}})).status,400);
 assert.equal((await call('/api/public/survey','POST',{...payload,answers:{}})).status,400);
 let sent=await call('/api/public/survey','POST',payload);assert.equal(sent.status,200,JSON.stringify(sent.body));assert.equal(sent.body.reused,false);
 assert.equal((await call('/api/public/survey','POST',payload)).body.reused,true);
 const results=await call('/api/manager/survey-results','GET',undefined,true);assert.equal(results.status,200,JSON.stringify(results.body));assert.equal(results.body.responses,1);assert.equal(results.body.questions[0].choices['ดีมาก'],1);
 assert.equal((await call('/api/manager/survey-results')).status,401);
 await call('/api/manager/survey-publication','PUT',{open:false},true);
 assert.equal((await call('/api/public/survey','POST',{...payload,requestKey:randomBytes(16).toString('hex')})).body.code,'survey-closed');
 assert.equal((await call('/api/public/survey','POST',payload)).body.reused,true);
 await call('/api/manager/survey-publication','PUT',{open:true},true);
 assert.equal((await call('/api/public/survey','POST',{...payload,requestKey:randomBytes(16).toString('hex')})).body.code,'survey-updated');
 console.log('PASS: real survey publication, required/choice validation, persisted answers, duplicate retries, Manager charts, private reports, closed survey and revision changes');
}
