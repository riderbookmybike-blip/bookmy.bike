# O'Circal Club Promotions Orchestration Plan (Pre-Implementation Review Draft)

## 1) What Changed from Previous Draft

This revision updates the core policy:
1. No global fixed validity (no hard 72h for all campaigns).
2. Every campaign must define its own start and end window in advance.
3. Campaign duration can be:
- few hours
- few days
- weeks
- months
- year-long
4. Every coin grant must inherit expiry from campaign rule (or explicit per-grant override where allowed).
5. Welcome lifecycle must support a pre-expiry booster that expires with/alongside welcome timeline as per configuration.

## 2) Final Business Policy (To Lock Before Build)

### 2.1 Campaign Window Governance
1. Each promotional campaign must be created with mandatory:
- `campaign_start_at`
- `campaign_end_at`
- `coin_expiry_strategy`
2. Campaign cannot be published without these three.
3. Campaign expiry strategy options:
- `CAMPAIGN_END` (all issued coins expire at campaign end)
- `RELATIVE_DURATION` (each grant expires after configured duration from issue time)
- `FIXED_DATETIME` (all grants expire at one fixed timestamp)

### 2.2 Welcome + Booster Rule
1. Welcome campaign is a lifecycle campaign with its own duration.
2. Booster trigger can run before welcome expiry (example: 1 day before expiry).
3. Booster coin must have explicit expiry rule, configurable as:
- same as welcome expiry (`WITH_PARENT_EXPIRY`), or
- independent duration (`RELATIVE_DURATION`), or
- fixed datetime.
4. If configured `WITH_PARENT_EXPIRY`, both welcome and booster expire together.

### 2.3 Referral Rule
1. Referrer gets coin instantly in `LOCKED` state.
2. On referee booking complete, locked coin moves to `EARNED`.
3. `EARNED` referral coin has no expiry unless policy is explicitly changed later.

### 2.4 New User Promo Exclusion Rule
1. While `welcome_active = true`, user is excluded from non-welcome promotions by default.
2. Exception only through admin override flag at campaign level.

### 2.5 Coin Usage Rule
1. User can redeem all available eligible coins unless transaction-level redemption caps are configured.
2. Eligibility is decided by status (`EARNED`/usable), expiry, and channel/policy constraints.

## 3) Campaign Types and Typical Duration Design

1. `WELCOME`
- starts at user onboarding completion
- duration configurable (hours/days)

2. `WELCOME_RECOVERY`
- trigger before welcome expiry
- short urgency duration suggested

3. `FESTIVAL`
- pre-planned date ranges (can be days/weeks)
- example: Dussehra campaign from Navratri minus 5 days to Dussehra end

4. `BEHAVIORAL`
- event-triggered journeys (no booking, cart abandoned, referral inactive)

5. `SEASONAL_LONG_RUN`
- month/quarter/year-level campaign
- stricter fatigue and cooldown controls

## 4) AUMS Product Scope

New module: `Promotions Control Center`
Suggested route: `/app/[slug]/dashboard/marketing/promotions`

Primary areas:
1. Calendar Planner
2. Campaign Builder
3. Audience Segmentation
4. Template Center (WhatsApp/SMS/Email)
5. Trigger Journey Builder
6. Queue/Delivery Monitor
7. Conversion & Liability Analytics

## 5) Data Model (Supabase)

### 5.1 promo_campaigns
- id uuid pk
- name text
- campaign_type text
- objective text
- status text (`DRAFT`, `SCHEDULED`, `RUNNING`, `PAUSED`, `COMPLETED`, `ARCHIVED`)
- campaign_start_at timestamptz
- campaign_end_at timestamptz
- timezone text
- coin_amount numeric
- coin_expiry_strategy text (`CAMPAIGN_END`, `RELATIVE_DURATION`, `FIXED_DATETIME`)
- coin_expiry_duration_hours int nullable
- coin_expiry_at timestamptz nullable
- allow_welcome_overlap boolean default false
- allow_campaign_overlap boolean default false
- override_flags jsonb
- budget_caps jsonb
- created_by uuid
- created_at timestamptz
- updated_at timestamptz

### 5.2 promo_segments
- id uuid
- name text
- filters_json jsonb
- exclusion_json jsonb
- estimated_size int
- last_refreshed_at timestamptz

