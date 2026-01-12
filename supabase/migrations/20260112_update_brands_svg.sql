-- Add SVG support to brands table
ALTER TABLE public.brands 
ADD COLUMN IF NOT EXISTS logo_svg TEXT;

-- Update existing brands (Optional cleanup)
COMMENT ON COLUMN public.brands.logo_svg IS 'Raw SVG code for pixel-perfect theme-aware rendering';
