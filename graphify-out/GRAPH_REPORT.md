# Graph Report - D:\My_Projects\My_Projects\Restaurant QR Ordering System  (2026-08-23)

## Corpus Check
- Corpus is ~22,935 words - fits in a single context window. You may not need a graph.

## Summary
- 438 nodes · 623 edges · 42 communities (32 shown, 10 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Admin Menu Management
- Customer Cart Menu
- Project Instructions
- Tooling Dependencies
- Security Model
- TypeScript Configuration
- Route Protection
- Frontend Dependencies
- Customer Entry Rating
- Cashier Operations
- Package Build Config
- Customer Product Flow
- Staff Authorization UI
- Core Database RPCs
- E2E Testing
- Root Layout
- Security Event Audit
- Migration Security Docs
- Hero 3D
- Self Role Protection
- Auth Logging
- ESLint Config
- Next Config
- PostCSS Config
- Document Icon
- Globe Icon
- Next Logo
- Vercel Logo
- Window Icon
- Database Types

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 30 edges
2. `compilerOptions` - 16 edges
3. `formatPrice()` - 15 edges
4. `useLocale()` - 13 edges
5. `useCustomerSession()` - 9 edges
6. `scripts` - 8 edges
7. `getStaffUser()` - 8 edges
8. `useCart()` - 8 edges
9. `Customer routes` - 8 edges
10. `include` - 7 edges

## Surprising Connections (you probably didn't know these)
- `Next.js (repository version)` --semantically_similar_to--> `Next.js`  [INFERRED] [semantically similar]
  AGENTS.md → README.md
- `CartPage()` --calls--> `createClient()`  [EXTRACTED]
  src/app/(customer)/cart/page.tsx → src/lib/supabase/client.ts
- `MenuPage()` --calls--> `createClient()`  [EXTRACTED]
  src/app/(customer)/menu/page.tsx → src/lib/supabase/client.ts
- `ItemCard()` --indirect_call--> `isAllergenCode()`  [INFERRED]
  src/app/(customer)/menu/page.tsx → src/lib/i18n/allergens.ts
- `OrderTrackerPage()` --calls--> `createClient()`  [EXTRACTED]
  src/app/(customer)/order/[id]/page.tsx → src/lib/supabase/client.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Customer ordering flow** — readme_single_qr_ordering_app, readme_customer_menu, readme_entry_form, readme_cart, readme_order_tracker, readme_rating [EXTRACTED 1.00]
- **Layered staff dashboard access** — readme_staff_login, readme_src_proxy, readme_staff_layouts, readme_getstaffuser, readme_kitchen_dashboard, readme_cashier_dashboard, readme_admin_dashboard [EXTRACTED 1.00]
- **Database security enforcement** — readme_profiles, readme_create_order, readme_order_status_transitions, readme_set_item_availability, readme_customer_pii, readme_ratings, readme_security_events [EXTRACTED 1.00]

## Communities (42 total, 10 thin omitted)

### Community 0 - "Admin Menu Management"
Cohesion: 0.07
Nodes (35): CategoriesSection(), Category, CategoryForm(), Category, ItemForm(), ItemsSection(), MenuItem, Category (+27 more)

### Community 1 - "Customer Cart Menu"
Cohesion: 0.09
Nodes (32): CartPage(), Category, ItemCard(), MenuItem, MenuPage(), OrderItemRow, OrderStatus, OrderTrackerPage() (+24 more)

### Community 2 - "Project Instructions"
Cohesion: 0.07
Nodes (33): Deprecation notices, Next.js local guide directory, Next.js (repository version), Next.js agent rules, @AGENTS.md reference, Admin dashboard, App Router, Backend (+25 more)

### Community 3 - "Tooling Dependencies"
Cohesion: 0.06
Nodes (33): dotenv, eslint, eslint-config-next, jsdom, devDependencies, dotenv, eslint, eslint-config-next (+25 more)

### Community 4 - "Security Model"
Cohesion: 0.08
Nodes (30): admin role, Admin → Staff view, Anonymous orders column grant, auth.users, Authenticated staff, BEFORE UPDATE trigger, cashier role, create_order() (+22 more)

### Community 5 - "TypeScript Configuration"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 6 - "Route Protection"
Cohesion: 0.11
Nodes (21): getRequiredRoleForPath(), ROLE_PREFIXES, NOTE: this documents actual prefix-matching behavior (startsWith),, updateSession(), config, proxy(), CompositeTypes, Constants (+13 more)

### Community 7 - "Frontend Dependencies"
Cohesion: 0.09
Nodes (23): @hookform/resolvers, next, dependencies, @hookform/resolvers, next, react, react-dom, react-hook-form (+15 more)

### Community 8 - "Customer Entry Rating"
Cohesion: 0.18
Nodes (12): EntryPage(), Hero3D, inputClass(), RatingPage(), COUNTRY_CODES, CountryCode, OTHER_COUNTRY_VALUE, cartItemNoteSchema (+4 more)

### Community 9 - "Cashier Operations"
Cohesion: 0.17
Nodes (11): AvailabilityPanel(), CashierPage(), Category, ClosedOrder, MenuItem, OrderStatus, StaffOrder, StaffOrderItem (+3 more)

### Community 10 - "Package Build Config"
Cohesion: 0.14
Nodes (13): name, overrides, sharp, private, scripts, build, dev, lint (+5 more)

### Community 11 - "Customer Product Flow"
Cohesion: 0.18
Nodes (14): AR/EN localization, Cart, Customer identity and table input, Customer menu, Customer routes, Customer session state, Entry form, Customer-facing i18n helpers (+6 more)

### Community 12 - "Staff Authorization UI"
Cohesion: 0.29
Nodes (8): AdminLayout(), CashierLayout(), KitchenLayout(), StaffHeader(), getStaffUser(), Role, createClient(), Enums

### Community 13 - "Core Database RPCs"
Cohesion: 0.17
Nodes (5): public.handle_new_user, on_auth_user_created, public.get_my_role(), public.profiles, auth.users

### Community 14 - "E2E Testing"
Cohesion: 0.33
Nodes (3): hasRoleCreds, roleCreds, DASHBOARDS

### Community 15 - "Root Layout"
Cohesion: 0.29
Nodes (5): displayAr, displayEn, metadata, sansAr, sansEn

### Community 16 - "Security Event Audit"
Cohesion: 0.33
Nodes (4): public.log_role_change, profiles_log_role_change, public.security_events, auth.users

### Community 17 - "Migration Security Docs"
Cohesion: 0.40
Nodes (5): Row-level security policies, Supabase RPC functions, Schema changes, Supabase migrations, Supabase security advisor

### Community 18 - "Hero 3D"
Cohesion: 0.50
Nodes (3): Burger(), prefersReducedMotion(), SEED_TRANSFORMS

### Community 20 - "Auth Logging"
Cohesion: 0.50
Nodes (4): Application database, Failed login attempts, GoTrue, Supabase Auth logs

## Knowledge Gaps
- **156 isolated node(s):** `DASHBOARDS`, `eslintConfig`, `nextConfig`, `name`, `version` (+151 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createClient()` connect `Admin Menu Management` to `Customer Entry Rating`, `Cashier Operations`, `Staff Authorization UI`, `Customer Cart Menu`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `Supabase` connect `Project Instructions` to `Security Model`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `Restaurant QR Ordering System` connect `Project Instructions` to `Customer Product Flow`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **What connects `DASHBOARDS`, `eslintConfig`, `nextConfig` to the rest of the system?**
  _156 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Admin Menu Management` be split into smaller, more focused modules?**
  _Cohesion score 0.06894049346879536 - nodes in this community are weakly interconnected._
- **Should `Customer Cart Menu` be split into smaller, more focused modules?**
  _Cohesion score 0.08599290780141844 - nodes in this community are weakly interconnected._
- **Should `Project Instructions` be split into smaller, more focused modules?**
  _Cohesion score 0.06756756756756757 - nodes in this community are weakly interconnected._