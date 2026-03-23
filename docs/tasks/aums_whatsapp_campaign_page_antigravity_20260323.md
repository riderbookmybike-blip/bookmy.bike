# AUMS WhatsApp Campaign Page (Antigravity Task)

Date: 2026-03-23  
Owner: Codex (task author)  
Executor: Antigravity (implementation)

## Objective
Build a dedicated AUMS campaign execution page for controlled WhatsApp rollout with batch safety controls.

Primary route contract (locked):
- `/aums/campaigns/[campaign-id]`

## Business Context
Current rollout must avoid single-shot blasts due to spam/report/block risk on WhatsApp number.  
Need controlled execution with test batch gate, staged batches, and operator controls.

Reference note:
- `whatsapp.md` (campaign content + SOP + metadata placeholders)

## Scope (Confirmed)
1. Campaign detail + batch controls on `/aums/campaigns/[campaign-id]`
2. Test batch approval gate on same page
3. Pause/Resume + live logs on same page

## Functional Requirements
1. Campaign Header
   - Campaign id/name/status
   - Template name + template status
   - Eligible recipient count
   - Date window (offer validity)
2. Audience Safety Filters (display + enforced in send flow)
   - Serviceable members only
   - Active members only
   - Valid WhatsApp number only
   - Exclude opted-out users
   - Exclude blacklist numbers
3. Batch Execution Controls
   - Configurable batch size
   - Configurable delay between batches
   - Start first test batch separately
   - Explicit approval action before production batches continue
4. Runtime Controls
   - Pause campaign
   - Resume campaign
   - Stop campaign
5. Live Logs Panel
   - Per batch status: queued/sent/failed
   - Aggregates: total sent, delivered (if available), failed, replies (if available)
   - Timestamped recent events
6. Guardrails
   - Prevent accidental full blast from UI
   - Disable "Run next batch" until test batch marked reviewed/approved
   - Basic idempotency safeguard for duplicate trigger clicks

## Technical Constraints
1. Reuse existing MSG91 WhatsApp integration where possible (`src/lib/sms/msg91-whatsapp.ts`).
2. Keep implementation additive; do not break existing welcome/quote WhatsApp flows.
3. Follow current app conventions for server actions/API routes, auth, and tenant access.
4. No hardcoded real phone numbers in code.
5. DB naming contract: use `cam_whatsapp` prefix for new campaign tables (example: `cam_whatsapp_campaigns`, `cam_whatsapp_logs`).

## Non-Goals (This Task)
1. Full campaign builder/template creation UI redesign
2. Cross-channel orchestration (Email/SMS)
3. Automatic AI content generation

## Suggested Implementation Plan
## Phase 0: Discovery + Contract Freeze
1. Identify existing AUMS route layout and permission guard for admin modules.
2. Define minimal data contract for campaign detail, eligible audience count, and logs.

Acceptance:
1. Contract documented in code/types.

## Phase 1: Route + Page Shell
1. Add route/page for `/aums/campaigns/[campaign-id]`.
2. Render campaign summary block + status badges + metadata section.

Acceptance:
1. Route is navigable directly via URL.
2. Missing campaign-id path handles gracefully.

## Phase 2: Batch Control Engine (UI + server wiring)
1. Add test batch send action.
2. Add approve-test-batch action.
3. Add run-next-batch action.
4. Add pause/resume/stop actions.
5. Add duplicate-trigger guard.

Acceptance:
1. Test batch must complete before next batch actions unlock.
2. Pause prevents further batch execution.

## Phase 3: Logs + Observability
1. Add live logs/timeline section.
2. Show per batch counters and latest events.
3. Provide operator-readable errors for failed sends.

Acceptance:
1. Operator can verify what happened without checking raw server logs.

## Phase 4: Validation
1. Unit/integration checks for gating logic.
2. Manual smoke flow:
   - Create/open campaign page
   - Send test batch
   - Approve
   - Run next batch
   - Pause/Resume
   - Confirm logs update

Acceptance:
1. No uncontrolled full-send action available.
2. Flow follows: test -> approve -> batch rollout.

## Deliverables
1. Page route and UI for `/aums/campaigns/[campaign-id]`
2. Server/API wiring for batch operations
3. Log data flow surfaced in UI
4. Updated docs if any contract/interface changed

## Mandatory Report Format (Antigravity -> Codex)
Return a unified implementation report with:
1. Files changed
2. Data model/API changes
3. Commands run (lint/typecheck/tests/build) + pass/fail
4. Known gaps or deferred items
5. Risk notes for production rollout

## Antigravity Execution Prompt
`@antigravity Execute docs/tasks/aums_whatsapp_campaign_page_antigravity_20260323.md end-to-end. Build dedicated AUMS route /aums/campaigns/[campaign-id] with campaign detail + batch controls, test batch approval gate, pause/resume/stop runtime controls, and live logs. Reuse existing MSG91 integration safely, preserve existing WhatsApp flows, and return unified implementation report with files changed, commands run, failures, and risks.`
