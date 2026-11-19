import {publishedEvent,requireEventId} from '@/server/cloud/registration';
import {createSupabaseAdminClient} from '@/lib/supabase/admin';
import {CloudError,cloudErrorResponse} from '@/server/cloud/auth';
import {cleanKiosk} from '@/lib/kiosk';
export async function GET(request:Request){try{const id=requireEventId(new URL(request.url).searchParams.get('event'));const pub=await publishedEvent(id);const {data,error}=await createSupabaseAdminClient().from('events').select('settings').eq('id',id).single();if(error)throw new CloudError('โหลดคิวสื่อไม่ได้',503);if(!data.settings.kiosk?.published)return Response.json({settings:null,name:pub.details.name},{headers:{'Cache-Control':'no-store'}});return Response.json({settings:cleanKiosk(data.settings.kiosk),name:pub.details.name},{headers:{'Cache-Control':'no-store'}});}catch(e){return cloudErrorResponse(e);}}
