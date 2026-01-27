-- Create Dealer Pricing Rules Table
CREATE TABLE IF NOT EXISTS public.id_dealer_pricing_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.id_tenants(id),
    vehicle_color_id UUID NOT NULL,
    state_code TEXT NOT NULL,
    offer_amount NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, vehicle_color_id, state_code)
);

-- RLS
ALTER TABLE public.id_dealer_pricing_rules ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'id_dealer_pricing_rules' AND policyname = 'Allow authenticated read'
    ) THEN
        CREATE POLICY "Allow authenticated read" ON public.id_dealer_pricing_rules FOR SELECT TO authenticated USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'id_dealer_pricing_rules' AND policyname = 'Allow tenant access'
    ) THEN
        CREATE POLICY "Allow tenant access" ON public.id_dealer_pricing_rules FOR ALL TO authenticated USING (
            tenant_id IN (
                SELECT tenant_id FROM public.id_members WHERE id::text = auth.uid()::text OR email = auth.email()
            )
        );
    END IF;
END
$$;

-- RPC for Upserting Dealer Offers
CREATE OR REPLACE FUNCTION public.upsert_dealer_offers(offers JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    item jsonb;
BEGIN
    FOR item IN SELECT * FROM jsonb_array_elements(offers)
    LOOP
        INSERT INTO public.id_dealer_pricing_rules (
            tenant_id,
            vehicle_color_id,
            state_code,
            offer_amount,
            updated_at
        )
        VALUES (
            (item->>'tenant_id')::UUID,
            (item->>'vehicle_color_id')::UUID,
            item->>'state_code',
            COALESCE((item->>'offer_amount')::NUMERIC, 0),
            NOW()
        )
        ON CONFLICT (tenant_id, vehicle_color_id, state_code)
        DO UPDATE SET
            offer_amount = EXCLUDED.offer_amount,
            updated_at = NOW();
    END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_dealer_offers(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_dealer_offers(JSONB) TO service_role;
