# Task Master (Single Source of Truth)

This file is the permanent control log for this repo. It tracks all Codex + Antigravity tasks, progress, outcomes, and affected files in a tree-style view. It MUST be updated whenever a task starts, changes status, or completes.

## Update Rules (Mandatory)
- Any new task MUST be added here before implementation starts.
- Any status change MUST update the task entry here.
- Any completion MUST include outcome + file tree + checklist update.
- If a task is paused, record why + next action.

## Status Keys
- `queued` | `in_progress` | `blocked` | `done` | `dropped`

## Current Snapshot
- Last updated: 2026-02-21
- Active owners: Codex, Antigravity

---

# Task Index

## Codex Tasks

### T-CODEX-001: Manual Match to Prevent Duplicate Models (NTorq-125)
- status: done
- owner: Codex
- goal: Allow manual matching of incoming scraped models to existing families to avoid duplicates.
- progress: Added match overrides in sync plan + UI dropdown in sync review; rebuilds plan on match select.
- outcome: User can match an incoming model to an existing family, turning CREATE into UPDATE/SKIP based on diffs.
- blockers: none
- files:
  - src/actions/catalog/syncAction.ts
  - src/components/catalog/SyncComparisonView.tsx
  - src/app/app/[slug]/dashboard/catalog/products/studio/steps/FamilyStep.tsx
- file tree impact:
  - src/actions/catalog/syncAction.ts
  - src/components/catalog/SyncComparisonView.tsx
  - src/app/app/[slug]/dashboard/catalog/products/studio/steps/FamilyStep.tsx
- next action: Validate in UI and extend matching to variants/colors if needed.

### T-CODEX-002: Manual Match + Fuzzy Suggestions for Variants/Colors
- status: done
- owner: Codex
- goal: Add manual matching for variants/colors and improve match dropdown ordering with fuzzy scoring.
- progress: Added match keys + overrides for variants/colors; UI dropdown now shows for family/variant/color; options ranked by similarity.
- outcome: Users can match duplicates at all three levels; closest matches appear first in dropdown.
- blockers: none
- files:
  - src/actions/catalog/syncAction.ts
  - src/components/catalog/SyncComparisonView.tsx
  - src/app/app/[slug]/dashboard/catalog/products/studio/steps/FamilyStep.tsx
- file tree impact:
  - src/actions/catalog/syncAction.ts
  - src/components/catalog/SyncComparisonView.tsx
  - src/app/app/[slug]/dashboard/catalog/products/studio/steps/FamilyStep.tsx
- next action: Consider limiting variant/color options by matched family to reduce list size.

### T-CODEX-003: Multi-Tier Ingestion Persistence (Brand/Item)
- status: done
- owner: Codex
- goal: Enable ingestion source persistence across brand, model, and variant levels with discovery/spec modes.
- progress: Added brand target support in DB + server actions; added discovery mode in sync plan; integrated ScraperDialog into Brand/Variant steps; added preview-only sync gating.
- outcome: Brand discovery previews new models; model/variant specs can be saved per target; sync is blocked without template in discovery mode.
- blockers: none
- files:
  - supabase/migrations/20260207_ingestion_sources_brand_target.sql
  - src/actions/catalog/scraperAction.ts
  - src/actions/catalog/syncAction.ts
  - src/components/catalog/ScraperDialog.tsx
  - src/components/catalog/SyncComparisonView.tsx
  - src/app/app/[slug]/dashboard/catalog/products/studio/steps/BrandStep.tsx
  - src/app/app/[slug]/dashboard/catalog/products/studio/steps/FamilyStep.tsx
  - src/app/app/[slug]/dashboard/catalog/products/studio/steps/VariantStep.tsx
- file tree impact:
  - supabase/migrations/20260207_ingestion_sources_brand_target.sql
  - src/actions/catalog/scraperAction.ts
  - src/actions/catalog/syncAction.ts
  - src/components/catalog/ScraperDialog.tsx
  - src/components/catalog/SyncComparisonView.tsx
  - src/app/app/[slug]/dashboard/catalog/products/studio/steps/BrandStep.tsx
  - src/app/app/[slug]/dashboard/catalog/products/studio/steps/FamilyStep.tsx
  - src/app/app/[slug]/dashboard/catalog/products/studio/steps/VariantStep.tsx
