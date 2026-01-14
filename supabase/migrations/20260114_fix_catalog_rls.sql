-- Fix RLS Policies for Catalog to match new Role Hierarchy (SUPER_ADMIN -> OWNER)

-- 1. Brands
DROP POLICY IF EXISTS "Admin Manage Brands" ON public.brands;
CREATE POLICY "Admin Manage Brands" ON public.brands FOR ALL USING (
    EXISTS (SELECT 1 FROM memberships WHERE user_id = auth.uid() AND role IN ('OWNER', 'SUPER_ADMIN', 'MARKETPLACE_ADMIN'))
);

-- 2. Vehicle Models
DROP POLICY IF EXISTS "Admin Manage Models" ON public.vehicle_models;
CREATE POLICY "Admin Manage Models" ON public.vehicle_models FOR ALL USING (
    EXISTS (SELECT 1 FROM memberships WHERE user_id = auth.uid() AND role IN ('OWNER', 'SUPER_ADMIN', 'MARKETPLACE_ADMIN'))
);

-- 3. Vehicle Variants
DROP POLICY IF EXISTS "Admin Manage Variants" ON public.vehicle_variants;
CREATE POLICY "Admin Manage Variants" ON public.vehicle_variants FOR ALL USING (
    EXISTS (SELECT 1 FROM memberships WHERE user_id = auth.uid() AND role IN ('OWNER', 'SUPER_ADMIN', 'MARKETPLACE_ADMIN'))
);

-- 4. Vehicle Colors
DROP POLICY IF EXISTS "Admin Manage Colors" ON public.vehicle_colors;
CREATE POLICY "Admin Manage Colors" ON public.vehicle_colors FOR ALL USING (
    EXISTS (SELECT 1 FROM memberships WHERE user_id = auth.uid() AND role IN ('OWNER', 'SUPER_ADMIN', 'MARKETPLACE_ADMIN'))
);
