-- Migration: Create Quotes Table and Add Count to Members (legacy-safe)

CREATE TABLE IF NOT EXISTS public.crm_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  lead_id UUID,
  version INTEGER DEFAULT 1,
  parent_quote_id UUID REFERENCES public.crm_quotes(id),
  is_latest BOOLEAN DEFAULT true,
  variant_id UUID,
  color_id UUID,
  commercials JSONB DEFAULT '{
    "base_price": 0,
    "road_tax": 0,
    "insurance": 0,
    "registration": 0,
    "accessories": [],
    "grand_total": 0
  }'::jsonb,
  status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SENT', 'ACCEPTED', 'EXPIRED', 'REJECTED')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

ALTER TABLE public.crm_quotes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin Full Access Quotes" ON public.crm_quotes;
CREATE POLICY "Admin Full Access Quotes"
  ON public.crm_quotes FOR ALL USING (auth.role() = 'authenticated');

DO $$
BEGIN
  IF to_regclass('public.id_members') IS NOT NULL THEN
    ALTER TABLE public.id_members
      ADD COLUMN IF NOT EXISTS quotes_count INTEGER DEFAULT 0;
    CREATE INDEX IF NOT EXISTS idx_members_quotes_count ON public.id_members(quotes_count);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.sync_member_stats()
RETURNS TRIGGER AS $$
BEGIN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_sync_member_quotes ON public.crm_quotes;
CREATE TRIGGER tr_sync_member_quotes
AFTER INSERT OR UPDATE OR DELETE ON public.crm_quotes
FOR EACH ROW EXECUTE FUNCTION public.sync_member_stats();
