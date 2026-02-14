-- ==========================================================================
-- Migration: CRM Receipts (customer money in)
-- Date: 2026-02-13
-- ==========================================================================

CREATE TABLE IF NOT EXISTS public.crm_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.crm_bookings(id),
    lead_id UUID REFERENCES public.crm_leads(id),
    member_id UUID REFERENCES public.id_members(id),
    tenant_id UUID REFERENCES public.id_tenants(id),
    amount NUMERIC,
    currency TEXT,
    method TEXT,
    status TEXT,
    transaction_id TEXT,
    provider_data JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    display_id VARCHAR,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID,
    is_reconciled BOOLEAN NOT NULL DEFAULT false,
    reconciled_at TIMESTAMPTZ,
    reconciled_by UUID,
    CONSTRAINT crm_receipts_transaction_id_key UNIQUE (transaction_id),
    CONSTRAINT crm_receipts_display_id_key UNIQUE (display_id)
);

-- Display ID trigger (reuse existing)
DROP TRIGGER IF EXISTS trigger_generate_display_id ON crm_receipts;
CREATE TRIGGER trigger_generate_display_id
    BEFORE INSERT ON crm_receipts
    FOR EACH ROW EXECUTE FUNCTION public.auto_generate_display_id();

-- Audit trigger
DROP TRIGGER IF EXISTS trg_audit_crm_receipts ON crm_receipts;
CREATE TRIGGER trg_audit_crm_receipts
  AFTER INSERT OR UPDATE OR DELETE ON crm_receipts
  FOR EACH ROW EXECUTE FUNCTION fn_crm_audit_trigger();

-- RLS (mirror crm_payments)
ALTER TABLE public.crm_receipts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "CRM Receipts tenant access" ON public.crm_receipts;
CREATE POLICY "CRM Receipts tenant access" ON public.crm_receipts
  USING (
    public.check_is_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.id_team t
      WHERE t.user_id = auth.uid()
        AND t.tenant_id = crm_receipts.tenant_id
        AND t.status = 'ACTIVE'
    )
  )
  WITH CHECK (
    public.check_is_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.id_team t
      WHERE t.user_id = auth.uid()
        AND t.tenant_id = crm_receipts.tenant_id
        AND t.status = 'ACTIVE'
    )
  );

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_crm_receipts_booking_id ON public.crm_receipts (booking_id);
CREATE INDEX IF NOT EXISTS idx_crm_receipts_lead_id ON public.crm_receipts (lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_receipts_member_id ON public.crm_receipts (member_id);
CREATE INDEX IF NOT EXISTS idx_crm_receipts_tenant_id ON public.crm_receipts (tenant_id);

-- Backfill existing crm_payments as receipts (idempotent)
INSERT INTO public.crm_receipts (
    id,
    booking_id,
    lead_id,
    member_id,
    tenant_id,
    amount,
    currency,
    method,
    status,
    transaction_id,
    provider_data,
    created_at,
    updated_at,
    display_id,
    is_deleted,
    deleted_at,
    deleted_by
)
SELECT
    p.id,
    p.booking_id,
    p.lead_id,
    p.member_id,
    p.tenant_id,
    p.amount,
    p.currency,
    p.method,
    p.status,
    p.transaction_id,
    p.provider_data,
    p.created_at,
    p.updated_at,
    p.display_id,
    p.is_deleted,
    p.deleted_at,
    p.deleted_by
FROM public.crm_payments p
WHERE NOT EXISTS (
    SELECT 1 FROM public.crm_receipts r WHERE r.id = p.id
);
