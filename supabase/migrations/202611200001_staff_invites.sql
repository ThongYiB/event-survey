begin;
create or replace function private.can_read_event(event_uuid uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select private.current_app_role()='system_admin' or exists(select 1 from public.events e where e.id=event_uuid and not e.suspended and private.current_app_role() is not null and (e.owner_id=auth.uid() or exists(select 1 from public.event_members m where m.event_id=e.id and m.user_id=auth.uid() and cardinality(m.permissions)>0)))
$$;
create or replace function public.set_staff_invite(p_event uuid,p_hash text,p_expires timestamptz)
returns void language plpgsql security invoker set search_path='' as $$
begin
 if not private.owns_event(p_event) then raise exception 'FORBIDDEN'; end if;
 if p_hash is null or p_hash !~ '^[a-f0-9]{64}$' or p_expires is null or p_expires<=now() or p_expires>now()+interval '8 days' then raise exception 'INVALID_INVITE'; end if;
 update public.events set settings=jsonb_set(settings,'{staff_invite}',jsonb_build_object('hash',p_hash,'expires',p_expires),true) where id=p_event;
end; $$;
revoke all on function public.set_staff_invite(uuid,text,timestamptz) from public,anon;
grant execute on function public.set_staff_invite(uuid,text,timestamptz) to authenticated;
create or replace function public.request_staff_membership(p_event uuid,p_hash text,p_user uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
 perform 1 from public.events e join public.profiles owner on owner.id=e.owner_id where e.id=p_event and not e.suspended and owner.role='event_manager' and not owner.suspended and owner.deleted_at is null and not owner.must_change_password and e.settings->'staff_invite'->>'hash'=p_hash and (e.settings->'staff_invite'->>'expires')::timestamptz>now() for update of e;
 if not found then raise exception 'INVALID_INVITE'; end if;
 if not exists(select 1 from public.profiles p join auth.users u on u.id=p.id where p.id=p_user and p.role='staff' and not p.suspended and p.deleted_at is null and not p.must_change_password and u.email_confirmed_at is not null) then raise exception 'VERIFIED_STAFF_REQUIRED'; end if;
 insert into public.event_members(event_id,user_id,permissions)values(p_event,p_user,'{}') on conflict(event_id,user_id) do nothing;
end; $$;
revoke all on function public.request_staff_membership(uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.request_staff_membership(uuid,text,uuid) to service_role;
-- Pending requests have no access until the Manager assigns permissions.
create or replace function public.staff_workspace()
returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if private.current_app_role() is distinct from 'staff' then raise exception 'STAFF_FORBIDDEN'; end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',e.id,'name',e.name,'status',e.status,'details',e.details,'capacity',coalesce(pub.capacity,0),'permissions',m.permissions,'stats',private.event_checkin_stats(e.id)) order by e.created_at desc)
 from public.events e join public.event_members m on m.event_id=e.id and m.user_id=auth.uid()
 join public.profiles owner on owner.id=e.owner_id left join public.event_publications pub on pub.event_id=e.id
 where cardinality(m.permissions)>0 and not e.suspended and owner.role='event_manager' and not owner.suspended and owner.deleted_at is null and not owner.must_change_password),'[]'::jsonb);
end; $$;
commit;
