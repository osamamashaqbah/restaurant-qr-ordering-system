# Security remediation baseline

Date: 2026-09-08

The active product is `frontend/` (Angular) plus `backend/` (ASP.NET Core).
The legacy Next.js/Supabase-browser code remains only as a migration reference
until it can be removed after live rewrite acceptance.

## Baseline evidence

- `dotnet test RestaurantQrOrdering.sln --nologo`: 58 passing tests.
- `npm test -- --run`: 55 passing, 1 intentionally skipped.
- `npm --prefix frontend test -- --watch=false`: 56 passing tests.
- `npm --prefix frontend run build`: passed.
- `npm run test:e2e`: 5/5 local Angular smoke tests.
- Production Angular smoke tests: 5/5.
- Live API checks passed for health, menu, CORS, authentication rejection,
  malformed tracking, invalid input, and oversized request handling.
- A warmed 200-request concurrent menu test returned 200 for all requests
  with P95 around 329ms.

## P0 inventory and decision

The old `create_order`, `get_public_order`, `submit_rating`,
`set_item_availability`, `get_sales_summary`, and `list_staff` RPCs retained
PostgREST grants for `anon` or `authenticated`. The rewrite does not call
them: it uses opaque-token public RPCs and API-only staff commands through a
direct database connection. Migration `20260825160000_lock_down_legacy_public_rpcs.sql`
therefore revokes browser-role execution from all six functions.

`tests/unit/legacy-rpc-lockdown.test.ts` prevents the source migration from
losing a revoke. `tests/integration/legacy-rpc-lockdown.test.ts` is the live
staging check; run it only with `RUN_SUPABASE_SECURITY_TESTS=true` after
applying the migration to a non-production Supabase project.

## Historical external gate

Applying the migration, creating a restricted API database role, and proving
RLS/function privileges were the original external gate. The target Supabase
project now has the rewrite migration applied and the API is using its direct
database connection; the browser data API remains denied by the lockdown
migration.

The API requires `Supabase:JwtIssuer` (HTTPS) and
`Supabase:JwtAudience=authenticated` at startup. It uses the issuer's OpenID
metadata and JWKS for asymmetric Supabase session-token validation.

## Remaining infrastructure limitation

The Render API is currently on the Free plan. Render reports that an idle
instance may take 50 seconds or more to wake. The application now bounds
browser API waits at 15 seconds, but an always-on paid Render instance is
required for a strict no-cold-start requirement.
