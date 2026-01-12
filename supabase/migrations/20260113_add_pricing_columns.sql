-- Add Master Pricing Components to Vehicle Variants
ALTER TABLE public.vehicle_variants 
ADD COLUMN IF NOT EXISTS rto_charges NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS insurance_charges NUMERIC DEFAULT 0;

COMMENT ON COLUMN public.vehicle_variants.rto_charges IS 'Base Registration Charges (Road Tax + Registration)';
COMMENT ON COLUMN public.vehicle_variants.insurance_charges IS 'Standard Insurance Cost (1yr OD + 5yr TP)';
