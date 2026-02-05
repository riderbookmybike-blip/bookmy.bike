import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import DealerDashboard from '@/components/dashboard/DealerDashboard';

import { getAuthUser } from '@/lib/auth/resolver';

export default async function TenantDashboard(props: { params: Promise<{ slug: string }> }) {
    const params = await props.params;
    const { slug } = params;
    const normalizedSlug = slug.toLowerCase();

    const user = await getAuthUser();
    const supabase = await createClient();

    if (!user) {
        redirect(`/login?next=/app/${slug}/dashboard`);
    }

    // 1. Fetch all memberships for the user via secure RPC
    const { data: rawMembershipsData } = await supabase.rpc('get_user_memberships', { p_user_id: user.id });

    // Identify if we got an array (new JSONB approach) or direct data
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
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">403 ACCESS DENIED</h1>
                    <p className="mb-4">You are authenticated, but you do not have permission to access this portal.</p>

                    <div className="mt-8 p-4 bg-slate-50 rounded-lg text-xs text-slate-400 text-left max-w-md mx-auto font-mono">
                        <p>User Context: {user.email}</p>
                        <p>Requested Slug: {slug}</p>
                    </div>

                    <div className="mt-8">
                        <a
                            href="/login"
                            className="px-6 py-3 bg-brand-primary text-slate-900 rounded-lg text-sm font-black uppercase tracking-wider shadow-lg shadow-brand-primary/20"
                        >
                            Switch Account // Login
                        </a>
                    </div>
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

    if (slug === 'aums') {
        return <AdminDashboard />;
    }

    return <DealerDashboard tenant={tenant} role={effectiveMembership.role} roleLabel={roleLabel} />;
}
