# Next Sprint Plan — 2026-03-20

**Baseline**: `v0.3.19-ci-green` @ `d4f5b425`  
**All CI gates green**: Unit Tests ✅ · E2E Smoke ✅ · SOT Parity Gate ✅

---

## CI Guardrails (do not break)

| Gate | Workflow | Scope |
|------|----------|-------|
| Unit Tests | `unit-tests.yml` | 7 suites, 84 tests — runs `jest` via `jest.config.js` |
| E2E Smoke (required) | `e2e-smoke.yml` | `npm ci → lint → build → playwright --list` |
| SOT Parity Gate | `parity-gate.yml` | `store-sot-parity.spec.ts` — `desktop-chrome` only |

**Secrets required in GitHub Actions**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

---

## Priorities

### P1 — Dealer Enrichment (active)
- [ ] Review `reports/dealer_primary_selection_sheet_20260319.md` with business
- [ ] Apply approved studio code / primary branch updates to DB
- [ ] Run `dealer_enrichment_seed_20260319` seeding script post-approval
- [ ] Verify dealer resolution and pricing still passes SOT parity gate

### P2 — PDP Soft Lock
- [ ] Validate soft lock behavior for unauthenticated users on live staging
- [ ] Ensure Gallery and Spec cards remain public; Pricing/Finance/Config gated
- [ ] Confirm login prompt renders correctly on mobile and desktop

### P3 — Collapsible CRM Sections (profile dropdown)
- [ ] Manual smoke: Dealership CRMs and Financer CRMs expand/collapse correctly
- [ ] WhatsApp quick-welcome toggle unchanged
- [ ] No regression in profile area on mobile

### P4 — CI Debt Cleanup
- [ ] Add concurrency group to `unit-tests.yml` to prevent accidental cancellation on rapid pushes
- [ ] Consider enabling `mobile-safari` parity tests once WebKit is stable on runner
- [ ] Update `actions/checkout`, `actions/setup-node`, `actions/upload-artifact` to Node 24 compatible versions before June 2026 deadline

### P5 — Backlog
- [ ] `git config --global user.email` / `user.name` — committer identity still auto-detected from hostname; set explicitly
- [ ] RLS on `public.recompute_queue`, `market_winner_price` (pre-existing advisor warnings)
- [ ] `v_share_actors` SECURITY DEFINER view remediation

---

## Definition of Done

- [ ] All P1 DB changes go through a numbered migration file
- [ ] `npm run lint` and `npm run typecheck` pass before commit
- [ ] All 3 CI gates green before tagging next baseline
