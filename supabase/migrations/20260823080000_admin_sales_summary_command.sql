-- Preserve the existing server-side report calculation while binding it to
-- the actor validated by ASP.NET rather than relying on a browser session.
create or replace function public.admin_get_sales_summary(
  p_actor_id uuid,
  p_start timestamptz,
  p_end timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role public.role_type;
begin
  select role into actor_role from public.profiles where id = p_actor_id;
  if actor_role is null or actor_role <> 'admin' then
    raise exception 'Not authorized';
  end if;

  perform set_config('request.jwt.claim.sub', p_actor_id::text, true);
  return public.get_sales_summary(p_start, p_end);
end;
$$;

revoke all on function public.admin_get_sales_summary(uuid, timestamptz, timestamptz) from public, anon, authenticated;
