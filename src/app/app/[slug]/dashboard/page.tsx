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

    // Verify tenant exists and user has access
    const { data: membership } = await supabase
        .from('memberships')
        .select('*, tenants!inner(*)')
        .eq('user_id', user.id)
        .eq('tenants.slug', slug)
        .eq('status', 'ACTIVE')
        .single();

    if (!membership) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
                    <p>You don&apos;t have permission to access this tenant.</p>
                </div>
            </div>
        );
    }

    // Map role enum to friendly label
    const roleLabel =
        {
            OWNER: 'Owner',
            ADMIN: 'Admin',
            STAFF: 'Staff',
            DEALERSHIP_ADMIN: 'Admin',
        }[membership.role] || membership.role;

    return (
        <div className="p-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">{membership.tenants.name}</h1>
                <p className="text-gray-600">
                    Welcome back! Your role: <span className="font-medium">{roleLabel}</span>
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
