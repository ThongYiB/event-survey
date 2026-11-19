begin;

alter table public.registrations add column if not exists source text not null default 'preregistered' check(source in ('preregistered','walkin'));
create unique index if not exists registrations_id_event on public.registrations(id,event_id);
grant select(source) on public.registrations to authenticated;
create table if not exists public.checkins (
  registration_id uuid primary key,
  event_id uuid not null references public.events(id) on delete cascade,
  checked_by uuid not null references public.profiles(id),
  checked_at timestamptz not null default now(),
  via text not null check(via in ('qr','search','walkin')),
  foreign key(registration_id,event_id) references public.registrations(id,event_id) on delete cascade
);
create index if not exists checkins_event_time on public.checkins(event_id,checked_at);
alter table public.checkins enable row level security;
revoke all on public.checkins from anon,authenticated;
grant select on public.checkins to authenticated;
grant all on public.checkins to service_role;
drop policy if exists checkin_owner_read on public.checkins;
create policy checkin_owner_read on public.checkins for select to authenticated using(private.owns_event(event_id));

-- Every Staff operation checks current membership, account and owner restrictions.
-- No Staff role receives raw table access to attendee ticket capabilities.
create or replace function private.require_staff_event(p_event uuid,p_permissions text[])
returns void language plpgsql security definer set search_path='' as $$
begin
  if private.current_app_role() is distinct from 'staff' or not exists(
    select 1 from public.event_members m
    join public.events e on e.id=m.event_id
    join public.profiles owner on owner.id=e.owner_id
    where m.event_id=p_event and m.user_id=auth.uid() and m.permissions @> p_permissions
      and not e.suspended and owner.role='event_manager' and not owner.suspended
      and owner.deleted_at is null and not owner.must_change_password
  ) then raise exception 'STAFF_FORBIDDEN'; end if;
end;
$$;
revoke all on function private.require_staff_event(uuid,text[]) from public,anon,authenticated;

create or replace function private.staff_attendee(p_id uuid)
returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object('code',r.id,'eventId',r.event_id,'firstName',r.name,'lastName','',
    'email',r.email,'phone',r.answers->>'phone','ticketType','ผู้เข้าร่วมทั่วไป','source',r.source,
    'checkIn',case when c.registration_id is null then null else jsonb_build_object('at',c.checked_at,'by',p.name,'via',c.via) end)
  from public.registrations r left join public.checkins c on c.registration_id=r.id
  left join public.profiles p on p.id=c.checked_by where r.id=p_id;
$$;
revoke all on function private.staff_attendee(uuid) from public,anon,authenticated;

create or replace function private.event_checkin_stats(p_event uuid)
returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object('registered',count(*),'checkedIn',count(c.registration_id),'remaining',count(*)-count(c.registration_id))
  from public.registrations r left join public.checkins c on c.registration_id=r.id where r.event_id=p_event;
$$;
revoke all on function private.event_checkin_stats(uuid) from public,anon,authenticated;

create or replace function public.staff_workspace()
returns jsonb language plpgsql security definer set search_path='' as $$
begin
  if private.current_app_role() is distinct from 'staff' then raise exception 'STAFF_FORBIDDEN'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id',e.id,'name',e.name,'status',e.status,'details',e.details,
    'capacity',coalesce(pub.capacity,0),'permissions',m.permissions,'stats',private.event_checkin_stats(e.id)) order by e.created_at desc)
    from public.events e join public.event_members m on m.event_id=e.id and m.user_id=auth.uid()
    join public.profiles owner on owner.id=e.owner_id left join public.event_publications pub on pub.event_id=e.id
    where not e.suspended and owner.role='event_manager' and not owner.suspended and owner.deleted_at is null and not owner.must_change_password),'[]'::jsonb);
end;
$$;

