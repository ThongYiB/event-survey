import 'server-only';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { CloudError,cloudErrorResponse } from './auth';
import { publishedEvent,requireEventId } from './registration';
import { cleanSurvey } from '@/lib/survey';
import type { SurveyField } from '@/lib/public-event';
import { isSameOrigin } from '@/server/manager-session';
export async function submitCloudSurvey(request:Request){
 try{
  if(!isSameOrigin(request))throw new CloudError('ไม่สามารถส่งจากเว็บไซต์อื่น',403);
  const text=await request.text();if(text.length>100000)throw new CloudError('คำตอบมีขนาดใหญ่เกินไป',413);
  const body=JSON.parse(text);const id=requireEventId(body.eventId);
  const pub=await publishedEvent(id);const result=cleanSurvey(pub.survey_fields as SurveyField[],body.answers);
  if(Object.keys(result.errors).length)return Response.json({message:'ตรวจสอบคำตอบที่ระบุ',errors:result.errors},{status:400});
  if(typeof body.requestKey!=='string'||!/^[a-f0-9]{32}$/.test(body.requestKey)||!Number.isInteger(body.revision))throw new CloudError('ข้อมูลคำตอบไม่ถูกต้อง');
  const {data,error}=await createSupabaseAdminClient().rpc('submit_event_survey',{p_event:id,p_revision:body.revision,p_request:body.requestKey,p_answers:result.answers});
  if(error){if(error.message.includes('SURVEY_CLOSED'))return Response.json({message:'ปิดรับแบบประเมินแล้ว',code:'survey-closed'},{status:409});if(error.message.includes('FORM_UPDATED'))return Response.json({message:'แบบประเมินมีการเปลี่ยนแปลง กรุณาโหลดใหม่',code:'survey-updated'},{status:409});throw new CloudError('ส่งคำตอบไม่ได้ กรุณาลองอีกครั้ง',409);}
  return Response.json(data,{headers:{'Cache-Control':'private, no-store'}});
 }catch(error){return cloudErrorResponse(error);}
}
