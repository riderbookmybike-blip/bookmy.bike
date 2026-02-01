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
