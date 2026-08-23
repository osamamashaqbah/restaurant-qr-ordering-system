-- Make retries safe when a customer loses the response after an order commit.
-- Existing rows may have no fingerprint because they predate this migration;
-- those rows cannot be safely replayed with a new idempotency key.
alter table public.order_tracking
  add column if not exists request_hash bytea
  check (request_hash is null or octet_length(request_hash) = 32);

create or replace function public.create_order_with_tracking_token(
  p_customer_name text,
  p_customer_whatsapp text,
  p_table_number text,
  p_items jsonb,
  p_tracking_token_hash bytea,
  p_request_hash bytea
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_existing_order_id uuid;
  v_existing_request_hash bytea;
begin
  if p_tracking_token_hash is null or octet_length(p_tracking_token_hash) <> 32
     or p_request_hash is null or octet_length(p_request_hash) <> 32 then
    raise exception 'Invalid idempotency data';
  end if;

  -- Serialize requests that use the same capability before checking/inserting.
  perform pg_advisory_xact_lock(hashtextextended(encode(p_tracking_token_hash, 'hex'), 0));

  select order_id, request_hash
    into v_existing_order_id, v_existing_request_hash
    from public.order_tracking
   where token_hash = p_tracking_token_hash;

  if found then
    if v_existing_request_hash is null or v_existing_request_hash is distinct from p_request_hash then
      raise exception 'Idempotency key reused' using errcode = 'P0001';
    end if;
    return v_existing_order_id;
  end if;

  v_order_id := public.create_order(
    p_customer_name,
    p_customer_whatsapp,
    p_table_number,
    p_items
  );

  insert into public.order_tracking (order_id, token_hash, request_hash)
  values (v_order_id, p_tracking_token_hash, p_request_hash);

  return v_order_id;
end;
$$;

revoke all on function public.create_order_with_tracking_token(text, text, text, jsonb, bytea, bytea)
  from public, anon, authenticated;
