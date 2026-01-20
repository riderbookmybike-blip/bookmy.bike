-- Migration: 20260120_clean_schema_overhaul.sql
-- Description: Non-destructive update to support Clean 4-Table Architecture.
-- Usage: Adds missing columns to public.profiles, public.leads, public.quotes, public.bookings.

-- 1. Profiles (Identity)
-- Core: phone (mobile), full_name (name), email.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pan_card_url TEXT;

-- 2. Leads (Qualification)
ALTER TABLE public.leads 
    ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'WALKIN',
    ADD COLUMN IF NOT EXISTS is_serviceable BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS interest_text TEXT, -- For raw input like 'Jupiter 125'
    ADD COLUMN IF NOT EXISTS notes TEXT;

-- 3. Quotes (Commercials)
ALTER TABLE public.quotes
    ADD COLUMN IF NOT EXISTS vehicle_sku_id TEXT, -- Specific SKU if different from variant_id
    ADD COLUMN IF NOT EXISTS vehicle_image TEXT,
    ADD COLUMN IF NOT EXISTS ex_showroom_price NUMERIC,
    ADD COLUMN IF NOT EXISTS insurance_amount NUMERIC,
    ADD COLUMN IF NOT EXISTS rto_amount NUMERIC,
    ADD COLUMN IF NOT EXISTS accessories_amount NUMERIC,
    ADD COLUMN IF NOT EXISTS discount_amount NUMERIC,
    ADD COLUMN IF NOT EXISTS on_road_price NUMERIC,
    ADD COLUMN IF NOT EXISTS valid_until TIMESTAMPTZ;

-- 4. Bookings (Fulfillment)
ALTER TABLE public.bookings
    ADD COLUMN IF NOT EXISTS booking_amount_received NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS finance_status TEXT DEFAULT 'NA', -- NA, APPLIED, APPROVED, REJECTED
    ADD COLUMN IF NOT EXISTS zoho_order_id TEXT,
    ADD COLUMN IF NOT EXISTS vin_number TEXT,
    ADD COLUMN IF NOT EXISTS registration_number TEXT;

-- Ensure Indexes exist
CREATE INDEX IF NOT EXISTS idx_leads_source ON public.leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_is_serviceable ON public.leads(is_serviceable);
CREATE INDEX IF NOT EXISTS idx_quotes_on_road_price ON public.quotes(on_road_price);
CREATE INDEX IF NOT EXISTS idx_bookings_vin ON public.bookings(vin_number);
