-- 1. DROP LEGACY TABLES (Destructive)
-- We use CASCADE to remove any dependent data or foreign keys
DROP TABLE IF EXISTS public.vehicle_variants CASCADE;
DROP TABLE IF EXISTS public.vehicle_colors CASCADE;
DROP TABLE IF EXISTS public.vehicle_models CASCADE;
DROP TABLE IF EXISTS public.accessories CASCADE;
DROP TABLE IF EXISTS public.services CASCADE;
DROP TABLE IF EXISTS public.catalog_items CASCADE;
DROP TABLE IF EXISTS public.catalog_templates CASCADE;

-- 2. CREATE NEW UNIFIED SCHEMA

-- A. Catalog Templates (The "DNA")
CREATE TABLE public.catalog_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,      -- e.g. "ICE Motorcycle", "Helmet"
    code TEXT NOT NULL UNIQUE,      -- e.g. "ice_bike", "helmet"
    
    -- Configuration for Hierarchy
    -- e.g. { "l1": "Variant", "l2": "Color" } for Bikes
    -- e.g. { "l1": "Shell", "l2": "Graphic" } for Helmets
    hierarchy_config JSONB DEFAULT '{}'::jsonb,
    
    -- Attribute Rules (What fields to ask for)
    -- e.g. [{ "key": "engine_cc", "label": "Displacement", "type": "number", "required": true }]
    attribute_config JSONB DEFAULT '[]'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- B. Catalog Items (The "Products")
CREATE TABLE public.catalog_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID, -- For Multi-tenant SaaS support
    
    -- Structural Links
    template_id UUID REFERENCES public.catalog_templates(id),
    brand_id UUID REFERENCES public.brands(id),
    parent_id UUID REFERENCES public.catalog_items(id), -- Self-referencing for hierarchy
    
    -- Hierarchy Definition
    -- FAMILY: The Product Line (e.g. Activa 6G)
    -- VARIANT: The Configuration (e.g. Standard - Drum)
    -- SKU: The Sellable Item (e.g. Matte Black)
    type TEXT NOT NULL CHECK (type IN ('FAMILY', 'VARIANT', 'SKU')),
    
    -- Identity
    name TEXT NOT NULL,         -- "Activa 6G", "Standard", "Matte Black"
    slug TEXT,
    sku_code TEXT UNIQUE,       -- "HON-ACT-STD-BLK"
    
    -- Dynamic Data (The "Specs")
    -- Validated against template rules by application logic
    specs JSONB DEFAULT '{}'::jsonb,
    
    -- Commercials
    price_base NUMERIC DEFAULT 0, -- Base Price (Ex-Showroom Mumbai)
    item_tax_rate NUMERIC DEFAULT 18, 
    hsn_code TEXT,
    
    -- Status
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'DRAFT')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS Policies (Security)
ALTER TABLE public.catalog_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone
CREATE POLICY "Public Read Templates" ON public.catalog_templates FOR SELECT USING (true);
CREATE POLICY "Public Read Items" ON public.catalog_items FOR SELECT USING (true);

-- Allow full access to authenticated admins (simplified for now, refine with verify_admin later if needed)
CREATE POLICY "Admin Full Access Templates" ON public.catalog_templates FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Full Access Items" ON public.catalog_items FOR ALL USING (auth.role() = 'authenticated');

-- 4. SEED INITIAL TEMPLATES
INSERT INTO public.catalog_templates (name, code, hierarchy_config, attribute_config) VALUES
(
    'ICE Motorcycle', 'ice_bike', 
    '{"l1": "Variant", "l2": "Color"}', 
    '[
        {"key": "engine_cc", "label": "Engine Capacity", "type": "number", "suffix": "cc"}, 
        {"key": "fuel_tank", "label": "Fuel Tank Capacity", "type": "number", "suffix": "L"},
        {"key": "gears", "label": "No. of Gears", "type": "number"},
        {"key": "mileage", "label": "ARAI Mileage", "type": "number", "suffix": "kmpl"}
    ]'
),
(
    'ICE Scooter', 'ice_scooter',
    '{"l1": "Variant", "l2": "Color"}',
    '[
        {"key": "engine_cc", "label": "Engine Capacity", "type": "number", "suffix": "cc"},
        {"key": "fuel_tank", "label": "Fuel Tank Capacity", "type": "number", "suffix": "L"},
        {"key": "mileage", "label": "ARAI Mileage", "type": "number", "suffix": "kmpl"}
    ]'
),
(
    'EV Scooter', 'ev_scooter',
    '{"l1": "Variant", "l2": "Color"}',
    '[
        {"key": "battery_capacity", "label": "Battery Config", "type": "text", "suffix": "kWh"},
        {"key": "range_eco", "label": "Eco Mode Range", "type": "number", "suffix": "km"},
        {"key": "charging_time", "label": "Charging Time", "type": "text"}
    ]'
),
(
    'Helmet', 'helmet',
    '{"l1": "Shell Type", "l2": "Size"}',
    '[
        {"key": "certification", "label": "Safety Rating", "type": "select", "options": ["ISI", "DOT", "ECE"]},
        {"key": "material", "label": "Shell Material", "type": "text"},
        {"key": "weight", "label": "Weight", "type": "number", "suffix": "g"}
    ]'
);

-- 5. Indexes for Performance
CREATE INDEX idx_catalog_items_template ON public.catalog_items(template_id);
CREATE INDEX idx_catalog_items_parent ON public.catalog_items(parent_id);
CREATE INDEX idx_catalog_items_brand ON public.catalog_items(brand_id);
CREATE INDEX idx_catalog_items_specs ON public.catalog_items USING gin (specs);
