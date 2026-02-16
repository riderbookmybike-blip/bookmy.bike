import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import ShellLayout from '@/components/layout/ShellLayout';
import TenantHydrator from '@/components/tenant/TenantHydrator';
import { createClient } from '@/lib/supabase/server';

import { TenantType, TenantProvider, TenantConfig, Membership } from '@/lib/tenant/tenantContext';
import { CelebrationProvider } from '@/components/providers/CelebrationProvider';
import { getAuthUser } from '@/lib/auth/resolver';

// Dynamic browser tab title + favicon — shows tenant name and logo
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const supabase = await createClient();
    const { data: tenant } = await supabase
        .from('id_tenants')
        .select('name, logo_url, favicon_url')
        .eq('slug', slug.toLowerCase())
        .maybeSingle();
    const tenantName = tenant?.name || slug.toUpperCase();
    const faviconUrl = tenant?.favicon_url || tenant?.logo_url;
    return {
        title: tenantName,
        ...(faviconUrl
            ? {
                  icons: {
                      icon: faviconUrl,
                      apple: faviconUrl,
                  },
              }
            : {}),
    };
}

interface Tenant {
    id: string;
    name: string;
    slug: string;
    type: string;
    config: TenantConfig;
}

interface LocalMembership extends Omit<Membership, 'tenants'> {
    tenants?: Tenant;
    tenant_id: string; // Ensure it's required locally
    user_id: string; // Ensure it's required locally
    tenant_name?: string;
    tenant_slug?: string;
    tenant_type?: string;
    tenant_config?: TenantConfig;
}

export default async function TenantDashboardLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ slug: string }>;
}) {
    const user = await getAuthUser();
    const supabase = await createClient();

    const { slug } = await params;
    const normalizedSlug = slug.toLowerCase();

    if (!user) {
        redirect(`/login?next=/app/${slug}/dashboard`);
    }
    const { data: rawMemberships } = await supabase.rpc('get_user_memberships', { p_user_id: user.id });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const memberships: LocalMembership[] = (Array.isArray(rawMemberships) ? rawMemberships : []).map((m: any) => ({
        ...m,
        id: m.id || `${m.user_id || user.id}:${m.tenant_id}:${m.role || 'MEMBER'}`,
        tenants: {
            id: m.tenant_id,
            name: m.tenant_name || '',
            slug: m.tenant_slug || '',
            type: m.tenant_type || '',
            config: (m.tenant_config as unknown as TenantConfig) || ({} as TenantConfig),
        },
    }));

    if (memberships.length === 0) {
        const { data: fallbackMemberships } = await supabase
            .from('id_team')
            .select('id, user_id, tenant_id, role, status, id_tenants!inner(id, name, slug, type, config)')
            .eq('user_id', user.id)
            .eq('status', 'ACTIVE');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fallback = (fallbackMemberships || []).map((m: any) => {
            const t = Array.isArray(m.id_tenants) ? m.id_tenants[0] : m.id_tenants;
            return {
                ...m,
                tenants: t as Tenant,
            };
        });
        memberships.push(...fallback);
    }

    // 2.5 CROSS-TENANT ACCESS: Check for Finance Partner staff granted CRM access to this dealer
    const { data: crossMemberships } = await supabase
        .from('dealer_finance_user_access')
        .select(
            `
            user_id,
            dealer_tenant_id,
            id_tenants:dealer_tenant_id (
                id, name, slug, type, config
            )
        `
        )
        .eq('user_id', user.id)
        .eq('crm_access', true);

    if (crossMemberships && crossMemberships.length > 0) {
        const mappedCross = crossMemberships.map((m: any) => ({
            id: `cross:${m.user_id}:${m.dealer_tenant_id}`,
            user_id: m.user_id,
            tenant_id: m.dealer_tenant_id,
            role: 'BANK_STAFF', // Using BANK_STAFF role for financer personnel
            status: 'ACTIVE',
            tenants: m.id_tenants as Tenant,
        }));
        memberships.push(...mappedCross);
    }

    let matched = memberships.find((m: LocalMembership) => {
        const tenantSlug = (m.tenants?.slug || m.tenant_slug || '').toLowerCase();
        const mStatus = (m.status || 'ACTIVE').toUpperCase(); // Default to ACTIVE if field missing
        return tenantSlug === normalizedSlug && mStatus === 'ACTIVE';
    });

    // 3. SPECIAL BYPASS: AUMS Admin Access
    if (!matched && normalizedSlug === 'aums') {
        const adminRoles = ['SUPER_ADMIN', 'SUPERADMIN', 'ADMIN', 'MARKETPLACE_ADMIN', 'OWNER'];
        matched = memberships.find((m: LocalMembership) => {
            const userRole = (m.role || '').toUpperCase();
            const mStatus = (m.status || 'ACTIVE').toUpperCase();
            return adminRoles.includes(userRole) && mStatus === 'ACTIVE';
        });

        if (matched) {
            console.log(`[ACL] AUMS Bypass triggered for user ${user.email} with role ${matched.role}`);
        }
    }
    if (!matched) redirect('/403');

    const { data: profile } = await supabase.from('id_members').select('full_name').eq('id', user.id).maybeSingle();

    const resolvedName =
        profile?.full_name ||
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split('@')[0] ||
        'User';
    const tenantConfig = (matched.tenants?.config as unknown as TenantConfig) || null;
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
                tenantConfig={tenantConfig}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                memberships={memberships as any}
            />
            <CelebrationProvider>
                <ShellLayout>{children}</ShellLayout>
            </CelebrationProvider>
        </TenantProvider>
    );
}
