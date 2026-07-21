-- ============================================================
-- Restaurant QR Ordering System — core schema, RLS, and RPCs
-- ============================================================

-- ---------- Enums ----------
create type public.role_type as enum ('admin', 'cashier', 'kitchen');
create type public.order_status as enum ('new', 'preparing', 'ready', 'closed', 'cancelled');

-- ---------- profiles (staff accounts only; customers never get a row here) ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.role_type,
  full_name text not null default '',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- SECURITY DEFINER helper so RLS policies can check role without recursive
-- RLS evaluation on profiles itself.
create function public.get_my_role()
returns public.role_type
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

create function public.is_staff(roles public.role_type[])
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.get_my_role() = any(roles), false);
$$;

-- profile bootstrap on signup; role stays NULL until an admin assigns one
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- profiles RLS: users read their own row; admins read/manage all.
-- No one — including the row owner — may write their own role (prevents self-escalation).
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());

create policy "profiles_select_admin" on public.profiles
  for select using (public.is_staff(array['admin']::public.role_type[]));

create policy "profiles_update_admin" on public.profiles
  for update using (public.is_staff(array['admin']::public.role_type[]))
  with check (public.is_staff(array['admin']::public.role_type[]));

-- ---------- updated_at helper ----------
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- categories ----------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_ar text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "categories_select_public" on public.categories
  for select using (true);

create policy "categories_write_admin" on public.categories
  for all using (public.is_staff(array['admin']::public.role_type[]))
  with check (public.is_staff(array['admin']::public.role_type[]));

-- ---------- menu_items ----------
create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  name_en text not null,
  name_ar text not null,
  description_en text not null default '',
  description_ar text not null default '',
  price numeric(10,2) not null check (price >= 0),
  image_url text,
  allergens text[] not null default '{}',
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index menu_items_category_id_idx on public.menu_items(category_id);

alter table public.menu_items enable row level security;

create trigger menu_items_set_updated_at
  before update on public.menu_items
  for each row execute function public.set_updated_at();

create policy "menu_items_select_public" on public.menu_items
  for select using (true);

-- Full CRUD (name/price/photo/category/etc) — admin only.
create policy "menu_items_write_admin" on public.menu_items
  for all using (public.is_staff(array['admin']::public.role_type[]))
  with check (public.is_staff(array['admin']::public.role_type[]));

-- Cashiers may only flip availability, and only through set_item_availability()
-- (SECURITY DEFINER below) — no direct table grant is given to cashiers.

-- ---------- orders ----------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_whatsapp text not null,
  table_number text not null,
  status public.order_status not null default 'new',
  total numeric(10,2) not null default 0 check (total >= 0),
  payment_confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz
);

create index orders_status_idx on public.orders(status);
create index orders_created_at_idx on public.orders(created_at desc);

alter table public.orders enable row level security;

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- Enforce valid status transitions & who may make them, independent of RLS,
-- so a compromised/careless client can't jump straight to closed or reopen orders.
create function public.enforce_order_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  my_role public.role_type := public.get_my_role();
begin
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

  -- staff may never rewrite customer-identifying fields or totals after the fact
  new.customer_name = old.customer_name;
  new.customer_whatsapp = old.customer_whatsapp;
  new.table_number = old.table_number;
  new.total = old.total;

  return new;
end;
$$;

create trigger orders_enforce_transition
  before update on public.orders
  for each row execute function public.enforce_order_transition();

-- No direct INSERT policy for anon/authenticated — orders are only created via
-- create_order() below, which validates & prices items server-side.

create policy "orders_select_staff" on public.orders
  for select using (public.is_staff(array['admin','cashier','kitchen']::public.role_type[]));

create policy "orders_update_staff" on public.orders
  for update using (public.is_staff(array['admin','cashier','kitchen']::public.role_type[]))
  with check (public.is_staff(array['admin','cashier','kitchen']::public.role_type[]));

-- Anonymous customers can read a narrow, non-PII slice of orders (needed for the
-- live status tracker + realtime). Enforced at the column level, not just RLS.
create policy "orders_select_anon_status" on public.orders
  for select using (true);

