-- Fix RLS for insurance_rules to match current admin role hierarchy
-- NOTE: Memberships live in public.id_team (not public.memberships).

DROP POLICY IF EXISTS "Admin Manage Insurance Rules" ON public.insurance_rules;

CREATE POLICY "Admin Manage Insurance Rules" ON public.insurance_rules
FOR ALL
USING (
    EXISTS (
        SELECT 1
        FROM public.id_team m
        WHERE m.user_id = auth.uid()
        AND upper(m.role) IN (
            'OWNER',
            'ADMIN',
            'DEALERSHIP_ADMIN',
            'SUPER_ADMIN',
            'SUPERADMIN',
            'MARKETPLACE_ADMIN'
        )
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.id_team m
        WHERE m.user_id = auth.uid()
        AND upper(m.role) IN (
            'OWNER',
            'ADMIN',
            'DEALERSHIP_ADMIN',
            'SUPER_ADMIN',
            'SUPERADMIN',
            'MARKETPLACE_ADMIN'
        )
    )
);

-- Registration Rules
DO $$
BEGIN
    IF to_regclass('public.registration_rules') IS NOT NULL THEN
        DROP POLICY IF EXISTS "Admin Manage Rules" ON public.registration_rules;
        CREATE POLICY "Admin Manage Rules" ON public.registration_rules
        FOR ALL
        USING (
            EXISTS (
                SELECT 1
                FROM public.id_team m
                WHERE m.user_id = auth.uid()
                AND upper(m.role) IN (
                    'OWNER',
                    'ADMIN',
                    'DEALERSHIP_ADMIN',
                    'SUPER_ADMIN',
                    'SUPERADMIN',
                    'MARKETPLACE_ADMIN'
                )
            )
        )
        WITH CHECK (
            EXISTS (
                SELECT 1
                FROM public.id_team m
                WHERE m.user_id = auth.uid()
                AND upper(m.role) IN (
                    'OWNER',
                    'ADMIN',
                    'DEALERSHIP_ADMIN',
                    'SUPER_ADMIN',
                    'SUPERADMIN',
                    'MARKETPLACE_ADMIN'
                )
            )
        );
    END IF;
END $$;

-- Accessories
DO $$
BEGIN
    IF to_regclass('public.accessories') IS NOT NULL THEN
        DROP POLICY IF EXISTS "Admin Manage Accessories" ON public.accessories;
        CREATE POLICY "Admin Manage Accessories" ON public.accessories
        FOR ALL
        USING (
            EXISTS (
                SELECT 1
                FROM public.id_team m
                WHERE m.user_id = auth.uid()
                AND upper(m.role) IN (
                    'OWNER',
                    'ADMIN',
                    'DEALERSHIP_ADMIN',
                    'SUPER_ADMIN',
                    'SUPERADMIN',
                    'MARKETPLACE_ADMIN'
                )
            )
        )
        WITH CHECK (
            EXISTS (
                SELECT 1
                FROM public.id_team m
                WHERE m.user_id = auth.uid()
                AND upper(m.role) IN (
                    'OWNER',
                    'ADMIN',
                    'DEALERSHIP_ADMIN',
                    'SUPER_ADMIN',
                    'SUPERADMIN',
                    'MARKETPLACE_ADMIN'
                )
            )
        );
    END IF;
END $$;

-- Services
DO $$
BEGIN
    IF to_regclass('public.services') IS NOT NULL THEN
        DROP POLICY IF EXISTS "Admin Manage Services" ON public.services;
        CREATE POLICY "Admin Manage Services" ON public.services
        FOR ALL
        USING (
            EXISTS (
                SELECT 1
                FROM public.id_team m
                WHERE m.user_id = auth.uid()
                AND upper(m.role) IN (
                    'OWNER',
                    'ADMIN',
                    'DEALERSHIP_ADMIN',
                    'SUPER_ADMIN',
                    'SUPERADMIN',
                    'MARKETPLACE_ADMIN'
                )
            )
        )
        WITH CHECK (
            EXISTS (
                SELECT 1
                FROM public.id_team m
                WHERE m.user_id = auth.uid()
                AND upper(m.role) IN (
                    'OWNER',
                    'ADMIN',
                    'DEALERSHIP_ADMIN',
                    'SUPER_ADMIN',
                    'SUPERADMIN',
                    'MARKETPLACE_ADMIN'
                )
            )
        );
    END IF;
END $$;

-- Vehicle Prices (legacy but still may exist)
DO $$
BEGIN
    IF to_regclass('public.vehicle_prices') IS NOT NULL THEN
        DROP POLICY IF EXISTS "Admin Manage Prices" ON public.vehicle_prices;
        CREATE POLICY "Admin Manage Prices" ON public.vehicle_prices
        FOR ALL
        USING (
            EXISTS (
                SELECT 1
                FROM public.id_team m
                WHERE m.user_id = auth.uid()
                AND upper(m.role) IN (
                    'OWNER',
                    'ADMIN',
                    'DEALERSHIP_ADMIN',
                    'SUPER_ADMIN',
                    'SUPERADMIN',
                    'MARKETPLACE_ADMIN'
                )
            )
        )
        WITH CHECK (
            EXISTS (
                SELECT 1
                FROM public.id_team m
                WHERE m.user_id = auth.uid()
                AND upper(m.role) IN (
                    'OWNER',
                    'ADMIN',
                    'DEALERSHIP_ADMIN',
                    'SUPER_ADMIN',
                    'SUPERADMIN',
                    'MARKETPLACE_ADMIN'
                )
            )
        );
    END IF;
END $$;
