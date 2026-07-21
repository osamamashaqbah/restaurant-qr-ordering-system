# Restaurant QR Ordering System

A single-QR ordering app for restaurants. One shared link opens the customer
menu; customers type in their name, WhatsApp number, and table number by
hand (never encoded in the QR). Kitchen, cashier, and admin each get a
role-scoped dashboard with realtime updates.

## Stack

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS
- **Backend:** Supabase — Postgres, Auth, Realtime, Storage
- **Deploy:** Vercel (frontend) + Supabase (backend)

## Project structure

```
src/
  app/
    (customer)/   # entry form, menu, cart, order tracker, rating
    (kitchen)/    # kitchen kanban board
    (cashier)/    # cashier dashboard: ready orders, availability toggle, invoice
    (admin)/      # menu CRUD, sales reports
    login/        # shared staff login (role decides redirect)
  lib/
    supabase/     # browser/server/middleware Supabase clients
    validation/   # zod schemas for all user input
    i18n/         # AR/EN copy + RTL helpers
  types/          # generated Supabase DB types
```

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project URL + anon key
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database & security model

Schema, RLS policies, and RPC functions live in Supabase (see migrations
applied via the Supabase MCP tooling — check the Supabase dashboard's
migration history for the full SQL). Key decisions:

- **Roles** (`admin` / `cashier` / `kitchen`) live in `public.profiles`,
  linked 1:1 to `auth.users`. Only an admin can assign roles; no user can
  ever write their own `role` column (no self-escalation path).
- **Orders are never trusted from the client.** `create_order()` is the only
  write path for placing an order — it re-prices every line item from
  `menu_items` server-side, so a tampered client payload can't change totals.
- **Status transitions are enforced in Postgres**, not just the UI
  (`new → preparing → ready → closed`, plus `cancelled`), each gated to the
  correct role via a `BEFORE UPDATE` trigger.
- **Item availability** is the *only* thing a cashier can touch on
  `menu_items`, and only through `set_item_availability()` — cashiers get no
  direct table grant, so they can't edit prices/photos/names.
- **Customer PII (name, WhatsApp number)** is excluded from the anon
  column-grant on `orders`; anonymous customers can only read
  `id/table_number/status/total/created_at/updated_at/closed_at` for the
  live order tracker. Full rows are only visible to authenticated staff.
- **Ratings** can only be submitted once, and only after an order is
  `closed`, enforced inside `submit_rating()`.

### Bootstrapping the first admin

1. Have the admin sign up once through Supabase Auth (dashboard, or the
   app's login page once it supports sign-up).
2. In the Supabase SQL editor, run:
   ```sql
   update public.profiles set role = 'admin' where id = '<their auth.users id>';
   ```
   This is intentionally not exposed through the app — the only way to
   create the *first* admin is a direct DB action by whoever controls the
   Supabase project.

## Environment variables

See `.env.example`. Never commit `.env.local` or any real key — `.gitignore`
already excludes all `.env*` files except the placeholder `.env.example`.

## Implementation phases

0. Project setup — Next.js, Supabase schema/RLS/RPCs, auth roles *(this commit)*
1. Customer flow — QR entry form, bilingual menu, cart, order submission
2. Kitchen board — New → Preparing → Ready
3. Cashier dashboard — realtime orders, payment close, availability toggle, WhatsApp invoice
4. Post-order rating
5. Admin dashboard — menu CRUD, sales reports
6. Role-based auth hardening pass
7. UI polish, testing, deployment
