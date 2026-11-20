import {createHash} from 'node:crypto';
import {createSupabaseAdminClient} from '@/lib/supabase/admin';
import {createSupabaseServerClient} from '@/lib/supabase/server';
import {requireCloudProfile,CloudError,cloudErrorResponse} from '@/server/cloud/auth';
import {requireEventId} from '@/server/cloud/registration';
import {isSameOrigin} from '@/server/manager-session';
async function inviteInfo(event:unknown,token:unknown){const id=requireEventId(event);if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))throw new CloudError('ลิงก์คำเชิญไม่ถูกต้อง',404);const hash=createHash('sha256').update(token).digest('hex'),admin=createSupabaseAdminClient();const {data:e}=await admin.from('events').select('name,owner_id,suspended,settings').eq('id',id).maybeSingle();const {data:owner}=e?await admin.from('profiles').select('role,suspended,must_change_password,deleted_at').eq('id',e.owner_id).single():{data:null};if(!e||e.suspended||!owner||owner.role!=='event_manager'||owner.suspended||owner.must_change_password||owner.deleted_at||e.settings.staff_invite?.hash!==hash||Date.parse(e.settings.staff_invite.expires)<=Date.now())throw new CloudError('คำเชิญหมดอายุหรือถูกยกเลิก กรุณาขอลิงก์ใหม่จาก Manager',404);return{id,hash,name:e.name,admin};}
export async function GET(request:Request){try{const q=new URL(request.url).searchParams;const info=await inviteInfo(q.get('event'),q.get('invite'));return Response.json({name:info.name},{headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});}catch(e){return cloudErrorResponse(e);}}
export async function POST(request:Request){try{if(!isSameOrigin(request))throw new CloudError('ไม่สามารถสมัครจากเว็บไซต์อื่น',403);const text=await request.text();if(text.length>5000)throw new CloudError('ข้อมูลใหญ่เกินไป',413);const body=JSON.parse(text),info=await inviteInfo(body.event,body.invite);
 if(body.action==='join'){const {profile,user}=await requireCloudProfile(['staff']);if(!user.email_confirmed_at)throw new CloudError('ยืนยันอีเมลก่อนขอเข้าร่วมทีม',403);const {error}=await info.admin.rpc('request_staff_membership',{p_event:info.id,p_hash:info.hash,p_user:profile.id});if(error)throw new CloudError('ส่งคำขอไม่ได้ กรุณาตรวจคำเชิญแล้วลองใหม่',409);return Response.json({next:'/staff',message:'ส่งคำขอแล้ว ให้ Manager กำหนดสิทธิ์ในหน้าทีมงานก่อนเริ่มใช้งาน'},{headers:{'Cache-Control':'private, no-store'}});}
 if(typeof body.name!=='string'||!body.name.trim()||body.name.length>120||typeof body.email!=='string'||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)||body.email.length>254||typeof body.password!=='string'||body.password.length<8||body.password.length>128)throw new CloudError('กรอกชื่อ อีเมล และรหัสผ่านอย่างน้อย 8 ตัวอักษร');
 // Only a valid event invitation can create a Staff account without an email round-trip.
 // Creating a new user never resets an existing account or changes its role.
 const email=body.email.trim().toLowerCase();
 const {error:reservationError}=await info.admin.rpc('reserve_staff_signup',{p_event:info.id,p_hash:info.hash});
 if(reservationError)throw new CloudError(reservationError.message.includes('SIGNUP_LIMIT')?'คำเชิญนี้มีการสมัครถี่เกินไป กรุณารอสักครู่หรือติดต่อผู้จัดงาน':'คำเชิญหมดอายุหรือใช้ไม่ได้ กรุณาขอคำเชิญใหม่',reservationError.message.includes('SIGNUP_LIMIT')?429:409);
 const {data:created,error:createError}=await info.admin.auth.admin.createUser({email,password:body.password,email_confirm:true,user_metadata:{name:body.name.trim()}});
 if(createError||!created.user)throw new CloudError('สมัครไม่ได้ กรุณาตรวจอีเมลและรหัสผ่าน หรือเลือกมีบัญชีแล้วเพื่อเข้าสู่ระบบ',400);
 const {error:profileError}=await info.admin.from('profiles').select('id').eq('id',created.user.id).eq('role','staff').single();
 if(profileError)throw new CloudError('สร้างบัญชีแล้ว แต่ยังโหลดสิทธิ์ไม่ได้ กรุณาติดต่อผู้จัดงาน',503);
 const {error:joinError}=await info.admin.rpc('request_staff_membership',{p_event:info.id,p_hash:info.hash,p_user:created.user.id});
 if(joinError)throw new CloudError('สร้างบัญชีแล้ว แต่คำเชิญใช้ไม่ได้ กรุณาขอคำเชิญใหม่แล้วเลือกมีบัญชีแล้ว',409);
 const client=await createSupabaseServerClient();const {error:loginError}=await client.auth.signInWithPassword({email,password:body.password});
 if(loginError)throw new CloudError('สร้างบัญชีแล้ว กรุณาเลือกมีบัญชีแล้วเพื่อเข้าสู่ระบบ',409);
 return Response.json({next:'/staff',message:'สมัครและเข้าสู่ระบบแล้ว รอ Manager กำหนดสิทธิ์ของงาน'},{status:201,headers:{'Cache-Control':'private, no-store'}});
 }catch(e){return cloudErrorResponse(e);}}
