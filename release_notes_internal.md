# Release Notes (Internal)

Date: 2026-03-23  
Branch: `main`

## Scope
This release bundles six meaningful commits across dealer pricing, identity, OCircle, and PDP/UI hardening.

## Commits Included

1. `ad290a17`  
   `feat(dealer-offers): wire mono-brand accessory & service offer pipeline end-to-end`
- Dealer pricelist split to Vehicles / Accessories / Services.
- Accessory/service pricing flows through `cat_price_dealer` end-to-end.
- `DealerDelta` and PDP data flow extended for service rules.

2. `c7ee13c1`  
   `fix(pricing-ledger): fix blank Accessories/Service tab and stale filter reset`
- Removed render-phase category state anti-pattern in pricing ledger.
- Added reliable table-local reset on parent filter changes.
- Eliminated blank tab behavior during category switches.

3. `2ddf4663`  
   `feat(pricing-context): resolve dealer context and scope catalog pricing`
- Pricing context now resolves dealer from explicit param, studio, or lead.
- Dashboard catalog pricing scoping improved for dealer-specific visibility.
- Accessory compatibility-based scoping added for mono-brand workflows.

4. `fcfcf6fd`  
   `feat(member-identity): move profile and attribution to canonical id_members`
- Introduced canonical member update/upload actions in `src/actions/members.ts`.
- Replaced legacy metadata fallbacks with `id_members` in key auth/profile/analytics paths.
- CRM attribution/name resolution aligned to canonical identity source.
- `next.config.ts` updated for larger server action body limit (`5mb`).

5. `fcbd87c1`  
   `feat(ocircle): expand member hub profile, contacts, addresses and image crop`
- OCircle pages now hydrate richer member datasets (contacts + addresses).
- `MemberHubClient` expanded for profile editing workflows.
- Added reusable image crop modal: `src/components/image/ImageCropModal.tsx`.

6. `7b35391a`  
   `feat(store-ui): refine pdp pricing surfaces and registration accordion`
- Desktop/mobile PDP pricing sections and command bar behavior refined.
- Registration accordion logic/UI updated for clearer charge and selection handling.

## Risk Notes
- Identity migration to canonical `id_members` touches multiple surfaces; monitor login/profile/update events.
- Dealer pricing context and compatibility logic changes can affect catalog visibility; monitor mono-brand dealer tenants specifically.
- OCircle UI/state expansion is large; monitor profile image and contact/address update flows.

## Validation Snapshot
- `git status`: clean
- TypeScript: `npx tsc --noEmit` passed
- Branch sync: commits pushed to `origin/main`
