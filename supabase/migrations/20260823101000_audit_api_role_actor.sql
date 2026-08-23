-- Preserve the actor in security_events when ASP.NET invokes the role command
-- through a direct database connection instead of PostgREST/JWT.
create or replace function public.log_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := coalesce(
    nullif(current_setting('app.actor_id', true), '')::uuid,
    auth.uid());
begin
  if new.role is distinct from old.role then
    insert into public.security_events (event_type, actor_id, target_id, detail)
    values (
      'role_change',
      actor_id,
      new.id,
      jsonb_build_object('old_role', old.role, 'new_role', new.role)
    );
  end if;
  return new;
end;
$$;

revoke execute on function public.log_role_change() from public, anon, authenticated;

create or replace function public.admin_update_staff_role(
  p_actor_id uuid,
  p_target_id uuid,
  p_role text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role public.role_type;
begin
  if p_role not in ('admin', 'cashier', 'kitchen') then
    return 'invalid_role';
  end if;

  select role into actor_role from public.profiles where id = p_actor_id;
  if actor_role is null or actor_role <> 'admin' then
    return 'not_authorized';
  end if;
  if p_actor_id = p_target_id then
    return 'self_role';
  end if;

  perform set_config('app.actor_id', p_actor_id::text, true);
  update public.profiles
     set role = p_role::public.role_type
   where id = p_target_id;
  if not found then
    return 'not_found';
  end if;
  return 'ok';
end;
$$;

revoke all on function public.admin_update_staff_role(uuid, uuid, text) from public, anon, authenticated;
