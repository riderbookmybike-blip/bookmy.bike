-- 1. Create Table
CREATE TABLE IF NOT EXISTS public.vehicle_prices (
    vehicle_color_id UUID NOT NULL,
    state_code TEXT NOT NULL,
    ex_showroom_price NUMERIC NOT NULL,
    offer_amount NUMERIC DEFAULT 0, -- Direct inclusion
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (vehicle_color_id, state_code)
);

-- 2. Enable RLS
ALTER TABLE public.vehicle_prices ENABLE ROW LEVEL SECURITY;

-- 3. Policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'vehicle_prices' AND policyname = 'Allow authenticated read'
    ) THEN
        CREATE POLICY "Allow authenticated read" ON public.vehicle_prices FOR SELECT TO authenticated USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'vehicle_prices' AND policyname = 'Allow service role full access'
    ) THEN
        CREATE POLICY "Allow service role full access" ON public.vehicle_prices FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
END
$$;

-- 4. RPC for Upsert (Bypass RLS)
CREATE OR REPLACE FUNCTION public.upsert_vehicle_prices_bypass(prices JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    item jsonb;
BEGIN
    FOR item IN SELECT * FROM jsonb_array_elements(prices)
    LOOP
        INSERT INTO public.vehicle_prices (
            vehicle_color_id,
            state_code,
            ex_showroom_price,
            offer_amount,
            updated_at
        )
        VALUES (
            (item->>'vehicle_color_id')::UUID,
            item->>'state_code',
            (item->>'ex_showroom_price')::NUMERIC,
            COALESCE((item->>'offer_amount')::NUMERIC, 0),
            NOW()
        )
        ON CONFLICT (vehicle_color_id, state_code)
        DO UPDATE SET
            ex_showroom_price = EXCLUDED.ex_showroom_price,
            offer_amount = EXCLUDED.offer_amount,
            updated_at = NOW();
    END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_vehicle_prices_bypass(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_vehicle_prices_bypass(JSONB) TO service_role;
