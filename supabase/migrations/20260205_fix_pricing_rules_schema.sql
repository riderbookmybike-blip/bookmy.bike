-- Add vehicle_color_id and offer_amount to id_dealer_pricing_rules
-- This fixes the mismatch with get_market_best_offers RPC

DO $$
BEGIN
    -- Add vehicle_color_id if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'id_dealer_pricing_rules' AND column_name = 'vehicle_color_id') THEN
        ALTER TABLE public.id_dealer_pricing_rules ADD COLUMN vehicle_color_id UUID;
    END IF;

    -- Add offer_amount if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'id_dealer_pricing_rules' AND column_name = 'offer_amount') THEN
        ALTER TABLE public.id_dealer_pricing_rules ADD COLUMN offer_amount NUMERIC DEFAULT 0;
    END IF;

    -- Optional: If delta_amount exists, copy to offer_amount
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'id_dealer_pricing_rules' AND column_name = 'delta_amount') THEN
        UPDATE public.id_dealer_pricing_rules 
        SET offer_amount = delta_amount 
        WHERE offer_amount = 0 AND delta_amount IS NOT NULL;
    END IF;

    -- Ensure RLS is enabled
    ALTER TABLE public.id_dealer_pricing_rules ENABLE ROW LEVEL SECURITY;

END $$;

-- Re-create the policies if needed (or ensure they exist)
-- Assuming policies exist or we rely on tenant isolation logic in app?
-- Usually we need policies for SELECT/INSERT/UPDATE based on tenant_id

DROP POLICY IF EXISTS "Dealers can view own rules" ON public.id_dealer_pricing_rules;
CREATE POLICY "Dealers can view own rules" ON public.id_dealer_pricing_rules
    FOR SELECT
    USING ( (select auth.jwt() ->> 'tenant_id')::uuid = tenant_id );

DROP POLICY IF EXISTS "Dealers can manage own rules" ON public.id_dealer_pricing_rules;
CREATE POLICY "Dealers can manage own rules" ON public.id_dealer_pricing_rules
    FOR ALL
    USING ( (select auth.jwt() ->> 'tenant_id')::uuid = tenant_id );

-- Allow public access for marketplace (get_market_best_offers is SECURITY DEFINER so this might not be needed for RPC, but good for direct queries if any)
-- Actually, marketplace users are authenticated as 'authenticated' or 'anon'.
-- But getting offers is done via RPC which is SECURITY DEFINER, so it bypasses RLS.
-- So we strictly lock down table access to the Tenant.
