# Graph Report - Restaurant QR Ordering System  (2026-09-10)

## Corpus Check
- 219 files · ~56,008 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1410 nodes · 2363 edges · 124 communities (102 shown, 22 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `23b65d04`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- createClient
- menu/page.tsx
- Supabase
- devDependencies
- First-admin bootstrap
- compilerOptions
- .GetOrders
- dependencies
- (customer)/page.tsx
- cashier/page.tsx
- Task
- Customer routes
- TrackingTokenSessionService
- 20260721121510_core_schema_rls_rpcs.sql
- edge-cases.spec.ts
- app/layout.tsx
- 20260721140000_security_events_log.sql
- Supabase migrations
- Hero3D.tsx
- 20260722030000_prevent_self_role_change.sql
- Failed login attempts
- eslint.config.mjs
- next.config.ts
- postcss.config.mjs
- Document Icon
- Globe Icon
- Next.js Logo
- Vercel Logo
- Window Icon
- Generated Supabase database types
- CashierCommandResult
- AdminMenuCommandResult
- public-menu.ts
- KitchenTests
- devDependencies
- PublicRatingResult
- StaffAuthTests
- admin/admin.ts
- http
- AdminMenuController
- cashier/cashier.ts
- .HandleAsync
- PublicMenuResponse
- KitchenService
- PublicOrderTests
- CartProvider.tsx
- RestaurantQrOrdering.Api.Tests.csproj
- Exception
- .CreateAsync
- .Create
- StaffAuthService
- ItemsSection.tsx
- PublicOrderTracking
- RestaurantQrOrdering.Api.Features.Staff
- .GetAsync
- .Get
- HealthEndpointTests
- dependencies
- serve
- .Get
- Role-gated access
- Restaurant QR Ordering System
- Next.js agent rules
- supabase-auth.ts
- options
- restaurant-qr-ordering-web
- RestaurantQrOrderingWeb
- RestaurantQrOrdering.Api.Features.PublicOrders
- .CreateAsync
- angular.json
- build
- .Validate
- scripts
- app.config.ts
- .Submit
- public.get_public_order_by_tracking_token
- Security remediation baseline
- development
- Single-QR ordering app
- public.get_public_order
- 20260823040000_staff_order_commands.sql
- ReportsPanel.tsx
- public.staff_close_order
- public.staff_set_item_availability
- public.admin_get_sales_summary
- atomic-rating-migration.test.ts
- unit/legacy-rpc-lockdown.test.ts
- public.order_tracking
- Cashier
- CartService
- PublicRatingTests
- frontend/package.json
- TestAppFactory
- staff-role.guard.ts
- AdminMenu
- AdminMenuService
- Admin
- integration/helpers.ts
- Guide
- rxjs
- .GetAsync

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 30 edges
2. `RestaurantQrOrdering.Api.Features.Staff` - 27 edges
3. `StaffAuthService` - 21 edges
4. `AdminMenuCommandResult` - 20 edges
5. `PublicOrderTests` - 16 edges
6. `compilerOptions` - 16 edges
7. `StaffAuthTests` - 15 edges
8. `RestaurantQrOrdering.Api.Features.PublicOrders` - 15 edges
9. `formatPrice()` - 15 edges
10. `RestaurantQrOrdering.Api.Features.PublicMenu` - 14 edges

## Surprising Connections (you probably didn't know these)
- `Next.js (repository version)` --semantically_similar_to--> `Next.js`  [INFERRED] [semantically similar]
  AGENTS.md → README.md
- `orderAsCustomer()` --references--> `browser`  [EXTRACTED]
  e2e/edge-cases.spec.ts → frontend/angular.json
- `FakeMenuStore` --implements--> `IPublicMenuStore`  [EXTRACTED]
  backend/RestaurantQrOrdering.Api.Tests/CashierTests.cs → backend/RestaurantQrOrdering.Api/Features/PublicMenu/IPublicMenuStore.cs
- `HealthEndpointTests` --references--> `TestAppFactory`  [EXTRACTED]
  backend/RestaurantQrOrdering.Api.Tests/HealthEndpointTests.cs → backend/RestaurantQrOrdering.Api.Tests/TestAppFactory.cs
- `FakeMenuStore` --implements--> `IPublicMenuStore`  [EXTRACTED]
  backend/RestaurantQrOrdering.Api.Tests/PublicMenuTests.cs → backend/RestaurantQrOrdering.Api/Features/PublicMenu/IPublicMenuStore.cs

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Customer ordering flow** — readme_single_qr_ordering_app, readme_customer_menu, readme_entry_form, readme_cart, readme_order_tracker, readme_rating [EXTRACTED 1.00]
- **Layered staff dashboard access** — readme_staff_login, readme_src_proxy, readme_staff_layouts, readme_getstaffuser, readme_kitchen_dashboard, readme_cashier_dashboard, readme_admin_dashboard [EXTRACTED 1.00]
- **Database security enforcement** — readme_profiles, readme_create_order, readme_order_status_transitions, readme_set_item_availability, readme_customer_pii, readme_ratings, readme_security_events [EXTRACTED 1.00]

## Communities (124 total, 22 thin omitted)

### Community 0 - "createClient"
Cohesion: 0.08
Nodes (29): CategoriesSection(), Category, CategoryForm(), ItemsSection(), Category, MenuPanel(), TabId, TABS (+21 more)

### Community 1 - "menu/page.tsx"
Cohesion: 0.14
Nodes (21): CartPage(), Category, ItemCard(), MenuItem, MenuPage(), OrderItemRow, OrderStatus, OrderTrackerPage() (+13 more)

### Community 2 - "Supabase"
Cohesion: 0.20
Nodes (11): HaveIBeenPwned, Implementation phases, Leaked-password protection, Live Supabase project verification, RLS-breaking function grant bug, Supabase, Supabase Auth, Supabase Realtime (+3 more)

### Community 3 - "devDependencies"
Cohesion: 0.06
Nodes (33): dotenv, eslint, eslint-config-next, devDependencies, dotenv, eslint, eslint-config-next, jsdom (+25 more)

### Community 4 - "First-admin bootstrap"
Cohesion: 0.08
Nodes (30): admin role, Admin → Staff view, Anonymous orders column grant, auth.users, Authenticated staff, BEFORE UPDATE trigger, cashier role, create_order() (+22 more)

### Community 5 - "compilerOptions"
Cohesion: 0.07
Nodes (29): dom, dom.iterable, esnext, frontend, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts (+21 more)

### Community 6 - ".GetOrders"
Cohesion: 0.31
Nodes (9): ActionResult, CancellationToken, Guid, HttpGet, HttpPost, IReadOnlyList, ProducesResponseType, Task (+1 more)

### Community 7 - "dependencies"
Cohesion: 0.05
Nodes (37): @hookform/resolvers, next, dependencies, @hookform/resolvers, next, react, react-dom, react-hook-form (+29 more)

### Community 8 - "(customer)/page.tsx"
Cohesion: 0.18
Nodes (12): EntryPage(), Hero3D, inputClass(), RatingPage(), COUNTRY_CODES, CountryCode, OTHER_COUNTRY_VALUE, cartItemNoteSchema (+4 more)

### Community 9 - "cashier/page.tsx"
Cohesion: 0.17
Nodes (11): AvailabilityPanel(), CashierPage(), Category, ClosedOrder, MenuItem, OrderStatus, StaffOrder, StaffOrderItem (+3 more)

### Community 10 - "Task"
Cohesion: 0.07
Nodes (38): AdminCommandResult, DailySales, SalesSummary, SecurityEvent, StaffMember, TopSellingItem, UpdateStaffRoleRequest, ActionResult (+30 more)

### Community 11 - "Customer routes"
Cohesion: 0.27
Nodes (10): AR/EN localization, Cart, Customer routes, Customer session state, Entry form, Customer-facing i18n helpers, Order tracker, Customer rating (+2 more)

### Community 12 - "TrackingTokenSessionService"
Cohesion: 0.05
Nodes (24): CustomerSessionData, CustomerSessionService, Injectable, OrderTrackingService, PublicOrderItem, PublicOrderTracking, Injectable, CreateOrderRequest (+16 more)

### Community 13 - "20260721121510_core_schema_rls_rpcs.sql"
Cohesion: 0.17
Nodes (5): public.handle_new_user, on_auth_user_created, public.get_my_role(), public.profiles, auth.users

### Community 14 - "edge-cases.spec.ts"
Cohesion: 0.39
Nodes (3): hasRoleCreds, roleCreds, DASHBOARDS

### Community 15 - "app/layout.tsx"
Cohesion: 0.29
Nodes (5): displayAr, displayEn, metadata, sansAr, sansEn

### Community 16 - "20260721140000_security_events_log.sql"
Cohesion: 0.33
Nodes (4): public.log_role_change, profiles_log_role_change, public.security_events, auth.users

### Community 17 - "Supabase migrations"
Cohesion: 0.40
Nodes (5): Row-level security policies, Supabase RPC functions, Schema changes, Supabase migrations, Supabase security advisor

### Community 18 - "Hero3D.tsx"
Cohesion: 0.50
Nodes (3): Burger(), prefersReducedMotion(), SEED_TRANSFORMS

### Community 20 - "Failed login attempts"
Cohesion: 0.50
Nodes (4): Application database, Failed login attempts, GoTrue, Supabase Auth logs

### Community 42 - "CashierCommandResult"
Cohesion: 0.11
Nodes (23): CashierCommandResult, CashierOrder, CashierOrderItem, SetAvailabilityRequest, CancellationToken, Guid, IReadOnlyList, Task (+15 more)

### Community 43 - "AdminMenuCommandResult"
Cohesion: 0.12
Nodes (22): Guid, AdminMenuCommandResult, CreateCategoryRequest, CreateMenuItemRequest, UpdateCategoryRequest, UpdateMenuItemRequest, CancellationToken, Guid (+14 more)

### Community 44 - "public-menu.ts"
Cohesion: 0.27
Nodes (5): PublicCategory, PublicMenuService, Injectable, Menu, Component

### Community 45 - "KitchenTests"
Cohesion: 0.08
Nodes (30): CancellationToken, Guid, IReadOnlyList, Task, IKitchenStore, KitchenCommandResult, KitchenOrder, KitchenOrderItem (+22 more)

### Community 46 - "devDependencies"
Cohesion: 0.12
Nodes (17): @angular/build, @angular/cli, @angular/compiler-cli, devDependencies, @angular/build, @angular/cli, @angular/compiler-cli, jsdom (+9 more)

### Community 47 - "PublicRatingResult"
Cohesion: 0.16
Nodes (13): CancellationToken, ReadOnlyMemory, Task, IPublicRatingStore, CancellationToken, ReadOnlyMemory, Task, NpgsqlPublicRatingStore (+5 more)

### Community 48 - "StaffAuthTests"
Cohesion: 0.12
Nodes (19): CancellationToken, Guid, Task, IStaffProfileStore, CancellationToken, Guid, Task, NpgsqlStaffProfileStore (+11 more)

### Community 49 - "admin/admin.ts"
Cohesion: 0.23
Nodes (6): AdminSecurityEvent, AdminService, AdminStaffMember, SalesSummary, StaffRole, Injectable

### Community 50 - "http"
Cohesion: 0.10
Nodes (21): ASPNETCORE_ENVIRONMENT, applicationUrl, commandName, dotnetRunMessages, environmentVariables, launchBrowser, launchUrl, commandName (+13 more)

### Community 51 - "AdminMenuController"
Cohesion: 0.25
Nodes (12): ActionResult, CancellationToken, Exception, Func, Guid, HttpGet, HttpPost, Task (+4 more)

### Community 52 - "cashier/cashier.ts"
Cohesion: 0.24
Nodes (4): CashierOrder, CashierOrderItem, CashierService, Injectable

### Community 53 - ".HandleAsync"
Cohesion: 0.13
Nodes (15): AuthorizationHandler, AuthorizationHandlerContext, AuthorizationMiddlewareResultHandler, AuthorizationPolicy, string, Task, StaffAuthorizationMiddlewareResultHandler, StaffRoleAuthorizationHandler (+7 more)

### Community 54 - "PublicMenuResponse"
Cohesion: 0.15
Nodes (12): CancellationToken, Task, IPublicMenuStore, PublicMenuStoreUnavailableException, CancellationToken, Task, NpgsqlPublicMenuStore, UnavailablePublicMenuStore (+4 more)

### Community 55 - "KitchenService"
Cohesion: 0.15
Nodes (7): KitchenOrder, KitchenOrderItem, KitchenService, Injectable, BoardState, Kitchen, Component

### Community 56 - "PublicOrderTests"
Cohesion: 0.29
Nodes (4): Fact, Task, PublicOrderTests, RecordingStore

### Community 57 - "CartProvider.tsx"
Cohesion: 0.15
Nodes (11): CartContext, CartContextValue, CartItem, CartProvider(), hummus, kebab, CustomerSession, CustomerSessionProvider() (+3 more)

### Community 58 - "RestaurantQrOrdering.Api.Tests.csproj"
Cohesion: 0.12
Nodes (13): net8.0, net8.0, coverlet.collector (6.0.0), Microsoft.AspNetCore.Authentication.JwtBearer (8.0.23), Microsoft.AspNetCore.Mvc.Testing (8.0.23), Microsoft.NET.Test.Sdk (17.8.0), Npgsql (8.0.6), Sentry.AspNetCore (6.10.0) (+5 more)

### Community 59 - "Exception"
Cohesion: 0.15
Nodes (8): PublicOrderIdempotencyConflictException, PublicOrderStoreUnavailableException, AdminMenuStoreUnavailableException, AdminStoreUnavailableException, CashierStoreUnavailableException, KitchenStoreUnavailableException, StaffProfileStoreUnavailableException, Exception

### Community 60 - ".CreateAsync"
Cohesion: 0.29
Nodes (8): IPublicOrderStore, CancellationToken, Guid, JsonSerializerOptions, ReadOnlyMemory, Task, NpgsqlPublicOrderStore, UnavailablePublicOrderStore

### Community 61 - ".Create"
Cohesion: 0.16
Nodes (11): ActionResult, CancellationToken, EnableRateLimiting, HttpGet, HttpPost, ProducesResponseType, Task, PublicOrdersController (+3 more)

### Community 63 - "ItemsSection.tsx"
Cohesion: 0.22
Nodes (11): Category, ItemForm(), MenuItem, ALLERGEN_CODES, AllergenCode, allergenLabels, ALLOWED_IMAGE_TYPES, categorySchema (+3 more)

### Community 64 - "PublicOrderTracking"
Cohesion: 0.36
Nodes (6): PublicOrderTracking, CancellationToken, Exception, Guid, ReadOnlyMemory, RecordingStore

### Community 65 - "RestaurantQrOrdering.Api.Features.Staff"
Cohesion: 0.27
Nodes (4): Program, RestaurantQrOrdering.Api.Features.Staff, RestaurantQrOrdering.Api.Features.PublicMenu, RestaurantQrOrdering.Api.Tests

### Community 66 - ".GetAsync"
Cohesion: 0.16
Nodes (10): CancellationToken, Func, string, Task, PublicMenuCache, Fact, Task, PublicMenuCacheTests (+2 more)

### Community 67 - ".Get"
Cohesion: 0.20
Nodes (9): string, StaffIdentityResponse, StaffPolicies, StaffRoles, ActionResult, CancellationToken, HttpGet, ProducesResponseType (+1 more)

### Community 68 - "HealthEndpointTests"
Cohesion: 0.31
Nodes (5): Fact, Task, HealthEndpointTests, HttpClient, IClassFixture

### Community 69 - "dependencies"
Cohesion: 0.11
Nodes (19): @angular/common, @angular/compiler, @angular/core, @angular/forms, @angular/platform-browser, @angular/router, dependencies, @angular/common (+11 more)

### Community 70 - "serve"
Cohesion: 0.20
Nodes (10): serve, production, proxyConfig, budgets, buildTarget, outputHashing, builder, configurations (+2 more)

### Community 71 - ".Get"
Cohesion: 0.18
Nodes (8): ActionResult, CancellationToken, HttpGet, ProducesResponseType, Task, PublicMenuController, StaffMeController, ControllerBase

### Community 72 - "Role-gated access"
Cohesion: 0.39
Nodes (8): Admin dashboard, Cashier dashboard, English-only internal dashboards, Kitchen dashboard, Role-gated access, Role-scoped dashboards, Next.js proxy (src/proxy.ts), Staff layouts

### Community 73 - "Restaurant QR Ordering System"
Cohesion: 0.25
Nodes (8): App Router, Backend, Frontend, Restaurant QR Ordering System, Shared staff login, Tailwind CSS, TypeScript, Vercel

### Community 74 - "Next.js agent rules"
Cohesion: 0.25
Nodes (6): Deprecation notices, Next.js local guide directory, Next.js (repository version), Next.js agent rules, @AGENTS.md reference, Next.js

### Community 75 - "supabase-auth.ts"
Cohesion: 0.24
Nodes (6): staffAuthInterceptor(), StaffIdentity, SUPABASE_CLIENT, SUPABASE_RUNTIME_CONFIG, Login, Component

### Community 76 - "options"
Cohesion: 0.25
Nodes (8): orderAsCustomer(), options, assets, browser, inlineStyleLanguage, styles, tsConfig, src/styles.scss

### Community 77 - "restaurant-qr-ordering-web"
Cohesion: 0.25
Nodes (8): restaurant-qr-ordering-web, prefix, projectType, root, schematics, sourceRoot, style, @schematics/angular:component

### Community 78 - "RestaurantQrOrderingWeb"
Cohesion: 0.25
Nodes (7): Additional Resources, Building, Code scaffolding, Development server, RestaurantQrOrderingWeb, Running unit tests, Runtime configuration

### Community 79 - "RestaurantQrOrdering.Api.Features.PublicOrders"
Cohesion: 0.12
Nodes (11): PublicRatingStoreUnavailableException, PublicOrderCanonicalizer, Guid, IReadOnlyList, CreateOrderItemRequest, CreateOrderRequest, CreateOrderResponse, PublicOrderItem (+3 more)

### Community 80 - ".CreateAsync"
Cohesion: 0.47
Nodes (4): CancellationToken, Guid, ReadOnlyMemory, Task

### Community 81 - "angular.json"
Cohesion: 0.25
Nodes (7): cli, analytics, packageManager, newProjectRoot, projects, $schema, version

### Community 82 - "build"
Cohesion: 0.29
Nodes (7): build, test, builder, configurations, defaultConfiguration, architect, builder

### Community 83 - ".Validate"
Cohesion: 0.40
Nodes (3): PublicOrderValidation, GeneratedRegex, Regex

### Community 84 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, deploy:cloudflare, ng, preview:live, start, test, watch

### Community 85 - "app.config.ts"
Cohesion: 0.18
Nodes (11): App, appConfig, RestaurantRuntimeConfig, runtime, RuntimeWindow, Component, API_BASE_URL, apiBaseUrlInterceptor() (+3 more)

### Community 86 - ".Submit"
Cohesion: 0.18
Nodes (8): PublicRatingRequest, ActionResult, CancellationToken, EnableRateLimiting, HttpPost, ProducesResponseType, Task, PublicRatingController

### Community 87 - "public.get_public_order_by_tracking_token"
Cohesion: 0.47
Nodes (4): public.get_public_order_by_tracking_token(), public.order_tracking, public.order_items, public.orders

### Community 88 - "Security remediation baseline"
Cohesion: 0.33
Nodes (5): Baseline evidence, Historical external gate, P0 inventory and decision, Remaining infrastructure limitation, Security remediation baseline

### Community 89 - "development"
Cohesion: 0.40
Nodes (5): development, buildTarget, extractLicenses, optimization, sourceMap

### Community 90 - "Single-QR ordering app"
Cohesion: 0.50
Nodes (4): Customer identity and table input, Customer menu, Single-QR ordering app, Zod input schemas

### Community 91 - "public.get_public_order"
Cohesion: 0.50
Nodes (3): public.get_public_order(), public.order_items, public.orders

### Community 92 - "20260823040000_staff_order_commands.sql"
Cohesion: 0.67
Nodes (3): public.enforce_order_transition(), public.staff_transition_order(), public.profiles

### Community 93 - "ReportsPanel.tsx"
Cohesion: 0.40
Nodes (3): isoDate(), ReportsPanel(), SalesSummary

### Community 110 - "Cashier"
Cohesion: 0.22
Nodes (3): PublicMenuItem, Cashier, Component

### Community 111 - "CartService"
Cohesion: 0.26
Nodes (3): CartItem, CartService, Injectable

### Community 112 - "PublicRatingTests"
Cohesion: 0.50
Nodes (4): Fact, Task, PublicRatingTests, RecordingRatingStore

### Community 113 - "frontend/package.json"
Cohesion: 0.25
Nodes (7): name, overrides, hono, sharp, packageManager, private, version

### Community 114 - "TestAppFactory"
Cohesion: 0.33
Nodes (4): string, TestAppFactory, IWebHostBuilder, WebApplicationFactory

### Community 118 - "AdminMenuService"
Cohesion: 0.19
Nodes (5): AdminMenuService, CategoryInput, MenuItemInput, Injectable, PublicMenuResponse

### Community 122 - "integration/helpers.ts"
Cohesion: 0.10
Nodes (19): AdminLayout(), CashierLayout(), KitchenLayout(), StaffHeader(), getStaffUser(), Role, getRequiredRoleForPath(), ROLE_PREFIXES (+11 more)

### Community 134 - ".GetAsync"
Cohesion: 0.29
Nodes (5): CancellationToken, Fact, Task, FakeMenuStore, PublicMenuTests

## Knowledge Gaps
- **280 isolated node(s):** `net8.0`, `coverlet.collector (6.0.0)`, `Microsoft.AspNetCore.Mvc.Testing (8.0.23)`, `Microsoft.NET.Test.Sdk (17.8.0)`, `xunit (2.9.3)` (+275 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `RestaurantQrOrdering.Api.Features.Staff` connect `RestaurantQrOrdering.Api.Features.Staff` to `.Get`, `.GetOrders`, `.Get`, `Task`, `AdminMenuCommandResult`, `CashierCommandResult`, `KitchenTests`, `StaffAuthTests`, `.HandleAsync`, `Exception`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Why does `RestaurantQrOrdering.Api.Features.PublicOrders` connect `RestaurantQrOrdering.Api.Features.PublicOrders` to `RestaurantQrOrdering.Api.Features.Staff`, `PublicRatingResult`, `.Validate`, `.Submit`, `Exception`, `.CreateAsync`, `.Create`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `RestaurantQrOrdering.Api.Tests` connect `RestaurantQrOrdering.Api.Features.Staff` to `.GetAsync`, `HealthEndpointTests`, `.GetAsync`, `RestaurantQrOrdering.Api.Features.PublicOrders`, `TestAppFactory`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **What connects `net8.0`, `coverlet.collector (6.0.0)`, `Microsoft.AspNetCore.Mvc.Testing (8.0.23)` to the rest of the system?**
  _280 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `createClient` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._
- **Should `menu/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13763440860215054 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._