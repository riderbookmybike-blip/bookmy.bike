-- Create Insurance Rules Table
CREATE TABLE IF NOT EXISTS public.insurance_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_id TEXT UNIQUE DEFAULT substring(upper(md5(random()::text)) from 1 for 9),
    rule_name TEXT NOT NULL,
    state_code TEXT NOT NULL DEFAULT 'ALL', -- ALL or specific state
    insurer_name TEXT NOT NULL,
    vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('TWO_WHEELER', 'THREE_WHEELER', 'FOUR_WHEELER')),
    
    -- Config
    idv_percentage NUMERIC DEFAULT 95,
    gst_percentage NUMERIC DEFAULT 18,
    
    -- Formula Components
    od_components JSONB NOT NULL DEFAULT '[]'::jsonb,
    tp_components JSONB NOT NULL DEFAULT '[]'::jsonb,
    addons JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'PENDING')),
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.insurance_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public View Insurance Rules" ON public.insurance_rules FOR SELECT USING (true);

CREATE POLICY "Admin Manage Insurance Rules" ON public.insurance_rules FOR ALL USING (
    EXISTS (SELECT 1 FROM memberships WHERE user_id = auth.uid() AND role IN ('SUPER_ADMIN', 'MARKETPLACE_ADMIN'))
);

-- Seed with a basic HDFC Ergo Two-Wheeler Rule
INSERT INTO public.insurance_rules (rule_name, insurer_name, vehicle_type, od_components, tp_components, addons)
VALUES ('HDFC ERGO 2W Comprehensive', 'HDFC ERGO', 'TWO_WHEELER', 
'[
    {
        "id": "od-basic",
        "type": "PERCENTAGE",
        "label": "Own Damage (OD) Base",
        "percentage": 1.5,
        "basis": "IDV"
    }
]'::jsonb,
'[
    {
        "id": "tp-standard",
        "type": "SLAB",
        "label": "Third Party Premium",
        "slabVariable": "ENGINE_CC",
        "ranges": [
            { "id": "tp1", "min": 0, "max": 75, "percentage": 0, "amount": 482 },
            { "id": "tp2", "min": 75, "max": 150, "percentage": 0, "amount": 714 },
            { "id": "tp3", "min": 150, "max": 350, "percentage": 0, "amount": 1366 },
            { "id": "tp4", "min": 350, "max": null, "percentage": 0, "amount": 2804 }
        ]
    }
]'::jsonb,
'[
    {
        "id": "addon-zero-dep",
        "type": "PERCENTAGE",
        "label": "Zero Depreciation",
        "percentage": 0.2,
        "basis": "IDV"
    },
    {
        "id": "addon-pa-cover",
        "type": "FIXED",
        "label": "Personal Accident Cover",
        "amount": 375
    }
]'::jsonb);
