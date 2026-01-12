-- State-Specific Pricing Table (Ex-Showroom Only)
-- RTO & Insurance are calculated dynamically via the Rule Engine
CREATE TABLE IF NOT EXISTS public.vehicle_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_color_id UUID NOT NULL REFERENCES public.vehicle_colors(id) ON DELETE CASCADE,
    state_code TEXT NOT NULL, -- MH, KA, DL etc.
    
    -- ONLY Base Price is stored
    ex_showroom_price NUMERIC DEFAULT 0,
    
    -- Meta
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraint: One price per Color per State
    UNIQUE(vehicle_color_id, state_code)
);

-- RLS
ALTER TABLE public.vehicle_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public View Prices" ON public.vehicle_prices FOR SELECT USING (true);

CREATE POLICY "Admin Manage Prices" ON public.vehicle_prices FOR ALL USING (
    EXISTS (SELECT 1 FROM memberships WHERE user_id = auth.uid() AND role IN ('SUPER_ADMIN', 'MARKETPLACE_ADMIN'))
);
