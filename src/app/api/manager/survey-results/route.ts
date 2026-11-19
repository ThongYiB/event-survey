import { NextRequest } from "next/server";
import { isManagerSession, managerCookie } from "@/server/manager-session";
import { getSurveyResults } from "@/server/public-event";
import {supabaseEnabled} from '@/lib/supabase/config';
import {requireCloudProfile,cloudErrorResponse,CloudError} from '@/server/cloud/auth';
import {getCloudManagerData} from '@/server/cloud/events';
import {surveyOptions,type SurveyField} from '@/lib/public-event';

export async function GET(request: NextRequest) {
  if(supabaseEnabled())try{
    const {client,profile}=await requireCloudProfile(['event_manager']);const {event}=await getCloudManagerData(client,profile);if(!event)throw new CloudError('เลือกอีเวนต์ก่อน',404);
    const rows:{questions:SurveyField[];answers:Record<string,string|string[]>}[]=[];
    for(let offset=0;;offset+=1000){const {data,error}=await client.from('survey_responses').select('questions,answers').eq('event_id',event.id).order('created_at',{ascending:false}).order('id').range(offset,offset+999);if(error)throw new CloudError('โหลดคำตอบไม่ได้',503);rows.push(...(data||[]));if(!data||data.length<1000)break;}
    const questions=new Map<string,{field:SurveyField;total:number;choices:Record<string,number>;texts:string[]}>();
    for(const row of rows)for(const field of row.questions){const key=JSON.stringify([field.id,field.label,field.type,surveyOptions(field)]);const q=questions.get(key)||{field,total:0,choices:Object.fromEntries(surveyOptions(field).map(v=>[v,0])),texts:[]};const value=row.answers[field.id];if(Array.isArray(value)){if(value.length)q.total++;for(const option of value)if(Object.hasOwn(q.choices,option))q.choices[option]++;}else if(value){q.total++;if(field.type==='radio'&&Object.hasOwn(q.choices,value))q.choices[value]++;else if(q.texts.length<100)q.texts.push(value);}questions.set(key,q);}
    const [registered,checked]=await Promise.all([client.from('registrations').select('id',{count:'exact',head:true}).eq('event_id',event.id),client.from('checkins').select('registration_id',{count:'exact',head:true}).eq('event_id',event.id)]);
    if(registered.error||checked.error)throw new CloudError('โหลดสรุปไม่ได้',503);
    return Response.json({eventName:event.name,registered:registered.count,checkedIn:checked.count,responses:rows.length,questions:[...questions.values()]},{headers:{'Cache-Control':'private, no-store'}});
  }catch(e){return cloudErrorResponse(e);}
  if (!isManagerSession(request.cookies.get(managerCookie)?.value)) return Response.json({ message: "เข้าสู่ระบบ Event Manager เพื่อดูคำตอบ" }, { status: 401 });
  return Response.json(getSurveyResults(), { headers: { "Cache-Control": "no-store" } });
}
