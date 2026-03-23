import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ 'campaign-id': string }> }) {
    // ── Auth guard ───────────────────────────────────────────────────────────
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

    // Fetch logs + recipient delivery aggregates in parallel
    const [logsRes, recipientsRes] = await Promise.all([
        adminClient
            .from('cam_whatsapp_logs')
            .select('*')
            .eq('campaign_id', campaignId)
            .order('batch_number', { ascending: false }),
        adminClient
            .from('cam_whatsapp_recipients')
            .select('batch_log_id, delivered_at, read_at, clicked_at')
            .eq('campaign_id', campaignId)
            .not('batch_log_id', 'is', null),
    ]);

    if (logsRes.error) {
        console.error('[CampaignLogsAPI] error:', logsRes.error);
        return NextResponse.json({ error: logsRes.error.message }, { status: 500 });
    }

    // Aggregate per batch_log_id
    const aggMap = new Map<string, { delivered: number; read: number; clicked: number }>();
    for (const r of recipientsRes.data ?? []) {
        if (!r.batch_log_id) continue;
        const prev = aggMap.get(r.batch_log_id) ?? { delivered: 0, read: 0, clicked: 0 };
        if (r.delivered_at) prev.delivered++;
        if (r.read_at) prev.read++;
        if (r.clicked_at) prev.clicked++;
        aggMap.set(r.batch_log_id, prev);
    }

    const logs = (logsRes.data ?? []).map(row => {
        const agg = aggMap.get(row.id) ?? { delivered: 0, read: 0, clicked: 0 };
        return { ...row, delivered_count: agg.delivered, read_count: agg.read, clicked_count: agg.clicked };
    });

    return NextResponse.json({ logs });
}
