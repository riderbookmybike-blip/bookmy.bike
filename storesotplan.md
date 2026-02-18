# Store SOT Unification Plan

Date: 2026-02-18  
Owner: Store Platform  
Status: Reviewed and updated (execution-ready)

## 1. Goal

Catalog, PDP, desktop, and phone must resolve the exact same SKU, color, image, and price using one consistent source path.

Success criteria:

1. No synthetic `default` SKU for active published variants.
2. No false `₹0` on PDP when price row exists in `cat_price_state_mh`.
3. Same totals for same `{sku, state, district, dealer}` on all surfaces.

## 2. Review Findings (from `storesotplan.md.resolved` + current code)

Critical gaps that must be fixed immediately:

1. PDP still carries dead `cat_assets!item_id` dependency in query chain.
2. PDP pricing queries must always enforce `publish_stage='PUBLISHED'`.
3. PDP should use `cat_colours!colour_id` join (same as catalog) for stable color name/hex/finish.
4. Gallery source must match catalog (`primary_image` + `gallery_img_1..6`).
5. Variant/color fallback currently allows synthetic `default` and leaks zero-pricing UX.

Clarification:

1. Supabase client mismatch is not root cause here; PDP already uses `adminClient` in `src/app/store/[make]/[model]/[variant]/page.tsx`.

## 3. Non-Negotiable SOT Rules

1. Pricing source: `cat_price_state_mh` only.
2. Renderable price rows: `publish_stage='PUBLISHED'` only.
3. SKU identity: UUID from `cat_skus.id` only.
4. Image identity: `cat_skus.primary_image` and `cat_skus.gallery_img_1..6` only.
5. Color identity: `cat_colours` join with SKU fallback.
6. Location/dealer source: unified through pricing context resolver.
7. Server snapshot is base truth; client applies dealer delta only.

## 4. Phase 1 Hotfix (Immediate)

Primary target file:

`src/app/store/[make]/[model]/[variant]/page.tsx`

### 4.1 Query-level patch checklist

1. Remove `assets:cat_assets!item_id(...)` from both SKU select blocks.
2. Add `gallery_img_1..6` in both SKU select blocks.
3. Add `colour:cat_colours!colour_id(id, name, hex_primary, hex_secondary, finish)` in both SKU select blocks.
4. Add `.eq('publish_stage', 'PUBLISHED')` in primary and MH fallback pricing queries.

### 4.2 Mapping-level patch checklist

1. Build color/gallery assets from:
`[primary_image, gallery_img_1, gallery_img_2, gallery_img_3, gallery_img_4, gallery_img_5, gallery_img_6]`.
2. Resolve color metadata in this precedence:
`sku.colour.*` -> `sku.color_name/hex_*` -> safe fallback.
3. Keep `pickImageFromAssets` compatible with this new in-memory gallery shape, or simplify to direct primary-first selection.

### 4.3 Fallback safety checklist

1. If no valid variant SKU UUID exists, return explicit unavailable state.
2. Do not fabricate `id:'default'` + `skuId:'default'` for active variant flow.

Secondary target file:

`src/hooks/SystemPDPLogic.ts`

1. Reject pricing computation path when selected color cannot map to valid SKU UUID.
2. Show unavailable state instead of computing `₹0` from synthetic defaults.

## 5. Phase 2 SOT Refactor (Shared Fetch Layer)

Create:

1. `src/lib/server/storeSot.ts`
2. `src/types/storeSot.ts`

Shared APIs:

1. `resolveStoreContext(input)`
2. `getCatalogSnapshot(context)`
3. `getPdpSnapshot({ make, model, variant, color, context })`
4. `getDealerDelta({ skuIds, accessoryIds, context })`

Then refactor:

1. `src/lib/server/catalogFetcherV2.ts` -> consume shared fetch layer.
2. `src/app/store/[make]/[model]/[variant]/page.tsx` -> consume shared fetch layer.

## 6. Phase 3 Client Contract Cleanup

Target:

`src/hooks/useSystemDealerContext.ts`
`src/app/store/[make]/[model]/[variant]/ProductClient.tsx`

Rules:

1. `prefetchedPricing` from server is authoritative for ex/RTO/insurance.
2. Client can update dealer offer/bundle only.
3. Client fallback query (if used) must use same state fallback and publish filter.
4. Always pass resolved `selectedSkuId` UUID downstream.

## 7. Phase 4 Desktop and Phone Parity

1. Keep one responsive data path (`ProductClient`) for both viewports.
2. Remove any device-conditional data fetch divergence.
3. Add parity e2e for `1366x768` and `390x844`.

## 8. Verification Matrix

## 8.1 Automated

1. `npm run -s typecheck`
2. `npm run build`

## 8.2 Manual core checks

1. Open `/store/tvs/jupiter/drum?color=meteor-red-gloss&district=Palghar` and verify non-zero values.
2. Verify debug never shows `sku: default` for active SKU-backed variant.
3. Compare one product in catalog vs PDP and confirm color/image/pricing parity.
4. Verify at least one SKU lacking `primary_image` still renders fallback from gallery if present.

## 8.3 Data checks (SQL)

1. SKU rows exist for variant and state.
2. Published price rows exist for target `sku_id` and `state_code`.
3. Color FK integrity (`colour_id`) is present for active vehicle SKUs.

## 9. Rollout and Rollback

Feature flag:

`NEXT_PUBLIC_STORE_SOT_V2`

Rollout:

1. Staging 100%
2. Prod canary 10%
3. Prod 50%
4. Prod 100% after 24h parity stability

Rollback:

1. Disable flag.
2. Re-run parity checklist on previous stable path.

## 10. Risks and Mitigation

1. Slug mismatch risk:
Resolve by variant ID after slug match and canonical redirect.
2. Dealer hydration drift risk:
Delta-only client contract.
3. Cache staleness risk:
Tag by `state + district + dealer` and revalidate on pricing publish events.

## 11. Definition of Done

1. No active published PDP renders `default/default` SKU.
2. No false `₹0` for published rows.
3. Catalog/PDP/desktop/phone parity confirmed on fixture matrix.
4. Quote payload always carries valid SKU UUID.
5. Typecheck/build/e2e gates pass.
