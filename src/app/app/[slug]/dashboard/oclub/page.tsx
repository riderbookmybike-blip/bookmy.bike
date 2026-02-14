'use client';

import React, { useEffect, useState } from 'react';
import { useTenant } from '@/lib/tenant/tenantContext';
import {
    getSponsorByTenant,
    getSponsorDashboard,
    listSponsorRedemptions,
    createSponsorAllocation,
    approveRedemptionRequest,
    rejectRedemptionRequest,
    confirmRedemptionPayment,
} from '@/actions/oclub';
import { toast } from 'sonner';

export default function OClubDashboardPage() {
    const { tenantId } = useTenant();
    const [sponsorId, setSponsorId] = useState<string | null>(null);
    const [summary, setSummary] = useState<any>(null);
    const [requests, setRequests] = useState<any[]>([]);
    const [allocationsLoading, setAllocationsLoading] = useState(false);
    const [allocation, setAllocation] = useState({ agentId: '', coins: 0, notes: '' });

    useEffect(() => {
        if (!tenantId) return;
        const load = async () => {
            const sponsorRes = await getSponsorByTenant(tenantId);
            if (!sponsorRes.success || !sponsorRes.sponsor) return;
            setSponsorId(sponsorRes.sponsor.id);
            const dash = await getSponsorDashboard(sponsorRes.sponsor.id);
            if (dash.success) setSummary(dash.summary);
            const req = await listSponsorRedemptions(sponsorRes.sponsor.id, 'PENDING_APPROVAL');
            if (req.success) setRequests(req.requests);
        };
        load();
    }, [tenantId]);

    const handleAllocate = async () => {
        if (!sponsorId || !allocation.agentId || allocation.coins <= 0) {
            toast.error('Agent ID and coins required');
            return;
        }
        setAllocationsLoading(true);
        const res = await createSponsorAllocation({
            sponsorId,
            agentId: allocation.agentId,
            coins: allocation.coins,
            notes: allocation.notes,
        });
        setAllocationsLoading(false);
        if (res.success) {
            toast.success('Coins assigned');
            setAllocation({ agentId: '', coins: 0, notes: '' });
            if (sponsorId) {
                const dash = await getSponsorDashboard(sponsorId);
                if (dash.success) setSummary(dash.summary);
            }
        } else {
            toast.error(res.error || 'Failed');
        }
    };

    const handleApprove = async (id: string) => {
        const res = await approveRedemptionRequest(id, null);
        if (res.success) {
            toast.success('Approved');
            setRequests(prev => prev.filter(r => r.id !== id));
        } else toast.error(res.error || 'Failed');
    };

    const handleReject = async (id: string) => {
        const res = await rejectRedemptionRequest(id, null);
        if (res.success) {
            toast.success('Rejected');
            setRequests(prev => prev.filter(r => r.id !== id));
        } else toast.error(res.error || 'Failed');
    };

    const handleConfirmPaid = async (id: string) => {
        const res = await confirmRedemptionPayment(id, null);
        if (res.success) {
            toast.success('Marked Paid');
            setRequests(prev => prev.filter(r => r.id !== id));
        } else toast.error(res.error || 'Failed');
    };

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-2xl font-black">O-Club Sponsor Dashboard</h1>
                <p className="text-slate-500 text-sm">Corporate reward controls and redemption approvals.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Assigned</p>
                    <p className="text-2xl font-black">{summary?.totalAssigned || 0}</p>
                </div>
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Coins Redeemed</p>
                    <p className="text-2xl font-black">{summary?.totalRedeemed || 0}</p>
                </div>
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Pending Requests</p>
                    <p className="text-2xl font-black">{summary?.pendingRequests || 0}</p>
                </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Assign Coins</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                        className="border border-slate-200 rounded-xl px-4 py-2 text-sm"
                        placeholder="Agent Member ID"
                        value={allocation.agentId}
                        onChange={e => setAllocation(prev => ({ ...prev, agentId: e.target.value }))}
                    />
                    <input
                        className="border border-slate-200 rounded-xl px-4 py-2 text-sm"
                        placeholder="Coins"
                        type="number"
                        value={allocation.coins}
                        onChange={e => setAllocation(prev => ({ ...prev, coins: Number(e.target.value) }))}
                    />
                    <input
                        className="border border-slate-200 rounded-xl px-4 py-2 text-sm"
                        placeholder="Notes (optional)"
                        value={allocation.notes}
                        onChange={e => setAllocation(prev => ({ ...prev, notes: e.target.value }))}
                    />
                </div>
                <button
                    onClick={handleAllocate}
                    disabled={allocationsLoading}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest"
                >
                    {allocationsLoading ? 'Assigning...' : 'Assign Coins'}
                </button>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">
                    Pending Redemptions
                </h3>
                <div className="space-y-3">
                    {requests.length === 0 && <p className="text-sm text-slate-400">No pending requests.</p>}
                    {requests.map(r => (
                        <div
                            key={r.id}
                            className="flex items-center justify-between p-4 rounded-xl border border-slate-100"
                        >
                            <div>
                                <div className="text-sm font-black">Booking: {r.booking_id}</div>
                                <div className="text-[10px] text-slate-400 uppercase tracking-widest">
                                    Agent: {r.agent_id}
                                </div>
                            </div>
                            <div className="text-sm font-black">{r.coin_amount} coins</div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleApprove(r.id)}
                                    className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-black"
                                >
                                    Approve
                                </button>
                                <button
                                    onClick={() => handleReject(r.id)}
                                    className="px-3 py-1 bg-rose-600 text-white rounded-lg text-[10px] font-black"
                                >
                                    Reject
                                </button>
                                <button
                                    onClick={() => handleConfirmPaid(r.id)}
                                    className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-black"
                                >
                                    Paid
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
