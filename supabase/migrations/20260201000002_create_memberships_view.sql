-- Compatibility views for legacy policies/functions referencing memberships/tenants

DO $$
BEGIN
    IF to_regclass('public.memberships') IS NULL THEN
        CREATE VIEW public.memberships AS
        SELECT
            id,
            user_id,
            tenant_id,
            role,
            status,
            created_at,
            NULL::timestamptz AS updated_at
        FROM public.id_team;
    END IF;

    IF to_regclass('public.tenants') IS NULL THEN
        CREATE VIEW public.tenants AS
        SELECT
            id,
            name,
            slug,
            type,
            config,
            status,
            created_at
        FROM public.id_tenants;
    END IF;
END $$;
