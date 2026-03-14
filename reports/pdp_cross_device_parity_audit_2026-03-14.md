# PDP Cross-Device Parity Audit (2026-03-14)

## Scope
- Goal: Desktop PDP card keys/values must remain logically identical across all device classes.
- User expectation: UX/layout can change, but card content keys, value formulas, and data sources must not diverge.
- Method: Source audit of device routing, breakpoint logic, PDP rendering architecture, and existing parity tests.

## Device/Breakpoint Matrix (Current Implementation)

### CSS breakpoints (Tailwind)
Source: `tailwind.config.js`
- `sm`: `640px`
- `md`: `768px`
- `lg`: `900px` (treated as desktop threshold)
- `xl`: `1280px`
- `2xl`: `1536px`
- Height/query variants also exist:
  - `h-sm`: `(max-height: 820px)`
  - `h-md`: `(max-height: 900px)`
  - `wide-short`: `(min-width: 1536px) and (max-height: 900px)`

### Runtime device buckets
Source: `src/hooks/useBreakpoint.ts`
- `phone`: `<= 767px` OR handheld phone UA override
- `tablet`: `768px .. 899px`
- `desktop`: `>= 900px`
- TV UA is forced to desktop bucket

### Server-side initial device
Source: `src/app/store/[make]/[model]/[variant]/page.tsx`, `src/lib/utils/device.ts`
- Initial SSR prop currently only: `'phone' | 'desktop'` via `isMobileDevice()`
- Tablet and TV are not explicitly emitted by SSR prop path (TV utility exists but not used in PDP page)

## Rendering Architecture (Current)

### PDP shell routing
Source: `src/app/store/[make]/[model]/[variant]/ProductClient.tsx`
- Shell choice: `forceMobileLayout ? MobilePDP : DesktopPDP`
- `forceMobileLayout` uses runtime pointer/UA + breakpoint logic

### Desktop PDP
Source: `src/components/store/DesktopPDP.tsx`
- Uses custom monolithic render path for cards
- Key card components used directly:
  - `PricingCard`
  - `FinanceCard`
  - `FinanceSummaryPanel`
  - `AmortizationPanel`
  - `FloatingCommandBar`

### Mobile PDP
Source: `src/components/store/mobile/MobilePDP.tsx`
- Uses shared section components:
  - `PdpPricingSection`
  - `PdpFinanceSection`
  - `PdpFinanceSummarySection`
  - `PdpConfigSection`
  - `PdpSpecsSection`
  - `PdpCommandBar`

## Findings (Ordered by Severity)

### F1 (High): Desktop and Mobile do not use the same section implementation
- Desktop uses monolithic card render path.
- Mobile uses shared section modules.
- Result: same feature can drift in key/value logic across shells over time.

### F2 (High): Command bar implementation differs between desktop and mobile shells
- Desktop uses `FloatingCommandBar`.
- Mobile uses `PdpCommandBar`.
- Value formulas and displayed metric grouping are not centrally unified.

### F3 (High): Existing parity section marker test can pass even when real desktop card content drifts
Source: `DesktopPDP.tsx`
- Desktop injects always-mounted hidden markers:
  - `data-parity-section="pricing|finance|finance-summary|amortization"`
- This verifies marker presence, not rendered card content parity.

### F4 (Medium): Parity snapshot coverage is partial
Source: `src/components/store/sections/ParitySnapshot.tsx`
- Snapshot currently checks aggregates and some ID lists.
- Missing high-risk values: wallet coin deduction, O'Circle deduction lines, TAT/Delivery By, Studio ID, Distance, pricing source label, command bar totals.

### F5 (Medium): Test matrix does not cover tablet/TV/intermediate breakpoints
Source: `tests/store-sot-parity.spec.ts`
- Current contexts are mainly desktop (1366x768) and phone (390x844).
- No tablet portrait/landscape, TV-like viewport, short-wide desktop variants.

