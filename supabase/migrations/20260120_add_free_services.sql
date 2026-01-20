-- Add is_mandatory column to services table
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS is_mandatory BOOLEAN DEFAULT FALSE;

-- Seed Free Services (Standard Care)
INSERT INTO public.services (id, name, description, price, discount_price, max_qty, duration_months, is_mandatory)
VALUES 
    ('FREE_1', '1st Free Service', '30 Days or 1000 km, whichever is earlier.', 0, 0, 1, 1, true),
    ('FREE_2', '2nd Free Service', '90 Days or 3000 km, whichever is earlier.', 0, 0, 1, 3, true),
    ('FREE_3', '3rd Free Service', '180 Days or 6000 km, whichever is earlier.', 0, 0, 1, 6, true),
    ('FREE_4', '4th Free Service', '270 Days or 9000 km, whichever is earlier.', 0, 0, 1, 9, true),
    ('FREE_5', '5th Free Service', '365 Days or 12000 km, whichever is earlier.', 0, 0, 1, 12, true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    is_mandatory = EXCLUDED.is_mandatory;
