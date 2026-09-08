# Restaurant QR Ordering System

A single-QR ordering app for restaurants. One shared link opens the customer
menu; customers type in their name, WhatsApp number, and table number by
hand (never encoded in the QR). Kitchen, cashier, and admin each get a
role-scoped dashboard with realtime updates.

## Stack

- **Frontend:** Angular 22 + TypeScript
- **Backend:** ASP.NET Core 8 Web API
- **Platform:** Supabase — Postgres, Auth, Realtime, Storage
- **Deploy:** Cloudflare Pages (Angular) + Render (ASP.NET) + Supabase

## Rewrite status

The active rewrite is the `frontend/` Angular app and `backend/` ASP.NET API.
The original Next.js implementation remains under `src/` only as a legacy
parity reference. Production deploys the Angular app from `frontend/`; Vercel
is no longer a deployment target.

## Project structure

```
backend/
  RestaurantQrOrdering.Api/        # ASP.NET Core API
  RestaurantQrOrdering.Api.Tests/  # API tests
frontend/                           # Angular application
src/                                # legacy Next.js implementation
supabase/
  migrations/                       # schema/RLS/RPC changes, in order
```

Staff dashboards (kitchen/cashier/admin) are intentionally English-only. The
Angular guards protect navigation and the ASP.NET API re-checks the JWT
subject and current database role on every staff request.

## Getting started

```bash
dotnet test RestaurantQrOrdering.sln
npm --prefix frontend install
npm --prefix frontend start
```

The Angular app runs at [http://localhost:4200](http://localhost:4200). Set
the browser Supabase values in `frontend/public/runtime-config.js` and the
API values with `ConnectionStrings__SupabaseDatabase`,
`Supabase__JwtIssuer`, `Supabase__JwtAudience=authenticated`, and one or more
`Cors__AllowedOrigins__0` values for the deployed Angular origin.

If the API is behind a reverse proxy, set each proxy IP in
`ForwardedHeaders__TrustedProxies__0` (and subsequent indexes). The API only
honors forwarded client-IP headers from this allowlist; do not enable it with
arbitrary client addresses.

The beginner-friendly project and interview guide is available at
`http://localhost:4200/guide`.

Production Angular URL: https://restaurant-qr-ordering-system.pages.dev

Deploy Angular to the production Cloudflare Pages branch with:

```bash
npm --prefix frontend run deploy:cloudflare
```

The ASP.NET Docker service is declared in `render.yaml`. Render must receive
`ConnectionStrings__SupabaseDatabase` and `SENTRY_DSN` as secret environment
variables; neither secret belongs in Git.

Run the API with:

```bash
dotnet run --project backend/RestaurantQrOrdering.Api
```

The repository-level `npm run test:e2e` runs the Angular rewrite smoke suite
against Angular plus the local ASP.NET API. The older Next.js journey specs
remain under `e2e/` as legacy parity references and require the live Supabase
project before they can be promoted back into the active suite.

## Database & security model

Schema, RLS policies, and RPC functions live in Supabase under `supabase/`.
The ASP.NET API uses parameterized queries and narrowly scoped database
functions for staff commands; apply migrations in filename order before using
the rewrite against a real project. Key decisions:

- **Roles** (`admin` / `cashier` / `kitchen`) live in `public.profiles`,
  linked 1:1 to `auth.users`. Only an admin can assign roles; no user can
  ever write their own `role` column (no self-escalation path).
- **Staff JWTs are verified from Supabase's JWKS.** The API requires the
  HTTPS issuer, validates `aud=authenticated`, expiry, and signature, and
  never accepts a generated fallback key. Configure an asymmetric JWT signing
  key in Supabase so `/auth/v1/.well-known/jwks.json` returns public keys.
- **Orders are never trusted from the client.** `create_order()` is the only
  write path for placing an order — it re-prices every line item from
  `menu_items` server-side, so a tampered client payload can't change totals.
- **Status transitions are enforced in Postgres**, not just the UI
  (`new → preparing → ready → closed`, plus `cancelled`), each gated to the
  correct role via a `BEFORE UPDATE` trigger.
- **Item availability** is the *only* thing a cashier can touch on
  `menu_items`, and only through `set_item_availability()` — cashiers get no
  direct table grant, so they can't edit prices/photos/names.
- **Customer order tracking is scoped.** Anonymous clients cannot read
  `orders` or `order_items` directly; `get_public_order()` returns only one
  order's non-PII tracking fields and line items. The customer tracker polls
  that RPC, while full rows remain visible only to authenticated staff.
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

### Known platform item

- **Leaked-password protection** (checks new passwords against
  HaveIBeenPwned) is a Supabase Auth *project setting*, not something
  reachable via SQL/migrations. Enable it in the dashboard: Authentication
  → Policies → Password Security when the current plan exposes that control.
  The current Free project reports this setting as unavailable; upgrading
  Supabase is required to enable it.
- **No-delay production SLA:** the API is live on Render's Free plan. Render
  displays a warning that an idle instance can take 50 seconds or more to
  wake. Upgrade the API service to an always-on paid instance before treating
  the system as a zero-cold-start production service.

## Environment variables

The rewrite uses `frontend/public/runtime-config.js` for the public Supabase
URL/anon key and server-side settings for the database/JWT values listed above.
The legacy Next.js app still uses `.env.example`. Never commit real keys —
`.gitignore` excludes environment files.

## Implementation phases

0. ✅ Legacy Next.js baseline and Supabase security model
1. ✅ ASP.NET foundation and Angular shell
2. ✅ Customer menu, checkout, opaque tracking, and rating
3. ✅ Kitchen, cashier, and admin role-scoped workflows
4. ✅ Local API/Angular tests and production dependency audit
5. ✅ Apply rewrite migrations to the target Supabase project
6. ✅ Deploy and smoke-test Angular on Cloudflare Pages
7. ✅ Deploy ASP.NET on Render and run live health, CORS, security, and load verification

## Current production verification

- Angular: `https://restaurant-qr-ordering-system.pages.dev`
- API: `https://restaurant-qr-ordering-api.onrender.com`
- `main` contains the deployed rewrite; the latest verified commit is
  `eefd2a3`.
- Live checks: health/menu `200`, anonymous staff access `401`, malformed
  tracking `404`, invalid order `400`, oversized request `413`, and allowed
  frontend CORS preflight `204`.
- A warmed 200-request concurrent menu test returned `200` for all requests
  with P95 around 329ms. This measures the read path only; do not create
  artificial production orders for a write-load test.
- The Render Free cold-start warning is the remaining infrastructure limit;
  it cannot be removed by application code alone.
