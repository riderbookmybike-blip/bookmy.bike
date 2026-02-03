# BookMyBike V1 - Master Plan (Living Document)

Created: 2026-02-02
Owner: Ajit + Codex
Scope: UI/UX-first rebuild with device-wise design and strict flow + logic integrity.

EDITING RULES (IMPORTANT)
- Do NOT delete items. If something is no longer needed, strike it using ~~like this~~.
- Add new decisions immediately after the item they change, prefixed with: "NEW:".
- Keep old decisions visible for audit.

GUIDING PRINCIPLES
- Keep user flows and calculation logic intact at all times.
- UI/UX should match current system first (no new concepts until parity achieved).
- One master component registry; components are reused everywhere.
- Mobile-first, device-aware design.
- No data migration risk during early phases (pre-launch).

--------------------------------------------------------------------------------
CURRENT STATUS SNAPSHOT (from existing bookmy.bike repo)
- Routes present:
  - Marketplace/store: src/app/store
  - CRM/Dealer app: src/app/app
  - Phone UI: src/app/phone
  - Login/Auth: src/app/login, src/app/logout, src/app/auth
  - Settings/Profile: src/app/settings, src/app/profile
  - AUMS landing: src/app/aums-landing
- Component domains:
  - layout, modules, leads, quotes, sales-orders, dealer, finance, templates
- Theme + providers:
  - ThemeProvider, TenantProvider, ShellLayout

NOTE: This snapshot is reference only; no changes to existing live project are required.