### 5.3 promo_campaign_channels
- id uuid
- campaign_id uuid
- channel text (`WHATSAPP`, `SMS`, `EMAIL`)
- template_id uuid
- send_mode text (`IMMEDIATE`, `SCHEDULED`, `EVENT_DRIVEN`)
- schedule_at timestamptz nullable
- throttle_per_minute int
- is_enabled boolean

### 5.4 promo_templates
- id uuid
- channel text
- provider text (`MSG91`, `INTERNAL`)
- template_key text
- provider_template_id text nullable
- provider_namespace text nullable
- language_code text
- variables_json jsonb
- approval_state text
- is_active boolean

### 5.5 promo_member_queue
- id uuid
- campaign_id uuid
- member_id uuid
- channel text
- payload_json jsonb
- dedupe_key text unique
- status text (`QUEUED`, `SENT`, `FAILED`, `SKIPPED`)
- provider_message_id text nullable
- reason text nullable
- attempts int default 0
- next_retry_at timestamptz nullable
- created_at timestamptz
- sent_at timestamptz nullable

### 5.6 bcoin_ledger
- id uuid
- member_id uuid
- source_type text (`WELCOME`, `BOOSTER`, `PROMO`, `REFERRAL_LOCKED`, `REFERRAL_EARNED`, `REDEEM`, `EXPIRE`, `ADJUSTMENT`)
- source_ref_id uuid/text
- amount numeric
- status text (`LOCKED`, `EARNED`, `REDEEMED`, `EXPIRED`)
- grant_at timestamptz
- expires_at timestamptz nullable
- parent_ledger_id uuid nullable
- metadata jsonb

### 5.7 promo_events_audit
- id uuid
- entity_type text
- entity_id uuid
- event_type text
- actor_id uuid
- before_json jsonb
- after_json jsonb
- created_at timestamptz

## 6) Segmentation Strategy (Practical + Safe)

### 6.1 Inputs
1. profile: gender, city, state, preferred language
2. lifecycle: onboarding date, welcome active, booking stage
3. engagement: last open/click/send history
4. consent: channel opt-in / DND / unsubscribe status

### 6.2 Sensitive Attributes Governance
1. Religion-based campaign should use explicit declared preference/segment only.
2. No hidden inference from weak or private signals.
3. Keep legal/compliance log of segmentation logic version.

### 6.3 Core Guardrails
1. `welcome_active` users excluded from regular promos by default.
2. Global frequency cap per member (example configurable: max X sends/day/channel).
3. Cooldown between two heavy promotional pushes.

## 7) Channel and Template Strategy with MSG91

## 7.1 Current Integration Status (Codebase Verified)
1. SMS sending utility exists via MSG91 Flow API.
2. WhatsApp template sending utility exists via MSG91 API.
3. OTP integration already live via MSG91 routes.

## 7.2 Template Handling Strategy
1. Preferred: standard reusable templates managed in AUMS Template Center.
2. For MSG91:
- If template creation API is available on your account, support create/sync workflow.
- If not available, use manual provider approval + API fetch/sync + local mapping.
3. Campaign can only use `APPROVED` templates.

## 7.3 Template Versioning
1. template key + version track (`welcome_v1`, `welcome_v2`).
2. Hard block publish when required variables are missing.
3. Preview mode with sample member payload before publish.

## 8) Journey Design (Detailed)

## 8.1 Welcome Journey
1. Event: user verified + onboarded.
2. Action: grant welcome bcoin.
3. Notify through enabled channels.
4. Track opens/clicks and booking conversion.

## 8.2 Welcome Expiry Booster Journey
1. Trigger condition:
- welcome coin not redeemed fully
- no booking confirmation
- current time reached `(welcome_expiry - booster_offset)`
2. Action:
- grant additional booster coin (example +13)
- expiry as per `booster_expiry_strategy`
3. Message intent:
- urgency + clear expiration timestamp
4. Final expiry action:
- expire welcome + booster as configured
- send optional “expired, next offer coming” message

## 8.3 Festival Journey
1. Campaign planned with fixed pre/festival/post window.
2. Example: Dussehra from Navratri minus 5 days till Dussehra.
3. Coin expiry may be campaign-end or relative duration based on strategy.

