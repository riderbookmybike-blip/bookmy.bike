-- Function to convert a Quote into a Booking (Sales Order)
-- Usage: SELECT create_booking_from_quote('quote_uuid');

DROP FUNCTION IF EXISTS public.create_booking_from_quote(uuid);

CREATE OR REPLACE FUNCTION public.create_booking_from_quote(quote_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_quote record;
    v_booking_id uuid;
    v_customer_json jsonb;
    v_member_record record;
BEGIN
    -- 1. Fetch the source quote
    SELECT * INTO v_quote FROM crm_quotes WHERE id = quote_id;

    IF v_quote IS NULL THEN
        RAISE EXCEPTION 'Quote not found with ID %', quote_id;
    END IF;

    -- 0. Idempotency Check: If booking already exists, return it
    SELECT id INTO v_booking_id FROM crm_bookings WHERE crm_bookings.quote_id = create_booking_from_quote.quote_id LIMIT 1;
    
    IF v_booking_id IS NOT NULL THEN
        RETURN v_booking_id;
    END IF;

    -- 2. Fetch Member details for customer_details snapshot
    -- (Optional but good for redundancy in the booking record)
    IF v_quote.member_id IS NOT NULL THEN
        SELECT * INTO v_member_record FROM id_members WHERE id = v_quote.member_id;
        
        if v_member_record IS NOT NULL THEN
            v_customer_json := jsonb_build_object(
                'id', v_member_record.id,
                'full_name', v_member_record.full_name,
                'phone', v_member_record.primary_phone,
                'email', v_member_record.primary_email,
                'address', jsonb_build_object(
                    'line1', v_member_record.current_address1,
                    'line2', v_member_record.current_address2,
                    'pincode', v_member_record.pincode,
                    'city', v_member_record.taluka
                )
            );
        END IF;
    END IF;

    -- Fallback to commercials->customer if member lookup failed or was empty
    IF v_customer_json IS NULL THEN
        v_customer_json := COALESCE(v_quote.commercials->'customer', '{}'::jsonb);
    END IF;

    -- 3. Create the Booking Record in crm_bookings
    INSERT INTO crm_bookings (
        tenant_id,
        user_id,          -- Mapped from member_id
        quote_id,         -- Link back to quote
        variant_id,
        color_id,
        status,           -- Initial Status
        current_stage,    -- Workflow Stage
        grand_total,      -- On Road Price
        base_price,       -- Ex Showroom
        
        -- Snapshots
        vehicle_details,
        customer_details,
        sales_order_snapshot, -- Full Commercials Dump
        
        created_at,
        updated_at
    ) VALUES (
        v_quote.tenant_id,
        v_quote.member_id,
        v_quote.id,
        v_quote.variant_id,
        v_quote.color_id,
        'BOOKED',      -- Standard initial status
        'BOOKING',     -- Initial Stage
        v_quote.on_road_price,
        v_quote.ex_showroom_price,
        
        -- Vehicle Details Snapshot
        jsonb_build_object(
            'brand', v_quote.snap_brand,
            'model', v_quote.snap_model,
            'variant', v_quote.snap_variant,
            'color', v_quote.snap_color,
            'sku_id', v_quote.vehicle_sku_id,
            'image_url', v_quote.vehicle_image
        ),
        
        -- Customer Details Snapshot
        v_customer_json,
        
        -- Full Quote Snapshot (Commercials)
        v_quote.commercials,
        
        NOW(),
        NOW()
    )
    RETURNING id INTO v_booking_id;

    -- 4. Update the Quote status to reflect conversion
    UPDATE crm_quotes 
    SET status = 'CONFIRMED',
        updated_at = NOW()
    WHERE id = quote_id;

    -- 5. Return the new Booking ID
    RETURN v_booking_id;

EXCEPTION
    WHEN OTHERS THEN
        -- Re-raise error to be caught by client
        RAISE;
END;
$$;
