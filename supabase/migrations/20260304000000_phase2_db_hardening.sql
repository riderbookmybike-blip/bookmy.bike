-- Migration: Phase 2 Database Hardening
-- Description: Apply missing indexes for performance and cleanup redundant indexes.

-- 0. Schema Alignment
-- Standardize id_members to include columns used in members.ts
ALTER TABLE public.id_members 
    ADD COLUMN IF NOT EXISTS last_visit_at timestamptz;

-- 1. Add missing indexes for foreign keys (Latency Reduction)
CREATE INDEX IF NOT EXISTS idx_id_documents_uploaded_by 
    ON public.id_documents(uploaded_by);

CREATE INDEX IF NOT EXISTS idx_id_locations_tenant 
    ON public.id_locations(tenant_id);

CREATE INDEX IF NOT EXISTS idx_id_locations_manager 
    ON public.id_locations(manager_id);

CREATE INDEX IF NOT EXISTS idx_id_bank_accounts_tenant 
    ON public.id_bank_accounts(tenant_id);

CREATE INDEX IF NOT EXISTS idx_id_operating_hours_tenant 
    ON public.id_operating_hours(tenant_id);

-- 2. Performance: Non-unique lookup indexes
CREATE INDEX IF NOT EXISTS idx_id_members_last_visit
    ON public.id_members(last_visit_at DESC);

-- 3. Cleanup: Redundant Indexes
DROP INDEX IF EXISTS public.idx_leads_display_id;
DROP INDEX IF EXISTS public.idx_crm_leads_display_id;
