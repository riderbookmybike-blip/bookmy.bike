-- Migration: 20260206_crm_schema_unification
-- Description: Unifies crm_quotes and crm_bookings schemas, updates quote lifecycle statuses.

-- 1. Update crm_quotes status constraint to include new life-cycle v2 states
ALTER TABLE public.crm_quotes DROP CONSTRAINT IF EXISTS quotes_status_check;
ALTER TABLE public.crm_quotes ADD CONSTRAINT quotes_status_check 
    CHECK (status = ANY (ARRAY['DRAFT', 'SENT', 'ACCEPTED', 'CONFIRMED', 'LOCKED', 'EXPIRED', 'REJECTED']));

-- 2. Enhance crm_bookings with commercial summaries for the Transaction Registry
ALTER TABLE public.crm_bookings ADD COLUMN IF NOT EXISTS grand_total NUMERIC DEFAULT 0;
ALTER TABLE public.crm_bookings ADD COLUMN IF NOT EXISTS base_price NUMERIC DEFAULT 0;
ALTER TABLE public.crm_bookings ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.cat_items(id);
ALTER TABLE public.crm_bookings ADD COLUMN IF NOT EXISTS color_id UUID REFERENCES public.cat_items(id);

-- 3. Update existing bookings if possible (link variant_id from vehicle_details if structured)
-- Assuming vehicle_details might contain variant_id or variantId
DO $$ 
BEGIN
    UPDATE public.crm_bookings 
    SET variant_id = (vehicle_details->>'variant_id')::UUID 
    WHERE variant_id IS NULL AND (vehicle_details->>'variant_id') IS NOT NULL;
EXCEPTION WHEN OTHERS THEN
    -- Ignore conversion errors for legacy data
    NULL;
END $$;
