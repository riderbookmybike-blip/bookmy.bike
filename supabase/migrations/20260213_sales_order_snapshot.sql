-- ==========================================================================
-- Migration: Sales Order Snapshot + Harden Quote->Booking clone
-- Date: 2026-02-13
-- ==========================================================================

ALTER TABLE public.crm_bookings
    ADD COLUMN IF NOT EXISTS sales_order_snapshot JSONB;

CREATE OR REPLACE FUNCTION public.create_booking_from_quote(p_quote_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    q public.crm_quotes%ROWTYPE;
    l public.crm_leads%ROWTYPE;
    m public.id_members%ROWTYPE;
    booking_id uuid;
    v_grand_total numeric;
    v_base_price numeric;
    v_member_id uuid;
    v_customer_snapshot jsonb;
    v_vehicle_snapshot jsonb;
    v_pricing_snapshot jsonb;
    v_finance_snapshot jsonb;
    v_sales_order_snapshot jsonb;
BEGIN
    SELECT * INTO q FROM public.crm_quotes
    WHERE id = p_quote_id AND (is_deleted IS FALSE OR is_deleted IS NULL)
    FOR UPDATE;

    IF NOT FOUND THEN RAISE EXCEPTION 'Quote not found'; END IF;
    IF q.status <> 'CONFIRMED' THEN RAISE EXCEPTION 'Quote must be CONFIRMED before converting to Booking'; END IF;

    IF q.lead_id IS NOT NULL THEN
        SELECT * INTO l FROM public.crm_leads WHERE id = q.lead_id;
    END IF;

    v_member_id := COALESCE(q.member_id, l.customer_id);
    IF v_member_id IS NOT NULL THEN
        SELECT * INTO m FROM public.id_members WHERE id = v_member_id;
    END IF;

    v_grand_total := COALESCE(q.on_road_price, NULLIF((q.commercials->>'grand_total')::numeric, 0), 0);
    v_base_price := COALESCE(q.ex_showroom_price, NULLIF((q.commercials->>'ex_showroom')::numeric, 0), 0);

    v_pricing_snapshot := COALESCE(q.commercials->'pricing_snapshot', '{}'::jsonb);
    v_finance_snapshot := COALESCE(q.commercials->'finance', '{}'::jsonb);

    v_vehicle_snapshot := jsonb_build_object(
        'variant_id', q.variant_id,
        'color_id', q.color_id,
        'brand', COALESCE(q.snap_brand, q.commercials->>'brand'),
        'model', COALESCE(q.snap_model, q.commercials->>'model'),
        'variant', COALESCE(q.snap_variant, q.commercials->>'variant'),
        'color', COALESCE(q.snap_color, q.commercials->>'color_name', q.commercials->>'color'),
        'commercial_snapshot', q.commercials,
        'pricing_snapshot', v_pricing_snapshot
    );

    v_customer_snapshot := jsonb_build_object(
        'lead', jsonb_build_object(
            'lead_id', q.lead_id,
            'customer_name', l.customer_name,
            'customer_phone', l.customer_phone,
            'customer_pincode', l.customer_pincode,
            'customer_taluka', l.customer_taluka,
            'customer_dob', l.customer_dob,
            'customer_address1', l.customer_address1,
            'customer_address2', l.customer_address2,
            'customer_address3', l.customer_address3
        ),
        'member', jsonb_build_object(
            'member_id', m.id,
            'full_name', m.full_name,
            'primary_phone', m.primary_phone,
            'whatsapp', m.whatsapp,
            'primary_email', m.primary_email,
            'current_address1', m.current_address1,
            'current_address2', m.current_address2,
            'current_address3', m.current_address3,
            'aadhaar_address1', m.aadhaar_address1,
            'aadhaar_address2', m.aadhaar_address2,
            'aadhaar_address3', m.aadhaar_address3
        )
    );

    v_sales_order_snapshot := jsonb_build_object(
        'quote_id', q.id,
        'quote_display_id', q.display_id,
        'quote_status', q.status,
        'quote_created_at', q.created_at,
        'quote_commercials', q.commercials,
        'snap_brand', q.snap_brand,
        'snap_model', q.snap_model,
        'snap_variant', q.snap_variant,
        'snap_color', q.snap_color,
        'snap_dealer_name', q.snap_dealer_name,
        'pricing_snapshot', v_pricing_snapshot,
        'finance_snapshot', v_finance_snapshot,
        'customer_snapshot', v_customer_snapshot,
        'vehicle_snapshot', v_vehicle_snapshot
    );

    INSERT INTO public.crm_bookings(
        tenant_id,
        quote_id,
        lead_id,
        user_id,
        variant_id,
        color_id,
        grand_total,
        base_price,
        vehicle_details,
        customer_details,
        sales_order_snapshot,
        status,
        current_stage,
        operational_stage
    )
    VALUES (
        q.tenant_id,
        q.id,
        q.lead_id,
        v_member_id,
        q.variant_id,
        q.color_id,
        v_grand_total,
        v_base_price,
        v_vehicle_snapshot,
        v_customer_snapshot,
        v_sales_order_snapshot,
        'BOOKED',
        'BOOKING',
        'BOOKING'
    )
    RETURNING id INTO booking_id;

    UPDATE public.crm_quotes SET status = 'BOOKED', updated_at = now() WHERE id = q.id;

    IF q.lead_id IS NOT NULL THEN
        UPDATE public.crm_leads SET status = 'CLOSED', updated_at = now()
        WHERE id = q.lead_id AND (is_deleted IS FALSE OR is_deleted IS NULL);

        UPDATE public.crm_quotes SET status = 'CANCELED', updated_at = now()
        WHERE lead_id = q.lead_id AND id <> q.id AND status NOT IN ('BOOKED','BOOKING');
    END IF;

    RETURN booking_id;
END;
$function$;
