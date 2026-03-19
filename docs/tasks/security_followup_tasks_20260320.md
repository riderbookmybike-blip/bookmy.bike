# Follow-up Tasks: Security Hardening Sprint 2026-03-19

Origin: `security_hardening_closure_20260320.md`  
Baseline: `d14f96c5`

---

## P-PERF-01 — Auth RLS Initialization: replace `auth.uid()` → `(SELECT auth.uid())`

**Priority**: Medium  
**Effort**: ~30 min  
**Trigger**: Performance Advisor flagging "Auth RLS Initialization Plan" on all 15 tables added in W2

**Problem**:  
`auth.uid()` in `USING`/`WITH CHECK` expressions is a volatile function call — PostgreSQL evaluates it per-row in the policy check, which can cause unnecessary overhead.

**Fix**:  
Replace every occurrence of `auth.uid()` with `(SELECT auth.uid())` in all W2 policies. The subselect form is evaluated once per statement, not once per row.

**Affected migration**: `20260320203000_w2_tighten_always_true_write_policies.sql`

**Tables**: all 15 tables that received new tenant-membership policies in W2.

**Implementation**:
```sql
-- Example (repeat for all 15 tables):
DROP POLICY "Team members insert leads" ON public.crm_leads;
CREATE POLICY "Team members insert leads"
  ON public.crm_leads FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.id_team
      WHERE id_team.tenant_id = crm_leads.tenant_id
        AND id_team.user_id   = (SELECT auth.uid())
        AND id_team.status    = 'ACTIVE')
  );
```

---

## P-SCHEMA-01 — Add `tenant_id` to `crm_member_documents`

**Priority**: Low  
**Effort**: ~1 hr  
**Trigger**: 2 residual `rls_policy_always_true` WARNs on `crm_member_documents` INSERT/DELETE

**Problem**:  
`crm_member_documents` has no `tenant_id` or owner column, so the existing INSERT/DELETE policies remain `WITH CHECK (true)` — broad for authenticated users.

**Fix**:
1. Add `tenant_id UUID REFERENCES id_tenants(id)` column
2. Backfill via join through `member_id` → `crm_leads.tenant_id` or equivalent
3. Replace broad policies with tenant-membership check (same pattern as W2)

**Impact**: Eliminates the last 2 `rls_policy_always_true` WARNs, bringing total WARNs from 5 → 3 (only analytics + auth_leaked_password remain, both intentional).

---

## P-AUTH-01 — Enable Leaked Password Protection (Pro plan only)

**Priority**: Low  
**Effort**: 5 min dashboard click  
**Condition**: Only actionable after upgrade to Supabase Pro

**Steps**:
1. Dashboard → Auth → Providers → Email → Password Security
2. Toggle "Prevent use of leaked passwords" ON
3. Save

**Note**: Zero impact on current auth flows (phone OTP via MSG91). This only affects email+password sign-ins, which are not currently in use.