- next action: Verify brand discovery preview and item-level spec sync in UI.

### T-CODEX-004: TVS HTML Fallback Extractor (No JSS_STATE)
- status: done
- owner: Codex
- goal: Allow TVS home HTML extraction even when __JSS_STATE__ is missing.
- progress: Added HTML fallback parsing of model cards; returns models for discovery.
- outcome: TVS home page source now extracts models without JSS_STATE.
- blockers: none
- files:
  - src/actions/catalog/scraperAction.ts
- file tree impact:
  - src/actions/catalog/scraperAction.ts
- next action: Validate with TVS home page HTML and tune selectors if needed.

### T-CODEX-005: TVS ProductListing JSS_STATE Extraction
- status: done
- owner: Codex
- goal: Parse /our-products/vehicles JSS_STATE ProductListing structure to extract all models.
- progress: Added ProductListing parser to read Vehicle.children.results and specs; handles ShowOnOurProductsPage.
- outcome: TVS vehicle listing now yields full model set instead of a single discovery model.
- blockers: none
- files:
  - src/actions/catalog/scraperAction.ts
- file tree impact:
  - src/actions/catalog/scraperAction.ts
- next action: Verify with live TVS listing HTML and tune spec mapping if needed.

### T-CODEX-006: Per-Model Template Assignment + Duplicate Linking in Template Step
- status: done
- owner: Codex
- goal: Show discovered models in Template step with preferred template suggestions and existing model match dropdowns; allow bulk sync on Next.
- progress: Added discovery model state, template suggestions, per-model template/match selections, and grouped sync execution from Template step.
- outcome: Template step now lists all new models, suggests templates, enables duplicate linking, and bulk creates/links on Next.
- blockers: none
- files:
  - src/app/app/[slug]/dashboard/catalog/products/studio/page.tsx
  - src/app/app/[slug]/dashboard/catalog/products/studio/steps/BrandStep.tsx
  - src/app/app/[slug]/dashboard/catalog/products/studio/steps/TemplateStep.tsx
- file tree impact:
  - src/app/app/[slug]/dashboard/catalog/products/studio/page.tsx
  - src/app/app/[slug]/dashboard/catalog/products/studio/steps/BrandStep.tsx
  - src/app/app/[slug]/dashboard/catalog/products/studio/steps/TemplateStep.tsx
- next action: Validate UX flow with discovery models spanning multiple templates.

### T-CODEX-007: Card-Level Inbound Source CTAs
- status: done
- owner: Codex
- goal: Add Inbound Source buttons directly on Brand/Model/Variant cards with consistent UX.
- progress: Added per-card CTA on brand cards (when selected), model cards, and variant cards.
- outcome: Users can trigger ingestion from within the relevant card without hunting for top controls.
- blockers: none
- files:
  - src/app/app/[slug]/dashboard/catalog/products/studio/steps/BrandStep.tsx
  - src/app/app/[slug]/dashboard/catalog/products/studio/steps/FamilyStep.tsx
  - src/app/app/[slug]/dashboard/catalog/products/studio/steps/VariantStep.tsx
- file tree impact:
  - src/app/app/[slug]/dashboard/catalog/products/studio/steps/BrandStep.tsx
  - src/app/app/[slug]/dashboard/catalog/products/studio/steps/FamilyStep.tsx
  - src/app/app/[slug]/dashboard/catalog/products/studio/steps/VariantStep.tsx
- next action: Consider showing CTA on unselected brand cards with a lightweight selection hint.

### T-CODEX-008: Discovery Ignore Rules + Series Expansion
- status: done
- owner: Codex
- goal: Allow manual ignore rules for discovery items and add series expansion to fetch child models.
- progress: Added ignore rules table + server actions, ignore UI buttons, and series expansion via footer navigation.
- outcome: Users can persist ignores (URL/NAME/TYPE) and expand series to load child models.
- blockers: none
- files:
  - supabase/migrations/20260207_add_ingestion_ignore_rules.sql
  - src/actions/catalog/scraperAction.ts
  - src/app/app/[slug]/dashboard/catalog/products/studio/page.tsx
  - src/app/app/[slug]/dashboard/catalog/products/studio/steps/TemplateStep.tsx
