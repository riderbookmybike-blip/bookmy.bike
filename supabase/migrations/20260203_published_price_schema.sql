-- Published Price Architecture: Schema Migration
-- Phase 1: Add columns to cat_prices + create history table

-- ============================================
-- 1. EXTEND cat_prices TABLE (nullable first)
-- ============================================

ALTER TABLE public.cat_prices 
  ADD COLUMN IF NOT EXISTS rto_total NUMERIC,
  ADD COLUMN IF NOT EXISTS insurance_total NUMERIC,
  ADD COLUMN IF NOT EXISTS on_road_price NUMERIC,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS published_by UUID REFERENCES auth.users(id);

-- ============================================
-- 2. CREATE PRICE HISTORY TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.cat_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_color_id UUID NOT NULL REFERENCES public.cat_items(id) ON DELETE CASCADE,
  state_code TEXT NOT NULL,
  old_on_road NUMERIC,
  new_on_road NUMERIC NOT NULL,
  delta NUMERIC NOT NULL DEFAULT 0,
  publish_job_id UUID NOT NULL,
  published_by UUID REFERENCES auth.users(id),
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Prevent duplicate entries for same publish job
  UNIQUE(vehicle_color_id, state_code, publish_job_id)
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_price_history_sku_state 
  ON public.cat_price_history(vehicle_color_id, state_code, published_at DESC);

-- ============================================
-- 3. EXTEND id_dealer_pricing_rules
-- ============================================

ALTER TABLE public.id_dealer_pricing_rules 
  ADD COLUMN IF NOT EXISTS auto_adjusted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS auto_adjusted_delta NUMERIC,
  ADD COLUMN IF NOT EXISTS last_publish_job_id UUID;

-- ============================================
-- 4. RLS FOR PRICE HISTORY
-- ============================================

ALTER TABLE public.cat_price_history ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read price history
DROP POLICY IF EXISTS "Allow authenticated read price history" ON public.cat_price_history;
CREATE POLICY "Allow authenticated read price history" 
  ON public.cat_price_history FOR SELECT TO authenticated USING (true);

-- Only service_role can insert (via server action)
DROP POLICY IF EXISTS "Allow service role insert price history" ON public.cat_price_history;
CREATE POLICY "Allow service role insert price history" 
  ON public.cat_price_history FOR INSERT TO service_role WITH CHECK (true);

-- ============================================
-- 5. NOTIFICATIONS TABLE (for price change alerts)
-- ============================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.id_tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'INFO',
  metadata JSONB DEFAULT '{}'::JSONB,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient reads per tenant
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_unread 
  ON public.notifications(tenant_id, is_read, created_at DESC);

-- RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenants can read own notifications" ON public.notifications;
CREATE POLICY "Tenants can read own notifications" 
  ON public.notifications FOR SELECT TO authenticated 
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.id_team 
      WHERE user_id = auth.uid() AND status = 'ACTIVE'
    )
  );

DROP POLICY IF EXISTS "Tenants can update own notifications" ON public.notifications;
CREATE POLICY "Tenants can update own notifications" 
  ON public.notifications FOR UPDATE TO authenticated 
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.id_team 
      WHERE user_id = auth.uid() AND status = 'ACTIVE'
    )
  );

-- Service role can insert
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;
CREATE POLICY "Service role can insert notifications" 
  ON public.notifications FOR INSERT TO service_role WITH CHECK (true);

-- ============================================
-- 6. COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON COLUMN public.cat_prices.rto_total IS 'Pre-calculated RTO total, published by AUMS';
COMMENT ON COLUMN public.cat_prices.insurance_total IS 'Pre-calculated Insurance total, published by AUMS';
COMMENT ON COLUMN public.cat_prices.on_road_price IS 'Final on-road = ex_showroom + rto_total + insurance_total';
COMMENT ON COLUMN public.cat_prices.published_at IS 'When AUMS last published this price';
COMMENT ON COLUMN public.cat_prices.published_by IS 'Which AUMS user published this price';

COMMENT ON TABLE public.cat_price_history IS 'Audit log of all price changes for dealer auto-adjustment';
COMMENT ON TABLE public.notifications IS 'In-app notifications for price changes and other alerts';
