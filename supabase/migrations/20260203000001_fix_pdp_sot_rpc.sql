-- Fix get_variant_on_road_price_v1 to prioritize published values from cat_prices
-- This ensures the Marketplace PDP reflects the data from the AUMS Pricing Ledger (Published SOT)

CREATE OR REPLACE FUNCTION public.get_variant_on_road_price_v1(
    p_vehicle_color_id UUID,
    p_district_name TEXT DEFAULT NULL,
    p_state_code TEXT DEFAULT NULL,
    p_registration_type TEXT DEFAULT 'STATE'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_ex_showroom NUMERIC := 0;
    v_rto_total NUMERIC := 0;
    v_insurance_total NUMERIC := 0;
    v_dealer_offer NUMERIC := 0;
    v_dealer_id UUID := NULL;
    v_dealer_name TEXT := NULL;
    v_is_serviceable BOOLEAN := true;
    v_engine_cc NUMERIC := 110; -- Default fallback
    v_fuel_type TEXT := 'PETROL';
    v_brand_id UUID;
    v_idv NUMERIC := 0;
    v_rto_breakdown JSONB := '[]'::JSONB;
    v_insurance_breakdown JSONB := '[]'::JSONB;
    v_result JSONB;
    v_sku RECORD;
    v_variant RECORD;
    v_family RECORD;
    v_price RECORD;
    v_state_code TEXT;
BEGIN
    -- Use provided state_code or default to MH
    v_state_code := COALESCE(p_state_code, 'MH');
    
    -- 1. Get SKU details with hierarchical spec lookup (for fallback calculation if needed)
    SELECT * INTO v_sku FROM public.cat_items WHERE id = p_vehicle_color_id AND type = 'SKU';
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'SKU not found');
    END IF;
    
    -- 2. Check for Published Price in cat_prices (Single Source of Truth)
    SELECT * INTO v_price FROM public.cat_prices 
    WHERE vehicle_color_id = p_vehicle_color_id 
    AND state_code = v_state_code 
    AND is_active = true
    AND (district = p_district_name OR district = 'ALL' OR district IS NULL)
    ORDER BY (CASE WHEN district = p_district_name THEN 0 WHEN district = 'ALL' THEN 1 ELSE 2 END)
    LIMIT 1;

    -- If a PUBLISHED record exists with actual calculated values, use them!
    IF v_price IS NOT NULL AND v_price.rto_total > 0 THEN
        v_ex_showroom := v_price.ex_showroom_price;
        v_rto_total := v_price.rto_total;
        v_insurance_total := v_price.insurance_total;
        v_rto_breakdown := COALESCE(v_price.rto_breakdown, '[]'::JSONB);
        v_insurance_breakdown := COALESCE(v_price.insurance_breakdown, '[]'::JSONB);
        
        -- Derive engine_cc and other metadata from specs if needed for the response
        SELECT * INTO v_variant FROM public.cat_items WHERE id = v_sku.parent_id AND type = 'VARIANT';
        IF v_variant IS NOT NULL THEN
            SELECT * INTO v_family FROM public.cat_items WHERE id = v_variant.parent_id AND type = 'FAMILY';
        END IF;
        
        v_engine_cc := COALESCE(
            (v_sku.specs->>'engine_cc')::NUMERIC,
            (v_variant.specs->>'engine_cc')::NUMERIC,
            (v_family.specs->>'engine_cc')::NUMERIC,
            110
        );
        v_fuel_type := COALESCE(
            v_sku.specs->>'fuel_type',
            v_variant.specs->>'fuel_type',
            v_family.specs->>'fuel_type',
            'PETROL'
        );
        v_idv := ROUND(v_ex_showroom * 0.95);
    ELSE
        -- 3. FALLBACK: Record doesn't exist or isn't fully published yet. Calculate on the fly.
        -- (This is the "old" logic we want to eventually phase out)
        
        -- Get variant/family if not already loaded
        IF v_variant IS NULL THEN
            SELECT * INTO v_variant FROM public.cat_items WHERE id = v_sku.parent_id AND type = 'VARIANT';
        END IF;
        IF v_family IS NULL AND v_variant IS NOT NULL THEN
            SELECT * INTO v_family FROM public.cat_items WHERE id = v_variant.parent_id AND type = 'FAMILY';
            v_brand_id := v_family.parent_id;
        END IF;
        
        v_engine_cc := COALESCE(
            (v_sku.specs->>'engine_cc')::NUMERIC,
            (v_variant.specs->>'engine_cc')::NUMERIC,
            (v_family.specs->>'engine_cc')::NUMERIC,
            110
        );
        v_fuel_type := COALESCE(
            v_sku.specs->>'fuel_type',
            v_variant.specs->>'fuel_type',
            v_family.specs->>'fuel_type',
            'PETROL'
        );
        
        IF v_price IS NOT NULL THEN
            v_ex_showroom := COALESCE(v_price.ex_showroom_price, 0);
        ELSE
            v_ex_showroom := COALESCE(v_sku.price_base, 0);
        END IF;
        
        v_idv := ROUND(v_ex_showroom * 0.95);
        
        -- RTO Calculation (Fallback)
        SELECT 
            COALESCE(SUM(
                CASE 
                    WHEN r.calc_type = 'PERCENTAGE' THEN ROUND(v_ex_showroom * r.value / 100)
                    WHEN r.calc_type = 'FIXED' THEN r.value
                    ELSE 0
                END
            ), 0),
            jsonb_agg(jsonb_build_object(
                'label', r.name,
                'amount', CASE 
                    WHEN r.calc_type = 'PERCENTAGE' THEN ROUND(v_ex_showroom * r.value / 100)
                    WHEN r.calc_type = 'FIXED' THEN r.value
                    ELSE 0
                END
            ))
        INTO v_rto_total, v_rto_breakdown
        FROM public.cat_reg_rules r
        WHERE r.state_code = v_state_code
        AND r.is_active = true
        AND (r.registration_type = p_registration_type OR r.registration_type IS NULL);
        
        -- Insurance Calculation (Fallback)
        SELECT 
            COALESCE(
                (SELECT 
                    (SELECT SUM((comp->>'premium')::NUMERIC) 
                     FROM jsonb_array_elements(r.tp_components) comp
                     WHERE (comp->>'cc_min')::NUMERIC <= v_engine_cc 
                     AND (comp->>'cc_max')::NUMERIC >= v_engine_cc)
                FROM public.cat_ins_rules r
                WHERE r.brand_id = v_brand_id 
                AND r.state_code = v_state_code
                AND r.is_active = true
                LIMIT 1), 
                3570 -- Default TP if no rules found
            ),
            ROUND(v_idv * 0.0217) -- Default OD calculation (2.17% of IDV)
        INTO v_insurance_total, v_idv;
        
        v_insurance_breakdown := jsonb_build_array(
            jsonb_build_object('label', 'Own Damage (OD) - 1yr', 'amount', ROUND(v_idv * 0.0217)),
            jsonb_build_object('label', 'Third Party (TP) - 5yr', 'amount', v_insurance_total - ROUND(v_idv * 0.0217))
        );
        v_insurance_total := ROUND(v_idv * 0.0217) + (v_insurance_total - ROUND(v_idv * 0.0217));
    END IF;
    
    -- 4. Get Dealer Offer (Remains dynamic as dealers update offers frequently)
    SELECT 
        bo.best_offer,
        bo.dealer_id,
        bo.dealer_name,
        bo.is_serviceable
    INTO v_dealer_offer, v_dealer_id, v_dealer_name, v_is_serviceable
    FROM public.get_market_best_offers(p_district_name, v_state_code) bo
    WHERE bo.vehicle_color_id = p_vehicle_color_id
    LIMIT 1;
    
    v_dealer_offer := COALESCE(v_dealer_offer, 0);
    v_is_serviceable := COALESCE(v_is_serviceable, true);
    
    -- 5. Build final result
    v_result := jsonb_build_object(
        'success', true,
        'ex_showroom', v_ex_showroom,
        'rto', jsonb_build_object(
            'total', v_rto_total,
            'type', p_registration_type,
            'breakdown', COALESCE(v_rto_breakdown, '[]'::JSONB)
        ),
        'insurance', jsonb_build_object(
            'total', v_insurance_total,
            'od', ROUND(v_idv * 0.0217),
            'tp', v_insurance_total - ROUND(v_idv * 0.0217),
            'gst_rate', 18,
            'breakdown', v_insurance_breakdown
        ),
        'dealer', jsonb_build_object(
            'id', v_dealer_id,
            'name', v_dealer_name,
            'offer', v_dealer_offer,
            'is_serviceable', v_is_serviceable
        ),
        'location', jsonb_build_object(
            'district', p_district_name,
            'state_code', v_state_code
        ),
        'meta', jsonb_build_object(
            'vehicle_color_id', p_vehicle_color_id,
            'engine_cc', v_engine_cc,
            'fuel_type', v_fuel_type,
            'idv', v_idv,
            'calculated_at', NOW(),
            'source', CASE WHEN v_price IS NOT NULL AND v_price.rto_total > 0 THEN 'PUBLISHED_SOT' ELSE 'DYNAMIC_CALC' END
        ),
        'final_on_road', v_ex_showroom + v_rto_total + v_insurance_total
    );
    
    RETURN v_result;
END;
$$;
