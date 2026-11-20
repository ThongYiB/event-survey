begin;
-- Reserve before calling the privileged Auth API; invitations allow at most
-- 100 account-creation attempts per hour, including failed/duplicate attempts.
create or replace function public.reserve_staff_signup(p_event uuid,p_hash text)
returns void language plpgsql security definer set search_path='' as $$
declare ev public.events; invitation jsonb; bucket text:=to_char(now() at time zone 'UTC','YYYY-MM-DD-HH24'); attempts integer;
begin
 select * into ev from public.events where id=p_event for update;
 if not found or ev.suspended or not exists(select 1 from public.profiles p where p.id=ev.owner_id and p.role='event_manager' and not p.suspended and p.deleted_at is null and not p.must_change_password) then raise exception 'INVALID_INVITE'; end if;
 invitation:=ev.settings->'staff_invite';
 if invitation->>'hash' is distinct from p_hash or coalesce((invitation->>'expires')::timestamptz,now())<=now() then raise exception 'INVALID_INVITE'; end if;
 attempts:=case when invitation->>'signup_hour'=bucket then coalesce((invitation->>'signup_attempts')::integer,0) else 0 end;
 if attempts>=100 then raise exception 'SIGNUP_LIMIT'; end if;
 update public.events set settings=jsonb_set(settings,'{staff_invite}',invitation||jsonb_build_object('signup_hour',bucket,'signup_attempts',attempts+1)) where id=p_event;
end; $$;
revoke all on function public.reserve_staff_signup(uuid,text) from public,anon,authenticated;
grant execute on function public.reserve_staff_signup(uuid,text) to service_role;
commit;