### F6 (Medium): SSR initial device path is coarse (`phone|desktop` only)
- SSR path does not explicitly emit tablet/tv in PDP page, though client hydrates later.
- This can create inconsistent first render behavior on edge devices.

### F7 (Low): Catalog parity note file had stale assertions (partially fixed already)
- Notes previously claimed some mobile routing gaps that code already addressed.
- Governance docs need to be tied to automated checks to prevent drift.

## What Was Already Fixed in This Session
- Mobile catalog card active-color-first price source parity update.
- PDP wallet-load transient mismatch mitigation in `ProductClient` (waits for wallet context before rendering PDP shell).
- Catalog parity notes updated with current status/checklist.

## Required Fix Plan for 100% PDP Key/Value Parity

### Phase 1: Define canonical parity contract (mandatory)
1. Create a single canonical key schema for each PDP card:
   - Pricing card keys
   - Finance card keys
   - Finance summary keys
   - Config card keys
   - Specs keys
   - Command bar keys
2. For every key, define:
   - Source path (e.g. `data.baseExShowroom`, `bestOffer.delivery_tat_days`)
   - Formula
   - Fallback
   - Visibility rule
3. Store schema in one file (e.g. `src/components/store/sections/pdpParityContract.ts`).

### Phase 2: Unify compute layer (no duplicated math)
1. Move pricing breakup computation to single shared pure function (already partially available in `buildPriceBreakup`; extend to full coverage).
2. Move command bar totals/labels to shared pure function used by both desktop and mobile bars.
3. Remove ad-hoc local computations from `DesktopPDP.tsx` where duplicate logic exists.

### Phase 3: Unify render layer
1. Desktop should render the same shared sections used by Mobile:
   - `PdpPricingSection(layout="desktop")`
   - `PdpFinanceSection(layout="desktop")`
   - `PdpFinanceSummarySection(layout="desktop")`
   - `PdpConfigSection(layout="desktop")`
   - `PdpSpecsSection(layout="desktop")`
2. Replace `FloatingCommandBar` in desktop path with `PdpCommandBar(layout="desktop")`.
3. Keep layout skin differences only via props/classes, not separate business logic.

### Phase 4: Harden parity test coverage
1. Extend Playwright parity matrix to include:
   - Phone small: `360x800`
   - Phone large: `430x932`
   - Tablet portrait: `768x1024`
   - Tablet landscape: `1024x768`
   - Desktop standard: `1366x768`
   - Desktop short: `1280x720`
   - TV-like: `960x540` + TV UA
   - Large TV: `1920x1080` + TV UA
2. Add strict key-value extraction asserts from rendered DOM (not hidden markers only).
3. Add dedicated assertions for:
   - `Bcoin Used`
   - `O' Circle Privileged`
   - `Net Offer Price`
   - `TAT`, `Delivery By`, `Studio ID`, `Distance`
   - command bar: amount + bcoin equivalent + CTA mode

### Phase 5: Governance + regression lock
1. Remove hidden parity marker shortcuts that can mask drift.
2. Keep `ParitySnapshot` but expand it to include pricing-line values, not only ids/aggregates.
3. Add CI gate: parity spec mandatory on every PDP-related PR.
4. Add a “parity contract change checklist” in PR template.

## Acceptance Criteria (Definition of Done)
- For same SKU + same context (login, wallet, location, dealer, offer mode), desktop/tablet/phone/tv all produce:
  - same key set per card
  - same numeric values
  - same textual value semantics
- Visual arrangement may differ, data semantics cannot.
- Parity tests pass across full matrix in CI.

## Estimated Execution Effort
- Phase 1: 0.5 day
- Phase 2: 1 day
- Phase 3: 1.5 to 2 days
- Phase 4: 1 day
- Phase 5: 0.5 day
- Total: ~4 to 5 engineering days (single developer, with review)

## Notes
- This audit is code/source based. Runtime cross-browser visual diff run was not executed in this pass.
- Next step should start with Phase 1 contract file, then refactor desktop render path to shared sections.
