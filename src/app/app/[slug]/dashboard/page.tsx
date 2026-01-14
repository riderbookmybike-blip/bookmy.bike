import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function TenantDashboard({ params }: { params: { slug: string } }) {
    const { slug } = params;
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // 1. Fetch all memberships for the user via secure RPC
    // Handling JSONB return for maximum flexibility and to avoid schema mismatch errors
    const { data: rawMembershipsData, error: rpcError } = await supabase
        .rpc('get_user_memberships', { p_user_id: user.id });

    // Identify if we got an array (new JSONB approach) or direct data
    const membershipsArray = Array.isArray(rawMembershipsData) ? rawMembershipsData : [];

    // Map RPC results to expected format
    const allMemberships = membershipsArray.map((m: any) => ({
        ...m,
        tenants: {
            name: m.tenant_name,
            slug: m.tenant_slug,
            type: m.tenant_type
        }
    }));


    const directMembership = (allMemberships || []).find((m: any) => m.tenants?.slug === slug);
    let effectiveMembership = directMembership;

    // FAIL-SAFE: If no direct membership exists for this specific slug, 
    // AND the slug is 'aums', check if the user has any admin-level role in the system.
    if (!directMembership && slug === 'aums' && allMemberships.length > 0) {
        // Strict list of roles allowed to bypass for AUMS management portal
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

                    {/* Debug Info (Only visible in 403 state) */}
                    <div className="mt-8 p-4 bg-slate-50 rounded-lg text-xs text-slate-400 text-left max-w-md mx-auto font-mono">
                        <p>User Context: {user.email}</p>
                        <p>Requested Slug: {slug}</p>
                        <p>Memberships Found: {allMemberships.length}</p>
                        {allMemberships.length > 0 && (
                            <p>Available Roles: {allMemberships.map((m: any) => m.role).join(', ')}</p>
                        )}
                        {rpcError && <p className="text-red-400">RPC Error: {rpcError.message}</p>}
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

    return (
        <div className="p-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">{tenant.name}</h1>
                <p className="text-gray-600">
                    Welcome back! Your role: <span className="font-medium text-brand-primary">{roleLabel}</span>
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="font-semibold mb-2">Quick Stats</h3>
                    <p className="text-gray-600">Dashboard content coming soon...</p>
                </div>
            </div>
        </div>
    );
}
