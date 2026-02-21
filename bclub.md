# BClub / O-Circle Secure Schema Plan
Date: 2026-02-21
Status: plan-approved draft

## Primary goals
- Keep O-Circle data independent from member profile tables, with strong FK links to members.
- Make referral code mandatory for both lead creation and member registration.
- Track complete attribution chain: who referred whom, source channel, who got points, and who redeemed how much.
- Ensure high security with least privilege, immutable ledger, idempotent posting, and full auditability.

## Non-negotiable business rules
- No referral code, no lead and no member signup.
- On successful registration:
  - New member gets `+13` points immediately.
  - Referrer gets `+13` B-coins only if referrer is not a team member.
- Team member referral still records attribution but rewards are skipped.
- Self-referral is blocked.

## Required independent O-Circle tables
1) `oclub_member_accounts` (1:1 with member)
- `id` uuid pk
- `member_id` uuid not null unique references `id_members(id)` on delete cascade
- `public_referral_code` text not null unique
- `is_team_member` boolean not null default false
- `status` text not null default 'ACTIVE'
- `created_at`, `updated_at`

2) `oclub_referral_attributions`
- `id` uuid pk
- `lead_id` uuid not null references `crm_leads(id)`
- `referred_member_id` uuid null references `id_members(id)` (filled after conversion)
- `referrer_account_id` uuid not null references `oclub_member_accounts(id)`
- `input_referral_code` text not null
- `source_channel` text not null (WEB, CRM, APP, IMPORT, API)
- `created_by_user_id` uuid null references `auth.users(id)`
- `status` text not null default 'LEAD_CAPTURED' (LEAD_CAPTURED, MEMBER_REGISTERED, REWARDED, SKIPPED_TEAM, REVERSED)
- `created_at`, `updated_at`
- unique: one active attribution per `lead_id`

3) `oclub_wallets` (existing, keep as balance cache)
- keep one row per member/account and maintain only through ledger posting functions
- add `version` bigint for optimistic locking (optional but recommended)

4) `oclub_coin_ledger` (append-only source of truth)
- `id` uuid pk
- `member_id` uuid not null references `id_members(id)`
- `account_id` uuid not null references `oclub_member_accounts(id)`
- `txn_type` text not null (SIGNUP_BONUS, REFERRAL_BONUS, TEAM_REFERRAL_SKIPPED, REDEEM_HOLD, REDEEM_RELEASE, REDEEM_REVERSE, MANUAL_ADJUSTMENT)
- `coin_type` text not null (SYSTEM, REFERRAL, SPONSORED)
- `delta` integer not null
- `balance_after` integer null (optional denormalized)
- `source_table` text not null
- `source_id` uuid not null
- `idempotency_key` text not null unique
- `prev_hash` text null
- `row_hash` text not null
- `metadata` jsonb not null default '{}'::jsonb
- `created_at` timestamptz not null default now()
- constraints: no update/delete via trigger, insert-only

5) `oclub_redemption_requests` (existing, harden)
- add `idempotency_key` unique
- add `requested_by_user_id`, `approved_by_user_id`, `payment_ref`, `settled_at`
- states: PENDING_APPROVAL, APPROVED, PAID, REJECTED, REVERSED

6) `oclub_redemption_settlements` (new)
- `id` uuid pk
- `redemption_request_id` uuid not null references `oclub_redemption_requests(id)`
- `member_id` uuid not null references `id_members(id)`
- `amount_coins` integer not null
- `amount_inr` numeric(12,2) not null
- `settlement_ref` text unique
- `status` text not null
- `created_at`, `updated_at`

7) `oclub_audit_events` (new security audit stream)
- `id` uuid pk
- `actor_user_id` uuid null
- `actor_role` text not null
- `event_name` text not null
- `entity_table` text not null
- `entity_id` uuid not null
- `before_json` jsonb null
- `after_json` jsonb null
- `ip_address` inet null
- `user_agent` text null
- `created_at` timestamptz not null default now()

## Security model (high security)
- RLS enabled on all O-Circle tables.
- Client-facing reads allowed only for own records (`auth.uid()` mapped to own member_id).
- No direct client writes to wallet/ledger/redemption/referral tables.
- All mutations only via `SECURITY DEFINER` RPC functions with strict parameter validation.
- Service role endpoints must verify caller identity and ownership before any wallet/ledger fetch.
- Ledger immutability:
  - BEFORE UPDATE/DELETE trigger raises exception.
  - hash chain (`prev_hash`, `row_hash`) detects tampering.
- Idempotency:
  - every mutation function requires `idempotency_key`.
  - repeated requests return existing transaction instead of duplicating credit/debit.

## Core transaction flows
1) Lead capture with referral
- Validate referral code in `oclub_member_accounts`.
- Reject invalid or self-referral.
- Insert row in `oclub_referral_attributions` with `LEAD_CAPTURED`.

2) Lead to member conversion
- Link `referred_member_id` in attribution.
- Post signup credit `+13` to new member ledger/wallet.
- If referrer is team member: write `TEAM_REFERRAL_SKIPPED` (delta 0).
- Else post referrer bonus `+13` as referral coin.
- Mark attribution status `REWARDED` or `SKIPPED_TEAM`.

3) Redemption
- Create request -> hold/release coins in ledger.
- On payout, write settlement record and PAID ledger event.
- On rejection/reversal, post compensating ledger entries only (never edit past entries).

## Migration plan
1) Phase A: DDL and backfill
- Create `oclub_member_accounts`, `oclub_referral_attributions`, `oclub_redemption_settlements`, `oclub_audit_events`.
- Backfill all existing members to `oclub_member_accounts` with unique codes.
- Mark internal users as `is_team_member=true`.

2) Phase B: dual-write
- Keep existing paths running, add writes to new attribution + audit tables.
- Add idempotency keys to signup/referral/redemption APIs.

3) Phase C: cutover
- Switch all reward/redemption logic to new secure functions.
- Lock direct writes with RLS and revoke table-level write grants.

4) Phase D: enforce and monitor
- Make referral required across all lead/member entry points.
- Enforce NOT NULL and unique constraints after rollout validation.
- Add alerting on fraud patterns (same device, repeated retries, unusual velocity).

## Required implementation changes
- Replace client-side direct `getOClubWallet(memberId)` access with server-validated API using current user context.
- Add dedicated RPCs:
  - `oclub_capture_referral_lead`
  - `oclub_register_member_reward`
  - `oclub_request_redemption`
  - `oclub_settle_redemption`
  - `oclub_reverse_transaction`
- Add admin screens for attribution trail, skipped-team events, and reversal workflows.
- Add smoke tests for full chain: lead -> member -> reward -> redeem -> settle/reverse.
