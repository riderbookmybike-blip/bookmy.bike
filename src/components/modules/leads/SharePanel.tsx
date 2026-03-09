'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Share2, Trash2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { requestLeadShareAction, revokeLeadShareAction } from '@/actions/crmShares';

// Valid statuses as per DB CHECK: PENDING | APPROVED | REJECTED | REVOKED
type ShareStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED';

const STATUS_STYLE: Record<ShareStatus, string> = {
    PENDING: 'bg-amber-500/10 text-amber-600',
    APPROVED: 'bg-emerald-500/10 text-emerald-600',
    REJECTED: 'bg-rose-500/10 text-rose-600',
    REVOKED: 'bg-slate-500/10 text-slate-500',
};

export default function SharePanel({ leadId }: { leadId: string }) {
    const [shares, setShares] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [tenants, setTenants] = useState<any[]>([]);
    const [selectedTenant, setSelectedTenant] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const supabase = createClient();

    const fetchShares = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('crm_dealer_shares')
            .select('id, status, share_type, is_primary, created_at: shared_at, dealer_tenant_id')
            .eq('lead_id', leadId)
            .order('shared_at', { ascending: false });

        if (!error && data) {
            // Fetch tenant names separately (no FK join to avoid RLS stacking)
            const tenantIds = [...new Set(data.map((d: any) => d.dealer_tenant_id).filter(Boolean))];
            let tenantMap: Record<string, string> = {};
            if (tenantIds.length > 0) {
                const { data: tenantData } = await supabase.from('id_tenants').select('id, name').in('id', tenantIds);
                if (tenantData) {
                    tenantMap = Object.fromEntries(tenantData.map((t: any) => [t.id, t.name]));
                }
            }
            setShares(data.map((s: any) => ({ ...s, tenantName: tenantMap[s.dealer_tenant_id] || 'Unknown Partner' })));
        }
        setLoading(false);
    };

    const fetchTenants = async () => {
        const { data } = await supabase
            .from('id_tenants')
            .select('id, name, type')
            .in('type', ['DEALERSHIP', 'BANK', 'FRANCHISE'])
            .order('name');
        if (data) setTenants(data);
    };

    useEffect(() => {
        fetchShares();
        fetchTenants();
    }, [leadId]);

    const handleShare = async () => {
        if (!selectedTenant) {
            toast.error('Please select a dealer or bank to share with');
            return;
        }
        setSubmitting(true);
        const result = await requestLeadShareAction({
            leadId,
            targetTenantId: selectedTenant,
            shareType: 'MANUAL_REQUEST',
        });

        if (result.success) {
            toast.success('Share requested successfully');
            setSelectedTenant('');
            fetchShares();
        } else {
            toast.error(result.message || 'Failed to request share');
        }
        setSubmitting(false);
    };

    const handleRevoke = async (shareId: string) => {
        if (!window.confirm('Are you sure you want to revoke this share?')) return;
        const result = await revokeLeadShareAction({ shareId, leadId });
        if (result.success) {
            toast.success('Share revoked');
            fetchShares();
        } else {
            toast.error(result.message || 'Failed to revoke share');
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-400 text-xs font-bold animate-pulse">Loading shares...</div>;
    }

    return (
        <div className="space-y-6 font-sans">
            {/* Request New Share */}
            <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6 text-indigo-600">
                    <Share2 size={18} />
                    <h3 className="text-[10px] font-black uppercase tracking-widest leading-none">
                        Collaborative Sharing
                    </h3>
                </div>

                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                            Target Partner
                        </label>
                        <select
                            value={selectedTenant}
                            onChange={e => setSelectedTenant(e.target.value)}
                            className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 text-xs font-bold focus:outline-none focus:border-indigo-500"
                        >
                            <option value="">Select Dealership / Bank</option>
                            {tenants.map(t => (
                                <option key={t.id} value={t.id}>
                                    {t.name} ({t.type})
                                </option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={handleShare}
                        disabled={submitting || !selectedTenant}
                        className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md transition-all disabled:opacity-50 h-10"
                    >
                        {submitting ? 'Requesting...' : 'Request Share'}
                    </button>
                </div>
            </div>

            {/* Active & Historical Shares */}
            <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Share History</h4>

                {shares.length === 0 ? (
                    <div className="text-center py-8 opacity-50">
                        <ShieldAlert size={32} className="mx-auto mb-2 text-slate-400" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">No shares yet</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {shares.map(share => {
                            const status: ShareStatus = share.status;
                            const isRevocable = status === 'APPROVED';
                            return (
                                <div
                                    key={share.id}
                                    className="flex items-center justify-between p-4 bg-white dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-white/5"
                                >
                                    <div>
                                        <p className="text-sm font-black text-slate-800 dark:text-slate-200">
                                            {share.tenantName}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span
                                                className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${STATUS_STYLE[status] ?? 'bg-slate-100 text-slate-500'}`}
                                            >
                                                {status}
                                            </span>
                                            <span className="text-[9px] font-bold text-slate-400">
                                                {share.share_type?.replace(/_/g, ' ')}
                                            </span>
                                            <span className="text-[9px] font-bold text-slate-400">
                                                {share.created_at
                                                    ? new Date(share.created_at).toLocaleDateString()
                                                    : ''}
                                            </span>
                                        </div>
                                    </div>

                                    {isRevocable && (
                                        <button
                                            onClick={() => handleRevoke(share.id)}
                                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                                            title="Revoke APPROVED share"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
