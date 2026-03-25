-- ==========================================================================
-- Migration: CRM Finance Operational Fields
-- Date: 2026-02-13
-- ==========================================================================

ALTER TABLE public.crm_finance
    ADD COLUMN IF NOT EXISTS agreement_signed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS enach_done_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS insurance_requested_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS onboarding_initiated_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS disbursement_initiated_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS disbursement_completed_at TIMESTAMPTZ;
