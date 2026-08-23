-- Replace internal UUIDs as public tracking capabilities with random opaque tokens.
create table public.order_tracking (
  order_id uuid primary key references public.orders(id) on delete cascade,
  token_hash bytea not null unique,
  created_at timestamptz not null default now()
);

alter table public.order_tracking enable row level security;
revoke all on public.order_tracking from public, anon, authenticated;

-- The API generates and returns the raw token; only its SHA-256 hash reaches the DB.
-- The existing create_order() remains the single pricing/validation authority.
create function public.create_order_with_tracking_token(
  p_customer_name text,
  p_customer_whatsapp text,
  p_table_number text,
  p_items jsonb,
  p_tracking_token_hash bytea
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
begin
  if p_tracking_token_hash is null or octet_length(p_tracking_token_hash) <> 32 then
    raise exception 'Invalid tracking token';
  end if;

  v_order_id := public.create_order(
    p_customer_name,
    p_customer_whatsapp,
    p_table_number,
    p_items
  );

  insert into public.order_tracking (order_id, token_hash)
  values (v_order_id, p_tracking_token_hash);

  return v_order_id;
end;
$$;

-- Returns the minimum non-PII tracking payload. No order or item UUID is exposed.
create function public.get_public_order_by_tracking_token(p_token_hash bytea)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select case
    when o.id is null then null::jsonb
    else jsonb_build_object(
      'status', o.status,
      'total', o.total,
      'createdAt', o.created_at,
      'updatedAt', o.updated_at,
      'closedAt', o.closed_at,
      'items', coalesce(
        jsonb_agg(
          jsonb_build_object(
            'nameEn', oi.name_en,
            'nameAr', oi.name_ar,
            'unitPrice', oi.unit_price,
            'quantity', oi.quantity
          ) order by oi.id
        ) filter (where oi.id is not null),
        '[]'::jsonb
      )
    )
  end
  from public.order_tracking t
  join public.orders o on o.id = t.order_id
  left join public.order_items oi on oi.order_id = o.id
  where t.token_hash = p_token_hash
  group by o.id, o.status, o.total, o.created_at, o.updated_at, o.closed_at;
$$;

revoke all on function public.create_order_with_tracking_token(text, text, text, jsonb, bytea) from public, anon, authenticated;
revoke all on function public.get_public_order_by_tracking_token(bytea) from public, anon, authenticated;
