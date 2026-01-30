-- 1. Add inclusion_type to cat_items for global defaults
ALTER TABLE public.cat_items ADD COLUMN IF NOT EXISTS inclusion_type TEXT DEFAULT 'OPTIONAL' CHECK (inclusion_type IN ('MANDATORY', 'OPTIONAL', 'BUNDLE'));

-- 2. Add inclusion_type to id_dealer_pricing_rules for dealer specific overrides
ALTER TABLE public.id_dealer_pricing_rules ADD COLUMN IF NOT EXISTS inclusion_type TEXT DEFAULT 'OPTIONAL' CHECK (inclusion_type IN ('MANDATORY', 'OPTIONAL', 'BUNDLE'));

-- 3. Update the upsert RPC to handle inclusion_type
CREATE OR REPLACE FUNCTION public.upsert_dealer_offers(offers JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    item jsonb;
BEGIN
    FOR item IN SELECT * FROM jsonb_array_elements(offers)
    LOOP
        INSERT INTO public.id_dealer_pricing_rules (
            tenant_id,
            vehicle_color_id,
            state_code,
            offer_amount,
            inclusion_type,
            updated_at
        )
        VALUES (
            (item->>'tenant_id')::UUID,
            (item->>'vehicle_color_id')::UUID,
            item->>'state_code',
            COALESCE((item->>'offer_amount')::NUMERIC, 0),
            COALESCE(item->>'inclusion_type', 'OPTIONAL'),
            NOW()
        )
        ON CONFLICT (tenant_id, vehicle_color_id, state_code)
        DO UPDATE SET
            offer_amount = EXCLUDED.offer_amount,
            inclusion_type = EXCLUDED.inclusion_type,
            updated_at = NOW();
    END LOOP;
END;
$$;
