-- Batch pricing RPC for catalog to avoid client-side calculations

CREATE OR REPLACE FUNCTION public.get_catalog_prices_v1(
    p_vehicle_color_ids UUID[],
    p_district_name TEXT DEFAULT NULL,
    p_state_code TEXT DEFAULT NULL,
    p_registration_type TEXT DEFAULT 'STATE'
)
RETURNS TABLE (
    vehicle_color_id UUID,
    pricing JSONB
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_id UUID;
    v_pricing JSONB;
BEGIN
    FOREACH v_id IN ARRAY p_vehicle_color_ids
    LOOP
        v_pricing := public.get_variant_on_road_price_v1(
            p_vehicle_color_id => v_id,
            p_district_name => p_district_name,
            p_state_code => p_state_code,
            p_registration_type => p_registration_type
        );

        IF v_pricing IS NOT NULL THEN
            vehicle_color_id := v_id;
            pricing := v_pricing;
            RETURN NEXT;
        END IF;
    END LOOP;

    RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_catalog_prices_v1(UUID[], TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_catalog_prices_v1(UUID[], TEXT, TEXT, TEXT) TO service_role;
