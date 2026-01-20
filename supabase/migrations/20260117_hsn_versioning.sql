-- Add 'effective_to' and 'is_active' columns for HSN versioning/validity management

ALTER TABLE public.hsn_codes 
ADD COLUMN IF NOT EXISTS effective_to DATE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing records to be active
UPDATE public.hsn_codes SET is_active = true WHERE is_active IS NULL;

-- Comment: When a GST rate is revised:
-- 1. Set effective_to on the OLD rate entry (the date before new rate starts)
-- 2. Set is_active = false on the OLD rate entry
-- 3. Create NEW entry with new rate, effective_from = revision date, is_active = true
-- 
-- Product/Invoice lookup logic should:
-- 1. For NEW entries: SELECT WHERE is_active = true
-- 2. For HISTORICAL entries: SELECT WHERE effective_from <= transaction_date AND (effective_to IS NULL OR effective_to >= transaction_date)
