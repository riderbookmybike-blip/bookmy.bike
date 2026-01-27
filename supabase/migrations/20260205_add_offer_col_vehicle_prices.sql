-- Add Offer/Surge Column
ALTER TABLE public.vehicle_prices 
ADD COLUMN IF NOT EXISTS offer_amount NUMERIC DEFAULT 0;

-- Update RPC to handle Offer Amount
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
