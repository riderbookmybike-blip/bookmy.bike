-- Align create_booking_from_quote with crm_bookings schema (operational_stage replaces current_stage).

CREATE OR REPLACE FUNCTION public.create_booking_from_quote(quote_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_quote record;
    v_booking_id uuid;
    v_customer_json json;
    v_member_record record;
BEGIN
    -- 1. Fetch the source quote
    SELECT * INTO v_quote FROM crm_quotes WHERE id = quote_id;

    IF v_quote IS NULL THEN
        RAISE EXCEPTION 'Quote not found with ID %', quote_id;
    END IF;

    -- 0. Idempotency Check: If booking already exists, return it
    SELECT id INTO v_booking_id
    FROM crm_bookings
    WHERE crm_bookings.quote_id = create_booking_from_quote.quote_id
    LIMIT 1;

    IF v_booking_id IS NOT NULL THEN
        RETURN v_booking_id;
    END IF;

    -- 2. Fetch Member details for customer_details snapshot
    IF v_quote.member_id IS NOT NULL THEN
        SELECT * INTO v_member_record FROM id_members WHERE id = v_quote.member_id;

        IF v_member_record IS NOT NULL THEN
            v_customer_json := json_build_object(
                'id', v_member_record.id,
                'full_name', v_member_record.full_name,
                'phone', v_member_record.primary_phone,
                'email', v_member_record.primary_email,
                'address', json_build_object(
                    'line1', v_member_record.current_address1,
                    'line2', v_member_record.current_address2,
                    'pincode', v_member_record.pincode,
                    'city', v_member_record.taluka
                )
            );
        END IF;
    END IF;

    IF v_customer_json IS NULL THEN
        v_customer_json := COALESCE((v_quote.commercials->'customer')::json, '{}'::json);
    END IF;

    -- 3. Create the Booking Record in crm_bookings
    INSERT INTO crm_bookings (
        tenant_id,
        user_id,
        quote_id,
        variant_id,
        color_id,
        status,
        operational_stage,
        grand_total,
        base_price,
        vehicle_details,
        customer_details,
        sales_order_snapshot,
        created_at,
        updated_at
    ) VALUES (
        v_quote.tenant_id,
        v_quote.member_id,
        v_quote.id,
        v_quote.variant_id,
        v_quote.color_id,
        'BOOKED',
        'BOOKING',
        v_quote.on_road_price,
        v_quote.ex_showroom_price,
        json_build_object(
            'brand', v_quote.snap_brand,
            'model', v_quote.snap_model,
            'variant', v_quote.snap_variant,
            'color', v_quote.snap_color,
            'sku_id', v_quote.vehicle_sku_id,
            'image_url', v_quote.vehicle_image
        ),
        v_customer_json,
        COALESCE((v_quote.commercials)::json, '{}'::json),
        NOW(),
        NOW()
    )
    RETURNING id INTO v_booking_id;

    -- 4. Update the Quote status to reflect conversion
    UPDATE crm_quotes
    SET status = 'BOOKED',
        updated_at = NOW()
    WHERE id = quote_id;

    RETURN v_booking_id;
END;
$$;
