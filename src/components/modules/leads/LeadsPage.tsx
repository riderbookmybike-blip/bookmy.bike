'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useTenant } from '@/lib/tenant/tenantContext';
import { createClient } from '@/lib/supabase/client';
import MasterListDetailLayout from '@/components/templates/MasterListDetailLayout';
import StatsHeader from '@/components/modules/shared/StatsHeader';
import ModuleLanding from '@/components/modules/shared/ModuleLanding';
import LeadEditorWrapper from '@/components/modules/leads/LeadEditorWrapper';
import LeadForm from '@/components/modules/leads/LeadForm';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useCrmMobile } from '@/hooks/useCrmMobile';
import {
    Users,
    Flame,
    Target,
    TrendingUp,
    AlertTriangle,
    LayoutGrid,
    Search as SearchIcon,
    Phone as PhoneIcon,
    ChevronRight,
    User,
    Building2,
    Calendar,
    ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDisplayId } from '@/utils/displayId';
import {
    approveLeadShareRequestAction,
    createLeadAction,
    getLeadIndexAction,
    getLeadShareRequestsInboxAction,
    rejectLeadShareRequestAction,
    uploadMemberDocumentAction,
} from '@/actions/crm';
import type { LeadIndexKpis, LeadIndexRow, LeadSlaBucket } from '@/actions/crm';
import { getFinanceUserDealerOptions } from '@/actions/finance-partners';

const STATUS_FILTERS = ['ALL', 'NEW', 'CONTACTED', 'QUALIFIED', 'HOT', 'QUOTE', 'BOOKING', 'JUNK'];
const INTENT_FILTERS = ['ALL', 'HOT', 'WARM', 'COLD'];
const SLA_FILTERS: Array<'ALL' | LeadSlaBucket> = ['ALL', 'OVERDUE', 'DUE_TODAY', 'UPCOMING', 'UNSCHEDULED', 'CLEAR'];
const PAGE_SIZE_OPTIONS = [12, 20, 40, 80];

const DEFAULT_KPIS: LeadIndexKpis = {
    totalLeads: 0,
    hotLeads: 0,
    qualifiedLeads: 0,
    inPipeline: 0,
    overdueFollowUps: 0,
    dueTodayFollowUps: 0,
};

const formatDateLabel = (value?: string | null) => {
    if (!value) return '—';
    try {
        return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
        return value;
    }
};

const formatDateTime = (value?: string | null) => {
    if (!value) return '—';
    try {
        return new Date(value).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return value;
    }
};

const getLocationLabel = (lead: LeadIndexRow) => {
    const labels = [lead.area, lead.district, lead.state].filter(Boolean) as string[];
    return labels.length ? labels.join(', ') : 'Location pending';
};

const getSlaLabel = (slaBucket: LeadSlaBucket) => {
    switch (slaBucket) {
        case 'OVERDUE':
            return 'Overdue';
        case 'DUE_TODAY':
            return 'Due Today';
        case 'UPCOMING':
            return 'Upcoming';
        case 'UNSCHEDULED':
            return 'Unscheduled';
        case 'CLEAR':
        default:
            return 'Clear';
    }
};

const getSlaBadgeClass = (slaBucket: LeadSlaBucket) => {
    switch (slaBucket) {
        case 'OVERDUE':
            return 'bg-rose-50 text-rose-600 border-rose-100';
        case 'DUE_TODAY':
            return 'bg-amber-50 text-amber-600 border-amber-100';
        case 'UPCOMING':
            return 'bg-blue-50 text-blue-600 border-blue-100';
        case 'UNSCHEDULED':
            return 'bg-slate-50 text-slate-600 border-slate-100';
        case 'CLEAR':
        default:
            return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    }
};

const extractErrorMessage = (value: unknown, depth = 0): string => {
    if (!value || depth > 3) return 'Failed to load lead index';
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed || trimmed === '[object Object]') return 'Failed to load lead index';
        return trimmed;
    }
    if (value instanceof Error) return extractErrorMessage(value.message, depth + 1);
    if (typeof value === 'object') {
        const maybe = value as any;
        const direct = [maybe.message, maybe.error, maybe.details, maybe.hint].find(part => part);
        if (direct) return extractErrorMessage(direct, depth + 1);
    }
    return 'Failed to load lead index';
};

