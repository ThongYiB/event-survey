-- Event Survey: accounts, event ownership, assignments and durable audit history.
-- Apply to the dedicated Event Survey project. No existing local data is uploaded.
begin;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null check (length(name) between 1 and 120),
  role text not null default 'staff' check (role in ('system_admin','event_manager','staff')),
  suspended boolean not null default false,
  must_change_password boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id),
  name text not null check (length(name) between 1 and 200),
  status text not null default 'draft' check (status in ('draft','open','closed')),
  suspended boolean not null default false,
  details jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists events_owner_idx on public.events(owner_id);

create table if not exists public.event_members (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  permissions text[] not null default '{}',
  primary key (event_id,user_id)
);
create index if not exists event_members_user_idx on public.event_members(user_id);

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id),
  action text not null,
  target text not null,
  created_at timestamptz not null default now()
);

create or replace function private.current_app_role()
returns text language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = (select auth.uid())
    and not suspended and deleted_at is null and not must_change_password
$$;

create or replace function private.can_read_event(event_uuid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select private.current_app_role() = 'system_admin' or exists (
    select 1 from public.events e where e.id = event_uuid and not e.suspended
      and private.current_app_role() is not null
      and (e.owner_id = (select auth.uid()) or exists (
        select 1 from public.event_members m where m.event_id = e.id and m.user_id = (select auth.uid())
      ))
  )
$$;

create or replace function private.owns_event(event_uuid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select private.current_app_role() = 'event_manager' and exists (
    select 1 from public.events e where e.id = event_uuid and e.owner_id = (select auth.uid()) and not e.suspended
  )
$$;

revoke all on function private.current_app_role() from public, anon;
revoke all on function private.can_read_event(uuid) from public, anon;
revoke all on function private.owns_event(uuid) from public, anon;
grant execute on function private.current_app_role(), private.can_read_event(uuid), private.owns_event(uuid) to authenticated;

create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id,email,name,role)
  values (new.id, lower(new.email), left(coalesce(nullif(new.raw_user_meta_data->>'name',''), split_part(new.email,'@',1)),120), 'staff');
  return new;
end;
$$;
revoke all on function private.handle_new_user() from public, anon, authenticated;
drop trigger if exists event_survey_new_user on auth.users;
create trigger event_survey_new_user after insert on auth.users
for each row execute function private.handle_new_user();

-- Existing Auth users receive the least privileged app role. Admin promotion is a separate explicit setup step.
insert into public.profiles(id,email,name)
select id,lower(email),left(coalesce(nullif(raw_user_meta_data->>'name',''),split_part(email,'@',1)),120)
from auth.users where email is not null on conflict(id) do nothing;

create or replace function private.touch_event()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists event_survey_touch_event on public.events;
create trigger event_survey_touch_event before update on public.events
for each row execute function private.touch_event();

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.event_members enable row level security;
alter table public.audit_log enable row level security;

revoke all on public.profiles, public.events, public.event_members, public.audit_log from anon, authenticated;
grant select on public.profiles, public.events, public.event_members, public.audit_log to authenticated;
grant insert(owner_id,name,status,details,settings) on public.events to authenticated;
grant update(name,status,details,settings) on public.events to authenticated;
grant insert,update,delete on public.event_members to authenticated;
-- Only the verified server-side Admin API writes roles, suspensions and audit entries.
grant all on public.profiles, public.events, public.event_members, public.audit_log to service_role;
grant usage,select on sequence public.audit_log_id_seq to service_role;

drop policy if exists profile_read on public.profiles;
create policy profile_read on public.profiles for select to authenticated
using (id = (select auth.uid()) or (select private.current_app_role()) = 'system_admin'
  or ((select private.current_app_role()) = 'event_manager' and role = 'staff' and deleted_at is null and not suspended));

drop policy if exists event_read on public.events;
create policy event_read on public.events for select to authenticated
using ((select private.current_app_role()) = 'system_admin' or
  (not suspended and (select private.current_app_role()) is not null and
    (owner_id = (select auth.uid()) or private.can_read_event(id))));
drop policy if exists event_insert on public.events;
create policy event_insert on public.events for insert to authenticated
with check ((select private.current_app_role()) = 'event_manager' and owner_id = (select auth.uid()) and not suspended);
drop policy if exists event_update on public.events;
create policy event_update on public.events for update to authenticated
using (private.owns_event(id)) with check (owner_id = (select auth.uid()) and not suspended);

drop policy if exists member_read on public.event_members;
create policy member_read on public.event_members for select to authenticated
using ((select private.current_app_role()) = 'system_admin' or private.owns_event(event_id) or (user_id = (select auth.uid()) and private.can_read_event(event_id)));
drop policy if exists member_insert on public.event_members;
create policy member_insert on public.event_members for insert to authenticated
with check (private.owns_event(event_id) and exists (select 1 from public.profiles p where p.id = user_id and p.role = 'staff' and not p.suspended and p.deleted_at is null));
drop policy if exists member_update on public.event_members;
create policy member_update on public.event_members for update to authenticated
using (private.owns_event(event_id)) with check (private.owns_event(event_id) and exists (select 1 from public.profiles p where p.id = user_id and p.role = 'staff' and not p.suspended and p.deleted_at is null));
drop policy if exists member_delete on public.event_members;
create policy member_delete on public.event_members for delete to authenticated using (private.owns_event(event_id));

drop policy if exists audit_read on public.audit_log;
create policy audit_read on public.audit_log for select to authenticated using ((select private.current_app_role()) = 'system_admin');

create or replace function public.admin_account_action(p_actor uuid, p_target uuid, p_action text, p_name text default null)
returns void language plpgsql security invoker set search_path = '' as $$
declare target_row public.profiles; event_row public.events; log_action text; log_target text;
begin
  if not exists(select 1 from public.profiles where id=p_actor and role='system_admin' and not suspended and not must_change_password and deleted_at is null) then
    raise exception 'Admin authorization required';
  end if;
  if p_action = 'toggle_event' then
    select * into event_row from public.events where id=p_target for update;
    if not found then raise exception 'Event not found'; end if;
    update public.events set suspended=not suspended where id=p_target;
    log_action := case when event_row.suspended then 'เปิดใช้งานอีเวนต์' else 'ระงับอีเวนต์' end;
    log_target := event_row.name;
  else
    select * into target_row from public.profiles where id=p_target and deleted_at is null for update;
    if not found or target_row.role='system_admin' then raise exception 'Account cannot be modified'; end if;
    if p_action = 'initialize_manager' then
      if target_row.role <> 'staff' or p_name is null or length(trim(p_name)) not between 1 and 120 then raise exception 'Invalid new account'; end if;
      update public.profiles set role='event_manager',name=trim(p_name),must_change_password=true where id=p_target;
      log_action := 'สร้างบัญชี Event Manager';
    elsif p_action = 'toggle_account' then
      update public.profiles set suspended=not suspended where id=p_target;
      log_action := case when target_row.suspended then 'คืนสิทธิ์บัญชี' else 'ระงับบัญชี' end;
    elsif p_action = 'delete_account' then
      update public.profiles set suspended=true,deleted_at=now() where id=p_target;
      log_action := 'ปิดใช้งานบัญชี';
    else raise exception 'Unsupported action'; end if;
    log_target := target_row.email;
  end if;
  insert into public.audit_log(actor_id,action,target) values(p_actor,log_action,log_target);
end;
$$;
revoke all on function public.admin_account_action(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.admin_account_action(uuid,uuid,text,text) to service_role;

create or replace function public.replace_event_team(p_event uuid, p_members jsonb)
returns void language plpgsql security invoker set search_path = '' as $$
declare member jsonb; staff_id uuid; permissions text[];
begin
  if not private.owns_event(p_event) then raise exception 'Event ownership required'; end if;
  if jsonb_typeof(p_members) <> 'array' or jsonb_array_length(p_members) > 100 then raise exception 'Invalid members'; end if;
  delete from public.event_members where event_id=p_event;
  for member in select value from jsonb_array_elements(p_members) loop
    select id into staff_id from public.profiles where lower(email)=lower(trim(member->>'email')) and role='staff' and not suspended and deleted_at is null;
    if not found then raise exception 'Staff account not found'; end if;
    if jsonb_typeof(member->'access') <> 'array' or jsonb_array_length(member->'access') > 10 then raise exception 'Invalid permissions'; end if;
    select coalesce(array_agg(value),'{}') into permissions from jsonb_array_elements_text(member->'access');
    if exists(select 1 from unnest(permissions) p where p not in ('เช็กอิน','ลงทะเบียน Walk-in','ค้นหาผู้ลงทะเบียน','แสดง QR แบบสอบถาม')) then raise exception 'Invalid permission'; end if;
    insert into public.event_members(event_id,user_id,permissions) values(p_event,staff_id,permissions);
  end loop;
end;
$$;
revoke all on function public.replace_event_team(uuid,jsonb) from public,anon;
grant execute on function public.replace_event_team(uuid,jsonb) to authenticated;

create or replace function public.save_event_setting(p_event uuid, p_key text, p_value jsonb)
returns boolean language plpgsql security invoker set search_path = '' as $$
begin
  if p_key not in ('form','survey','kiosk') or not private.owns_event(p_event) then raise exception 'Event ownership required'; end if;
  update public.events set settings=jsonb_set(settings,array[p_key],p_value,true) where id=p_event;
  return found;
end;
$$;
revoke all on function public.save_event_setting(uuid,text,jsonb) from public,anon;
grant execute on function public.save_event_setting(uuid,text,jsonb) to authenticated;

create or replace function public.bootstrap_first_admin(p_email text)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare target_id uuid;
begin
  lock table public.profiles in share row exclusive mode;
  select id into target_id from public.profiles where email=lower(trim(p_email)) and deleted_at is null;
  if target_id is null then raise exception 'Create the Auth user first'; end if;
  if exists(select 1 from public.profiles where role='system_admin' and deleted_at is null and id<>target_id) then raise exception 'An administrator already exists'; end if;
  if exists(select 1 from public.profiles where id=target_id and role='system_admin') then return target_id; end if;
  update public.profiles set role='system_admin',suspended=false,must_change_password=false where id=target_id;
  insert into public.audit_log(actor_id,action,target) values(target_id,'ตั้งผู้ดูแลระบบคนแรก',lower(trim(p_email)));
  return target_id;
end;
$$;
revoke all on function public.bootstrap_first_admin(text) from public,anon,authenticated;
grant execute on function public.bootstrap_first_admin(text) to service_role;

commit;
