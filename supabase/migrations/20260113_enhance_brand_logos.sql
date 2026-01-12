-- Add brand_logos column to brands table for multi-theme support
ALTER TABLE public.brands 
ADD COLUMN IF NOT EXISTS brand_logos JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.brands.brand_logos IS 'Stores multiple logo variants: { "original": "...", "dark": "...", "light": "..." }';

-- Optional: Migrate existing logo_svg to brand_logos['original'] if needed
-- UPDATE public.brands SET brand_logos = jsonb_build_object('original', logo_svg) WHERE logo_svg IS NOT NULL AND brand_logos = '{}'::jsonb;
