import { surveyOptions,type SurveyField } from './public-event';
export function cleanSurvey(fields:SurveyField[],input:unknown){
 const values=input&&typeof input==='object'&&!Array.isArray(input)?input as Record<string,unknown>:{};
 const answers:Record<string,string|string[]>=Object.create(null),errors:Record<string,string>={};
 for(const field of fields){
  const value=values[field.id];
  if(field.type==='checkbox'){
   const choices=surveyOptions(field);
   if(value!==undefined&&(!Array.isArray(value)||value.some(v=>typeof v!=='string'||!choices.includes(v)))){errors[field.id]='เลือกคำตอบจากตัวเลือกที่กำหนด';continue;}
   answers[field.id]=[...new Set((value||[]) as string[])];
  }else{
   if(value!==undefined&&typeof value!=='string'){errors[field.id]='รูปแบบคำตอบไม่ถูกต้อง';continue;}
   const text=typeof value==='string'?value.trim():'';
   if(text.length>(field.type==='textarea'?3000:500)||(field.type==='radio'&&text&&!surveyOptions(field).includes(text))){errors[field.id]='ตรวจสอบคำตอบอีกครั้ง';continue;}
   answers[field.id]=text;
  }
  if(field.required&&!answers[field.id]?.length)errors[field.id]='กรุณาตอบคำถามนี้';
 }
 return {answers,errors};
}
