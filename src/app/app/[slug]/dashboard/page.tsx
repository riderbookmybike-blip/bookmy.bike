import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminDashboard from '@/components/dashboard/AdminDashboard';

export default async function TenantDashboard(props: { params: Promise<{ slug: string }> }) {
    const params = await props.params;
    const { slug } = params;
    const normalizedSlug = slug.toLowerCase();
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect(`/login?next=/app/${slug}/dashboard`);
    }

    // 1. Fetch all memberships for the user via secure RPC
    // Handling JSONB return for maximum flexibility and to avoid schema mismatch errors
    const { data: rawMembershipsData, error: rpcError } = await supabase
        .rpc('get_user_memberships', { p_user_id: user.id });

    // Identify if we got an array (new JSONB approach) or direct data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let allMemberships = (Array.isArray(rawMembershipsData) ? rawMembershipsData : []).map((m: any) => ({
        ...m,
        tenants: {
            id: m.tenant_id,
            name: m.tenant_name,
            slug: m.tenant_slug,
            type: m.tenant_type,
            config: m.tenant_config,
        }
    }));

    if (allMemberships.length === 0) {
        const { data: fallbackMemberships } = await supabase
            .from('id_team')
            .select('role, status, id_tenants!inner(id, name, slug, type, config)')
            .eq('user_id', user.id)
            .eq('status', 'ACTIVE');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        allMemberships = (fallbackMemberships || []).map((m: any) => ({
            ...m,
            tenants: Array.isArray(m.id_tenants) ? m.id_tenants[0] : m.id_tenants,
        }));
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    allMemberships = allMemberships.filter((m: any) => (m.status || '').toUpperCase() === 'ACTIVE');


    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const directMembership = (allMemberships || []).find((m: any) =>
        (m.tenants?.slug || '').toLowerCase() === normalizedSlug
    );
    let effectiveMembership = directMembership;

    // FAIL-SAFE: If no direct membership exists for this specific slug, 
    // AND the slug is 'aums', check if the user has any admin-level role in the system.
    if (!directMembership && normalizedSlug === 'aums' && allMemberships.length > 0) {
        // Strict list of roles allowed to bypass for AUMS management portal
        const adminRoles = ['SUPER_ADMIN', 'SUPERADMIN', 'ADMIN', 'MARKETPLACE_ADMIN', 'OWNER'];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                        <a href="/login" className="px-6 py-3 bg-brand-primary text-slate-900 rounded-lg text-sm font-black uppercase tracking-wider shadow-lg shadow-brand-primary/20">
                            Switch Account // Login
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    const { tenants: tenant } = effectiveMembership;

    // Map role enum to friendly label
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

    return (
        <div className="p-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">{tenant.name}</h1>
                <p className="text-gray-600 dark:text-slate-400">
                    Welcome back! Your role: <span className="font-medium text-brand-primary">{roleLabel}</span>
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow">
                    <h3 className="font-semibold mb-2">Quick Stats</h3>
                    <p className="text-gray-600 dark:text-slate-400">Dashboard content coming soon...</p>
                </div>
            </div>
        </div>
    );
}