- file tree impact:
  - supabase/migrations/20260207_add_ingestion_ignore_rules.sql
  - src/actions/catalog/scraperAction.ts
  - src/app/app/[slug]/dashboard/catalog/products/studio/page.tsx
  - src/app/app/[slug]/dashboard/catalog/products/studio/steps/TemplateStep.tsx
- next action: Validate series expansion on TVS Apache and refine series detection rules if needed.

### T-CODEX-009: Unify Phone/Desktop Store UI
- status: done
- owner: Codex
- goal: Use a single store UI for phone and desktop instead of separate render paths.
- progress: Removed mobile UA branching, deleted phone-only UI components, and removed `/phone` route pages entirely.
- outcome: Single responsive UI is the source of truth; phone-specific pages/components removed and `/phone` routes eliminated.
- blockers: none
- files:
  - src/app/phone/page.tsx
  - src/app/phone/search/page.tsx
  - src/app/phone/store/catalog/page.tsx
  - src/app/phone/store/[make]/[model]/[variant]/page.tsx
  - src/app/phone/store/layout.tsx
  - src/app/page.tsx
  - src/app/store/catalog/SystemCatalogRouter.tsx
  - src/app/store/[make]/[model]/[variant]/ProductClient.tsx
  - src/app/store/layout.tsx
  - src/actions/getProductBySlug.ts
  - src/hooks/useSystemDealerContext.ts
  - src/components/phone/layout/PhoneMenuDrawer.tsx
  - src/components/phone/layout/PhoneFooter.tsx
  - src/components/phone/layout/PhoneHeader.tsx
  - src/components/phone/layout/PhoneBottomNav.tsx
  - src/components/phone/home/OClubDashboard.tsx
  - src/components/phone/home/PhoneHome.tsx
  - src/components/phone/pdp/PhonePDPBottomBar.tsx
  - src/components/phone/pdp/PhonePDPSticky.tsx
  - src/components/phone/pdp/PhonePDP.tsx
  - src/components/phone/pdp/PhonePDPEnhanced.tsx
  - src/components/phone/pdp/PhonePDPSimple.tsx
  - src/components/phone/catalog/FullPageDeal.tsx
  - src/components/phone/catalog/PhoneFilterModal.tsx
  - src/components/phone/catalog/PhoneContextFeed.tsx
  - src/components/phone/catalog/PhoneSearch.tsx
  - src/components/phone/catalog/ModelCard.tsx
  - src/components/phone/catalog/PhoneCatalog.tsx
  - src/components/phone/ui/SwipeHint.tsx
  - src/app/phone/store/[make]/[model]/[variant]/SystemPDPRouter.tsx
- file tree impact:
  - src/app/phone/page.tsx
  - src/app/phone/search/page.tsx
  - src/app/phone/store/catalog/page.tsx
  - src/app/phone/store/[make]/[model]/[variant]/page.tsx
  - src/app/phone/store/layout.tsx
  - src/app/page.tsx
  - src/app/store/catalog/SystemCatalogRouter.tsx
  - src/app/store/[make]/[model]/[variant]/ProductClient.tsx
  - src/app/store/layout.tsx
  - src/actions/getProductBySlug.ts
  - src/hooks/useSystemDealerContext.ts
  - src/components/phone/layout/PhoneMenuDrawer.tsx
  - src/components/phone/layout/PhoneFooter.tsx
  - src/components/phone/layout/PhoneHeader.tsx
  - src/components/phone/layout/PhoneBottomNav.tsx
  - src/components/phone/home/OClubDashboard.tsx
  - src/components/phone/home/PhoneHome.tsx
  - src/components/phone/pdp/PhonePDPBottomBar.tsx
  - src/components/phone/pdp/PhonePDPSticky.tsx
  - src/components/phone/pdp/PhonePDP.tsx
  - src/components/phone/pdp/PhonePDPEnhanced.tsx
  - src/components/phone/pdp/PhonePDPSimple.tsx
  - src/components/phone/catalog/FullPageDeal.tsx
  - src/components/phone/catalog/PhoneFilterModal.tsx
  - src/components/phone/catalog/PhoneContextFeed.tsx
  - src/components/phone/catalog/PhoneSearch.tsx
  - src/components/phone/catalog/ModelCard.tsx
  - src/components/phone/catalog/PhoneCatalog.tsx
  - src/components/phone/ui/SwipeHint.tsx
  - src/app/phone/store/[make]/[model]/[variant]/SystemPDPRouter.tsx
