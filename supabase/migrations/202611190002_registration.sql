begin;

create table if not exists public.event_publications (
  event_id uuid primary key references public.events(id) on delete cascade,
  details jsonb not null,
  form_fields jsonb not null check (jsonb_typeof(form_fields)='array'),
  registration_open boolean not null default false,
  capacity integer not null default 0 check(capacity between 0 and 100000),
  revision integer not null default 1,
  published_at timestamptz not null default now()
);
create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null check(length(name) between 1 and 200),
  email text not null check(length(email) between 3 and 254),
  answers jsonb not null,
  form_fields jsonb not null,
  request_key text not null check(request_key ~ '^[a-f0-9]{32}$'),
  ticket_code text not null unique default replace(gen_random_uuid()::text,'-',''),
  created_at timestamptz not null default now(),
  unique(event_id,email), unique(event_id,request_key)
);
create index if not exists registrations_event_created on public.registrations(event_id,created_at desc);
alter table public.event_publications enable row level security;
alter table public.registrations enable row level security;
revoke all on public.event_publications,public.registrations from anon,authenticated;
grant select on public.event_publications to authenticated;
-- Tickets and retry keys are capabilities, never included in the Manager's table access.
grant select(id,event_id,name,email,answers,form_fields,created_at) on public.registrations to authenticated;
grant all on public.event_publications,public.registrations to service_role;
drop policy if exists publication_owner_read on public.event_publications;
create policy publication_owner_read on public.event_publications for select to authenticated using(private.owns_event(event_id));
drop policy if exists registration_owner_read on public.registrations;
create policy registration_owner_read on public.registrations for select to authenticated using(private.owns_event(event_id));

create or replace function public.publish_registration(p_event uuid,p_open boolean,p_capacity integer)
returns void language plpgsql security definer set search_path='' as $$
declare ev public.events; fields jsonb;
begin
  if not private.owns_event(p_event) then raise exception 'Not event owner'; end if;
  if p_capacity is null or p_capacity not between 0 and 100000 or p_open is null then raise exception 'Invalid settings'; end if;
  select * into ev from public.events where id=p_event for update;
  fields:=coalesce(ev.settings->'form','[{"id":"name","label":"ชื่อ-นามสกุล","type":"text","required":true,"help":"","options":""},{"id":"email","label":"อีเมล","type":"email","required":true,"help":"","options":""},{"id":"phone","label":"โทรศัพท์","type":"tel","required":false,"help":"","options":""}]'::jsonb);
  if jsonb_typeof(fields)<>'array' or jsonb_array_length(fields) not between 2 and 50 then raise exception 'Invalid form'; end if;
  if exists(select 1 from jsonb_array_elements(fields) f where coalesce(f->>'type','') not in ('text','email','tel') or coalesce(f->>'id','') !~ '^[a-zA-Z0-9_-]{1,80}$' or coalesce(length(f->>'label'),0) not between 1 and 300 or jsonb_typeof(f->'required') is distinct from 'boolean') then raise exception 'Invalid form fields'; end if;
  if (select count(distinct f->>'id') from jsonb_array_elements(fields) f)<>jsonb_array_length(fields) then raise exception 'Duplicate fields'; end if;
  if not exists(select 1 from jsonb_array_elements(fields) f where f->>'id'='name' and f->>'type'='text' and f->>'required'='true')
     or not exists(select 1 from jsonb_array_elements(fields) f where f->>'id'='email' and f->>'type'='email' and f->>'required'='true') then
    raise exception 'Name and email are required';
  end if;
  if coalesce(length(ev.details->>'venue'),0)=0 then raise exception 'Event details incomplete'; end if;
  insert into public.event_publications(event_id,details,form_fields,registration_open,capacity)
    values(p_event,ev.details || jsonb_build_object('name',ev.name),fields,p_open,p_capacity)
  on conflict(event_id) do update set details=excluded.details,form_fields=excluded.form_fields,
    registration_open=excluded.registration_open,capacity=excluded.capacity,
    revision=public.event_publications.revision+1,published_at=now();
  if p_open then update public.events set status='open' where id=p_event; end if;
end;
$$;
revoke all on function public.publish_registration(uuid,boolean,integer) from public,anon;
grant execute on function public.publish_registration(uuid,boolean,integer) to authenticated;

-- Only the application's server invokes registration, after validating all fields.
-- The row lock makes capacity and duplicate checks atomic across concurrent requests.
create or replace function public.register_event_attendee(p_event uuid,p_revision integer,p_request text,p_answers jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare pub public.event_publications; ev public.events; existing public.registrations; created public.registrations; email_value text; name_value text;
begin
  select * into ev from public.events where id=p_event for update;
  if not found or ev.suspended or not exists(select 1 from public.profiles where id=ev.owner_id and role='event_manager' and not suspended and deleted_at is null and not must_change_password) then raise exception 'EVENT_UNAVAILABLE'; end if;
  select * into pub from public.event_publications where event_id=p_event;
  if not found then raise exception 'EVENT_UNAVAILABLE'; end if;
  if p_request is null or p_request !~ '^[a-f0-9]{32}$' or p_answers is null or jsonb_typeof(p_answers)<>'object' then raise exception 'INVALID_INPUT'; end if;
  email_value:=lower(trim(p_answers->>'email')); name_value:=trim(p_answers->>'name');
  if email_value is null or name_value is null or length(name_value) not between 1 and 200 or length(email_value) not between 3 and 254 then raise exception 'INVALID_INPUT'; end if;
  select * into existing from public.registrations where event_id=p_event and request_key=p_request;
  if found then
    if existing.email<>email_value or existing.answers<>p_answers then raise exception 'RETRY_MISMATCH'; end if;
    return jsonb_build_object('ticketCode',existing.ticket_code,'registeredAt',existing.created_at,'reused',true);
  end if;
  if not pub.registration_open or ev.status<>'open' then raise exception 'REGISTRATION_CLOSED'; end if;
  if pub.revision<>p_revision or p_revision is null then raise exception 'FORM_UPDATED'; end if;
  if exists(select 1 from public.registrations where event_id=p_event and email=email_value) then raise exception 'ALREADY_REGISTERED'; end if;
  if pub.capacity>0 and (select count(*) from public.registrations where event_id=p_event)>=pub.capacity then raise exception 'EVENT_FULL'; end if;
  insert into public.registrations(event_id,name,email,answers,form_fields,request_key) values(p_event,name_value,email_value,p_answers,pub.form_fields,p_request) returning * into created;
  return jsonb_build_object('ticketCode',created.ticket_code,'registeredAt',created.created_at,'reused',false);
end;
$$;
revoke all on function public.register_event_attendee(uuid,integer,text,jsonb) from public,anon,authenticated;
grant execute on function public.register_event_attendee(uuid,integer,text,jsonb) to service_role;
commit;
