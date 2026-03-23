import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCampaign, getCampaignLogs, getCampaignRecipients } from '@/actions/wa-campaign';
import { WaCampaignPage } from '@/components/modules/campaigns/WaCampaignPage';

interface Props {
    params: Promise<{ 'campaign-id': string }>;
}

export default async function AumsCampaignDetailPage({ params }: Props) {
    const { 'campaign-id': campaignId } = await params;

    // ── Role guard: require AUMS admin ──────────────────────────────────────
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: membership } = await supabase
        .from('id_team')
        .select('role, id_tenants!inner(slug)')
        .eq('user_id', user.id)
        .eq('id_tenants.slug', 'aums')
        .eq('status', 'ACTIVE')
        .maybeSingle();

    const role = (membership?.role ?? '').toUpperCase();
    if (!['SUPER_ADMIN', 'OWNER', 'ADMIN'].includes(role)) redirect('/login');
    // ───────────────────────────────────────────────────────────────────────

    const [campaign, logs, recipients] = await Promise.all([
        getCampaign(campaignId),
        getCampaignLogs(campaignId),
        getCampaignRecipients(campaignId),
    ]);

    if (!campaign) {
        redirect('/app/aums/campaigns');
    }

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
            {/* Breadcrumb */}
            <div className="shrink-0 bg-white border-b border-slate-200 px-8 py-3.5">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <a href="/app/aums/campaigns" className="hover:text-slate-700 transition-colors">
                        Campaigns
                    </a>
                    <span>›</span>
                    <span className="text-slate-700 font-semibold">{campaign.name}</span>
                </div>
            </div>
            <div className="flex-1 min-h-0 overflow-auto">
                <WaCampaignPage initialCampaign={campaign} initialLogs={logs} initialRecipients={recipients} />
            </div>
        </div>
    );
}

export async function generateMetadata({ params }: Props) {
    const { 'campaign-id': campaignId } = await params;
    const campaign = await getCampaign(campaignId);
    return {
        title: campaign ? `${campaign.name} — AUMS Campaign` : 'Campaign Not Found',
    };
}
