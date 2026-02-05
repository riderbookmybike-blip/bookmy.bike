-- Migration: 20260206_fix_get_dealer_offers_rpc
-- Description: Fix the get_dealer_offers RPC to use correct column names

-- First, check if vehicle_color_id exists
-- The column should exist, but the old RPC version in production might be referencing wrong alias

DROP FUNCTION IF EXISTS public.get_dealer_offers(uuid, text);

CREATE OR REPLACE FUNCTION public.get_dealer_offers(p_tenant_id uuid, p_state_code text)
 RETURNS TABLE(
    vehicle_color_id uuid,
    best_offer numeric,
    dealer_name text,
    dealer_id uuid,
    studio_id text,
    district text,
    is_serviceable boolean,
    bundle_ids uuid[],
    bundle_value numeric,
    bundle_price numeric
)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_studio_id TEXT;
    v_dealer_name TEXT;
    v_district TEXT;
BEGIN
    -- Get dealer info
    SELECT t.studio_id, t.name, COALESCE(l.district, d.name)
    INTO v_studio_id, v_dealer_name, v_district
    FROM public.id_tenants t
    LEFT JOIN public.id_locations l ON l.tenant_id = t.id AND l.is_active = true
    LEFT JOIN public.loc_districts d ON t.district_id = d.id
    WHERE t.id = p_tenant_id
    LIMIT 1;

    RETURN QUERY
    WITH dealer_bundles AS (
        SELECT
            dpr.tenant_id,
            array_agg(dpr.vehicle_color_id) as bundle_ids,
            COALESCE(SUM(i.price_base), 0) as total_bundle_value,
            COALESCE(SUM(i.price_base + COALESCE(dpr.offer_amount, 0)), 0) as total_bundle_price
        FROM public.id_dealer_pricing_rules dpr
        JOIN public.cat_items i ON i.id = dpr.vehicle_color_id
        WHERE dpr.tenant_id = p_tenant_id
        AND dpr.state_code = p_state_code
        AND dpr.inclusion_type = 'BUNDLE'
        AND dpr.is_active = true
        GROUP BY dpr.tenant_id
    )
    SELECT
        dpr.vehicle_color_id,
        dpr.offer_amount as best_offer,
        v_dealer_name as dealer_name,
        p_tenant_id as dealer_id,
        v_studio_id as studio_id,
        v_district as district,
        true as is_serviceable,
        COALESCE(b.bundle_ids, ARRAY[]::uuid[]) as bundle_ids,
        COALESCE(b.total_bundle_value, 0) as bundle_value,
        COALESCE(b.total_bundle_price, 0) as bundle_price
    FROM public.id_dealer_pricing_rules dpr
    LEFT JOIN dealer_bundles b ON b.tenant_id = dpr.tenant_id
    WHERE dpr.tenant_id = p_tenant_id
    AND dpr.state_code = p_state_code
    AND dpr.is_active = true
    AND (dpr.inclusion_type IS NULL OR dpr.inclusion_type != 'BUNDLE');
END;
$function$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_dealer_offers(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dealer_offers(uuid, text) TO anon;