NEW: BIRD'S EYE SYSTEM MAP (CURRENT CODEBASE STUDY)
- Auth & Tenant:
  - ShellLayout decides marketplace vs CRM based on /app/* + role.
  - TenantHydrator syncs tenant context + localStorage.
  - Login flow triggers LoginSidebar (OTP via API).
  - Memberships resolved via RPC get_user_memberships (fallback id_team).
- Marketplace (bookmy.bike):
  - /store (DesktopHome) → /store/[make] → /store/[make]/[model]/[variant].
  - PDP uses createQuoteAction (crm) for quote creation.
- CRM / Dealer (multi-tenant):
  - /app/[slug]/dashboard → AdminDashboard or DealerDashboard.
  - /app/[slug]/leads → LeadList + LeadForm + LeadTabs.
  - /app/[slug]/quotes → Quote list + detail (paper view).
  - /app/[slug]/sales-orders → Bookings pipeline (CRM bookings).
  - /app/[slug]/bookings → Firebase “Ongoing Bookings” (legacy).
  - /app/[slug]/members → Member analytics + presence.
- AUMS / Admin:
  - /dashboard/* (dealers, inventory, finance partners).
  - /app/[slug]/superadmin (legacy admin tools).
- Phone UI:
  - /phone + /phone/store + /phone/store/catalog.

--------------------------------------------------------------------------------
PHASE 1 - PLANNING (Detailed, No Coding Yet)

1.0 GOAL DEFINITION
- Goal: Build BookMyBike V1 as a clean, structured UI/UX system that matches current flows.
- Outcome: Master UI library + page assemblies + device-wise responsive layouts.
- Constraints: No user flow or calculation logic change.

1.1 STACK SELECTION (Freeze)
- Frontend: Next.js (App Router), React
- Styling: Tailwind CSS + design tokens
- State/Auth: Supabase auth (same flow), tenant context
- Data: Supabase (but data migration postponed)
- Icons: lucide-react
- Animations: framer-motion (only where needed)

1.2 UI STRATEGY
- First pass = UI parity copy (no redesign).
- Second pass = master UI refinement (colors, spacing, typography).
- Components must be reusable, parameterized, and device-aware.
- Build a master component registry before coding pages.

1.3 UX STRATEGY
- Preserve all existing user flows and labels.
- Navigation structure stays same across devices.
- Reduce user confusion by keeping layout positions consistent.

1.4 TECH USAGE (Per Domain)
- Marketplace: catalog, product cards, store pages
- Dealer CRM: leads, quotes, bookings, member profiles
- Finance: application states, approvals, disbursement
- AUMS: global admin dashboards
- Shared: auth, tenant, theme, layout shell

1.5 FOLDER + NAMING CONVENTION
- Prefixes:
  - sys_  = system/core
  - dealer_ = dealer/CRM
  - fin_ = finance
  - aums_ = superadmin
  - member_ = member/profile
  - mkt_ = marketplace
- File names should be short but meaningful.
- Example:
  - dealer_leads_list.tsx
  - fin_status_chip.tsx
  - member_profile_card.tsx
  - sys_header.tsx

1.6 MASTER COMPONENT REGISTRY (Core Requirement)
- Create a single reference file for every component.
- Registry fields for each component:
  - component_id (unique)
  - purpose
  - props (input contract)
  - data_source (table/field or mock)
  - states (loading/empty/error)
  - responsive rules
  - where used (pages)

1.7 MASTER DATA CONTRACTS
- Every UI component must map data fields explicitly.
- Example (Product Card):
  - Title -> product.name
  - Price -> product.price
  - Image -> product.image_url
  - CTA -> /store/[make]/[model]/[variant]
- These contracts live in /docs/contracts.

1.8 DEVICE-WISE UI RULES
- Mobile (<= 480): single column, stacked cards
- Tablet (768-1024): 2-column layout
- Desktop (>= 1024): 3-4 columns, sidebar + header
- Large (>= 1440): expanded grid + larger typography

1.9 RISKS & CONTROLS
- Risk: UI mismatch -> Use parity checklist.
- Risk: Flow break -> Use golden flow checklist.
- Risk: component duplication -> Registry enforcement.

1.10 USER FLOW MAP (CURRENT)
Marketplace (BMB):
- Browse catalog → filter → PDP → quote (createQuoteAction).
- Login sidebar (OTP) → user context.

CRM / Dealer:
- Lead create (LeadForm → createLeadAction → crm_leads).
- Lead detail tabs:
  - Overview / History / Quotes / Booking / Documents.
- Quote creation:
  - Lead → QuoteForm → createQuoteAction → crm_quotes.
- Sales order pipeline:
  - Quote → createBookingFromQuote → crm_bookings.
  - Update stages via updateBookingStage (BOOKING → FINANCE → ALLOTMENT → PDI → DELIVERY).
- Bookings (legacy):
  - Firebase “Ongoing Bookings” used in /bookings page.

Finance:
- createFinanceApplication → crm_finance
- updateFinanceStatus (APPLIED, APPROVED, CLOSED, DISBURSED)

Insurance/Registration:
- crm_insurance (upsertInsurance)
- crm_registration (upsertRegistration)

AUMS:
- Dealer management + inventory + finance partners (dashboard routes).

1.11 LOGIC & CALCULATION MAP (CURRENT)
- Pricing: compute in PDP (ProductClient) with accessories, insurance, registration, EMI.
- Quote versioning: crm_quotes is_latest + version logic.
- Booking stages: crm_bookings.current_stage + status fields.
- Finance pipeline: crm_finance.status.
- Lead auto-segregation: serviceability → JUNK vs NEW.

1.12 DATA SOURCES (CURRENT)
- Supabase: crm_leads, crm_quotes, crm_bookings, crm_finance, crm_insurance, crm_registration.
- Firebase (legacy): bookings → “Aapli Collections/Bookings/Ongoing Bookings”.

1.13 MIGRATION DECISIONS (TO BE FINALIZED)
- Decide: keep Firebase bookings or fully migrate to crm_bookings.
- Decide: single auth flow vs separate (recommended: single).
- Decide: phone UI parity or custom.

1.14 PAGE INVENTORY (CURRENT)
Marketplace:
- / (home), /store, /store/catalog, /store/compare, /store/[make], /store/[make]/[model]/[variant]
- /wishlist, /orders, /notifications, /profile
CRM / Dealer:
- /app/[slug]/dashboard
- /app/[slug]/leads
- /app/[slug]/quotes
- /app/[slug]/sales-orders
- /app/[slug]/bookings (Firebase legacy)
- /app/[slug]/members
Admin / AUMS:
- /dashboard/dealers, /dashboard/inventory/*, /dashboard/finance-partners/*
Auth / Setup:
- /login, /logout, /select-tenant, /setup, /invite, /reset-password
Phone:
- /phone, /phone/store, /phone/store/catalog

1.15 COMPONENT FAMILY INVENTORY (CURRENT)
- Shell: ShellLayout, DashboardHeader, Sidebar, MarketplaceHeader, PhoneHeader
- Layout: MasterListDetailLayout, DetailPanel, ModuleLanding
- Modals/Overlays: SlideOver, LoginSidebar, ImageEditor
- CRM Modules: LeadList, LeadForm, LeadTabs, QuoteList, QuoteForm, SalesOrderList, SalesOrderDetail
- Shared: StatsHeader, ThemeToggle, Logo

1.16 TECH DEBT / DUPLICATION (CURRENT)
- Bookings exist in both Firebase and Supabase (crm_bookings).
- Finance status stored in crm_finance, also partial in crm_bookings.
- Multiple dashboards (/app/[slug]/dashboard vs /dashboard/*).

--------------------------------------------------------------------------------
PHASE 2 - SETUP

2.0 REPO STRUCTURE (bookmybike-v1)
- /src/app (route groups)
- /src/features
- /src/shared
- /docs/registry
- /docs/contracts

2.1 SUPABASE SETUP
- Create new Supabase project (no data migration yet)
- Store env keys in .env.local
- Auth enabled (email/phone as per existing)

2.2 BASE TOOLING
- ESLint + Prettier
- Tailwind config with design tokens
- Shared UI theme tokens

--------------------------------------------------------------------------------
PHASE 3 - WIREFRAMING

3.0 WIREFRAME SCOPE
- Marketplace: home, catalog, PDP, checkout
- Dealer: leads, quotes, bookings, members, settings
- Finance: applications, approvals, disbursed
- AUMS: dashboards, tenant management

3.1 OUTPUT
- Wireframes per device type
- Approval before UI build

--------------------------------------------------------------------------------
PHASE 4 - REAL UI/UX BUILD

4.0 COMPONENT FIRST
- Build shared components first
- Use registry to validate

4.1 PAGE ASSEMBLY
- Assemble UI pages with real components
- Keep styling identical to current system

4.2 RESPONSIVE CHECK
- Test per device class

--------------------------------------------------------------------------------
PHASE 5 - CODING (Logic Integration)

5.0 ORDER OF LOGIC
1) Auth + tenant context
2) Member profile
3) Leads -> Quotes -> Bookings
4) Finance pipeline
5) Insurance/Registration/Delivery
6) AUMS operations

5.1 RULES
- No logic changes unless signed off
- Use existing calculations exactly

--------------------------------------------------------------------------------
PHASE 6 - QA + POLISH

6.0 TESTING
- Golden flow tests
- Responsive UI checks
- Cross-browser sanity tests

6.1 RELEASE READINESS
- Only after parity achieved

--------------------------------------------------------------------------------
REFERENCE CHECKLISTS (to be created in Phase 1)
- /docs/registry/components.md
- /docs/contracts/product_card.md
- /docs/contracts/lead_card.md
- /docs/contracts/quote_card.md
- /docs/contracts/booking_card.md
- /docs/contracts/finance_status.md

--------------------------------------------------------------------------------
NOTES / OPEN QUESTIONS
- ~~What subdomains (if any) will be used later?~~
  NEW: Subdomains confirmed: bookmy.bike (marketplace), partner.bookmy.bike (dealership + finance), aums.bookmy.bike (superadmin).
- ~~Which flows are highest priority after UI parity?~~
  NEW: No rush to replace working app; priority is \"best quality\". After UI parity, focus on stability + critical CRM flows (Leads → Quotes → Bookings) while keeping flexibility.
- ~~Confirm target devices (any TV/kiosk view needed?)~~
  NEW: Target devices include phone, tablet, desktop, TV, kiosk (portrait + landscape). Strategy: build mobile + desktop first, then ensure responsive scaling to cover tablet/TV/kiosk; add device-specific overrides only if required.
