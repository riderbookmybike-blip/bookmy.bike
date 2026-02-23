import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth/resolver';
import AriaDashboard from '@/components/dashboard/aria/AriaDashboard';
import {
    getDashboardSkuTrends,
    getDealerCrmInsights,
    getDealerDashboardKpis,
    getPlatformDashboardKpis,
} from '@/actions/dashboardKpis';
import { getRecentEvents } from '@/actions/analytics';

export default async function TenantDashboard(props: { params: Promise<{ slug: string }> }) {
    const params = await props.params;
    const { slug } = params;
    const normalizedSlug = slug.toLowerCase();

    const user = await getAuthUser();
    const supabase = await createClient();

    if (!user) {
        redirect(`/login?next=/app/${slug}/dashboard`);
    }

    // 1. Fetch all memberships
    const { data: rawMembershipsData } = await supabase.rpc('get_user_memberships', { p_user_id: user.id });

    let allMemberships = (Array.isArray(rawMembershipsData) ? rawMembershipsData : []).map((m: any) => ({
        ...m,
        tenants: {
            id: m.tenant_id,
            name: m.tenant_name,
            slug: m.tenant_slug,
            type: m.tenant_type,
            config: m.tenant_config,
        },
    }));

    if (allMemberships.length === 0) {
        const { data: fallbackMemberships } = await supabase
            .from('id_team')
            .select('role, status, id_tenants!inner(id, name, slug, type, config)')
            .eq('user_id', user.id)
            .eq('status', 'ACTIVE');

        allMemberships = (fallbackMemberships || []).map((m: any) => ({
            ...m,
            tenants: Array.isArray(m.id_tenants) ? m.id_tenants[0] : m.id_tenants,
        }));
    }

    allMemberships = allMemberships.filter((m: any) => (m.status || '').toUpperCase() === 'ACTIVE');

    const directMembership = (allMemberships || []).find(
        (m: any) => (m.tenants?.slug || '').toLowerCase() === normalizedSlug
    );
    let effectiveMembership = directMembership;

    if (!directMembership && normalizedSlug === 'aums' && allMemberships.length > 0) {
        const adminRoles = ['SUPER_ADMIN', 'SUPERADMIN', 'ADMIN', 'MARKETPLACE_ADMIN', 'OWNER'];
        effectiveMembership = allMemberships.find((m: any) => {
            const userRole = (m.role || '').toUpperCase();
            return adminRoles.includes(userRole);
        });
    }

    if (!effectiveMembership) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="text-center p-12 bg-white rounded-[2rem] shadow-xl">
                    <h1 className="text-2xl font-black text-slate-900 mb-4 tracking-tighter italic">
                        403_ACCESS_DENIED
                    </h1>
                    <p className="text-slate-400 mb-4 max-w-sm">
                        Node authentication successful, but authorization is missing for this sector.
                    </p>
                </div>
            </div>
        );
    }

    const { tenants: tenant } = effectiveMembership;

    const roleMap: Record<string, string> = {
        OWNER: 'Owner',
        ADMIN: 'Admin',
        STAFF: 'Staff',
        DEALERSHIP_ADMIN: 'Admin',
        SUPER_ADMIN: 'Super Admin',
        SUPERADMIN: 'Super Admin',
    };
    const roleLabel = roleMap[effectiveMembership.role] || effectiveMembership.role;

    // Resolve Persona and Fetch Live Data
    let initialPersona: 'AUMS' | 'DEALERSHIP' | 'FINANCER' = 'DEALERSHIP';
    let kpis = null;
    let skuTrends = null;
    let crmInsights = null;

    if (slug === 'aums' || tenant.type === 'MARKETPLACE') {
        initialPersona = 'AUMS';
        [kpis, skuTrends] = await Promise.all([getPlatformDashboardKpis(), getDashboardSkuTrends(null, 5)]);
    } else if (tenant.type === 'BANK') {
        initialPersona = 'FINANCER';
        [kpis, skuTrends] = await Promise.all([getDealerDashboardKpis(tenant.id), getDashboardSkuTrends(tenant.id, 5)]);
    } else {
        [kpis, skuTrends, crmInsights] = await Promise.all([
            getDealerDashboardKpis(tenant.id),
            getDashboardSkuTrends(tenant.id, 5),
            getDealerCrmInsights(tenant.id),
        ]);
    }

    const recentEvents = await getRecentEvents(10);

    return (
        <AriaDashboard
            initialPersona={initialPersona}
            tenantName={tenant.name || 'Command Node'}
            roleLabel={roleLabel}
            kpis={kpis}
            recentEvents={recentEvents}
            skuTrends={skuTrends}
            crmInsights={crmInsights}
        />
    );
}
