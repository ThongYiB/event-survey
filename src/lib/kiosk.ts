export type KioskSettings={published?:boolean;screens:string[];startsAt:string;endsAt:string;media:{id:string;name:string;type:'image'|'video';src:string;seconds:number}[]};
export function cleanKiosk(value:unknown):KioskSettings{
 const v=value as KioskSettings;
 if(!v||!Array.isArray(v.screens)||!v.screens.length||v.screens.length>30||v.screens.some(s=>typeof s!=='string'||!s.trim()||s.length>80)||!Array.isArray(v.media)||v.media.length>30||typeof v.startsAt!=='string'||typeof v.endsAt!=='string'||(v.published!==undefined&&typeof v.published!=='boolean'))throw new Error('ตรวจรายการจอและคิวสื่อ');
 const date=(s:string)=>s===''||(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)&&Number.isFinite(Date.parse(s+':00+07:00')));
 if(!date(v.startsAt)||!date(v.endsAt)||!!v.startsAt!==!!v.endsAt||(v.startsAt&&v.startsAt>=v.endsAt))throw new Error('ตรวจวันเวลาเริ่มและสิ้นสุด');
 const ids=new Set();
 for(const m of v.media){if(!m||typeof m.id!=='string'||ids.has(m.id)||typeof m.name!=='string'||m.name.length>200||!Number.isInteger(m.seconds)||m.seconds<1||m.seconds>600||typeof m.src!=='string'||m.src.length>1500000||!(m.type==='image'?/^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/:m.type==='video'?/^data:video\/(mp4|webm);base64,[a-zA-Z0-9+/=]+$/:/a^/).test(m.src))throw new Error('ตรวจชนิดสื่อและระยะเวลา 1–600 วินาที');ids.add(m.id);}
 return {published:v.published===true,screens:[...new Set(v.screens)],startsAt:v.startsAt,endsAt:v.endsAt,media:v.media.map(({id,name,type,src,seconds})=>({id,name,type,src,seconds}))};
}
export function currentMedia(settings:KioskSettings,now:number,screen:string){
 if(!settings.published||!settings.screens.includes(screen)||!settings.media.length)return null;
 const start=settings.startsAt?Date.parse(settings.startsAt+':00+07:00'):0,end=settings.endsAt?Date.parse(settings.endsAt+':00+07:00'):Infinity;
 if(now<start||now>=end)return null;
 const total=settings.media.reduce((sum,m)=>sum+m.seconds,0);let offset=((now-start)/1000)%total;
 for(const media of settings.media){if(offset<media.seconds)return{media,offset};offset-=media.seconds;}
 return null;
}
