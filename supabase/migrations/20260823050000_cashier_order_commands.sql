-- Give the ASP.NET API an explicit cashier close command.
create or replace function public.staff_close_order(
  p_order_id uuid,
  p_actor_id uuid
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role public.role_type;
  current_status public.order_status;
begin
  select role into actor_role from public.profiles where id = p_actor_id;
  if actor_role is null or actor_role not in ('cashier','admin') then
    return 'not_authorized';
  end if;

  select status into current_status from public.orders where id = p_order_id for update;
  if not found then
    return 'not_found';
  end if;
  if current_status <> 'ready' then
    return 'invalid_transition';
  end if;

  perform set_config('app.actor_id', p_actor_id::text, true);
  update public.orders
    set status = 'closed', payment_confirmed = true
    where id = p_order_id;
  return 'ok';
end;
$$;

revoke all on function public.staff_close_order(uuid, uuid) from public, anon, authenticated;
