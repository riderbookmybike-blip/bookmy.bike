-- Create Brand Regional Configs Table
CREATE TABLE IF NOT EXISTS public.brand_regional_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
    state_code TEXT NOT NULL,
    delta_percentage NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(brand_id, state_code)
);

-- RLS Policies
ALTER TABLE public.brand_regional_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read for brand configs" ON public.brand_regional_configs
    FOR SELECT USING (true);

CREATE POLICY "Allow service_role full access" ON public.brand_regional_configs
    FOR ALL USING (true);

-- Functions and Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_brand_regional_configs_updated_at
    BEFORE UPDATE ON public.brand_regional_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
