import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ProfileClient from './ProfileClient';

import { getAuthUser } from '@/lib/auth/resolver';

export default async function ProfilePage() {
    const user = await getAuthUser();
    const supabase = await createClient();

    if (!user) {
        redirect('/login?next=/profile');
    }
    const { data: member } = await supabase.from('id_members').select('*').eq('id', user.id).maybeSingle();

    // 2. Fetch User Memberships (to see roles/tenants)
    const { data: rawMemberships } = await supabase.rpc('get_user_memberships', { p_user_id: user.id });

    // 3. Fetch Quotes for the user
    // We join with crm_leads to filter by customer_id which is the user's member ID
    const { data: quotes } = await supabase
        .from('crm_quotes')
        .select(
            `
            *,
            crm_leads!inner (
                customer_name,
                phone,
                customer_id
            )
        `
        )
        .eq('crm_leads.customer_id', user.id)
        .order('created_at', { ascending: false });

    // 4. Fetch Addresses for the member
    const { data: addresses } = await supabase
        .from('id_member_addresses')
        .select('*')
        .eq('member_id', user.id)
        .order('created_at', { ascending: false });

    return (
        <ProfileClient
            user={user}
            member={member}
            memberships={rawMemberships || []}
            quotes={quotes || []}
            addresses={addresses || []}
        />
    );
}
