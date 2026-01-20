-- Add is_active and fixed_delta to brand_regional_configs
ALTER TABLE public.brand_regional_configs 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS fixed_delta NUMERIC DEFAULT 0;
