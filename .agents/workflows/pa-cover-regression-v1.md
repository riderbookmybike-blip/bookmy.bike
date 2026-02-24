# PA-COVER-REGRESSION-v1

Status: Planned
Owner: Codex (Project Director)
Implementation Agent: Antigravity

## Objective
Remove forced PA-cover included/free behavior on PDP and align old published pricing rows.

## Agent + Mode Assignment
1. Task: UI semantics fix (mandatory != free/bundled)
Agent: Gemini 3.1 Pro (Low)
Mode: Task
Files:
- src/hooks/SystemPDPLogic.ts
- src/components/store/Personalize/Accordion/AccordionInsurance.tsx

2. Task: Data correction for old published rows
Agent: Gemini 3.1 Pro (High)
Mode: Task
Scope:
- public.cat_price_state_mh

3. Task: Publish-path consistency audit
Agent: Claude Sonnet 4.6 (Thinking)
Mode: Planning
Scope:
- src/actions/publishPrices.ts
- related pricing save/publish actions

4. Task: Regression/risk review
Agent: Claude Sonnet 4.6 (Thinking)
Mode: Planning
Scope:
- PDP insurance display and totals
- sample SKUs across states

## Acceptance Criteria
- PA addon is not auto-rendered as Included/FREE unless true bundle rule is explicitly intended.
- Existing legacy rows with forced PA default are corrected as per approved policy.
- No duplicate insurance addons on PDP.
- Insurance totals remain consistent after UI/data fix.

## Non-Goals
- Full insurance engine redesign.
- Unrelated pricing UX refactor.

## Execution Order
1. UI semantics
2. DB backfill
3. Publish-path audit
4. Regression validation
