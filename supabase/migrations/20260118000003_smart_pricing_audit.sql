-- Migration for Smart Pricing Persistence & Audit Logs
-- Description: Adds a ledger to track all regional price adjustments and manual overrides.

CREATE TABLE IF NOT EXISTS public.catalog_price_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    catalog_item_id UUID REFERENCES public.catalog_items(id) ON DELETE CASCADE, -- The SKU
    state_code TEXT NOT NULL,
    previous_price NUMERIC,
    new_price NUMERIC NOT NULL,
    base_price_at_time NUMERIC, -- The reference price (e.g., Mumbai) when this was calculated
    rule_applied JSONB, -- The rule metadata (e.g., { "type": "PERCENTAGE", "value": 10 })
    is_manual_override BOOLEAN DEFAULT false,
    updated_by UUID, -- Link to profiles.id / auth.users.id
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for high-performance lookup of SKU price history
CREATE INDEX IF NOT EXISTS idx_catalog_price_logs_item ON public.catalog_price_logs(catalog_item_id);
CREATE INDEX IF NOT EXISTS idx_catalog_price_logs_state ON public.catalog_price_logs(state_code);

-- Enable RLS for granular security
ALTER TABLE public.catalog_price_logs ENABLE ROW LEVEL SECURITY;

-- Policies: Everyone can read logs (Audit transparency)
CREATE POLICY "Public Read Price Logs" ON public.catalog_price_logs 
FOR SELECT USING (true);

-- Policies: Only authenticated users (Admins) can append logs
CREATE POLICY "Admin Full Access Price Logs" ON public.catalog_price_logs 
FOR ALL USING (auth.role() = 'authenticated');

-- Commentary
COMMENT ON TABLE public.catalog_price_logs IS 'Audit trail for multi-state pricing adjustments generated via Product Studio.';
