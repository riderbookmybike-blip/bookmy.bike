# Remove Super Admin Offer Override (Antigravity Task)

Date: 2026-03-19  
Owner: Codex (investigation/task author)  
Executor: Antigravity (implementation + review fixes)

## Objective
Remove the **Super Admin Offer Override** feature completely from app surface, actions, tests, and CI references.

No replacement UI is required.

## Investigation Summary (What Exists Today)
The feature is currently connected across:
1. UI route/page/components
2. Sidebar + route registry + AUMS template route item
3. AUMS server actions for listing/editing/deactivating dealer offers
4. Playwright specs and dedicated CI workflows
5. A Supabase migration that adds broad super-admin policy on `cat_price_dealer`

## Confirmed File Footprint
Primary removal targets:
1. `src/app/app/[slug]/dashboard/catalog/offers/page.tsx`
2. `src/app/app/[slug]/dashboard/catalog/offers/components/EditOfferPanel.tsx`
3. `src/app/app/[slug]/dashboard/catalog/offers/components/OfferTable.tsx`
4. `src/app/aums/actions/getAllDealerOffers.ts`
5. `src/app/aums/actions/updateDealerOffer.ts`
6. `src/config/sidebarConfig.ts`
7. `src/modules/registry/routeRegistry.ts`
8. `src/modules/templates/aums-superadmin.ts`
9. `tests/aums-dealer-offer-override.spec.ts`
10. `tests/aums-dealer-offer-override-mutations.spec.ts`
11. `.github/workflows/e2e-smoke.yml`
12. `.github/workflows/e2e-mutations.yml`

Database/RLS follow-up:
1. `supabase/migrations/20260319090000_aums_super_admin_cat_price_dealer_policy.sql` (already applied history; do not edit in place)
2. Add a **new** migration to drop policy `Super Admins can manage all pricing rules` only after dependency check.

## Execution Plan

## Phase 0: Safety + Dependency Check
1. Verify no other imports/usages remain for:
   - `getAllDealerOffersForAdmin`
   - `getAllDealerOffersForExport`
   - `getDealerOfferOverrideHistory`
   - `updateDealerOffer`
   - `updateDealerOfferBulk`
   - `deactivateDealerOffer`
2. Verify `catalog-offers` route id is not required elsewhere after template/registry cleanup.
3. Confirm CI branch-protection expectations if `e2e-smoke` workflow is removed/renamed.

Acceptance:
1. `rg` shows zero live references to removed symbols and route path.

## Phase 1: Remove Product Surface
1. Remove `Dealer Offer Override` menu entry from `sidebarConfig`.
2. Remove `catalog-offers` from route registry.
3. Remove `catalog-offers` item from AUMS template config.
4. Remove `/dashboard/catalog/offers` page + components.

Acceptance:
1. Route is no longer navigable from UI.
2. Build has no unresolved imports from offers page/components.

## Phase 2: Remove Server Actions
1. Delete `getAllDealerOffers.ts` and `updateDealerOffer.ts` if no longer used.
2. If project conventions require stubs, keep empty-safe exports with deprecation comments, then remove in follow-up PR (only if needed to pass strict imports).

Acceptance:
1. No dead server-action files for this feature remain.
2. Typecheck passes.

## Phase 3: Remove Test + CI Coupling
1. Delete both Playwright specs tied to this feature.
2. Update or remove dedicated workflows that execute those specs.
3. If workflows are repurposed, point them to current smoke/mutation suites that still exist.

Acceptance:
1. CI does not reference deleted test files.
2. `npx playwright test --list` shows no missing-file failures.

## Phase 4: DB Policy Rollback (Careful)
1. Create a new migration:
   - `DROP POLICY IF EXISTS "Super Admins can manage all pricing rules" ON public.cat_price_dealer;`
2. Before applying, verify whether this policy is still required by any non-override flow.
3. If still required, do not drop; document rationale in PR and keep migration out.

Acceptance:
1. RLS posture is explicit and documented.
2. No accidental permission regressions for legitimate dealer pricing flows.

## Review Checklist (Mandatory)
1. `npm run lint`
2. `npm run type-check` (or project-equivalent TS check)
3. `npm run build`
4. `npx playwright test --list`
5. Supabase advisor check (if migration added) and include result in PR notes
6. Manual smoke:
   - AUMS sidebar renders without `Dealer Offer Override`
   - Catalog pages still load
   - Dealer pricing/customer-facing offers still resolve normally

## PR Notes Template
Include in Antigravity PR:
1. Exact files removed/changed
2. Whether workflows were removed or repointed
3. Whether RLS policy was dropped or retained (with reason)
4. Commands run + pass/fail
5. Residual risks

## Antigravity Execution Prompt
`@antigravity Execute docs/tasks/remove_super_admin_offer_override_antigravity_20260319.md end-to-end. Remove Super Admin Offer Override fully from UI, actions, tests, and CI references. Perform dependency-safe cleanup, run the review checklist, and include a unified report: files changed, migrations added/applied, commands run, failures, and final risk notes.`

