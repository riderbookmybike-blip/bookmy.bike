-- Create Service Areas Table
CREATE TABLE IF NOT EXISTS public.id_dealer_service_areas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.id_tenants(id),
    district TEXT NOT NULL,
    state_code TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, district)
);

-- RLS
ALTER TABLE public.id_dealer_service_areas ENABLE ROW LEVEL SECURITY;

-- Helper for RLS (Idempotent)
CREATE OR REPLACE FUNCTION public.check_is_tenant_owner_for_pricing(p_user_id UUID, p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check id_team first (if it exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'id_team') THEN
        RETURN EXISTS (
            SELECT 1 FROM public.id_team 
            WHERE user_id = p_user_id 
            AND tenant_id = p_tenant_id
            AND role IN ('OWNER', 'ADMIN', 'SUPER_ADMIN')
            AND status = 'ACTIVE'
        );
    END IF;

    -- Fallback to id_members if id_team is missing (Legacy support)
    RETURN EXISTS (
        SELECT 1 FROM public.id_members 
        WHERE (id = p_user_id OR email = (select email from auth.users where id = p_user_id))
        AND tenant_id = p_tenant_id
    );
END;
$$;

DROP POLICY IF EXISTS "Allow authenticated read service areas" ON public.id_dealer_service_areas;
CREATE POLICY "Allow authenticated read service areas" 
ON public.id_dealer_service_areas FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow tenant modification of service areas" ON public.id_dealer_service_areas;
CREATE POLICY "Allow tenant modification of service areas" 
ON public.id_dealer_service_areas FOR ALL TO authenticated USING (
    public.check_is_tenant_owner_for_pricing(auth.uid(), tenant_id)
)
WITH CHECK (
    public.check_is_tenant_owner_for_pricing(auth.uid(), tenant_id)
);

-- RPC to get Market Best Offers
CREATE OR REPLACE FUNCTION public.get_market_best_offers(
    p_district_name TEXT,
    p_state_code TEXT
)
RETURNS TABLE (
    vehicle_color_id UUID,
    best_offer NUMERIC,
    dealer_name TEXT,
    dealer_id UUID,
    is_serviceable BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
        -- Identify location by checking id_locations (if populated) or id_tenants meta
        -- For now, we assume id_locations is the source of truth for physical presence
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
        WHERE l.state ILIKE p_state_code -- Or restrict by state code if we have it distinct
        AND NOT EXISTS (SELECT 1 FROM relevant_dealers) -- Only if no primary dealers found
        LIMIT 5 -- Limit fallback to avoid noise
    ),
    all_candidates AS (
        SELECT * FROM relevant_dealers
        UNION ALL
        SELECT * FROM fallback_dealers
    ),
    ranked_offers AS (
        SELECT 
            r.vehicle_color_id,
            r.offer_amount,
            c.tenant_name,
            c.tenant_id,
            c.serviceable,
            ROW_NUMBER() OVER (
                PARTITION BY r.vehicle_color_id 
                ORDER BY r.offer_amount ASC -- Lower is better (more negative = more discount). 
                -- Wait. A "Surge" is positive, "Discount" is negative typically in systems?
                -- User said "sabe kam ho wo dikha do" (show lowest).
                -- If offer is -5000, and another is -2000. Price - 5000 is lower.
                -- So we want the MINIMUM algebraic value of offer_amount.
            ) as rank
        FROM public.id_dealer_pricing_rules r
        JOIN all_candidates c ON r.tenant_id = c.tenant_id
        WHERE r.state_code = p_state_code -- Rules are state bound usually
    )
    SELECT 
        ro.vehicle_color_id,
        ro.offer_amount as best_offer,
        ro.tenant_name as dealer_name,
        ro.tenant_id as dealer_id,
        ro.serviceable as is_serviceable
    FROM ranked_offers ro
    WHERE ro.rank = 1;
END;
$$;
