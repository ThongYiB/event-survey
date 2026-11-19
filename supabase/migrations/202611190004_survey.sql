begin;
alter table public.event_publications add column if not exists survey_open boolean not null default false;
alter table public.event_publications add column if not exists survey_fields jsonb not null default '[]';
alter table public.event_publications add column if not exists survey_revision integer not null default 1;
create table if not exists public.survey_responses (
 id uuid primary key default gen_random_uuid(),event_id uuid not null references public.events(id) on delete cascade,
 request_key text not null check(request_key ~ '^[a-f0-9]{32}$'),revision integer not null,
 questions jsonb not null,answers jsonb not null,created_at timestamptz not null default now(),unique(event_id,request_key)
);
alter table public.survey_responses enable row level security;
revoke all on public.survey_responses from anon,authenticated;
grant select on public.survey_responses to authenticated;
grant all on public.survey_responses to service_role;
drop policy if exists survey_owner_read on public.survey_responses;
create policy survey_owner_read on public.survey_responses for select to authenticated using(private.owns_event(event_id));
create or replace function public.publish_survey(p_event uuid,p_open boolean)
returns void language plpgsql security definer set search_path='' as $$
declare fields jsonb;
begin
 if not private.owns_event(p_event) then raise exception 'FORBIDDEN'; end if;
 select settings->'survey' into fields from public.events where id=p_event for update;
 if p_open is null or jsonb_typeof(fields) is distinct from 'array' or jsonb_array_length(fields) not between 1 and 50 then raise exception 'INVALID_SURVEY'; end if;
 if exists(select 1 from jsonb_array_elements(fields) f where coalesce(f->>'type','') not in ('text','textarea','radio','checkbox') or coalesce(f->>'id','') !~ '^[a-zA-Z0-9_-]{1,80}$' or coalesce(length(f->>'label'),0) not between 1 and 300 or jsonb_typeof(f->'required') is distinct from 'boolean') then raise exception 'INVALID_SURVEY'; end if;
 if (select count(distinct f->>'id') from jsonb_array_elements(fields) f)<>jsonb_array_length(fields) then raise exception 'INVALID_SURVEY'; end if;
 update public.event_publications set survey_fields=fields,survey_open=p_open,survey_revision=survey_revision+1 where event_id=p_event;
 if not found then raise exception 'PUBLISH_EVENT_FIRST'; end if;
end; $$;
revoke all on function public.publish_survey(uuid,boolean) from public,anon;
grant execute on function public.publish_survey(uuid,boolean) to authenticated;
create or replace function public.submit_event_survey(p_event uuid,p_revision integer,p_request text,p_answers jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare pub public.event_publications; previous public.survey_responses;
begin
 perform 1 from public.events e join public.profiles p on p.id=e.owner_id where e.id=p_event and not e.suspended and p.role='event_manager' and not p.suspended and p.deleted_at is null and not p.must_change_password for update of e;
 if not found then raise exception 'EVENT_UNAVAILABLE'; end if;
 select * into pub from public.event_publications where event_id=p_event for update;
 if not found then raise exception 'EVENT_UNAVAILABLE'; end if;
 if p_request is null or p_request !~ '^[a-f0-9]{32}$' or jsonb_typeof(p_answers) is distinct from 'object' then raise exception 'INVALID_INPUT'; end if;
 select * into previous from public.survey_responses where event_id=p_event and request_key=p_request;
 if found then
  if previous.answers<>p_answers then raise exception 'RETRY_MISMATCH'; end if;
  return jsonb_build_object('ok',true,'reused',true);
 end if;
 if not pub.survey_open then raise exception 'SURVEY_CLOSED'; end if;
 if p_revision is distinct from pub.survey_revision then raise exception 'FORM_UPDATED'; end if;
 insert into public.survey_responses(event_id,request_key,revision,questions,answers) values(p_event,p_request,p_revision,pub.survey_fields,p_answers);
 return jsonb_build_object('ok',true,'reused',false);
end; $$;
revoke all on function public.submit_event_survey(uuid,integer,text,jsonb) from public,anon,authenticated;
grant execute on function public.submit_event_survey(uuid,integer,text,jsonb) to service_role;
commit;