## 8.4 Referral Lifecycle Journey
1. Referral created -> `REFERRAL_LOCKED`.
2. Referee booking complete -> convert to `REFERRAL_EARNED` (no expiry).
3. Trigger member notification at lock and unlock events.

## 9) Scheduling and Execution Engine

1. Scheduler interval: every 5-10 min.
2. Jobs:
- activate scheduled campaigns
- enqueue eligible members
- dispatch channel sends
- process retries
- expire coins
- run journey evaluators

3. Idempotency:
- unique dedupe key per member/campaign/channel/trigger.

4. Failure handling:
- exponential retry up to N attempts
- dead-letter state for manual review

5. Timezone correctness:
- all campaign windows evaluated in campaign timezone
- UI always shows local + UTC for audit clarity

## 10) UI/UX Plan (Detailed)

## 10.1 IA (Information Architecture)
1. Promotions Home (snapshot)
2. Calendar View
3. Campaign List
4. Campaign Builder Wizard
5. Segments
6. Templates
7. Journeys
8. Delivery Logs
9. Analytics

## 10.2 Campaign Builder UX (Step Wizard)
Step 1: Objective + campaign type
Step 2: Start/end window + timezone
Step 3: Coin grant and expiry strategy
Step 4: Segment + exclusions
Step 5: Channels and templates
Step 6: Frequency and guardrails
Step 7: Preview + cost + liability estimate
Step 8: Publish confirmation

## 10.3 Critical UX Safeguards
1. Hard validation banners:
- missing dates
- invalid expiry logic
- template variable mismatch
- audience size = 0
2. “Conflict Check” panel before publish:
- overlap with running campaigns
- welcome overlap count
- expected coin liability
3. Dry run simulation:
- how many members eligible now
- projected sends by channel

## 10.4 Calendar UX
1. Month + Week + Agenda view.
2. Color coding by campaign type.
3. Overlap markers and warning badges.
4. Click campaign to open quick actions: pause/resume/edit clone.

## 10.5 Operations UX
1. Live dispatch monitor with queue states.
2. Failed sends tab with retry button.
3. Member timeline drill-down:
- what was granted
- what was sent
- what expired

## 10.6 Mobile and Accessibility
1. Responsive layout for key workflows.
2. Keyboard navigable forms and dialogs.
3. WCAG-aligned color contrast for status chips.

## 11) API Plan

1. `POST /api/admin/promotions/campaigns`
2. `PATCH /api/admin/promotions/campaigns/:id`
3. `POST /api/admin/promotions/campaigns/:id/publish`
4. `POST /api/admin/promotions/campaigns/:id/pause`
5. `POST /api/admin/promotions/campaigns/:id/resume`
6. `POST /api/admin/promotions/campaigns/:id/clone`
7. `GET /api/admin/promotions/templates`
8. `POST /api/admin/promotions/templates/sync/msg91`
9. `POST /api/admin/promotions/segments/preview`
10. `POST /api/admin/promotions/journeys/evaluate`
11. `POST /api/admin/promotions/webhooks/msg91`

## 12) Security, Compliance, and Audit

1. Role-based access for create/publish/pause.
2. Mandatory audit log for every publish/edit.
3. Consent and unsubscribe checks before dispatch.
4. DLT compliance and approved templates for SMS.
5. PII minimization in logs.

## 13) Rollout Plan

## Phase A: Foundation
1. Schema migrations.
2. Campaign + template + segment CRUD.
3. Calendar read model.

## Phase B: Execution
1. Queue + dispatcher.
2. MSG91 template sync + send orchestration.
3. Basic journey engine (welcome + booster + referral unlock).

## Phase C: Intelligence
1. Conflict detection and dry-run estimator.
2. Conversion analytics.
3. Fatigue tuning and frequency caps.

## 14) Pre-Implementation Review Checklist (For Tight Review)

1. Business policy freeze done?
2. Expiry strategy matrix approved?
3. Welcome booster exact behavior approved?
4. Segmentation governance approved?
5. Legal/compliance sign-off for targeting logic?
6. Template lifecycle (create/sync/manual) finalized?
7. UI flow reviewed with ops team?
8. Failure/retry ops playbook approved?

## 15) Decision Freeze (Approved Defaults for Build)

