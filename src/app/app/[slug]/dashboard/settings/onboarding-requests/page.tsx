'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTenant } from '@/lib/tenant/tenantContext';
import {
    getOnboardingRequestsAction,
    reviewOnboardingRequestAction,
    type OnboardingRequestRow,
} from '@/actions/onboardingRequests';

type FilterValue = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL';

export default function OnboardingRequestsPage() {
    const { tenantId } = useTenant();
    const [rows, setRows] = useState<OnboardingRequestRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterValue>('PENDING');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
    const [crmAccessByRequest, setCrmAccessByRequest] = useState<Record<string, boolean>>({});

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        const res = await getOnboardingRequestsAction({ tenantId: tenantId || undefined, status: filter });
        if (res.success) {
            const nextRows = res.rows || [];
            setRows(nextRows);
            const nextCrmMap: Record<string, boolean> = {};
            for (const row of nextRows) {
                nextCrmMap[row.requestId] = row.crmAccessRequested !== false;
            }
            setCrmAccessByRequest(nextCrmMap);
        } else {
            setRows([]);
            setError(res.message || 'Failed to load requests');
        }
        setLoading(false);
    }, [tenantId, filter]);

    useEffect(() => {
        load();
    }, [load]);

    const handleReview = async (requestId: string, decision: 'APPROVE' | 'REJECT') => {
        setProcessingRequestId(requestId);
        setMessage('');
        setError('');
        const res = await reviewOnboardingRequestAction({
            requestId,
            tenantId: tenantId || undefined,
            decision,
            crmAccess: crmAccessByRequest[requestId] !== false,
        });
        if (!res.success) {
            setError(res.message || 'Action failed');
            setProcessingRequestId(null);
            return;
        }
        setMessage(`Request ${decision === 'APPROVE' ? 'approved' : 'rejected'} successfully.`);
        await load();
        setProcessingRequestId(null);
    };

    const title = useMemo(() => {
        if (filter === 'ALL') return 'All Onboarding Requests';
        return `${filter.charAt(0)}${filter.slice(1).toLowerCase()} Onboarding Requests`;
    }, [filter]);

    return (
        <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h1 className="text-2xl font-black text-slate-900">Team Onboarding Requests</h1>
                <p className="mt-1 text-sm text-slate-500">
                    Review requests from `/welcome`. Approval auto-enables team membership for selected financer and
                    dealership.
                </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                    {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as FilterValue[]).map(item => (
                        <button
                            key={item}
                            onClick={() => setFilter(item)}
                            className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-wider ${
                                filter === item
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            {item}
                        </button>
                    ))}
                </div>

                <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-600">{title}</h2>

                {error ? <p className="mb-3 text-sm font-semibold text-rose-600">{error}</p> : null}
                {message ? <p className="mb-3 text-sm font-semibold text-emerald-600">{message}</p> : null}

                {loading ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-sm text-slate-500">
                        Loading requests...
                    </div>
                ) : rows.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-sm text-slate-500">
                        No requests found.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {rows.map(row => (
                            <div key={row.requestId} className="rounded-2xl border border-slate-200 p-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-black text-slate-900">
                                            {row.fullName || 'Unnamed user'}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {row.phone} {row.email ? `• ${row.email}` : ''}
                                        </p>
                                        <p className="mt-1 text-[11px] text-slate-500">Pincode: {row.pincode || '—'}</p>
                                    </div>
                                    <span
                                        className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                                            row.status === 'APPROVED'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : row.status === 'REJECTED'
                                                  ? 'bg-rose-100 text-rose-700'
                                                  : 'bg-amber-100 text-amber-700'
                                        }`}
                                    >
                                        {row.status}
                                    </span>
                                </div>

                                <div className="mt-3 text-xs text-slate-500">
                                    Submitted:{' '}
                                    {row.submittedAt ? new Date(row.submittedAt).toLocaleString('en-IN') : '—'}
                                </div>
                                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                                    <div className="rounded-xl border border-slate-200 p-3">
                                        <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                                            Financer Teams Requested
                                        </p>
                                        <div className="mt-2 space-y-1">
                                            {row.financeTenants.length > 0 ? (
                                                row.financeTenants.map(tenant => (
                                                    <p key={tenant.id} className="text-xs text-slate-700">
                                                        {tenant.name}
                                                    </p>
                                                ))
                                            ) : (
                                                <p className="text-xs text-slate-400">No financer selected</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 p-3">
                                        <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                                            Dealership Teams Requested
                                        </p>
                                        <div className="mt-2 space-y-1">
                                            {row.dealershipTenants.length > 0 ? (
                                                row.dealershipTenants.map(tenant => (
                                                    <p key={tenant.id} className="text-xs text-slate-700">
                                                        {tenant.name}
                                                    </p>
                                                ))
                                            ) : (
                                                <p className="text-xs text-slate-400">No dealership selected</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {row.status === 'PENDING' ? (
                                    <div className="mt-3 space-y-3">
                                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                                            <input
                                                type="checkbox"
                                                checked={crmAccessByRequest[row.requestId] !== false}
                                                onChange={e =>
                                                    setCrmAccessByRequest(prev => ({
                                                        ...prev,
                                                        [row.requestId]: e.target.checked,
                                                    }))
                                                }
                                            />
                                            Grant CRM Access
                                        </label>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleReview(row.requestId, 'APPROVE')}
                                                disabled={processingRequestId === row.requestId}
                                                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black uppercase tracking-wider text-white disabled:opacity-60"
                                            >
                                                {processingRequestId === row.requestId ? 'Processing...' : 'Approve'}
                                            </button>
                                            <button
                                                onClick={() => handleReview(row.requestId, 'REJECT')}
                                                disabled={processingRequestId === row.requestId}
                                                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-black uppercase tracking-wider text-white disabled:opacity-60"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
