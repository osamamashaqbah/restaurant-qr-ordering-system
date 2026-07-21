-- Admin-only aggregated sales report. Computed server-side so the client
-- never has to pull raw order rows (with customer PII) just to show totals.
create function public.get_sales_summary(p_start timestamptz, p_end timestamptz)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if not public.is_staff(array['admin']::public.role_type[]) then
    raise exception 'Not authorized';
  end if;

  select jsonb_build_object(
    'revenue', coalesce(sum(o.total), 0),
    'order_count', count(*),
    'avg_order_value', coalesce(round(avg(o.total), 2), 0),
    'daily', (
      select coalesce(jsonb_agg(d order by d->>'day'), '[]'::jsonb)
      from (
        select jsonb_build_object(
          'day', to_char(date_trunc('day', o2.closed_at), 'YYYY-MM-DD'),
          'revenue', sum(o2.total)
        ) as d
        from public.orders o2
        where o2.status = 'closed' and o2.closed_at between p_start and p_end
        group by date_trunc('day', o2.closed_at)
      ) days
    ),
    'top_items', (
      select coalesce(jsonb_agg(t order by (t->>'revenue')::numeric desc), '[]'::jsonb)
      from (
        select jsonb_build_object(
          'name_en', oi.name_en,
          'quantity', sum(oi.quantity),
          'revenue', sum(oi.unit_price * oi.quantity)
        ) as t
        from public.order_items oi
        join public.orders o3 on o3.id = oi.order_id
        where o3.status = 'closed' and o3.closed_at between p_start and p_end
        group by oi.name_en
        limit 10
      ) items
    )
  )
  into v_result
  from public.orders o
  where o.status = 'closed' and o.closed_at between p_start and p_end;

  return v_result;
end;
$$;

revoke all on function public.get_sales_summary(timestamptz, timestamptz) from public, anon;
grant execute on function public.get_sales_summary(timestamptz, timestamptz) to authenticated;
