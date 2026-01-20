-- Add hierarchy columns to accessories table
ALTER TABLE public.accessories
ADD COLUMN IF NOT EXISTS make TEXT DEFAULT 'Universal',
ADD COLUMN IF NOT EXISTS model TEXT,
ADD COLUMN IF NOT EXISTS variant TEXT,
ADD COLUMN IF NOT EXISTS size TEXT,
ADD COLUMN IF NOT EXISTS color TEXT,
ADD COLUMN IF NOT EXISTS sku TEXT,
ADD COLUMN IF NOT EXISTS hsn_code TEXT,
ADD COLUMN IF NOT EXISTS gst_rate NUMERIC DEFAULT 18.0;

-- Update existing data with sample hierarchy values (Idempotent updates)
UPDATE public.accessories SET 
    make = 'Studds', 
    model = 'Ninja 3G', 
    variant = 'Flip Up', 
    size = 'L', 
    sku = 'STD-NIN-3G-FLP-L' 
WHERE id = 'acc-helmet-studds'; -- Assuming you might have added this or will add it. 

-- Update the hardcoded/migrated ones to have some data
UPDATE public.accessories SET make = 'Generic', model = 'Standard' WHERE make IS NULL;

-- Insert new distinct examples for cascading demo
INSERT INTO public.accessories (id, name, description, price, make, model, variant, size, color, sku, category, status)
VALUES 
('acc-helmet-studds-blk', 'Studds Ninja 3G (Black)', 'Flip-up helmet with aerodynamic design', 2100, 'Studds', 'Ninja 3G', 'Flip Up', 'L', 'Black', 'STD-NIN-3G-BLK', 'HELMET', 'ACTIVE'),
('acc-helmet-studds-wht', 'Studds Ninja 3G (White)', 'Flip-up helmet with aerodynamic design', 2100, 'Studds', 'Ninja 3G', 'Flip Up', 'L', 'White', 'STD-NIN-3G-WHT', 'HELMET', 'ACTIVE'),
('acc-helmet-vega-off', 'Vega Off-Road', 'Full face off-road helmet', 2400, 'Vega', 'Off Road', 'Sketch', 'M', 'Graphic', 'VEG-OFF-SKT-M', 'HELMET', 'ACTIVE')
ON CONFLICT (id) DO UPDATE SET
    make = EXCLUDED.make,
    model = EXCLUDED.model,
    variant = EXCLUDED.variant,
    size = EXCLUDED.size,
    color = EXCLUDED.color;

-- Indexes for faster filtering
CREATE INDEX IF NOT EXISTS accessories_make_idx ON public.accessories (make);
CREATE INDEX IF NOT EXISTS accessories_model_idx ON public.accessories (model);
CREATE INDEX IF NOT EXISTS accessories_variant_idx ON public.accessories (variant);
CREATE INDEX IF NOT EXISTS accessories_size_idx ON public.accessories (size);
CREATE INDEX IF NOT EXISTS accessories_color_idx ON public.accessories (color);
CREATE INDEX IF NOT EXISTS accessories_hsn_idx ON public.accessories (hsn_code);

-- Unique SKU (ignore nulls)
CREATE UNIQUE INDEX IF NOT EXISTS accessories_sku_unique ON public.accessories (sku) WHERE sku IS NOT NULL;

-- GST sanity check (0-100)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'accessories_gst_rate_check'
    ) THEN
        ALTER TABLE public.accessories
        ADD CONSTRAINT accessories_gst_rate_check
        CHECK (gst_rate >= 0 AND gst_rate <= 100);
    END IF;
END $$;
