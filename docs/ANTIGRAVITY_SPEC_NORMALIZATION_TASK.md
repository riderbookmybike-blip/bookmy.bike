# Antigravity Specification Normalization Task

Date: 8 March 2026  
Owner: Catalog Admin (Ajit)  
Goal: Existing specifications ko clean, uniform aur approval-driven banana using Antigravity + review workflow.

## Objective

- One row = one key = one value.
- Unknown/new spec key bina approval ke live na ho.
- Existing wrong/conflicting values ko one-by-one review karke `keep/edit/remove` decide karna.
- Future seeding me prescribed format enforcement mandatory.

## Current Controls (already implemented)

- Seed gate helper: `scripts/specGate.mjs`
- Vehicle seed scripts me gate wired:
  - `scripts/seed-v2-activa.mjs`
  - `scripts/seed-v2-jupiter.mjs`
  - `scripts/seed-v2-ronin.mjs`
  - `scripts/seed-v2-unicorn.mjs`
  - `scripts/seed-v2-xl100.mjs`
- Review queue builder: `scripts/spec_review_queue_build.ts`
- One-by-one decision runner: `scripts/spec_review_queue_review.ts`
- NPM commands:
  - `npm run spec:review:build`
  - `npm run spec:review:run`

## End-to-End Workflow (Antigravity-led)

## Phase 1: Snapshot & Audit

1. Build review queue from existing DB specs:
```bash
npm run spec:review:build
```

2. Generated file check karo:
- `reports/spec-review-queue.json`

This queue contains suspicious entries like:
- invalid max power/torque format
- displacement mismatch
- placeholder values (`N/A`, `-`, etc.)

## Phase 2: One-by-One Review (Manual Decision)

Run interactive reviewer:
```bash
npm run spec:review:run
```

Per item options:
- `k` = keep existing value
- `e` = edit with corrected value
- `r` = remove (set null)
- `s` = skip
- `q` = quit session

Decision trail is archived in:
- `reports/spec-review-decisions.jsonl`

Queue status updates in:
- `reports/spec-review-queue.json`

## Phase 3: Antigravity Mapping Rules

Antigravity ingestion ke liye mandatory mapping policy:

1. Incoming key -> canonical key map
2. If key unknown:
- direct write reject
- send to approval list (`pending key`)
3. If known key but format invalid:
- reject and queue for correction
4. Composite values split before save when required:
- engine type split (stroke/cylinder/cooling/fuel system/valves)
- mode-wise performance split where applicable

## Phase 4: Apply Decisions Back to DB

When review decisions complete:

1. Re-run queue build to verify residual issues:
```bash
npm run spec:review:build
```

2. Ensure pending count near zero (except intended skips).

3. Run seed/ingest only through gated scripts.

## Phase 5: Lock Future Drift

Non-negotiable rules:

- New key insertion without approval: blocked
- Invalid enum/type/metric format: blocked
- Unknown label variants (same meaning, different key): map to canonical key first

## Value Format Guidance

For key metrics, preferred patterns:

- `max_power`: `17.55 PS @ 9250 rpm`  
- mode-wise `max_power`: `17.55 PS @ 9250 rpm (Sport) / 15.64 PS @ 8650 rpm (Urban/Rain)`
- `max_torque`: `14.73 Nm @ 7500 rpm`
- `displacement`: numeric (`160.2`)
- booleans: true/false only

## Weekly Operating Routine

1. `npm run spec:review:build`
2. `npm run spec:review:run`
3. Resolve all high-priority pending items
4. Archive decisions and keep commit trail

## Success Criteria

- No duplicate/ambiguous spec rows in UI
- No unapproved key entering DB
- Existing bad values reviewed with explicit decision log
- Antigravity ingestion becomes deterministic and auditable

