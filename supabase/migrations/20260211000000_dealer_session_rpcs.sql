-- Migration: 20260211_dealer_session_rpcs
-- Description: Expand RPCs with studio_id and district_name for Dealer Session Lock feature

-- 1. Update get_user_memberships to include studio_id and district_name
CREATE OR REPLACE FUNCTION public.get_user_memberships(p_user_id UUID)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_agg(sub) INTO result
    FROM (
        SELECT 
            m.id,
            m.role::TEXT,
            m.status::TEXT,
            m.tenant_id,
            m.user_id,
            t.name::TEXT as tenant_name,
            t.slug::TEXT as tenant_slug,
            t.type::TEXT as tenant_type,
            t.config as tenant_config,
            t.studio_id::TEXT as studio_id,
            d.name::TEXT as district_name
        FROM 
            public.id_team m
        LEFT JOIN 
            public.id_tenants t ON m.tenant_id = t.id
        LEFT JOIN
            public.loc_districts d ON t.district_id = d.id
        WHERE 
            m.user_id = p_user_id
    ) sub;
    
    RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- 2. Update get_market_best_offers to include studio_id separately
DROP FUNCTION IF EXISTS public.get_market_best_offers(text, text);

CREATE OR REPLACE FUNCTION public.get_market_best_offers(p_district_name text, p_state_code text)
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
BEGIN
    RETURN QUERY
    WITH relevant_dealers AS (
        -- 1. Dealers explicitly servicing the district
        SELECT t.id as tenant_id, t.name::TEXT as tenant_name, t.studio_id::TEXT as tenant_studio_id, sa.district::TEXT as served_district, true as serviceable
        FROM public.id_tenants t
        JOIN public.id_dealer_service_areas sa ON sa.tenant_id = t.id
        WHERE sa.district ILIKE p_district_name
        AND sa.is_active = true

        UNION

        -- 2. Dealers physically located in the district (Implicit Coverage)
        SELECT t.id as tenant_id, t.name::TEXT as tenant_name, t.studio_id::TEXT as tenant_studio_id, l.district::TEXT as served_district, true as serviceable
        FROM public.id_tenants t
        JOIN public.id_locations l ON l.tenant_id = t.id
        WHERE l.district ILIKE p_district_name
        AND l.is_active = true
    ),
    fallback_dealers AS (
        -- 3. If no relevant dealers, find anyone in the state (Fallback)
        SELECT t.id as tenant_id, t.name::TEXT as tenant_name, t.studio_id::TEXT as tenant_studio_id, l.district::TEXT as served_district, false as serviceable
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
            c.tenant_studio_id,
            c.served_district,
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
        ro.tenant_studio_id as studio_id,
        ro.served_district as district,
        ro.serviceable as is_serviceable,
        ro.bundle_ids,
        ro.bundle_value,
        ro.bundle_price
    FROM ranked_offers ro
    WHERE ro.rank = 1;
END;
$function$;

-- 3. Update get_dealer_offers to include studio_id
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
            r.tenant_id,
            array_agg(r.vehicle_color_id) as bundle_ids,
            COALESCE(SUM(i.price_base), 0) as total_bundle_value,
            COALESCE(SUM(i.price_base + COALESCE(r.offer_amount, 0)), 0) as total_bundle_price
        FROM public.id_dealer_pricing_rules r
        JOIN public.cat_items i ON i.id = r.vehicle_color_id
        WHERE r.tenant_id = p_tenant_id
        AND r.state_code = p_state_code
        AND r.inclusion_type = 'BUNDLE'
        AND r.is_active = true
        GROUP BY r.tenant_id
    )
    SELECT
        r.vehicle_color_id,
        r.offer_amount as best_offer,
        v_dealer_name as dealer_name,
        p_tenant_id as dealer_id,
        v_studio_id as studio_id,
        v_district as district,
        true as is_serviceable,
        COALESCE(b.bundle_ids, ARRAY[]::uuid[]) as bundle_ids,
        COALESCE(b.total_bundle_value, 0) as bundle_value,
        COALESCE(b.total_bundle_price, 0) as bundle_price
    FROM public.id_dealer_pricing_rules r
    LEFT JOIN dealer_bundles b ON b.tenant_id = r.tenant_id
    WHERE r.tenant_id = p_tenant_id
    AND r.state_code = p_state_code
    AND r.is_active = true
    AND (r.inclusion_type IS NULL OR r.inclusion_type != 'BUNDLE');
END;
$function$;
