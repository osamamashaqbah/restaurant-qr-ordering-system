-- Keep customer tracking scoped to one order instead of exposing public table reads.
drop policy if exists "orders_select_anon_status" on public.orders;
drop policy if exists "order_items_select_public" on public.order_items;

create policy "order_items_select_staff" on public.order_items
  for select using (public.is_staff(array['admin','cashier','kitchen']::public.role_type[]));

revoke all on public.orders from anon;
revoke all on public.order_items from anon;

create function public.get_public_order(p_order_id uuid)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select case
    when o.id is null then null::jsonb
    else jsonb_build_object(
      'order', jsonb_build_object(
        'id', o.id,
        'table_number', o.table_number,
        'status', o.status,
        'total', o.total,
        'created_at', o.created_at,
        'updated_at', o.updated_at,
        'closed_at', o.closed_at
      ),
      'items', coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', oi.id,
            'name_en', oi.name_en,
            'name_ar', oi.name_ar,
            'unit_price', oi.unit_price,
            'quantity', oi.quantity,
            'notes', oi.notes
          ) order by oi.id
        ) filter (where oi.id is not null),
        '[]'::jsonb
      )
    )
  end
  from public.orders o
  left join public.order_items oi on oi.order_id = o.id
  where o.id = p_order_id
  group by o.id, o.table_number, o.status, o.total, o.created_at, o.updated_at, o.closed_at;
$$;

revoke all on function public.get_public_order(uuid) from public, anon, authenticated;
grant execute on function public.get_public_order(uuid) to anon;
