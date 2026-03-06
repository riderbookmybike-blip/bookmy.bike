import { redirect } from 'next/navigation';
import FinancePartnerDetailPage from '@/app/dashboard/finance-partners/[id]/page';
import { createClient } from '@/lib/supabase/server';

export default async function ScopedFinancePartnerDetailPage({
    params,
}: {
    params: Promise<{ slug: string; id: string }>;
}) {
    const { slug, id } = await params;
    if ((slug || '').toLowerCase() !== 'aums') {
        redirect('/403');
    }

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
        redirect(`/login?next=/app/aums/dashboard/finance-partners/${id}`);
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

    return <FinancePartnerDetailPage params={Promise.resolve({ id })} />;
}