create or replace function public.staff_search(p_event uuid,p_query text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare term text:=left(trim(coalesce(p_query,'')),200);
begin
  perform private.require_staff_event(p_event,array['ค้นหาผู้ลงทะเบียน']);
  return coalesce((select jsonb_agg(private.staff_attendee(r.id) order by r.created_at desc) from (
    select id,created_at from public.registrations where event_id=p_event and
      (term='' or strpos(lower(name),lower(term))>0 or strpos(email,lower(term))>0
       or strpos(coalesce(answers->>'phone',''),term)>0 or id::text=term)
    order by created_at desc limit 50) r),'[]'::jsonb);
end;
$$;

create or replace function public.staff_checkin(p_event uuid,p_code text,p_via text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare ev public.events; guest_id uuid; outcome text; token_parts text[]; inserted_count integer;
begin
  if p_via is null or p_via not in ('qr','search') or p_code is null or length(p_code)>200 then raise exception 'INVALID_INPUT'; end if;
  perform private.require_staff_event(p_event,case when p_via='search' then array['เช็กอิน','ค้นหาผู้ลงทะเบียน'] else array['เช็กอิน'] end);
  select * into ev from public.events where id=p_event for update;
  if ev.status<>'open' then raise exception 'CHECKIN_CLOSED'; end if;
  if p_via='qr' then
    token_parts:=regexp_match(trim(p_code),'^ES1:([a-f0-9-]{36}):([a-f0-9]{32})$');
    if token_parts is not null and token_parts[1] ~ '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$' then
      if token_parts[1]::uuid<>p_event then
        -- A foreign ticket must never disclose its attendee or event details.
        return jsonb_build_object('status','wrong-event','attendee',null,'code','','stats',private.event_checkin_stats(p_event));
      end if;
      select id into guest_id from public.registrations where event_id=p_event and ticket_code=token_parts[2];
    end if;
  elsif trim(p_code) ~ '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$' then
    select id into guest_id from public.registrations where event_id=p_event and id=trim(p_code)::uuid;
  end if;
  if guest_id is null then return jsonb_build_object('status','not-found','attendee',null,'code','','stats',private.event_checkin_stats(p_event)); end if;
  insert into public.checkins(registration_id,event_id,checked_by,via) values(guest_id,p_event,auth.uid(),p_via) on conflict(registration_id) do nothing;
  get diagnostics inserted_count=row_count;
  outcome:=case when inserted_count=1 then 'success' else 'duplicate' end;
  return jsonb_build_object('status',outcome,'code',guest_id,'attendee',private.staff_attendee(guest_id),'stats',private.event_checkin_stats(p_event));
end;
$$;

create or replace function public.staff_walkin(p_event uuid,p_name text,p_email text,p_phone text,p_verified boolean)
returns jsonb language plpgsql security definer set search_path='' as $$
declare ev public.events; pub public.event_publications; guest_id uuid; clean_email text:=lower(trim(p_email)); clean_name text:=trim(p_name);
begin
  perform private.require_staff_event(p_event,array['เช็กอิน','ลงทะเบียน Walk-in']);
  if p_verified is distinct from true or clean_name is null or length(clean_name) not between 1 and 200
    or clean_email is null or length(clean_email)>254 or clean_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or length(coalesce(p_phone,''))>40 then raise exception 'INVALID_INPUT'; end if;
  select * into ev from public.events where id=p_event for update;
  if ev.status<>'open' then raise exception 'CHECKIN_CLOSED'; end if;
  select * into pub from public.event_publications where event_id=p_event;
  if not found then raise exception 'EVENT_UNAVAILABLE'; end if;
  if exists(select 1 from public.registrations where event_id=p_event and email=clean_email) then raise exception 'ALREADY_REGISTERED'; end if;
  if pub.capacity>0 and (select count(*) from public.registrations where event_id=p_event)>=pub.capacity then raise exception 'EVENT_FULL'; end if;
  insert into public.registrations(event_id,name,email,answers,form_fields,request_key,source)
    values(p_event,clean_name,clean_email,jsonb_build_object('name',clean_name,'email',clean_email,'phone',trim(coalesce(p_phone,''))),
    '[{"id":"name","label":"ชื่อ-นามสกุล","type":"text","required":true},{"id":"email","label":"อีเมล","type":"email","required":true},{"id":"phone","label":"โทรศัพท์","type":"tel","required":false}]',replace(gen_random_uuid()::text,'-',''),'walkin') returning id into guest_id;
  insert into public.checkins(registration_id,event_id,checked_by,via) values(guest_id,p_event,auth.uid(),'walkin');
  return jsonb_build_object('status','success','code',guest_id,'attendee',private.staff_attendee(guest_id),'stats',private.event_checkin_stats(p_event));
end;
$$;
revoke all on function public.staff_workspace(),public.staff_search(uuid,text),public.staff_checkin(uuid,text,text),public.staff_walkin(uuid,text,text,text,boolean) from public,anon;
grant execute on function public.staff_workspace(),public.staff_search(uuid,text),public.staff_checkin(uuid,text,text),public.staff_walkin(uuid,text,text,text,boolean) to authenticated;

create or replace function public.manager_checkin_summary()
returns jsonb language plpgsql security definer set search_path='' as $$
begin
  if private.current_app_role() is distinct from 'event_manager' then raise exception 'STAFF_FORBIDDEN'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('eventId',e.id,'stats',private.event_checkin_stats(e.id),
    'walkin',(select count(*) from public.registrations r where r.event_id=e.id and r.source='walkin'),
    'timeline',coalesce((select jsonb_agg(t) from (select to_char(c.checked_at at time zone 'Asia/Bangkok','YYYY-MM-DD HH24:00') as time,count(*) as count
       from public.checkins c where c.event_id=e.id group by 1 order by 1) t),'[]'::jsonb)))
    from public.events e where private.owns_event(e.id)),'[]'::jsonb);
end;
$$;
revoke all on function public.manager_checkin_summary() from public,anon;
grant execute on function public.manager_checkin_summary() to authenticated;
commit;
