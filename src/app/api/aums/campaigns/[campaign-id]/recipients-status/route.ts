import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ 'campaign-id': string }> }) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const { data: membership } = await supabase
        .from('id_team')
        .select('role, id_tenants!inner(slug)')
        .eq('user_id', user.id)
        .eq('id_tenants.slug', 'aums')
        .eq('status', 'ACTIVE')
        .maybeSingle();

    const role = (membership?.role ?? '').toUpperCase();
    if (!['SUPER_ADMIN', 'OWNER', 'ADMIN'].includes(role)) {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const { 'campaign-id': campaignId } = await params;
    if (!campaignId) return NextResponse.json({ error: 'campaign-id required' }, { status: 400 });

    const { data, error } = await adminClient
        .from('cam_whatsapp_recipients')
        .select('id, send_status, delivered_at, read_at, clicked_at, signup_at, login_at')
        .eq('campaign_id', campaignId);

    if (error) {
        console.error('[CampaignRecipientsStatusAPI] error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ recipients: data ?? [] });
}
