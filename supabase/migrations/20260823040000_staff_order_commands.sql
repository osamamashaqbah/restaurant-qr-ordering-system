-- Give the ASP.NET API explicit, role-checked order commands.
-- The function is intentionally not exposed as a generic update endpoint.
create or replace function public.enforce_order_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  my_role public.role_type := coalesce(
    (select role from public.profiles
      where id = nullif(current_setting('app.actor_id', true), '')::uuid),
    public.get_my_role());
begin
  new.created_at = old.created_at;
  new.updated_at = now();
  new.closed_at = old.closed_at;

  if new.status is distinct from old.status then
    if old.status = 'new' and new.status = 'preparing' and my_role in ('kitchen','admin') then
      -- ok
    elsif old.status = 'preparing' and new.status = 'ready' and my_role in ('kitchen','admin') then
      -- ok
    elsif old.status = 'ready' and new.status = 'closed' and my_role in ('cashier','admin') then
      new.closed_at = now();
    elsif old.status in ('new','preparing') and new.status = 'cancelled' and my_role in ('kitchen','cashier','admin') then
      -- ok
    else
      raise exception 'Invalid order status transition from % to % for role %', old.status, new.status, my_role;
    end if;
  end if;

  if new.payment_confirmed is distinct from old.payment_confirmed and my_role not in ('cashier','admin') then
    raise exception 'Only cashier/admin may confirm payment';
  end if;

  new.customer_name = old.customer_name;
  new.customer_whatsapp = old.customer_whatsapp;
  new.table_number = old.table_number;
  new.total = old.total;
  return new;
end;
$$;

create or replace function public.staff_transition_order(
  p_order_id uuid,
  p_actor_id uuid,
  p_next_status public.order_status
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
  if actor_role is null then
    return 'not_authorized';
  end if;

  select status into current_status from public.orders where id = p_order_id for update;
  if not found then
    return 'not_found';
  end if;

  if not (
    (current_status = 'new' and p_next_status = 'preparing' and actor_role in ('kitchen','admin')) or
    (current_status = 'preparing' and p_next_status = 'ready' and actor_role in ('kitchen','admin')) or
    (current_status in ('new','preparing') and p_next_status = 'cancelled' and actor_role in ('kitchen','admin'))
  ) then
    return 'invalid_transition';
  end if;

  perform set_config('app.actor_id', p_actor_id::text, true);
  update public.orders set status = p_next_status where id = p_order_id;
  return 'ok';
end;
$$;

revoke all on function public.staff_transition_order(uuid, uuid, public.order_status) from public, anon, authenticated;
