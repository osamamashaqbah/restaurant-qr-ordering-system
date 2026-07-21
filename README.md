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
    (customer)/   # entry form, menu, cart, order tracker, rating (AR/EN, RTL/LTR)
    kitchen/      # kitchen kanban board (role-gated)
    cashier/      # ready orders, availability toggle, invoice (role-gated)
    admin/        # menu CRUD, sales reports, staff roles (role-gated)
    login/        # shared staff login (role decides redirect)
  lib/
    supabase/     # browser/server/proxy Supabase clients
    auth/         # getStaffUser() — server-side role re-check per layout
    validation/   # zod schemas for all user input
    i18n/         # AR/EN copy + RTL helpers (customer-facing only)
    customer/     # cart + entry-form session state (sessionStorage)
  types/          # generated Supabase DB types
supabase/
  migrations/     # every schema/RLS/RPC change, in application order
```

Staff dashboards (kitchen/cashier/admin) are intentionally English-only —
they're internal tools, not customer-facing, so they don't carry the i18n
provider. Route protection is layered: `src/proxy.ts` (Next.js proxy, the
renamed `middleware.ts`) gates `/admin`, `/cashier`, `/kitchen` at the edge,
and every staff layout independently re-checks auth + role server-side via
`getStaffUser()` before rendering anything — neither check trusts the other.

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
- **Security events are logged.** Role changes are captured automatically
  in `public.security_events` (actor, target, old/new role — no PII) via a
  trigger on `profiles`, visible to admins under Admin → Staff. Failed
  login attempts aren't duplicated into our own table — they're already in
  Supabase's own Auth logs (project dashboard → Logs → Auth), since GoTrue
  verifies passwords itself and our database never sees the attempt.
- **No service-role key anywhere in the app.** Creating a *new* staff login
  is a Supabase Auth admin action (dashboard → Authentication → Users →
  Add user), done outside the app by whoever controls the Supabase
  project. The Admin → Staff tab only *assigns roles* to existing
  accounts, entirely through the normal `profiles` RLS policy — there's no
  privileged API route or secret key for the app itself to leak.

### Bootstrapping the first admin

1. Create the admin's account in the Supabase dashboard (Authentication →
   Users → Add user) with an email and password.
2. In the Supabase SQL editor, run:
   ```sql
   update public.profiles set role = 'admin' where id = '<their auth.users id>';
   ```
   This one-time step is intentionally not exposed through the app —
   after it, that admin can assign every subsequent role through
   Admin → Staff.

### Known outstanding item

- **Leaked-password protection** (checks new passwords against
  HaveIBeenPwned) is a Supabase Auth *project setting*, not something
  reachable via SQL/migrations. Enable it in the dashboard: Authentication
  → Policies → Password Security. Everything else in the mandatory
  security checklist (bcrypt hashing, JWT/session expiry, rate limiting on
  auth endpoints) is Supabase Auth's default behavior and needs no extra
  configuration — verified via Supabase's own security advisor
  (`get_advisors`) throughout development, re-run after every schema
  change.

## Environment variables

See `.env.example`. Never commit `.env.local` or any real key — `.gitignore`
already excludes all `.env*` files except the placeholder `.env.example`.

## Implementation phases

0. ✅ Project setup — Next.js, Supabase schema/RLS/RPCs, auth roles
1. ✅ Customer flow — QR entry form, bilingual menu, cart, order submission
2. ✅ Kitchen board — New → Preparing → Ready
3. ✅ Cashier dashboard — realtime orders, payment close, availability toggle, WhatsApp invoice
4. ✅ Post-order rating
5. ✅ Admin dashboard — menu CRUD, sales reports, staff role assignment
6. ✅ Role-based auth hardening pass — security-event logging, error-message
   audit, RLS/advisor sweep (see "Known outstanding item" above)
7. UI polish, testing, deployment

Every phase after 0 was verified against the live deployed Supabase
project (not just locally) — placing real orders, logging in as each
role, and confirming Realtime propagation end-to-end — with two real bugs
found and fixed along the way (an RLS-breaking function grant, and a
trigger that silently zeroed out order totals). See migration file
comments in `supabase/migrations/` for the details of each.