- next action: Validate `/phone/*` redirects and ensure desktop UI is responsive for key flows.

### T-CODEX-010: Responsive Pass (Home/Catalog/PDP)
- status: done
- owner: Codex
- goal: Make home, catalog, and PDP layouts responsive for mobile without separate phone UI.
- progress: Added mobile catalog header + bottom-sheet filters, adjusted catalog grid, built mobile PDP accordions + sticky bottom CTA, and disabled desktop scroll-snapping on mobile; updated home sections to use min-height and mobile-friendly typography.
- outcome: Core store flows render cleanly on mobile with a single responsive UI and touch-friendly navigation.
- blockers: none
- files:
  - src/components/store/DesktopCatalog.tsx
  - src/components/store/DesktopPDP.tsx
  - src/components/store/DesktopHome.tsx
  - src/app/store/layout.tsx
- file tree impact:
  - src/components/store/DesktopCatalog.tsx
  - src/components/store/DesktopPDP.tsx
  - src/components/store/DesktopHome.tsx
  - src/app/store/layout.tsx
- next action: Validate touch interactions and verify mobile CTA/filters in real device testing.

### T-CODEX-011: Yamaha Catalog Studio Visibility
- status: done
- owner: Codex
- goal: Ensure Yamaha models appear in Catalog Studio and normalize RayZR naming.
- progress: Added paginated fetch for `cat_items` to avoid PostgREST default limits; normalized RayZR Street Rally family name in DB.
- outcome: Catalog Studio now loads all families reliably, including Yamaha entries.
- blockers: none
- files:
  - src/app/app/[slug]/dashboard/catalog/products/studio/page.tsx
- file tree impact:
  - src/app/app/[slug]/dashboard/catalog/products/studio/page.tsx
- next action: Verify Yamaha families show in Studio with ICE Scooter template selected.

### T-CODEX-012: SKU Variant/Color Resolution in Review
- status: done
- owner: Codex
- goal: Show variant and color in Studio SKU/Review even when SKUs are nested under Color.
- progress: Added parent-chain resolution for variant/color in ReviewStep filters, sorting, and display.
- outcome: SKU list now displays correct variant and color for Yamaha RayZR data.
- blockers: none
- files:
  - src/app/app/[slug]/dashboard/catalog/products/studio/steps/ReviewStep.tsx
- file tree impact:
  - src/app/app/[slug]/dashboard/catalog/products/studio/steps/ReviewStep.tsx
- next action: Reload Studio SKU step and confirm variant/color display.

### T-CODEX-013: O' Circle Independent Secure Schema + Referral Attribution Plan
- status: done
- owner: Codex
- goal: Define a production-grade O' Circle schema with independent account table (FK to member), complete referral attribution, immutable ledger, and secure redemption lifecycle.
- progress: Audited existing O' Circle core/redemption tables and mapped required hardening into a single implementation plan.
- outcome: Added a detailed plan covering independent `oclub_member_accounts`, attribution chain, idempotent transaction model, security controls (RLS + definer RPC), and phased migration.
- blockers: none
- files:
  - bclub.md
  - TASK_MASTER.md
- file tree impact:
  - bclub.md
  - TASK_MASTER.md
- next action: Implement migrations + secure RPCs from plan (`oclub_member_accounts`, `oclub_referral_attributions`, `oclub_redemption_settlements`, `oclub_audit_events`) and cut over wallet access to server-validated APIs.

