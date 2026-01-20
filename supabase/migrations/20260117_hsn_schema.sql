
-- Create HSN Codes table
CREATE TABLE IF NOT EXISTS public.hsn_codes (
    code TEXT PRIMARY KEY, -- The HSN Code itself is the unique identifier (e.g., '871120')
    description TEXT NOT NULL,
    gst_rate NUMERIC NOT NULL DEFAULT 18,
    cess_rate NUMERIC DEFAULT 0,
    type TEXT CHECK (type IN ('VEHICLE', 'ACCESSORY', 'PART', 'SERVICE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.hsn_codes ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone (public)
CREATE POLICY "Allow public read access" ON public.hsn_codes
    FOR SELECT USING (true);

-- Allow write access to Admins/Superadmins
CREATE POLICY "Allow admin write access" ON public.hsn_codes
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT user_id FROM memberships 
            WHERE role IN ('SUPER_ADMIN', 'ADMIN', 'OWNER') 
            AND status = 'ACTIVE'
        )
    );

-- Seed Data (from Mock Store)
INSERT INTO public.hsn_codes (code, description, gst_rate, type) VALUES
('871120', 'Motorcycles with reciprocating internal combustion piston engine of a cylinder capacity exceeding 50cc but not exceeding 250cc', 28, 'VEHICLE'),
('871130', 'Motorcycles exceeding 250cc but not exceeding 500cc', 28, 'VEHICLE'),
('650610', 'Safety Headgear (Helmets)', 18, 'ACCESSORY'),
('871410', 'Parts and accessories of motorcycles (including mopeds)', 18, 'PART'),
('998729', 'Maintenance and repair services of motorcycles', 18, 'SERVICE')
ON CONFLICT (code) DO UPDATE SET
description = EXCLUDED.description,
gst_rate = EXCLUDED.gst_rate,
type = EXCLUDED.type;