export default function LeadsPage({ initialLeadId }: { initialLeadId?: string }) {
    const { tenantId, memberships, tenantType } = useTenant();
    const router = useRouter();
    const searchParams = useSearchParams();
    const params = useParams();
    const slug = typeof params?.slug === 'string' ? params.slug : Array.isArray(params?.slug) ? params.slug[0] : '';
    const { device } = useBreakpoint();
    const { isReadOnly } = useCrmMobile();
    const isPhone = device === 'phone';
    const isCompact = isPhone || device === 'tablet';

    const [leads, setLeads] = useState<LeadIndexRow[]>([]);
    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(initialLeadId || null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [view, setView] = useState<'grid' | 'list'>('list');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [intentFilter, setIntentFilter] = useState<string>('ALL');
    const [slaFilter, setSlaFilter] = useState<'ALL' | LeadSlaBucket>('ALL');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [totalRows, setTotalRows] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [kpis, setKpis] = useState<LeadIndexKpis>(DEFAULT_KPIS);
    const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
    const [shareRequests, setShareRequests] = useState<any[]>([]);
    const [loadingShareRequests, setLoadingShareRequests] = useState(false);
    const [actingRequestId, setActingRequestId] = useState<string | null>(null);
    const [dealerOptions, setDealerOptions] = useState<Array<{ id: string; name: string }>>([]);
    const [initialSelectedDealerId, setInitialSelectedDealerId] = useState('');

    const dealerMemberships = useMemo(
        () =>
            (memberships || []).filter((m: any) => m?.tenants?.type === 'DEALER' || m?.tenants?.type === 'DEALERSHIP'),
        [memberships]
    );

    const requiresDealerSelection = tenantType === 'BANK' ? dealerOptions.length > 1 : dealerMemberships.length > 1;

    useEffect(() => {
        const action = searchParams.get('action');
        const dealerId = searchParams.get('dealerId') || '';
        setInitialSelectedDealerId(dealerId);
        if (action === 'create') setIsLeadFormOpen(true);
    }, [searchParams]);

    useEffect(() => {
        const fromMemberships = (memberships || [])
            .filter((m: any) => m?.tenants?.type === 'DEALER' || m?.tenants?.type === 'DEALERSHIP')
            .map((m: any) => ({ id: m.tenant_id, name: m.tenants?.name || 'Dealer' }));

        if (fromMemberships.length > 0) {
            const uniqueDealers = Array.from(
                new Map(fromMemberships.map((item: any) => [item.id, item])).values()
            ) as any[];
            setDealerOptions(uniqueDealers);
            return;
        }

        if (requiresDealerSelection) {
            (async () => {
                const supabase = createClient();
                const { data } = await supabase
                    .from('id_tenants')
                    .select('id, name')
                    .eq('type', 'DEALER')
                    .eq('status', 'ACTIVE')
                    .order('name', { ascending: true });
                setDealerOptions((data as any[]) || []);
            })();
        }
    }, [memberships, requiresDealerSelection]);

    useEffect(() => {
        const timeout = window.setTimeout(() => setDebouncedSearch(searchQuery), 250);
        return () => window.clearTimeout(timeout);
    }, [searchQuery]);

    const hasPrev = page > 1;
    const hasNext = totalPages > 0 && page < totalPages;

    const fetchLeadIndex = useCallback(async () => {
        if (!tenantId) return;
        setIsLoading(true);
        try {
            const result = await getLeadIndexAction({
                tenantId,
                page,
                pageSize,
                filters: {
                    search: debouncedSearch,
                    status: statusFilter,
                    intent: intentFilter,
                    sla: slaFilter,
                },
            });

            if (!result?.success) throw new Error(extractErrorMessage(result));

            setLeads(result.rows || []);
            setKpis(result.kpis || DEFAULT_KPIS);
            setTotalRows(result.pagination.totalRows || 0);
            setTotalPages(result.pagination.totalPages || 0);
        } catch (error) {
            toast.error(extractErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    }, [tenantId, page, pageSize, debouncedSearch, statusFilter, intentFilter, slaFilter]);

    useEffect(() => {
        fetchLeadIndex();
    }, [fetchLeadIndex]);

    const loadShareRequests = useCallback(async () => {
        if (!tenantId) return;
        setLoadingShareRequests(true);
        try {
            const result = await getLeadShareRequestsInboxAction({ tenantId });
            if (result?.success) setShareRequests((result.rows || []) as any[]);
        } finally {
            setLoadingShareRequests(false);
        }
    }, [tenantId]);

    useEffect(() => {
        loadShareRequests();
    }, [loadShareRequests]);

    const handleApproveShareRequest = async (request: any) => {
        setActingRequestId(request.requestId);
        try {
            const result = await approveLeadShareRequestAction({
                leadId: request.leadId,
                requestId: request.requestId,
            });
            if (result?.success) {
                toast.success('Request approved');
                await Promise.all([fetchLeadIndex(), loadShareRequests()]);
            } else {
                toast.error(result?.message || 'Failed to approve');
            }
        } finally {
            setActingRequestId(null);
        }
    };

    const handleRejectShareRequest = async (request: any) => {
        setActingRequestId(request.requestId);
        try {
            const result = await rejectLeadShareRequestAction({ leadId: request.leadId, requestId: request.requestId });
            if (result?.success) {
                toast.success('Request rejected');
                await Promise.all([fetchLeadIndex(), loadShareRequests()]);
            }
        } finally {
            setActingRequestId(null);
        }
    };

    const stats = [
        { label: 'Total Leads', value: kpis.totalLeads, icon: Users, color: 'indigo' as const },
        { label: 'Hot Leads', value: kpis.hotLeads, icon: Flame, color: 'rose' as const, trend: 'Priority' },
        { label: 'Qualified', value: kpis.qualifiedLeads, icon: Target, color: 'emerald' as const },
        { label: 'In Pipeline', value: kpis.inPipeline, icon: TrendingUp, color: 'amber' as const },
        {
            label: 'SLA Overdue',
            value: kpis.overdueFollowUps,
            icon: AlertTriangle,
            color: 'blue' as const,
            trend: `${kpis.dueTodayFollowUps} today`,
        },
    ];

    const handleOpenLead = (leadId: string) => {
        setSelectedLeadId(leadId);
        if (!isCompact && slug) router.push(`/app/${slug}/leads/${leadId}`);
    };

    const handleCloseDetail = () => {
        setSelectedLeadId(null);
        if (!isCompact && slug) router.push(`/app/${slug}/leads`);
    };

    const handleCreateLead = async (data: {
        customerName: string;
        phone: string;
        pincode: string;
        interestText: string;
        organisation?: string;
        dob?: string;
        selectedDealerId?: string;
        attachmentPurpose?: string;
        attachments?: File[];
        referredByCode?: string;
        referredByPhone?: string;
        referredByName?: string;
    }) => {
        const result = await createLeadAction({
            customer_name: data.customerName,
            customer_phone: data.phone,
            customer_pincode: data.pincode,
            customer_dob: data.dob,
            interest_text: data.interestText,
            selected_dealer_id: data.selectedDealerId,
            organisation: data.organisation,
            referred_by_code: data.referredByCode,
            referred_by_phone: data.referredByPhone,
            referred_by_name: data.referredByName,
            source: 'CRM_MANUAL',
        });
        if (result?.success) {
            setIsLeadFormOpen(false);
            await fetchLeadIndex();
        }
    };

    const effectiveView = isPhone ? 'list' : view;

    if (!selectedLeadId) {
        return (
            <div className="h-full bg-[#f8fafc]">
                <ModuleLanding
                    title="Leads Index"
                    subtitle="NODE_PIPELINE"
                    onNew={() => setIsLeadFormOpen(true)}
                    searchPlaceholder="Search Leads Index..."
                    onSearch={setSearchQuery}
                    statsContent={<StatsHeader stats={stats} device={device} />}
                    view={effectiveView}
                    onViewChange={setView}
                    device={device}
                    hideActions={isReadOnly}
                >
                    <div className="space-y-4">
                        {/* Share Requests - Compact Enterprise Style */}
                        {shareRequests.length > 0 && (
                            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">
                                            Pending Share Approvals
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-black text-amber-600 bg-white px-2 py-0.5 rounded border border-amber-100">
                                        {shareRequests.length}
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                    {shareRequests.map(request => (
                                        <div
                                            key={request.requestId}
                                            className="bg-white border border-amber-100 rounded-lg p-3 flex justify-between items-center shadow-sm"
                                        >
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-black text-indigo-600 uppercase">
                                                        {formatDisplayId(request.leadDisplayId)}
                                                    </span>
                                                    <span className="text-xs font-black text-slate-900 uppercase truncate max-w-[120px]">
                                                        {request.customerName || 'Lead'}
                                                    </span>
                                                </div>
                                                <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest truncate">
                                                    {request.requesterTenantName || 'Req Node'}
                                                </p>
                                            </div>
                                            <div className="flex gap-2 shrink-0 ml-4">
                                                <button
                                                    onClick={() => handleApproveShareRequest(request)}
                                                    className="px-3 py-1.5 bg-slate-900 hover:bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest rounded transition-all"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleRejectShareRequest(request)}
                                                    className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-all"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Filter Bar - Clean Flat Design */}
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-1 rounded-lg">
                                {STATUS_FILTERS.slice(0, 5).map(chip => (
                                    <button
                                        key={chip}
                                        onClick={() => setStatusFilter(chip)}
                                        className={`px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest transition-all ${
                                            statusFilter === chip
                                                ? 'bg-slate-900 text-white shadow-sm'
                                                : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                    >
                                        {chip}
                                    </button>
                                ))}
                            </div>

                            <select
                                value={intentFilter}
                                onChange={e => setIntentFilter(e.target.value)}
                                className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                            >
                                {INTENT_FILTERS.map(opt => (
                                    <option key={opt} value={opt}>
                                        Intent: {opt}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={slaFilter}
                                onChange={e => setSlaFilter(e.target.value as any)}
                                className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                            >
                                {SLA_FILTERS.map(opt => (
                                    <option key={opt} value={opt}>
                                        SLA: {opt.replace('_', ' ')}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Results Registry */}
                        {effectiveView === 'grid' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
                                {leads.map(lead => (
                                    <div
                                        key={lead.id}
                                        onClick={() => handleOpenLead(lead.id)}
                                        className="group bg-white border border-slate-200 rounded-xl p-5 cursor-pointer transition-all hover:shadow-lg hover:border-indigo-500/30 shadow-sm"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                                                {formatDisplayId(lead.displayId)}
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[9px] font-black text-rose-500 uppercase tracking-tighter">
                                                    Intent Score
                                                </span>
                                                <span className="text-sm font-black text-slate-900">
                                                    {lead.intentScore}%
                                                </span>
                                            </div>
                                        </div>
                                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-1 truncate">
                                            {lead.customerName}
                                        </h3>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate mb-6">
                                            {lead.phone}
                                        </div>
                                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">
                                                    Region
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-600">
                                                    {lead.district || 'Unset'}
                                                </span>
                                            </div>
                                            <div
                                                className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${getSlaBadgeClass(lead.slaBucket)}`}
                                            >
                                                {getSlaLabel(lead.slaBucket)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50 border-b border-slate-200">
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                                Node ID
                                            </th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                                Lead Entity
                                            </th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                                Communication
                                            </th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                                Score
                                            </th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">
                                                Protocol
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leads.map(lead => (
                                            <tr
                                                key={lead.id}
                                                onClick={() => handleOpenLead(lead.id)}
                                                className="group hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-100 last:border-0"
                                            >
                                                <td className="px-6 py-4 text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                                                    {formatDisplayId(lead.displayId)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                                                            <User size={14} />
                                                        </div>
                                                        <div className="text-xs font-black text-slate-900 uppercase tracking-tight">
                                                            {lead.customerName}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-bold text-slate-500">
                                                    {lead.phone}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-indigo-500 rounded-full"
                                                                style={{ width: `${lead.intentScore}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-[10px] font-black text-slate-900">
                                                            {lead.intentScore}%
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div
                                                        className={`px-2.5 py-1 rounded inline-block text-[9px] font-black uppercase tracking-widest border ${getSlaBadgeClass(lead.slaBucket)}`}
                                                    >
                                                        {getSlaLabel(lead.slaBucket)}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination Footer */}
                        <div className="flex items-center justify-between border-t border-slate-100 pt-6 px-2">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Total Registry Count: {totalRows}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={!hasPrev || isLoading}
                                    className="p-2 border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-slate-50 transition-all"
                                >
                                    <ChevronRight size={16} className="rotate-180" />
                                </button>
                                <button
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={!hasNext || isLoading}
                                    className="p-2 border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-slate-50 transition-all"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </ModuleLanding>
            </div>
        );
    }

    return (
        <div className="h-full bg-white flex overflow-hidden font-sans">
            <MasterListDetailLayout
                mode="list-detail"
                listPosition="left"
                device={device}
                hasActiveDetail={!!selectedLeadId}
                onBack={handleCloseDetail}
            >
                <div className="h-full flex flex-col bg-[#fdfdfd] border-r border-slate-200 w-full">
                    <div className="p-4 border-b border-slate-200 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">
                                Leads <span className="text-indigo-600">Core</span>
                            </h2>
                            <button
                                onClick={handleCloseDetail}
                                className="p-1.5 hover:bg-slate-100 rounded-lg transition-all text-slate-400"
                            >
                                <LayoutGrid size={14} />
                            </button>
                        </div>
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-3 h-3" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-8 pr-4 text-[10px] font-bold text-slate-900 placeholder:text-slate-400 focus:border-indigo-500/50 shadow-sm"
                                placeholder="Search leads node..."
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 no-scrollbar">
                        {leads.map(lead => {
                            const isActive = selectedLeadId === lead.id;
                            const slaClass = getSlaBadgeClass(lead.slaBucket).split(' ')[0];
                            return (
                                <button
                                    key={lead.id}
                                    onClick={() => handleOpenLead(lead.id)}
                                    className={`w-full text-left rounded-lg p-3 transition-all border ${isActive ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-transparent hover:bg-slate-50'}`}
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span
                                            className={`text-[8px] font-black uppercase tracking-widest ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}
                                        >
                                            {formatDisplayId(lead.displayId)}
                                        </span>
                                        <div
                                            className={`w-1.5 h-1.5 rounded-full ${slaClass === 'bg-rose-50' ? 'bg-rose-400' : slaClass === 'bg-amber-50' ? 'bg-amber-400' : 'bg-emerald-400'}`}
                                        />
                                    </div>
                                    <div className="text-[11px] font-black text-slate-900 uppercase tracking-tight mb-1 truncate">
                                        {lead.customerName}
                                    </div>
                                    <div className="flex items-center justify-between text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                        <span>{lead.phone}</span>
                                        <span className="text-indigo-600 font-black">{lead.intentScore}%</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
                <div className="h-full flex flex-col overflow-y-auto no-scrollbar bg-white">
                    <LeadEditorWrapper leadId={selectedLeadId!} />
                </div>
            </MasterListDetailLayout>

            {isLeadFormOpen && (
                <LeadForm
                    isOpen={isLeadFormOpen}
                    onClose={() => setIsLeadFormOpen(false)}
                    onSubmit={handleCreateLead}
                    dealerOptions={dealerOptions}
                    initialSelectedDealerId={initialSelectedDealerId}
                />
            )}
        </div>
    );
}

const X = ({ size, className }: { size?: number; className?: string }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);