### T-CODEX-014: Lead Workspace Module Wiring + Interest/Attachment Capture
- status: done
- owner: Codex
- goal: Wire all lead detail modules (Documents, Tasks, Notes, Timeline, O' Circle) and add interest + attachment capture in lead creation.
- progress: Replaced placeholder tabs with live data components/actions, added notes/tasks persistence on `crm_leads`, and integrated lead-form interest text + KYC attachment upload into member assets.
- outcome: Lead workspace modules now open with working content and actions; new lead form captures customer interest and uploads docs to member document vault.
- blockers: none
- files:
  - src/actions/crm.ts
  - src/components/modules/leads/LeadEditorTable.tsx
  - src/components/modules/leads/LeadForm.tsx
  - src/components/modules/leads/LeadsPage.tsx
- file tree impact:
  - src/actions/crm.ts
  - src/components/modules/leads/LeadEditorTable.tsx
  - src/components/modules/leads/LeadForm.tsx
  - src/components/modules/leads/LeadsPage.tsx
- next action: Validate lead creation + document upload on staging and verify module actions with role-based users (owner/staff).

### T-CODEX-015: crm_leads updated_at Compatibility Hotfix
- status: done
- owner: Codex
- goal: Resolve runtime failure where PostgREST schema cache cannot resolve `crm_leads.updated_at`.
- progress: Added compatibility fallback in lead module server actions and created migration to guarantee `updated_at` column exists.
- outcome: Notes/tasks timeline writes avoid hard failure on missing `updated_at`, and DB migration provides permanent schema fix.
- blockers: none
- files:
  - src/actions/crm.ts
  - supabase/migrations/20260221101500_add_updated_at_to_crm_leads.sql
  - TASK_MASTER.md
- file tree impact:
  - src/actions/crm.ts
  - supabase/migrations/20260221101500_add_updated_at_to_crm_leads.sql
  - TASK_MASTER.md
- next action: Apply migration in active Supabase environment and retry Lead Notes save path.

### T-CODEX-016: Notes Metadata + Unified Member Attachment Ledger
- status: done
- owner: Codex
- goal: Show note author/timestamp + note attachments in lead workspace and route all member-related attachments through a single table.
- progress: Added note author and attachment schema support end-to-end, wired attachment upload UI in lead notes, and refactored legacy member-doc APIs to use `id_member_assets` compatibility mapping.
- outcome: Lead notes now capture/display author + time + attachments; note attachments are persisted in note payload and mirrored into `id_member_assets`; quote/member document flows now read/write through the unified attachment table.
- blockers: none
- files:
  - src/actions/crm.ts
  - src/components/modules/leads/LeadEditorTable.tsx
  - src/components/modules/quotes/MemberMediaManager.tsx
  - supabase/migrations/20260221114500_backfill_crm_member_documents_to_id_member_assets.sql
  - TASK_MASTER.md
- file tree impact:
  - src/actions/crm.ts
  - src/components/modules/leads/LeadEditorTable.tsx
  - src/components/modules/quotes/MemberMediaManager.tsx
  - supabase/migrations/20260221114500_backfill_crm_member_documents_to_id_member_assets.sql
  - TASK_MASTER.md
- next action: Apply backfill migration, then validate note attachment uploads + quote document label edits on staging.

### T-CODEX-017: Pincode Auto-Resolution Into Lead/Member Profile
- status: done
- owner: Codex
- goal: Auto-fetch state/district/taluka/area from pincode and persist it when creating/updating leads.
- progress: Added pincode resolution server action, wired lead creation to enrich member + lead location metadata, and updated lead UI to display district/state/area.
- outcome: On valid pincode, location is resolved from `loc_pincodes`/serviceability flow and stored in DB (`id_members` + `crm_leads.utm_data.location_profile`), including duplicate-lead refresh path.
- blockers: none
- files:
  - src/actions/crm.ts
  - src/components/modules/leads/LeadForm.tsx
  - src/components/modules/leads/LeadEditorTable.tsx
  - TASK_MASTER.md
- file tree impact:
  - src/actions/crm.ts
  - src/components/modules/leads/LeadForm.tsx
  - src/components/modules/leads/LeadEditorTable.tsx
  - TASK_MASTER.md
- next action: Validate with known pincodes (deliverable + non-deliverable) and confirm location chip + persisted lead profile values.

### T-CODEX-018: Mandatory Referral Flow + Repeat Delivery Exemption
- status: done
- owner: Codex
- goal: Enforce mandatory referral capture in CRM lead creation, resolve referrer by code/phone, preserve existing referral on duplicate leads, and skip referral rewards for repeat delivery members.
- progress: Added referrer lookup actions, wired referral capture/validation UI in LeadForm, and extended `createLeadAction` to store referral context, keep duplicate referral locked, and apply O' Circle referral credit only when eligible.
- outcome: CRM lead flow now supports referral code or contact details with member name resolution; new leads require referral unless customer already has active delivery; duplicate lead updates refresh intent/location but do not overwrite referral attribution.
- blockers: none
- files:
  - src/actions/crm.ts
  - src/components/modules/leads/LeadForm.tsx
  - src/components/modules/leads/LeadsPage.tsx
  - TASK_MASTER.md
- file tree impact:
  - src/actions/crm.ts
  - src/components/modules/leads/LeadForm.tsx
  - src/components/modules/leads/LeadsPage.tsx
  - TASK_MASTER.md
- next action: Validate 4 scenarios in staging: new member + member referrer, new member + external referrer, existing member duplicate lead refresh, existing member with active delivery (no referral credit).

### T-CODEX-019: Books Module (Phase 1 + 2: Static Payment Architecture)
- status: done
- owner: Codex
- goal: Review the proposed Books overhaul plan, draft a highly secure architecture, execute Phase 1 (DB UI setup), and Phase 2 (Payment Generation).
- progress: Phase 1 hardened the database (`account_type`, single `is_primary`) and Server Actions. Phase 2 pivoted from Kotak API to a Static generator. Rewrote `BankDetailWorkspace.tsx` to conditionally render an interactive NPCI `upi://pay` URI string-builder for UPI accounts, and a high-fidelity "Bank Details" clipboard card for non-UPI transfers.
- outcome: Database safely restricts `account_type` strings and enforces 1 primary account per tenant. Server Actions respect invariants. Ledger view strictly scopes transactions. UI now seamlessly handles offline/static payment generation without 3rd party API dependencies.
- blockers: none
- files:
  - /Users/rathoreajitmsingh/.gemini/antigravity/brain/9f8a88f2-a2e2-4fdd-ad80-fbcffbf2202b/implementation_plan.md
  - TASK_MASTER.md
  - supabase/migrations/20260221175500_books_account_type_hardening.sql
  - src/actions/accounting.ts
  - src/components/modules/books/BooksPage.tsx
  - src/components/modules/books/BankDetailWorkspace.tsx
- file tree impact:
  - /Users/rathoreajitmsingh/.gemini/antigravity/brain/9f8a88f2-a2e2-4fdd-ad80-fbcffbf2202b/implementation_plan.md
  - TASK_MASTER.md
  - supabase/migrations/20260221175500_books_account_type_hardening.sql
  - src/actions/accounting.ts
  - src/components/modules/books/BooksPage.tsx
  - src/components/modules/books/BankDetailWorkspace.tsx
- next action: Begin Phase 3: Add Private Mode Masking, Explicit Reveal logic, and Audit Events to the Books module.

### T-CODEX-020: Lead Module Improvisation Program (Backlog)
- status: in_progress
- owner: Codex
- goal: Improve overall Lead module and current Lead Index view with phased UX + ops hardening (speed, quality, conversion readiness).
- progress: P0 shipped with live KPI engine, server pagination, filter v1, row enrichment, and SLA tracking foundation. P1 execution started with lead/quote event audit wiring (`crm_lead_events`, `crm_quote_events`) and booking feedback capture flow.
- outcome: Lead Index runs on server-backed pagination/filters with KPI/SLA context; quote creation and marketplace lead capture now emit auditable lifecycle events; booking editor now supports direct feedback save with stage-aware FEEDBACK transition attempt.
- blockers: none
- sprint checkpoints:
  - P0: Real KPI engine, list pagination/performance, filter v1, row enrichment, follow-up SLA foundation. (done)
  - P1: Stage transition guardrails, assignment/workload balancing, unified activity timeline, duplicate merge workflow.
  - P2: Automation rules, source/referral ROI analytics, smart prioritization scoring.
- files:
  - src/actions/crm.ts
  - src/actions/lead.ts
  - src/components/modules/quotes/QuoteEditorTable.tsx
  - src/components/modules/leads/LeadsPage.tsx
  - TASK_MASTER.md
- file tree impact:
  - src/actions/crm.ts
  - src/actions/lead.ts
  - src/components/modules/quotes/QuoteEditorTable.tsx
  - src/components/modules/leads/LeadsPage.tsx
  - TASK_MASTER.md
- next action: Complete remaining P1 items (assignment balancing, unified timeline API for leads, duplicate merge workflow).

## Antigravity Tasks

### T-AG-001: (empty)
- status: queued
- owner: Antigravity
- goal: 
- progress: 
- outcome: 
- blockers: 
- files:
  - (none)
- file tree impact:
  - (none)
- next action: 

---

# File Tree Impact (Aggregate)

```
.
├── bclub.md
├── supabase/migrations/20260221101500_add_updated_at_to_crm_leads.sql
├── supabase/migrations/20260221114500_backfill_crm_member_documents_to_id_member_assets.sql
├── src/actions/crm.ts
├── src/components/modules/leads/LeadEditorTable.tsx
├── src/components/modules/leads/LeadForm.tsx
├── src/components/modules/leads/LeadsPage.tsx
├── src/components/modules/quotes/MemberMediaManager.tsx
├── supabase/migrations/20260207_make_ingestion_item_nullable.sql
├── supabase/migrations/20260207_add_ingestion_ignore_rules.sql
├── TASK_MASTER.md
├── /Users/rathoreajitmsingh/.gemini/antigravity/brain/9f8a88f2-a2e2-4fdd-ad80-fbcffbf2202b/implementation_plan.md.resolved
├── src/actions/catalog/syncAction.ts
├── src/actions/catalog/scraperAction.ts
├── src/components/catalog/SyncComparisonView.tsx
├── src/app/app/[slug]/dashboard/catalog/products/studio/page.tsx
├── src/app/app/[slug]/dashboard/catalog/products/studio/steps/BrandStep.tsx
├── src/app/app/[slug]/dashboard/catalog/products/studio/steps/FamilyStep.tsx
└── src/app/app/[slug]/dashboard/catalog/products/studio/steps/VariantStep.tsx
```

---

# Changelog

- 2026-02-07: Created Task Master file and workflow rules.
- 2026-02-07: Added manual matching in sync review to prevent duplicate models.
- 2026-02-07: Added manual match + fuzzy suggestion ordering for variants/colors.
- 2026-02-07: Implemented multi-tier ingestion persistence (brand + item) with discovery mode.
- 2026-02-07: Added TVS HTML fallback extraction when JSS_STATE is missing.
- 2026-02-07: Added TVS ProductListing JSS_STATE extraction for /our-products/vehicles.
- 2026-02-07: Added per-model template assignment and duplicate linking in Template step.
- 2026-02-07: Added card-level Inbound Source CTAs for Brand/Model/Variant.
- 2026-02-07: Added discovery ignore rules and series expansion for TVS series items.
- 2026-02-21: Added O' Circle independent secure schema and referral attribution plan in `bclub.md`.
- 2026-02-21: Wired lead modules and added lead interest + attachment capture to member document vault.
- 2026-02-21: Added `crm_leads.updated_at` compatibility hotfix (code fallback + migration).
- 2026-02-21: Added note author/attachment support and unified legacy member documents into `id_member_assets` with backfill migration.
- 2026-02-21: Added pincode-based location auto-resolution (state/district/taluka/area) and persisted it into lead/member records.
- 2026-02-21: Added mandatory CRM referral flow with referrer lookup and repeat-delivery no-benefit rule.
- 2026-02-21: Reviewed and upgraded Books module implementation plan with DB hardening, ledger scoping, access control, and phased verification.
- 2026-02-21: Added T-CODEX-020 backlog for Lead Module Improvisation Program (P0/P1/P2 checkpoints) for deferred execution.
- 2026-02-21: Executed T-CODEX-020 P0 — added live lead KPI engine, server pagination/filter v1, enriched lead index rows, and SLA-aware follow-up foundation.