revoke all on public.orders from anon;
grant select (id, table_number, status, total, created_at, updated_at, closed_at) on public.orders to anon;

revoke all on public.orders from authenticated;
grant select, update on public.orders to authenticated;

-- ---------- order_items ----------
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  name_en text not null,
  name_ar text not null,
  unit_price numeric(10,2) not null check (unit_price >= 0),
  quantity int not null check (quantity > 0 and quantity <= 50),
  notes text not null default ''
);

create index order_items_order_id_idx on public.order_items(order_id);

alter table public.order_items enable row level security;

-- No PII on this table — safe for public/staff read. Writes only via create_order().
create policy "order_items_select_public" on public.order_items
  for select using (true);

revoke all on public.order_items from anon;
grant select on public.order_items to anon;
revoke all on public.order_items from authenticated;
grant select on public.order_items to authenticated;

-- ---------- ratings ----------
create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  stars int not null check (stars between 1 and 5),
  comment text not null default '',
  created_at timestamptz not null default now()
);

alter table public.ratings enable row level security;

create policy "ratings_select_staff" on public.ratings
  for select using (public.is_staff(array['admin','cashier']::public.role_type[]));

revoke all on public.ratings from anon, authenticated;

-- ============================================================
-- RPCs (SECURITY DEFINER) — the only write paths for customer actions
-- ============================================================

-- Creates an order with server-priced items. Client sends only
-- {menu_item_id, quantity, notes}[]; price/name snapshots come from the DB,
-- never from the client, closing off price-tampering.
create function public.create_order(
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

  insert into public.orders (customer_name, customer_whatsapp, table_number, status, total)
  values (trim(p_customer_name), trim(p_customer_whatsapp), trim(p_table_number), 'new', 0)
  returning id into v_order_id;

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

    insert into public.order_items (order_id, menu_item_id, name_en, name_ar, unit_price, quantity, notes)
    values (v_order_id, v_menu_item.id, v_menu_item.name_en, v_menu_item.name_ar, v_menu_item.price, v_quantity, v_notes);

    v_total := v_total + (v_menu_item.price * v_quantity);
  end loop;

  update public.orders set total = v_total where id = v_order_id;

  return v_order_id;
end;
$$;

revoke all on function public.create_order(text, text, text, jsonb) from public;
grant execute on function public.create_order(text, text, text, jsonb) to anon;

-- Cashier/admin-only availability toggle — the sole write path onto
-- menu_items.is_available (cashiers get no direct table grant).
create function public.set_item_availability(p_item_id uuid, p_available boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_staff(array['cashier','admin']::public.role_type[]) then
    raise exception 'Not authorized';
  end if;

  update public.menu_items
    set is_available = p_available, updated_at = now()
    where id = p_item_id;

  if not found then
    raise exception 'Menu item not found';
  end if;
end;
$$;

revoke all on function public.set_item_availability(uuid, boolean) from public;
grant execute on function public.set_item_availability(uuid, boolean) to authenticated;

-- Customer star rating — only once, only after the order is closed.
create function public.submit_rating(p_order_id uuid, p_stars int, p_comment text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status public.order_status;
begin
  if p_stars < 1 or p_stars > 5 then
    raise exception 'Stars must be between 1 and 5';
  end if;
  if p_comment is not null and length(p_comment) > 500 then
    raise exception 'Comment too long';
  end if;

  select status into v_status from public.orders where id = p_order_id;
  if not found then
    raise exception 'Order not found';
  end if;
  if v_status <> 'closed' then
    raise exception 'Order is not yet closed';
  end if;

  insert into public.ratings (order_id, stars, comment)
  values (p_order_id, p_stars, coalesce(trim(p_comment), ''));
end;
$$;

revoke all on function public.submit_rating(uuid, int, text) from public;
grant execute on function public.submit_rating(uuid, int, text) to anon;

-- ---------- realtime ----------
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.order_items;
alter publication supabase_realtime add table public.menu_items;
