-- Add custom_attributes to accessories table to support dynamic key-value pairs
ALTER TABLE public.accessories
ADD COLUMN IF NOT EXISTS custom_attributes JSONB DEFAULT '{}'::jsonb;

-- Example: Update a studds helmet with some custom attributes
UPDATE public.accessories 
SET custom_attributes = '{"Certification": "ISI", "Weight": "1250g", "Visor": "Scratch Resistant"}'::jsonb
WHERE make = 'Studds' AND model = 'Ninja 3G';
