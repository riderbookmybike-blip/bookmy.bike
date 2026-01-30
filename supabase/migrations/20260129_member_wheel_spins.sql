-- Member reward wheel spins
CREATE TABLE IF NOT EXISTS public.id_member_spins (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id uuid REFERENCES public.id_members(id) ON DELETE CASCADE,
    tenant_id uuid REFERENCES public.id_tenants(id) ON DELETE SET NULL,
    booking_id uuid,
    status text NOT NULL DEFAULT 'ELIGIBLE',
    eligible_reason text,
    eligible_at timestamptz DEFAULT now(),
    expires_at timestamptz,
    spun_at timestamptz,
    reward_id text,
    reward_label text,
    reward_value numeric,
    reward_kind text,
    reward_payload jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_member_spins_member
    ON public.id_member_spins(member_id);

CREATE INDEX IF NOT EXISTS idx_member_spins_status
    ON public.id_member_spins(status);

CREATE INDEX IF NOT EXISTS idx_member_spins_tenant
    ON public.id_member_spins(tenant_id);

ALTER TABLE public.id_member_spins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members read own spins" ON public.id_member_spins;
CREATE POLICY "Members read own spins" ON public.id_member_spins
    FOR SELECT TO authenticated
    USING (member_id = auth.uid());
