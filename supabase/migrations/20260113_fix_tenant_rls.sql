-- Allow SUPER_ADMIN and MARKETPLACE_ADMIN to see all tenants (for God Mode)
DROP POLICY IF EXISTS "Admins can view all tenants" ON public.tenants;
CREATE POLICY "Admins can view all tenants" ON public.tenants
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM memberships 
        WHERE user_id = auth.uid() 
        AND role IN ('SUPER_ADMIN', 'MARKETPLACE_ADMIN')
    )
    OR 
    EXISTS (
        SELECT 1 FROM memberships
        WHERE user_id = auth.uid()
        AND tenant_id = id
    )
);

-- Seed some basic prices for TVS and Yamaha if they don't exist
-- This ensures the Product Page finds data
DO $$
DECLARE
    v_variant_id UUID;
    v_color_id UUID;
BEGIN
    -- Try to find a variant for Yamaha MT-15
    SELECT id INTO v_variant_id FROM vehicle_variants WHERE slug = 'mt-15' LIMIT 1;
    
    IF v_variant_id IS NOT NULL THEN
        -- Find first color
        SELECT id INTO v_color_id FROM vehicle_colors WHERE variant_id = v_variant_id LIMIT 1;
        
        IF v_color_id IS NOT NULL THEN
            -- Insert price for MH
            INSERT INTO vehicle_prices (vehicle_color_id, state_code, ex_showroom_price)
            VALUES (v_color_id, 'MH', 168000)
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;
END $$;
