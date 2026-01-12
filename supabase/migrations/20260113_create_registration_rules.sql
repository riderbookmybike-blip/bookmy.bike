-- Create Registration Rules Table (RTO Rule Engine)
CREATE TABLE IF NOT EXISTS public.registration_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_id TEXT UNIQUE DEFAULT substring(upper(md5(random()::text)) from 1 for 9),
    rule_name TEXT NOT NULL,
    state_code TEXT NOT NULL, -- MH, KA, DL, etc.
    vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('TWO_WHEELER', 'THREE_WHEELER', 'FOUR_WHEELER')),
    
    -- Smart Variant Config
    state_tenure INTEGER DEFAULT 15,
    bh_tenure INTEGER DEFAULT 2,
    company_multiplier NUMERIC DEFAULT 2,
    
    -- Formula Components (Stored as JSONB but mapped to FormulaComponent[] type)
    components JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.registration_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public View Rules" ON public.registration_rules FOR SELECT USING (true);

CREATE POLICY "Admin Manage Rules" ON public.registration_rules FOR ALL USING (
    EXISTS (SELECT 1 FROM memberships WHERE user_id = auth.uid() AND role IN ('SUPER_ADMIN', 'MARKETPLACE_ADMIN'))
);

-- Seed with a basic Maharashtra 2-Wheeler Rule
INSERT INTO public.registration_rules (rule_name, state_code, vehicle_type, components)
VALUES ('Maharashtra 2W Individual', 'MH', 'TWO_WHEELER', '[
    {
        "id": "road-tax",
        "type": "PERCENTAGE",
        "label": "Road Tax",
        "percentage": 10,
        "isRoadTax": true,
        "basis": "EX_SHOWROOM"
    },
    {
        "id": "smart-card",
        "type": "FIXED",
        "label": "Smart Card Fee",
        "amount": 200
    },
    {
        "id": "hypothecation",
        "type": "FIXED",
        "label": "Hypothecation Fee (If Loan)",
        "amount": 500
    }
]'::jsonb);
