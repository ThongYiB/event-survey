import {PGlite} from '@electric-sql/pglite';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
const db=new PGlite();
try{
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;`);
 for(const f of ['202611190001_accounts_events.sql','202611190002_registration.sql','202611190003_staff_checkin.sql','202611190004_survey.sql','202611190004_survey.sql'])await db.exec(await readFile(new URL(`../supabase/migrations/${f}`,import.meta.url),'utf8'));
 const a=randomUUID(),b=randomUUID(),event=randomUUID();
 for(const id of [a,b])await db.query('insert into auth.users(id,email)values($1,$2)',[id,`${id}@example.test`]);
 await db.query("update public.profiles set role='event_manager' where id=$1",[a]);
 const fields=[{id:'score',label:'Satisfaction',type:'radio',required:true,options:'Good\nBad',help:''}];
 await db.query("insert into public.events(id,owner_id,name,details,settings)values($1,$2,'QA survey','{\"venue\":\"Hall\"}',$3)",[event,a,{survey:fields}]);
 const login=async id=>{await db.exec('reset role;set role authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);};
 await login(a);await db.query('select public.publish_registration($1,true,0)',[event]);await db.query('select public.publish_survey($1,true)',[event]);
 await login(b);await assert.rejects(db.query('select public.publish_survey($1,true)',[event]),/FORBIDDEN/);
 await assert.rejects(db.query('select public.submit_event_survey($1,2,$2,$3)',[event,'a'.repeat(32),{score:'Good'}]));
 await db.exec('reset role;set role service_role');
 const submit=async(key='a'.repeat(32),answer={score:'Good'},rev=2)=>(await db.query('select public.submit_event_survey($1,$2,$3,$4) r',[event,rev,key,answer])).rows[0].r;
 assert.equal((await submit()).reused,false);assert.equal((await submit()).reused,true);
 await assert.rejects(submit('a'.repeat(32),{score:'Bad'}),/RETRY_MISMATCH/);
 await assert.rejects(submit('b'.repeat(32),{score:'Good'},1),/FORM_UPDATED/);
 await login(a);assert.equal((await db.query('select * from public.survey_responses')).rows.length,1);await db.query('select public.publish_survey($1,false)',[event]);
 await db.exec('reset role;set role service_role');assert.equal((await submit()).reused,true);await assert.rejects(submit('b'.repeat(32)),/SURVEY_CLOSED/);
 await login(b);assert.equal((await db.query('select * from public.survey_responses')).rows.length,0);
 await db.exec('reset role;set role anon');await assert.rejects(db.query('select * from public.survey_responses'));
 console.log('PASS: survey migration idempotency, publishing permissions, private responses, retry protection, revisions and closed survey');
}finally{await db.close();}
