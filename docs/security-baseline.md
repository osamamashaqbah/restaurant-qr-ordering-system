# Security remediation baseline

Date: 2026-08-25

The active product is `frontend/` (Angular) plus `backend/` (ASP.NET Core).
The legacy Next.js/Supabase-browser code remains only as a migration reference
until it can be removed after live rewrite acceptance.

## Baseline evidence

- `dotnet test RestaurantQrOrdering.sln --nologo`: 49 passing tests.
- `npm --prefix frontend test -- --watch=false`: 53 passing tests.
- `npm --prefix frontend run build`: passed.
- Root legacy integration tests cannot reach the configured Supabase host from
  this environment (`ENOTFOUND`), so no migration or live-RLS claim is made.

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

## External gate

Applying the migration, creating a restricted API database role, and proving
RLS/function privileges require an approved staging connection. No production
database operation was attempted from this workspace.
