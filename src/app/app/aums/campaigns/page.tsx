import { adminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { CampaignsListClient } from '@/components/modules/campaigns/CampaignsListClient';

export const metadata: Metadata = {
    title: 'WhatsApp Campaigns — AUMS',
};

export default async function AumsCampaignsPage() {
    // ── Role guard ───────────────────────────────────────────────────────────
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) notFound();

    const { data: membership } = await supabase
        .from('id_team')
        .select('role, id_tenants!inner(slug)')
        .eq('user_id', user.id)
        .eq('id_tenants.slug', 'aums')
        .eq('status', 'ACTIVE')
        .maybeSingle();

    const role = (membership?.role ?? '').toUpperCase();
    if (!['SUPER_ADMIN', 'OWNER', 'ADMIN'].includes(role)) notFound();
    // ────────────────────────────────────────────────────────────────────────

    const { data: campaigns } = await adminClient
        .from('cam_whatsapp_campaigns')
        .select('id, name, status, template_name, eligible_count, sent_count, failed_count, created_at')
        .order('created_at', { ascending: false });

    return (
        <CampaignsListClient campaigns={(campaigns ?? []) as Parameters<typeof CampaignsListClient>[0]['campaigns']} />
    );
}
