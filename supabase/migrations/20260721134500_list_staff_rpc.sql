-- Admin-only: surfaces email (from auth.users, which clients can never query
-- directly) alongside each profile so the admin can tell pending accounts
-- apart and assign roles. Read-only; role changes still go through the
-- existing profiles_update_admin RLS policy via a normal table UPDATE.
create function public.list_staff()
returns table (id uuid, email text, full_name text, role public.role_type, created_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_staff(array['admin']::public.role_type[]) then
    raise exception 'Not authorized';
  end if;

  return query
    select p.id, u.email::text, p.full_name, p.role, p.created_at
    from public.profiles p
    join auth.users u on u.id = p.id
    order by p.created_at desc;
end;
$$;

revoke all on function public.list_staff() from public, anon;
grant execute on function public.list_staff() to authenticated;
