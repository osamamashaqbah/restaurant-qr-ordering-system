-- Cashiers may change availability only through this explicit command.
create or replace function public.staff_set_item_availability(
  p_item_id uuid,
  p_actor_id uuid,
  p_available boolean
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role public.role_type;
begin
  select role into actor_role from public.profiles where id = p_actor_id;
  if actor_role is null or actor_role not in ('cashier','admin') then
    return 'not_authorized';
  end if;

  update public.menu_items
    set is_available = p_available, updated_at = now()
    where id = p_item_id;
  if not found then
    return 'not_found';
  end if;
  return 'ok';
end;
$$;

revoke all on function public.staff_set_item_availability(uuid, uuid, boolean) from public, anon, authenticated;
