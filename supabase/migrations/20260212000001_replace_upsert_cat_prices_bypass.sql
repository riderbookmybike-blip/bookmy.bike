CREATE OR REPLACE FUNCTION public.upsert_cat_price_state_bypass(prices JSONB)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.cat_price_state (
        id,
        vehicle_color_id,
        state_code,
        district,
        ex_showroom_price,
        rto_total,
        insurance_total,
        on_road_price,
        published_at,
        published_by,
        publish_stage,
        is_active,
        updated_at
    )
    SELECT
        (p->>'id')::uuid,
        (p->>'vehicle_color_id')::uuid,
        p->>'state_code',
        p->>'district',
        (p->>'ex_showroom_price')::numeric,
        (p->>'rto_total')::numeric,
        (p->>'insurance_total')::numeric,
        (p->>'on_road_price')::numeric,
        (p->>'published_at')::timestamptz,
        (p->>'published_by')::uuid,
        p->>'publish_stage',
        (p->>'is_active')::boolean,
        now()
    FROM jsonb_array_elements(prices) AS p
    ON CONFLICT (id) DO UPDATE SET
        ex_showroom_price = EXCLUDED.ex_showroom_price,
        rto_total = EXCLUDED.rto_total,
        insurance_total = EXCLUDED.insurance_total,
        on_road_price = EXCLUDED.on_road_price,
        published_at = EXCLUDED.published_at,
        published_by = EXCLUDED.published_by,
        publish_stage = EXCLUDED.publish_stage,
        is_active = EXCLUDED.is_active,
        updated_at = now();
END;
$$;

DROP FUNCTION IF EXISTS public.upsert_cat_prices_bypass(JSONB);

GRANT EXECUTE ON FUNCTION public.upsert_cat_price_state_bypass(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_cat_price_state_bypass(JSONB) TO service_role;
