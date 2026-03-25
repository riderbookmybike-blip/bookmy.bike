CREATE OR REPLACE FUNCTION public.upsert_dealer_offers(offers jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    item jsonb;
BEGIN
    FOR item IN SELECT * FROM jsonb_array_elements(offers)
    LOOP
        INSERT INTO public.cat_price_dealer (
            tenant_id,
            vehicle_color_id,
            state_code,
            offer_amount,
            inclusion_type,
            is_active,
            tat_days,
            tat_hours_input,
            tat_source,
            tat_updated_at,
            updated_at
        )
        VALUES (
            (item->>'tenant_id')::uuid,
            (item->>'vehicle_color_id')::uuid,
            item->>'state_code',
            COALESCE((item->>'offer_amount')::numeric, 0),
            COALESCE(item->>'inclusion_type', 'OPTIONAL'),
            COALESCE((item->>'is_active')::boolean, true),
            (item->>'tat_days')::integer,
            (item->>'tat_hours_input')::integer,
            COALESCE(item->>'tat_source', 'MANUAL'),
            CASE WHEN item ? 'tat_days' OR item ? 'tat_hours_input' THEN NOW() ELSE NULL END,
            NOW()
        )
        ON CONFLICT (tenant_id, vehicle_color_id, state_code)
        DO UPDATE SET
            offer_amount = EXCLUDED.offer_amount,
            inclusion_type = EXCLUDED.inclusion_type,
            is_active = EXCLUDED.is_active,
            tat_days = EXCLUDED.tat_days,
            tat_hours_input = EXCLUDED.tat_hours_input,
            tat_source = EXCLUDED.tat_source,
            tat_updated_at = CASE
                WHEN EXCLUDED.tat_days IS DISTINCT FROM public.cat_price_dealer.tat_days
                  OR EXCLUDED.tat_hours_input IS DISTINCT FROM public.cat_price_dealer.tat_hours_input
                THEN NOW()
                ELSE public.cat_price_dealer.tat_updated_at
            END,
            updated_at = NOW();
    END LOOP;
END;
$function$;
