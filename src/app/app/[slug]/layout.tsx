import { redirect } from 'next/navigation';
import ShellLayout from '@/components/layout/ShellLayout';
import TenantHydrator from '@/components/tenant/TenantHydrator';
import { createClient } from '@/lib/supabase/server';
import { TenantType, TenantProvider } from '@/lib/tenant/tenantContext';
import { CelebrationProvider } from '@/components/providers/CelebrationProvider';

interface Tenant {
    id: string;
    name: string;
    slug: string;
    type: string;
    config: any;
}

interface Membership {
    id: string;
    role: string;
    status: string;
    tenant_id: string;
    user_id: string;
    tenants?: Tenant;
    id_tenants?: Tenant | Tenant[];
    tenant_name?: string;
    tenant_slug?: string;
    tenant_type?: string;
    tenant_config?: any;
    [key: string]: any;
}

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let memberships = (Array.isArray(rawMemberships) ? rawMemberships : []).map((m: any) => ({
        ...m,
        tenants: {
            id: m.tenant_id,
            name: m.tenant_name || '',
            slug: m.tenant_slug || '',
            type: m.tenant_type || '',
            config: m.tenant_config,
        },
    }));

    if (memberships.length === 0) {
        const { data: fallbackMemberships } = await supabase
            .from('id_team')
            .select('role, status, id_tenants!inner(id, name, slug, type, config)')
            .eq('user_id', user.id)
            .eq('status', 'ACTIVE');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        memberships = (fallbackMemberships || []).map((m: any) => ({
            ...m,
            tenants: Array.isArray(m.id_tenants) ? m.id_tenants[0] : m.id_tenants,
        }));
    }

    // 2. Identify the matching membership for this slug
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let matched = memberships.find((m: any) => {
        const tenantSlug = (m.tenants?.slug || m.tenant_slug || '').toLowerCase();
        const mStatus = (m.status || 'ACTIVE').toUpperCase(); // Default to ACTIVE if field missing
        return tenantSlug === normalizedSlug && mStatus === 'ACTIVE';
    });

    // 3. SPECIAL BYPASS: AUMS Admin Access
    if (!matched && normalizedSlug === 'aums') {
        const adminRoles = ['SUPER_ADMIN', 'SUPERADMIN', 'ADMIN', 'MARKETPLACE_ADMIN', 'OWNER'];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        matched = memberships.find((m: any) => {
            const userRole = (m.role || '').toUpperCase();
            const mStatus = (m.status || 'ACTIVE').toUpperCase();
            return adminRoles.includes(userRole) && mStatus === 'ACTIVE';
        });

        if (matched) {
            console.log(`[ACL] AUMS Bypass triggered for user ${user.email} with role ${matched.role}`);
        }
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
        <TenantProvider>
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
            <CelebrationProvider>
                <ShellLayout>{children}</ShellLayout>
            </CelebrationProvider>
        </TenantProvider>
    );
}
