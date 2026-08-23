-- Security audit finding (Medium): the schema comment on profiles_update_admin
-- claims "No one — including the row owner — may write their own role", but
-- the RLS policy only checked is_staff(['admin']) with no clause excluding
-- the caller's own row. An admin could therefore change their own role via a
-- direct API call, bypassing the UI's disabled dropdown (StaffPanel.tsx
-- already disables this client-side, but that's UX only, not a security
-- boundary). This doesn't allow privilege escalation from a lower role —
-- only an existing admin can touch profiles at all — but it doesn't match
-- the documented guarantee, and self-demotion could accidentally lock a
-- sole admin out. Enforce it server-side, matching the original intent.
create or replace function public.prevent_self_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and new.id = auth.uid() then
    raise exception 'You cannot change your own role';
  end if;
  return new;
end;
$$;

revoke execute on function public.prevent_self_role_change() from public, anon, authenticated;

create trigger profiles_prevent_self_role_change
  before update on public.profiles
  for each row execute function public.prevent_self_role_change();
