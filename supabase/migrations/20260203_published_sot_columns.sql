-- Migration: Add Published SOT columns to cat_prices
-- Purpose: Enable storing complete pricing data without RPC

ALTER TABLE cat_prices 
ADD COLUMN IF NOT EXISTS rto_breakdown JSONB,
ADD COLUMN IF NOT EXISTS insurance_breakdown JSONB,
ADD COLUMN IF NOT EXISTS gst_rate NUMERIC DEFAULT 0.28,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'VEHICLE';

-- Add comment for documentation
COMMENT ON COLUMN cat_prices.rto_breakdown IS 'JSON breakdown of RTO components: {state: num, bh: num, fees: [...]}';
COMMENT ON COLUMN cat_prices.insurance_breakdown IS 'JSON breakdown of insurance: {od: num, tp: num, addons: [...]}';
COMMENT ON COLUMN cat_prices.category IS 'VEHICLE, ACCESSORY, or SERVICE';
