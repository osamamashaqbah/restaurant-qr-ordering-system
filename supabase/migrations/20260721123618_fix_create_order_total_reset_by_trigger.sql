-- create_order()'s original implementation inserted the order with total=0,
-- then UPDATEd it once the total was known. That UPDATE was silently undone
-- by orders_enforce_transition's `new.total = old.total` guard (which exists
-- to stop staff/clients from rewriting totals during status changes) — so
-- every order was created with total stuck at 0.
--
-- Fix: validate & price every line item in a first pass (accumulating the
-- total), then INSERT the order with the correct total already set — no
-- follow-up UPDATE, so the trigger never comes into play for creation.
create or replace function public.create_order(
  p_customer_name text,
  p_customer_whatsapp text,
  p_table_number text,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_item jsonb;
  v_menu_item public.menu_items%rowtype;
  v_quantity int;
  v_notes text;
  v_total numeric(10,2) := 0;
begin
  if p_customer_name is null or length(trim(p_customer_name)) < 1 or length(p_customer_name) > 100 then
    raise exception 'Invalid customer name';
  end if;
  if p_customer_whatsapp is null or p_customer_whatsapp !~ '^\+?[0-9]{7,15}$' then
    raise exception 'Invalid WhatsApp number';
  end if;
  if p_table_number is null or length(trim(p_table_number)) < 1 or length(p_table_number) > 20 then
    raise exception 'Invalid table number';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Order must contain at least one item';
  end if;
  if jsonb_array_length(p_items) > 100 then
    raise exception 'Too many line items';
  end if;

  -- Pass 1: validate every line and accumulate the true total, without
  -- writing anything yet.
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_menu_item from public.menu_items
      where id = (v_item->>'menu_item_id')::uuid
      for update;

    if not found then
      raise exception 'Menu item not found';
    end if;
    if not v_menu_item.is_available then
      raise exception 'Menu item % is not available', v_menu_item.name_en;
    end if;

    v_quantity := coalesce((v_item->>'quantity')::int, 0);
    if v_quantity < 1 or v_quantity > 50 then
      raise exception 'Invalid quantity for %', v_menu_item.name_en;
    end if;

    v_notes := coalesce(v_item->>'notes', '');
    if length(v_notes) > 300 then
      raise exception 'Note too long';
    end if;

    v_total := v_total + (v_menu_item.price * v_quantity);
  end loop;

  -- Order is inserted with its final total already correct.
  insert into public.orders (customer_name, customer_whatsapp, table_number, status, total)
  values (trim(p_customer_name), trim(p_customer_whatsapp), trim(p_table_number), 'new', v_total)
  returning id into v_order_id;

  -- Pass 2: write the priced line items (re-reading menu_items is cheap for
  -- cart-sized inputs and keeps this pass simple/consistent with pass 1).
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_menu_item from public.menu_items
      where id = (v_item->>'menu_item_id')::uuid;

    v_quantity := (v_item->>'quantity')::int;
    v_notes := coalesce(v_item->>'notes', '');

    insert into public.order_items (order_id, menu_item_id, name_en, name_ar, unit_price, quantity, notes)
    values (v_order_id, v_menu_item.id, v_menu_item.name_en, v_menu_item.name_ar, v_menu_item.price, v_quantity, v_notes);
  end loop;

  return v_order_id;
end;
$$;
