'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useTenant } from '@/lib/tenant/tenantContext';
import { getQuotes } from '@/actions/crm';
import { createClient } from '@/lib/supabase/client';
import MasterListDetailLayout from '@/components/templates/MasterListDetailLayout';
import StatsHeader from '@/components/modules/shared/StatsHeader';
import ModuleLanding from '@/components/modules/shared/ModuleLanding';
import QuoteEditorWrapper from '@/components/modules/quotes/QuoteEditorWrapper';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useCrmMobile } from '@/hooks/useCrmMobile';
import {
    FileText,
    FileCheck,
    Clock,
    BarChart3,
    AlertCircle,
    LayoutGrid,
    Search as SearchIcon,
    ExternalLink,
    ChevronRight,
    User,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDisplayId } from '@/utils/displayId';

export interface Quote {
    id: string;
    displayId: string;
    customerName: string;
    customerPhone: string;
    customerLocation: string;
    productName: string;
    productSku: string;
    price: number;
    status: string;
    date: string;
    createdAt: string;
    vehicleBrand: string;
    vehicleModel: string;
    vehicleVariant: string;
    vehicleColor: string;
    deliveryTimeline?: number | null;
    avatarUrl?: string | null;
    dealership?: string;
    financeMode?: string;
    validUntil?: string | null;
}

const getInitials = (name: string) => {
    if (!name || name === 'N/A') return '?';
    const parts = name
        .trim()
        .split(' ')
        .filter(p => p.length > 0);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const getAvatarColor = (name: string) => {
    const sum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
        'bg-rose-100 text-rose-600 border-rose-200',
        'bg-pink-100 text-pink-600 border-pink-200',
        'bg-fuchsia-100 text-fuchsia-600 border-fuchsia-200',
        'bg-purple-100 text-purple-600 border-purple-200',
        'bg-violet-100 text-violet-600 border-violet-200',
        'bg-indigo-100 text-indigo-600 border-indigo-200',
        'bg-blue-100 text-blue-600 border-blue-200',
        'bg-sky-100 text-sky-600 border-sky-200',
        'bg-cyan-100 text-cyan-600 border-cyan-200',
        'bg-teal-100 text-teal-600 border-teal-200',
        'bg-emerald-100 text-emerald-600 border-emerald-200',
        'bg-green-100 text-green-600 border-green-200',
        'bg-amber-100 text-amber-600 border-amber-200',
        'bg-orange-100 text-orange-600 border-orange-200',
    ];
    return colors[sum % colors.length];
};

