import { redirect } from 'next/navigation';
import FinancePartnersPage from '@/app/dashboard/finance-partners/page';
import { createClient } from '@/lib/supabase/server';

export default async function ScopedFinancePartnersPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    if ((slug || '').toLowerCase() !== 'aums') {
        redirect('/403');
    }

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login?next=/app/aums/dashboard/finance-partners');
    }

    const { data: membership } = await supabase
        .from('id_team')
        .select('id, id_tenants!inner(slug)')
        .eq('user_id', user.id)
        .eq('status', 'ACTIVE')
        .in('role', ['SUPER_ADMIN', 'SUPERADMIN'])
        .eq('id_tenants.slug', 'aums')
        .limit(1)
        .maybeSingle();

    if (!membership) {
        redirect('/403');
    }

    return <FinancePartnersPage />;
}
