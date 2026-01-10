-- 1. Tenant Config (Retry)
ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS config jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS tenants_config_gin
ON public.tenants USING gin (config);

-- 2. Invitations Table
CREATE TYPE invitation_status AS ENUM ('PENDING', 'SENT', 'ACCEPTED', 'EXPIRED', 'REVOKED');

CREATE TABLE IF NOT EXISTS public.invitations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
    email text NOT NULL,
    role text NOT NULL, -- 'DEALER_ADMIN', 'SALES_EXEC', etc.
    token_hash text NOT NULL, -- Store hashed token for security
    status invitation_status DEFAULT 'PENDING',
    created_by uuid REFERENCES auth.users(id),
    accepted_by uuid REFERENCES auth.users(id),
    expires_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- RLS for Invitations
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Admin can see/manage invites for their tenant
CREATE POLICY "Admins can view tenant invites" ON public.invitations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.memberships m
            WHERE m.user_id = auth.uid()
            AND m.tenant_id = invitations.tenant_id
            AND m.role IN ('DEALER_OWNER', 'DEALER_ADMIN', 'SUPER_ADMIN')
        )
    );

CREATE POLICY "Admins can insert tenant invites" ON public.invitations
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.memberships m
            WHERE m.user_id = auth.uid()
            AND m.tenant_id = invitations.tenant_id
            AND m.role IN ('DEALER_OWNER', 'DEALER_ADMIN', 'SUPER_ADMIN')
        )
    );

CREATE POLICY "Admins can update tenant invites" ON public.invitations
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.memberships m
            WHERE m.user_id = auth.uid()
            AND m.tenant_id = invitations.tenant_id
            AND m.role IN ('DEALER_OWNER', 'DEALER_ADMIN', 'SUPER_ADMIN')
        )
    );

-- 3. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
    actor_id uuid REFERENCES auth.users(id),
    action text NOT NULL, -- 'INVITE_CREATED', 'ROLE_UPDATED'
    entity_type text NOT NULL, -- 'INVITATION', 'MEMBERSHIP'
    entity_id text,
    metadata jsonb DEFAULT '{}'::jsonb,
    ip_address text,
    user_agent text,
    created_at timestamptz DEFAULT now()
);

-- RLS for Audit Logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view tenant audit logs" ON public.audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.memberships m
            WHERE m.user_id = auth.uid()
            AND m.tenant_id = audit_logs.tenant_id
            AND m.role IN ('DEALER_OWNER', 'DEALER_ADMIN', 'SUPER_ADMIN')
        )
    );

-- Only System/Server can insert audit logs? Or Admins too?
-- For now, allow auth users to insert if they belong to the tenant (logging their own actions)
CREATE POLICY "Users can insert audit logs" ON public.audit_logs
    FOR INSERT
    WITH CHECK (
        auth.uid() = actor_id
        AND
        EXISTS (
            SELECT 1 FROM public.memberships m
            WHERE m.user_id = auth.uid()
            AND m.tenant_id = audit_logs.tenant_id
        )
    );
