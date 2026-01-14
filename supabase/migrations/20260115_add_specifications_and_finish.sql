-- Add specifications to vehicle_variants and finish to vehicle_colors
ALTER TABLE public.vehicle_variants 
ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.vehicle_colors 
ADD COLUMN IF NOT EXISTS finish TEXT;
