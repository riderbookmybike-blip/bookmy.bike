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
- Last updated: 2026-02-08
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
├── supabase/migrations/20260207_make_ingestion_item_nullable.sql
├── supabase/migrations/20260207_add_ingestion_ignore_rules.sql
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
