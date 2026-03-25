-- Migration: update_get_market_best_offers_bundle_price
-- Description: Extend bundle data with discounted bundle_price (sum of price_base + offer_amount)

DROP FUNCTION IF EXISTS public.get_market_best_offers(text, text);

CREATE OR REPLACE FUNCTION public.get_market_best_offers(p_district_name text, p_state_code text)
 RETURNS TABLE(
    vehicle_color_id uuid, 
    best_offer numeric, 
    dealer_name text, 
    dealer_id uuid, 
    is_serviceable boolean,
    bundle_ids uuid[],
    bundle_value numeric,
    bundle_price numeric
)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    WITH relevant_dealers AS (
        -- 1. Dealers explicitly servicing the district
        SELECT t.id as tenant_id, t.name as tenant_name, true as serviceable
        FROM public.id_tenants t
        JOIN public.id_dealer_service_areas sa ON sa.tenant_id = t.id
        WHERE sa.district ILIKE p_district_name 
        AND sa.is_active = true
        
        UNION
        
        -- 2. Dealers physically located in the district (Implicit Coverage)
        SELECT t.id as tenant_id, t.name as tenant_name, true as serviceable
        FROM public.id_tenants t
        JOIN public.id_locations l ON l.tenant_id = t.id
        WHERE l.district ILIKE p_district_name
        AND l.is_active = true
    ),
    fallback_dealers AS (
        -- 3. If no relevant dealers, find anyone in the state (Fallback)
        SELECT t.id as tenant_id, t.name as tenant_name, false as serviceable
        FROM public.id_tenants t
        JOIN public.id_locations l ON l.tenant_id = t.id
        WHERE l.state ILIKE p_state_code 
        AND NOT EXISTS (SELECT 1 FROM relevant_dealers) 
        LIMIT 5 
    ),
    all_candidates AS (
        SELECT * FROM relevant_dealers
        UNION ALL
        SELECT * FROM fallback_dealers
    ),
    dealer_bundles AS (
        -- Pre-calculate bundles for all candidate dealers
        SELECT 
            r.tenant_id,
            array_agg(r.vehicle_color_id) as bundle_ids,
            COALESCE(SUM(i.price_base), 0) as total_bundle_value,
            COALESCE(SUM(i.price_base + COALESCE(r.offer_amount, 0)), 0) as total_bundle_price
        FROM public.id_dealer_pricing_rules r
        JOIN public.cat_items i ON i.id = r.vehicle_color_id
        WHERE r.tenant_id IN (SELECT tenant_id FROM all_candidates)
        AND r.state_code = p_state_code
        AND r.inclusion_type = 'BUNDLE'
        AND r.is_active = true
        GROUP BY r.tenant_id
    ),
    ranked_offers AS (
        SELECT 
            r.vehicle_color_id,
            r.offer_amount,
            c.tenant_name,
            c.tenant_id,
            c.serviceable,
            COALESCE(b.bundle_ids, ARRAY[]::uuid[]) as bundle_ids,
            COALESCE(b.total_bundle_value, 0) as bundle_value,
            COALESCE(b.total_bundle_price, 0) as bundle_price,
            ROW_NUMBER() OVER (
                PARTITION BY r.vehicle_color_id 
                ORDER BY r.offer_amount ASC 
            ) as rank
        FROM public.id_dealer_pricing_rules r
        JOIN all_candidates c ON r.tenant_id = c.tenant_id
        LEFT JOIN dealer_bundles b ON b.tenant_id = c.tenant_id
        WHERE r.state_code = p_state_code 
    )
    SELECT 
        ro.vehicle_color_id,
        ro.offer_amount as best_offer,
        ro.tenant_name as dealer_name,
        ro.tenant_id as dealer_id,
        ro.serviceable as is_serviceable,
        ro.bundle_ids,
        ro.bundle_value,
        ro.bundle_price
    FROM ranked_offers ro
    WHERE ro.rank = 1;
END;
$function$;
