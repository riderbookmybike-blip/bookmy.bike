-- Admin pricing write path: upsert cat_prices for state-level (district = 'ALL')

CREATE OR REPLACE FUNCTION public.upsert_cat_prices_bypass(prices JSONB)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    price JSONB;
    v_district TEXT;
BEGIN
    FOR price IN SELECT * FROM jsonb_array_elements(prices)
    LOOP
        v_district := COALESCE(NULLIF(price->>'district', ''), 'ALL');

        INSERT INTO public.cat_prices (
            vehicle_color_id,
            state_code,
            district,
            ex_showroom_price,
            is_active,
            updated_at
        ) VALUES (
            (price->>'vehicle_color_id')::UUID,
            price->>'state_code',
            v_district,
            (price->>'ex_showroom_price')::NUMERIC,
            COALESCE((price->>'is_active')::BOOLEAN, TRUE),
            COALESCE((price->>'updated_at')::TIMESTAMPTZ, NOW())
        )
        ON CONFLICT (vehicle_color_id, state_code, district)
        DO UPDATE SET
            ex_showroom_price = EXCLUDED.ex_showroom_price,
            is_active = EXCLUDED.is_active,
            updated_at = EXCLUDED.updated_at;
    END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_cat_prices_bypass(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_cat_prices_bypass(JSONB) TO service_role;
