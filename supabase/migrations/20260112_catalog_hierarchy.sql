-- 1. Vehicle Models (Owned by Brand) - Focus on Engine & RTO Specs
CREATE TABLE IF NOT EXISTS public.vehicle_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('MOTORCYCLE', 'SCOOTER', 'MOPED', 'CAR')),
    fuel_type TEXT NOT NULL CHECK (fuel_type IN ('PETROL', 'CNG', 'ELECTRICAL', 'DIESEL', 'HYBRID')),
    segment TEXT NOT NULL DEFAULT 'COMMUTER', -- SPORTS, COMMUTER, ADVENTURE, LUXURY, etc.
    
    -- Performance Specs (RTO Essentials - Fixed Columns)
    displacement_cc NUMERIC, -- NULL for Electric
    max_power_kw NUMERIC,   -- Common for both (BHP converted to kW for Petrol)
    max_torque_nm NUMERIC,
    emission_type TEXT,    -- BS6-2.0, BS4, etc.
    seating_capacity INTEGER DEFAULT 2,
    
    -- Electric Specific Core Specs
    battery_capacity_kwh NUMERIC, -- NULL for Petrol
    certified_range_km NUMERIC,
    
    -- Flexible Marketing/Technical Specs (JSONB)
    specifications JSONB DEFAULT '{}'::jsonb,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(brand_id, slug)
);

-- 2. Vehicle Variants (Owned by Model) - Focus on Equipment
CREATE TABLE IF NOT EXISTS public.vehicle_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID NOT NULL REFERENCES public.vehicle_models(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    segment_override TEXT, -- Optional override for variant-specific positioning
    
    -- Core Variant Equipment (Fixed Columns for filtering)
    braking_system TEXT, -- ABS, CBS, Std
    front_brake_type TEXT, -- Disc, Drum
    rear_brake_type TEXT, -- Disc, Drum
    wheel_type TEXT, -- Alloy, Spoke
    
    -- Flexible Variant Features (JSONB)
    features JSONB DEFAULT '{}'::jsonb,
    
    base_price_ex_showroom NUMERIC DEFAULT 0,

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(model_id, slug)
);

-- 3. Vehicle Colors (Owned by Variant)
CREATE TABLE IF NOT EXISTS public.vehicle_colors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES public.vehicle_variants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    hex_code TEXT,
    hex_code_secondary TEXT,
    image_url TEXT,
    gallery_urls JSONB DEFAULT '[]'::jsonb,
    
    price_adjustment NUMERIC DEFAULT 0, -- Extra cost for premium colors
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS & Policies
ALTER TABLE public.vehicle_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_colors ENABLE ROW LEVEL SECURITY;

-- Select for everyone
CREATE POLICY "Public View Models" ON public.vehicle_models FOR SELECT USING (true);
CREATE POLICY "Public View Variants" ON public.vehicle_variants FOR SELECT USING (true);
CREATE POLICY "Public View Colors" ON public.vehicle_colors FOR SELECT USING (true);

-- Manage for Admins
CREATE POLICY "Admin Manage Models" ON public.vehicle_models FOR ALL USING (
    EXISTS (SELECT 1 FROM memberships WHERE user_id = auth.uid() AND role IN ('SUPER_ADMIN', 'MARKETPLACE_ADMIN'))
);
CREATE POLICY "Admin Manage Variants" ON public.vehicle_variants FOR ALL USING (
    EXISTS (SELECT 1 FROM memberships WHERE user_id = auth.uid() AND role IN ('SUPER_ADMIN', 'MARKETPLACE_ADMIN'))
);
CREATE POLICY "Admin Manage Colors" ON public.vehicle_colors FOR ALL USING (
    EXISTS (SELECT 1 FROM memberships WHERE user_id = auth.uid() AND role IN ('SUPER_ADMIN', 'MARKETPLACE_ADMIN'))
);


