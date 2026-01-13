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

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">{membership.tenants.name} Dashboard</h1>
            <p className="text-gray-600">
                Welcome to {slug} portal! Role: {membership.role}
            </p>
        </div>
    );
}