1. Welcome default duration: `3 days (72h)` from onboarding completion.
2. Booster default offset: trigger at `T-24h` from welcome expiry.
3. Booster expiry policy: `WITH_PARENT_EXPIRY` (booster expires when welcome expires).
4. Redemption caps: `No global cap` for now (keep optional per-campaign override fields in schema).
5. Frequency caps per member:
- WhatsApp: max `2/day`
- SMS: max `2/day`
- Email: max `1/day`
- Combined marketing pushes: max `3/day`
6. Year-long campaigns: allowed, but only with mandatory sub-window waves (weekly/monthly cohorts), not a continuous blast.

## 16) Immediate Next Steps (Execution Ready)

1. Start Phase A with the above defaults frozen.
2. Create migration + contracts + API skeleton in one pass.
3. Build wireframes and low-fidelity UI for calendar + wizard.
4. Run internal review before enabling publish action in production.

## 17) Phase A Implementation Tickets (Detailed)

### 17.1 Database Tickets
1. Create migration `promo_core_schema`:
- tables: `promo_campaigns`, `promo_segments`, `promo_campaign_channels`, `promo_templates`, `promo_member_queue`, `bcoin_ledger`, `promo_events_audit`.
2. Add constraints:
- `campaign_end_at > campaign_start_at`
- valid enum-like checks for status/channel/strategy columns
- unique index on `promo_member_queue.dedupe_key`
3. Add indexes:
- `promo_campaigns(status, campaign_start_at, campaign_end_at)`
- `promo_member_queue(status, next_retry_at, campaign_id)`
- `bcoin_ledger(member_id, status, expires_at)`
4. Add RLS policies for admin roles only (create/edit/publish) and read-only policies for reporting screens.

### 17.2 API Tickets
1. Implement campaign CRUD:
- `POST /api/admin/promotions/campaigns`
- `PATCH /api/admin/promotions/campaigns/:id`
- `GET /api/admin/promotions/campaigns`
- `GET /api/admin/promotions/campaigns/:id`
2. Implement lifecycle endpoints:
- `POST /api/admin/promotions/campaigns/:id/publish`
- `POST /api/admin/promotions/campaigns/:id/pause`
- `POST /api/admin/promotions/campaigns/:id/resume`
- `POST /api/admin/promotions/campaigns/:id/clone`
3. Implement template endpoints:
- `GET /api/admin/promotions/templates`
- `POST /api/admin/promotions/templates/sync/msg91`
4. Implement segment preview endpoint:
- `POST /api/admin/promotions/segments/preview`
5. Add validation layer:
- date/strategy/required variable checks
- overlap checks with active campaigns
- new-user welcome exclusion checks

### 17.3 UI/UX Tickets
1. Add route shell:
- `/app/[slug]/dashboard/marketing/promotions`
2. Build list + calendar:
- campaign table with status chips
- month/week calendar with overlap warnings
3. Build wizard steps:
- objective
- schedule + timezone
- coin rules + expiry strategy
- segment + exclusions
- channels + template mapping
- guardrails + frequency caps
- dry-run preview
- publish confirm
4. Build UX safeguards:
- conflict check panel
- hard blocking validation banners
- preview payload per channel
5. Build operations views:
- queue monitor (`QUEUED/SENT/FAILED/SKIPPED`)
- retry action for failed items

### 17.4 Jobs/Orchestration Tickets
1. Create scheduler job runner (5-10 minute interval):
- activate scheduled campaigns
- enqueue eligible members
- process queue dispatch
2. Create retry processor:
- exponential backoff up to configured attempts
- dead-letter terminal marking
3. Create expiry processor:
- expire due ledger entries
- log expiry event in audit
4. Create booster evaluator:
- detect welcome entries at `T-24h`
- issue booster with `WITH_PARENT_EXPIRY`
- enqueue urgency message

### 17.5 Analytics and QA Tickets
1. Create base metrics:
- sent/delivered/failed by channel
- campaign conversion to booking
- coin granted vs redeemed vs expired
2. Test matrix:
- welcome + booster journey
- referral lock->earned transition
- overlap conflict checks
- timezone edge cases
3. UAT checklist with ops:
- create, preview, publish, pause, resume, retry, expire flows
