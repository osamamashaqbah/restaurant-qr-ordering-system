-- Audit trail for role changes (failed-login events are already captured by
-- Supabase Auth's own logs — GoTrue never hands password verification to our
-- database, so there's nothing meaningful we could log ourselves for that
-- without duplicating what Auth already records). No customer PII ever
-- touches this table — only staff user ids and role values.
create table public.security_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  actor_id uuid references auth.users(id) on delete set null,
  target_id uuid references auth.users(id) on delete set null,
  detail jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.security_events enable row level security;

create policy "security_events_select_admin" on public.security_events
  for select using (public.is_staff(array['admin']::public.role_type[]));

revoke all on public.security_events from anon, authenticated;
grant select on public.security_events to authenticated;

create function public.log_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    insert into public.security_events (event_type, actor_id, target_id, detail)
    values (
      'role_change',
      auth.uid(),
      new.id,
      jsonb_build_object('old_role', old.role, 'new_role', new.role)
    );
  end if;
  return new;
end;
$$;

revoke execute on function public.log_role_change() from public, anon, authenticated;

create trigger profiles_log_role_change
  after update on public.profiles
  for each row execute function public.log_role_change();
