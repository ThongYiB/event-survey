import { NextRequest, NextResponse } from "next/server";
import { defaultEventDetails } from "@/lib/public-event";
import { CloudError, cloudErrorResponse, requireCloudProfile } from "@/server/cloud/auth";
import { activeEventCookie, getCloudManagerData, validateEventSetting } from "@/server/cloud/events";
import { isSameOrigin } from "@/server/manager-session";

export async function GET(request:NextRequest) {
  try { const { client, profile } = await requireCloudProfile(["event_manager"]); return Response.json(await getCloudManagerData(client, profile,undefined,request.nextUrl.searchParams.get('media')==='1'), { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return cloudErrorResponse(error); }
}

export async function POST(request: NextRequest) {
  try {
    if (!isSameOrigin(request)) throw new CloudError("ไม่สามารถสร้างอีเวนต์จากเว็บไซต์อื่น", 403);
    const { client, profile } = await requireCloudProfile(["event_manager"]);
    const body = await request.json().catch(() => null);
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    if (!name || name.length > 200) throw new CloudError("กรอกชื่ออีเวนต์ 1–200 ตัวอักษร");
    const { data, error } = await client.from("events").insert({ owner_id: profile.id, name, details: { ...defaultEventDetails, name }, settings: {} }).select("id").single();
    if (error || !data) throw new CloudError("สร้างอีเวนต์ไม่สำเร็จ กรุณาลองอีกครั้ง", 503);
    const response = NextResponse.json({ id: data.id }, { status: 201 });
    response.cookies.set(activeEventCookie, data.id, { httpOnly: true, sameSite: "lax", secure: request.nextUrl.protocol === "https:", path: "/", maxAge: 30 * 86400 });
    return response;
  } catch (error) { return cloudErrorResponse(error); }
}

export async function PUT(request: NextRequest) {
  try {
    if (!isSameOrigin(request)) throw new CloudError("ไม่สามารถบันทึกจากเว็บไซต์อื่น", 403);
    const { client, profile } = await requireCloudProfile(["event_manager"]);
    const text = await request.text(); if (text.length > 3300000) throw new CloudError("ข้อมูลมีขนาดใหญ่เกินไป", 413);
    let body; try { body = JSON.parse(text); } catch { throw new CloudError("ข้อมูลไม่ถูกต้อง"); }
    const value = validateEventSetting(body.key, body.value);
    const selected = request.cookies.get(activeEventCookie)?.value;
    const state = await getCloudManagerData(client, profile, selected,body.key==='kiosk');
    if (!state.event || (selected && state.event.id !== selected)) throw new CloudError("ไม่พบอีเวนต์ที่เลือก หรืออีเวนต์ถูกระงับแล้ว", 404);
    if (body.key === "team") {
      const { error } = await client.rpc("replace_event_team", { p_event: state.event.id, p_members: value });
      if (error) throw new CloudError("บันทึกทีมงานไม่ได้ ต้องมีบัญชี Staff ที่ใช้งานได้สำหรับทุกอีเมล และกำหนดสิทธิ์ให้ถูกต้อง");
    } else if (body.key === "details") {
      const update = { name: String((value as Record<string, unknown>).name), details: value };
      const { data, error } = await client.from("events").update(update).eq("id", state.event.id).eq("owner_id", profile.id).select("id");
      if (error || !data?.length) throw new CloudError("บันทึกอีเวนต์ไม่สำเร็จ กรุณาตรวจสิทธิ์และลองอีกครั้ง", 503);
    } else {
      const { data, error } = await client.rpc("save_event_setting", { p_event: state.event.id, p_key: body.key, p_value: value });
      if (error || !data) throw new CloudError("บันทึกการตั้งค่าไม่สำเร็จ กรุณาตรวจสิทธิ์และลองอีกครั้ง", 503);
    }
    return Response.json(await getCloudManagerData(client, profile, state.event.id,body.media===true), { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return cloudErrorResponse(error); }
}
