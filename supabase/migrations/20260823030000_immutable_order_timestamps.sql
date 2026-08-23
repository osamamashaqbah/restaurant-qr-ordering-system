-- Prevent staff updates from rewriting order timestamps or closed_at.
-- Status changes remain explicit and role-gated by this trigger.
create or replace function public.enforce_order_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  my_role public.role_type := public.get_my_role();
begin
  -- These fields are owned by the database, never by a client patch.
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

  -- Staff may never rewrite customer-identifying fields or totals after the fact.
  new.customer_name = old.customer_name;
  new.customer_whatsapp = old.customer_whatsapp;
  new.table_number = old.table_number;
  new.total = old.total;

  return new;
end;
$$;

revoke execute on function public.enforce_order_transition() from public, anon, authenticated;
