import { redirect } from 'next/navigation';
import ShellLayout from '@/components/layout/ShellLayout';
import TenantHydrator from '@/components/tenant/TenantHydrator';
import { createClient } from '@/lib/supabase/server';
import { TenantType } from '@/lib/tenant/tenantContext';

export default async function TenantDashboardLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ slug: string }>;
}) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { slug } = await params;
    const normalizedSlug = slug.toLowerCase();

    if (!user) {
        redirect(`/login?next=/app/${slug}/dashboard`);
    }
    const { data: rawMemberships } = await supabase
        .rpc('get_user_memberships', { p_user_id: user.id });

    let memberships = (Array.isArray(rawMemberships) ? rawMemberships : []).map((m: any) => ({
        ...m,
        tenants: {
            id: m.tenant_id,
            name: m.tenant_name,
            slug: m.tenant_slug,
            type: m.tenant_type,
            config: m.tenant_config,
        },
    }));

    if (memberships.length === 0) {
        const { data: fallbackMemberships } = await supabase
            .from('memberships')
            .select('role, status, tenants!inner(id, name, slug, type, config)')
            .eq('user_id', user.id)
            .eq('status', 'ACTIVE');

        memberships = (fallbackMemberships || []).map((m: any) => ({
            ...m,
            tenants: Array.isArray(m.tenants) ? m.tenants[0] : m.tenants,
        }));
    }

    let matched = memberships.find((m: any) =>
        (m.tenants?.slug || '').toLowerCase() === normalizedSlug &&
        (m.status || '').toUpperCase() === 'ACTIVE'
    );
    if (!matched && normalizedSlug === 'aums') {
        const adminRoles = ['SUPER_ADMIN', 'SUPERADMIN', 'ADMIN', 'MARKETPLACE_ADMIN', 'OWNER'];
        // Ensure AUMS access is also restricted to ACTIVE memberships
        matched = memberships.find((m: any) =>
            adminRoles.includes((m.role || '').toUpperCase()) &&
            (m.status || '').toUpperCase() === 'ACTIVE'
        );
    }
    if (!matched) redirect('/403');

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();

    const resolvedName = profile?.full_name
        || user.user_metadata?.full_name
        || user.user_metadata?.name
        || user.email?.split('@')[0]
        || 'User';
    const tenantType = (matched.tenants?.type === 'SUPER_ADMIN' ? 'AUMS' : matched.tenants?.type) as TenantType;

    return (
        <>
            <TenantHydrator
                userName={resolvedName}
                role={matched.role}
                tenantId={matched.tenants?.id || null}
                tenantName={matched.tenants?.name || null}
                tenantSlug={matched.tenants?.slug || null}
                tenantType={tenantType}
                tenantConfig={matched.tenants?.config || null}
                memberships={memberships}
            />
            <ShellLayout>{children}</ShellLayout>
        </>
    );
}