export default function QuotesPage({ initialQuoteId }: { initialQuoteId?: string }) {
    const { tenantId, memberships, tenantType, tenantSlug } = useTenant();
    const router = useRouter();
    const searchParams = useSearchParams();
    const params = useParams();
    const slug = typeof params?.slug === 'string' ? params.slug : Array.isArray(params?.slug) ? params.slug[0] : '';
    const { device } = useBreakpoint();
    const { isReadOnly } = useCrmMobile();
    const isPhone = device === 'phone';
    const isCompact = isPhone || device === 'tablet';

    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(initialQuoteId || null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [view, setView] = useState<'grid' | 'list'>('list');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [dealerOptions, setDealerOptions] = useState<Array<{ id: string; name: string }>>([]);
    const [selectedDealerId, setSelectedDealerId] = useState('');
    const [showCreateQuoteSelector, setShowCreateQuoteSelector] = useState(false);
    const isMultiTenantMember = (memberships || []).length > 1;
    const requiresDealerSelection = tenantType === 'BANK' || isMultiTenantMember;

    useEffect(() => {
        const action = searchParams.get('action');
        if (action === 'create') {
            if (requiresDealerSelection) {
                setShowCreateQuoteSelector(true);
            } else {
                const target = tenantSlug ? `/app/${tenantSlug}/leads?action=create` : '/leads?action=create';
                router.push(target);
            }
        }
    }, [searchParams, requiresDealerSelection, tenantSlug, router]);

    useEffect(() => {
        const fromMemberships = (memberships || [])
            .filter((m: any) => m?.tenants?.type === 'DEALER')
            .map((m: any) => ({ id: m.tenant_id, name: m.tenants?.name || 'Dealer' }));
        if (fromMemberships.length > 0) {
            setDealerOptions(fromMemberships);
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

    const fetchQuotes = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getQuotes(tenantType === 'AUMS' ? undefined : tenantId);
            setQuotes(data || []);
        } catch (error) {
            console.error('Failed to fetch quotes:', error);
            toast.error('Failed to load quotes');
        } finally {
            setIsLoading(false);
        }
    }, [tenantId]);

    useEffect(() => {
        fetchQuotes();
    }, [fetchQuotes]);

    useEffect(() => {
        const supabase = createClient();
        let channelFilter = undefined;
        if (tenantType !== 'AUMS' && tenantId) {
            channelFilter = `tenant_id=eq.${tenantId}`;
        }

        const channel = supabase
            .channel('quotes-live')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'crm_quotes',
                    ...(channelFilter ? { filter: channelFilter } : {}),
                },
                _payload => {
                    fetchQuotes();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [tenantId, fetchQuotes]);

    useEffect(() => {
        if (initialQuoteId) {
            setSelectedQuoteId(initialQuoteId);
        }
    }, [initialQuoteId]);

    const handleNewQuote = () => {
        if (requiresDealerSelection) {
            setShowCreateQuoteSelector(true);
            return;
        }
        const target = slug ? `/app/${slug}/leads?action=create` : '/leads?action=create';
        router.push(target);
    };

    const filteredQuotes = useMemo(
        () =>
            quotes.filter(
                q =>
                    (statusFilter === 'ALL' || q.status === statusFilter) &&
                    (q.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        formatDisplayId(q.displayId).toLowerCase().includes(searchQuery.toLowerCase()))
            ),
        [quotes, searchQuery, statusFilter]
    );

    const stats = [
        { label: 'Total Quotes', value: quotes.length, icon: FileText, color: 'indigo' as const, trend: '+5.2%' },
        {
            label: 'Approved',
            value: quotes.filter(q => q.status === 'APPROVED').length,
            icon: FileCheck,
            color: 'emerald' as const,
            trend: '85% Rate',
        },
        {
            label: 'Pending',
            value: quotes.filter(q => q.status === 'SENT').length,
            icon: Clock,
            color: 'amber' as const,
        },
        { label: 'Conv. Rate', value: '64%', icon: BarChart3, color: 'blue' as const, trend: 'High' },
        { label: 'Expired', value: 0, icon: AlertCircle, color: 'rose' as const },
    ];

    const handleOpenQuote = (quoteId: string) => {
        setSelectedQuoteId(quoteId);
        if (!isCompact && slug) {
            router.push(`/app/${slug}/quotes/${quoteId}`);
        }
    };

    const handleCloseDetail = () => {
        setSelectedQuoteId(null);
        if (!isCompact && slug) {
            router.push(`/app/${slug}/quotes`);
        }
    };

    const effectiveView = isPhone ? 'list' : view;

    if (!selectedQuoteId) {
        return (
            <div className="h-full bg-[#f8fafc]">
                {showCreateQuoteSelector && (
                    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 space-y-6 shadow-2xl">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                    <Building2 size={24} />
                                </div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">
                                    Select Dealership
                                </h3>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                For finance or multi-tenant members, choose the target dealership node before initiating
                                quote calibration.
                            </p>
                            <select
                                value={selectedDealerId}
                                onChange={e => setSelectedDealerId(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                            >
                                <option value="">Select dealership node</option>
                                {dealerOptions.map(d => (
                                    <option key={d.id} value={d.id}>
                                        {d.name}
                                    </option>
                                ))}
                            </select>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    onClick={() => setShowCreateQuoteSelector(false)}
                                    className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        if (!selectedDealerId) {
                                            toast.error('Please select dealership');
                                            return;
                                        }
                                        const target = slug
                                            ? `/app/${slug}/leads?action=create&dealerId=${selectedDealerId}`
                                            : `/leads?action=create&dealerId=${selectedDealerId}`;
                                        router.push(target);
                                    }}
                                    className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg bg-slate-900 hover:bg-indigo-600 text-white transition-all"
                                >
                                    Continue
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                <ModuleLanding
                    title="Quotes Index"
                    subtitle="CORE_PROPOSALS"
                    onNew={handleNewQuote}
                    searchPlaceholder="Search Quotes Index..."
                    onSearch={setSearchQuery}
                    statsContent={<StatsHeader stats={stats} device={device} />}
                    view={effectiveView}
                    onViewChange={setView}
                    device={device}
                    hideActions={isReadOnly}
                >
                    {effectiveView === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
                            {filteredQuotes.map(quote => (
                                <div
                                    key={quote.id}
                                    onClick={() => handleOpenQuote(quote.id)}
                                    className="group relative bg-white border border-slate-200 rounded-xl p-5 cursor-pointer transition-all hover:shadow-lg hover:border-indigo-500/30 shadow-sm"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100 self-start">
                                                {formatDisplayId(quote.displayId)}
                                            </div>
                                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                {quote.createdAt
                                                    ? new Date(quote.createdAt).toLocaleString('en-IN', {
                                                          month: 'short',
                                                          day: 'numeric',
                                                          hour: 'numeric',
                                                          minute: '2-digit',
                                                          hour12: true,
                                                      })
                                                    : quote.date}
                                                {` • TAT: ${quote.deliveryTimeline || 'PENDING'} ${quote.deliveryTimeline ? 'DAYS' : ''}`.trim()}
                                            </div>
                                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                {quote.dealership} &bull; {quote.financeMode}
                                            </div>
                                        </div>
                                        <div className="text-slate-900 font-black text-sm tabular-nums">
                                            ₹{quote.price.toLocaleString()}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mb-0.5">
                                        <div
                                            className={`w-5 h-5 rounded-full flex items-center justify-center overflow-hidden border shrink-0 shadow-sm ${quote.avatarUrl ? 'bg-slate-100 border-slate-200' : getAvatarColor(quote.customerName)}`}
                                        >
                                            {quote.avatarUrl ? (
                                                <img
                                                    src={quote.avatarUrl}
                                                    alt={quote.customerName}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-[8px] font-black tracking-widest">
                                                    {getInitials(quote.customerName)}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight truncate">
                                            {quote.customerName}
                                        </h3>
                                    </div>

                                    <div className="text-[10px] font-bold text-slate-500 tracking-widest mb-3 truncate">
                                        {quote.customerPhone} &bull; {quote.customerLocation}
                                    </div>

                                    <div className="text-[10px] font-bold text-slate-900 uppercase tracking-widest truncate mb-0.5">
                                        {[quote.vehicleBrand, quote.vehicleModel, quote.vehicleVariant]
                                            .filter(Boolean)
                                            .join(' ')}
                                    </div>
                                    <div className="text-[9px] font-semibold text-slate-400 uppercase truncate mb-4">
                                        {quote.vehicleColor || 'N/A Color'}
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                        <div
                                            className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                                quote.status === 'APPROVED'
                                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                    : 'bg-slate-50 text-slate-400 border border-slate-100'
                                            }`}
                                        >
                                            {quote.status}
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
                                            Client Node
                                        </th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                            Configuration
                                        </th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                            Finance
                                        </th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                            Dealership
                                        </th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                            Origin & Time
                                        </th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">
                                            Valuation
                                        </th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredQuotes.map(quote => (
                                        <tr
                                            key={quote.id}
                                            onClick={() => handleOpenQuote(quote.id)}
                                            className="group hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-100 last:border-0"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-start gap-3">
                                                    <div
                                                        className={`w-8 h-8 rounded-full flex items-center justify-center overflow-hidden border shrink-0 shadow-sm ${quote.avatarUrl ? 'bg-slate-100 border-slate-200' : getAvatarColor(quote.customerName)}`}
                                                    >
                                                        {quote.avatarUrl ? (
                                                            <img
                                                                src={quote.avatarUrl}
                                                                alt={quote.customerName}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <span className="text-[10px] font-black tracking-widest">
                                                                {getInitials(quote.customerName)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col gap-0.5">
                                                        <div className="text-xs font-black text-slate-900 uppercase tracking-tight">
                                                            {quote.customerName}
                                                        </div>
                                                        <div className="text-[10px] font-bold text-slate-500 tracking-widest">
                                                            {quote.customerPhone}
                                                        </div>
                                                        <div className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mt-0.5">
                                                            {formatDisplayId(quote.displayId)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-0.5">
                                                    <div className="text-[10px] font-bold text-slate-900 uppercase tracking-widest truncate max-w-[200px]">
                                                        {[quote.vehicleBrand, quote.vehicleModel, quote.vehicleVariant]
                                                            .filter(Boolean)
                                                            .join(' ')}
                                                    </div>
                                                    <div className="text-[9px] font-semibold text-slate-500 uppercase truncate max-w-[200px]">
                                                        {quote.vehicleColor || 'N/A Color'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-0.5">
                                                    <div className="text-[10px] font-black text-slate-900 tracking-widest uppercase mb-0.5">
                                                        {quote.financeMode}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-0.5">
                                                    <div className="text-[10px] font-black text-slate-900 tracking-widest uppercase truncate max-w-[150px]">
                                                        {quote.dealership}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-0.5">
                                                    <div className="text-[10px] font-bold text-slate-900 tracking-widest truncate max-w-[150px]">
                                                        {quote.customerLocation}
                                                    </div>
                                                    <div className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest">
                                                        {quote.createdAt
                                                            ? new Date(quote.createdAt).toLocaleString('en-IN', {
                                                                  month: 'short',
                                                                  day: 'numeric',
                                                                  hour: 'numeric',
                                                                  minute: '2-digit',
                                                                  hour12: true,
                                                              })
                                                            : quote.date}
                                                    </div>
                                                    <div className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mt-0.5">
                                                        Est. Delivery:{' '}
                                                        {quote.deliveryTimeline
                                                            ? `${quote.deliveryTimeline} Days`
                                                            : 'Pending'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="text-xs font-black text-slate-900 tabular-nums">
                                                    ₹{quote.price.toLocaleString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div
                                                    className={`px-2.5 py-1 rounded inline-block text-[9px] font-black uppercase tracking-wider ${
                                                        quote.status === 'APPROVED'
                                                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                            : 'bg-slate-50 text-slate-400 border border-slate-100'
                                                    }`}
                                                >
                                                    {quote.status}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
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
                hasActiveDetail={!!selectedQuoteId}
                onBack={handleCloseDetail}
            >
                {/* 1. Master List Sidebar */}
                <div className="h-full flex flex-col bg-[#fdfdfd] border-r border-slate-200 w-full">
                    <div className="p-4 border-b border-slate-200 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">
                                Quotes <span className="text-indigo-600">Core</span>
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
                                className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-8 pr-4 text-[10px] font-bold text-slate-900 focus:outline-none focus:border-indigo-500/50 shadow-sm"
                                placeholder="Search quote registry..."
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1 no-scrollbar">
                        {isLoading && filteredQuotes.length === 0 && (
                            <div className="p-4 flex justify-center">
                                <Loader2 className="w-6 h-6 text-slate-200 animate-spin" />
                            </div>
                        )}
                        {filteredQuotes.map(quote => {
                            const isActive = selectedQuoteId === quote.id;
                            const statusColor =
                                quote.status === 'APPROVED' || quote.status === 'SENT'
                                    ? 'emerald'
                                    : quote.status === 'IN_REVIEW'
                                      ? 'amber'
                                      : 'indigo';
                            return (
                                <button
                                    key={quote.id}
                                    onClick={() => handleOpenQuote(quote.id)}
                                    className={`w-full text-left rounded-lg p-3 transition-all border ${
                                        isActive
                                            ? 'bg-indigo-50 border-indigo-200'
                                            : 'bg-white border-transparent hover:bg-slate-50'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span
                                            className={`text-[8px] font-black uppercase tracking-widest ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}
                                        >
                                            {formatDisplayId(quote.displayId)}
                                        </span>
                                        <div
                                            className={`w-1.5 h-1.5 rounded-full ${
                                                statusColor === 'emerald'
                                                    ? 'bg-emerald-400'
                                                    : statusColor === 'amber'
                                                      ? 'bg-amber-400'
                                                      : 'bg-indigo-400'
                                            }`}
                                        />
                                    </div>
                                    <div className="text-[11px] font-black text-slate-900 uppercase tracking-tight mb-1 truncate">
                                        {quote.customerName}
                                    </div>
                                    <div className="flex items-center justify-between text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                        <span className="truncate max-w-[120px]">
                                            {[quote.vehicleBrand, quote.vehicleModel].filter(Boolean).join(' ')}
                                        </span>
                                        <span className="text-slate-900 font-black tabular-nums">
                                            ₹{Math.round(quote.price / 1000)}k
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 2. Detail Viewport */}
                <div className="h-full flex flex-col overflow-y-auto no-scrollbar bg-white">
                    <QuoteEditorWrapper quoteId={selectedQuoteId} onClose={handleCloseDetail} onRefresh={fetchQuotes} />
                </div>
            </MasterListDetailLayout>
        </div>
    );
}

const Building2 = ({ size, className }: { size?: number; className?: string }) => (
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
        <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
        <path d="M9 22v-4h6v4" />
        <path d="M8 6h.01" />
        <path d="M16 6h.01" />
        <path d="M8 10h.01" />
        <path d="M16 10h.01" />
        <path d="M8 14h.01" />
        <path d="M16 14h.01" />
    </svg>
);

const Loader2 = ({ size, className }: { size?: number; className?: string }) => (
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
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
);
