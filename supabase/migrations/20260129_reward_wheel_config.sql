-- Tenant reward wheel configuration (per-tenant rewards + weights)
CREATE TABLE IF NOT EXISTS public.id_tenant_reward_wheel_configs (
    tenant_id uuid PRIMARY KEY REFERENCES public.id_tenants(id) ON DELETE CASCADE,
    rewards jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.id_tenant_reward_wheel_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant admins manage reward wheel config" ON public.id_tenant_reward_wheel_configs;
CREATE POLICY "Tenant admins manage reward wheel config" ON public.id_tenant_reward_wheel_configs
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.id_team
            WHERE user_id = auth.uid()
            AND tenant_id = id_tenant_reward_wheel_configs.tenant_id
            AND status = 'ACTIVE'
            AND role IN ('OWNER', 'DEALERSHIP_ADMIN', 'SUPER_ADMIN', 'MARKETPLACE_ADMIN', 'ADMIN')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.id_team
            WHERE user_id = auth.uid()
            AND tenant_id = id_tenant_reward_wheel_configs.tenant_id
            AND status = 'ACTIVE'
            AND role IN ('OWNER', 'DEALERSHIP_ADMIN', 'SUPER_ADMIN', 'MARKETPLACE_ADMIN', 'ADMIN')
        )
    );
