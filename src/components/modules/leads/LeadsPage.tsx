'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTenant } from '@/lib/tenant/tenantContext';
import { getLeads } from '@/actions/crm';
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
    Clock,
    LayoutGrid,
    Search as SearchIcon,
    Phone as PhoneIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDisplayId } from '@/utils/displayId';
import { createLeadAction } from '@/actions/crm';

export interface LeadRow {
    id: string;
    displayId: string;
    customerName: string;
    phone: string;
    status: string;
    intentScore?: string;
    created_at?: string;
}

export default function LeadsPage({ initialLeadId }: { initialLeadId?: string }) {
    const { tenantId } = useTenant();
    const router = useRouter();
    const params = useParams();
    const slug = typeof params?.slug === 'string' ? params.slug : Array.isArray(params?.slug) ? params.slug[0] : '';
    const { device } = useBreakpoint();
    const { isReadOnly } = useCrmMobile();
    const isPhone = device === 'phone';
    const isCompact = isPhone || device === 'tablet';

    const [leads, setLeads] = useState<LeadRow[]>([]);
    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(initialLeadId || null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [view, setView] = useState<'grid' | 'list'>('list');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);

    const fetchLeads = useCallback(async () => {
        if (!tenantId) return;
        setIsLoading(true);
        try {
            const data = await getLeads(tenantId);
            const mapped = (data || []).map((l: any) => ({
                id: l.id,
                displayId: l.displayId || formatDisplayId(l.id),
                customerName: l.customerName || 'Lead',
                phone: l.phone || '—',
                status: l.status || 'NEW',
                intentScore: l.intentScore || 'COLD',
                created_at: l.created_at,
            }));
            setLeads(mapped);
        } catch (error) {
            console.error('Failed to fetch leads:', error);
            toast.error('Failed to load leads');
        } finally {
            setIsLoading(false);
        }
    }, [tenantId]);

    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);

    useEffect(() => {
        const supabase = createClient();
        const channel = supabase
            .channel('leads-live')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'crm_leads' }, () => fetchLeads())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchLeads]);

    useEffect(() => {
        if (initialLeadId) setSelectedLeadId(initialLeadId);
    }, [initialLeadId]);

    const filteredLeads = useMemo(
        () =>
            leads.filter(
                l =>
                    (statusFilter === 'ALL' || l.status === statusFilter) &&
                    (l.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        formatDisplayId(l.displayId).toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (l.phone || '').includes(searchQuery))
            ),
        [leads, searchQuery, statusFilter]
    );

    const stats = [
        { label: 'Total Leads', value: leads.length, icon: Users, color: 'indigo' as const, trend: '+12.5%' },
        {
            label: 'Hot Leads',
            value: leads.filter(l => l.intentScore === 'HOT').length,
            icon: Flame,
            color: 'rose' as const,
            trend: 'Priority',
        },
        {
            label: 'Qualified',
            value: leads.filter(l => l.status !== 'NEW' && l.status !== 'JUNK').length,
            icon: Target,
            color: 'emerald' as const,
        },
        {
            label: 'In Pipeline',
            value: leads.filter(l => ['QUOTE', 'BOOKING'].includes(l.status)).length,
            icon: TrendingUp,
            color: 'amber' as const,
        },
        { label: 'Avg Speed', value: '4.2h', icon: Clock, color: 'blue' as const, trend: '-15m' },
    ];

    const handleOpenLead = (leadId: string) => {
        setSelectedLeadId(leadId);
        // On compact devices, don't push URL — just switch view
        if (!isCompact && slug) router.push(`/app/${slug}/leads/${leadId}`);
    };

    const handleCloseDetail = () => {
        setSelectedLeadId(null);
        if (!isCompact && slug) router.push(`/app/${slug}/leads`);
    };

    const handleCreateLead = async (formData: {
        customerName: string;
        phone: string;
        pincode: string;
        model?: string;
        dob?: string;
    }) => {
        if (!tenantId) {
            toast.error('Tenant context missing. Please refresh.');
            return;
        }

        const result = await createLeadAction({
            customer_name: formData.customerName,
            customer_phone: formData.phone,
            customer_pincode: formData.pincode,
            customer_dob: formData.dob,
            model: formData.model,
            source: 'CRM_MANUAL',
            owner_tenant_id: tenantId,
        });

        if (!result?.success || !('leadId' in result) || !result.leadId) {
            throw new Error(result?.message || 'Failed to create lead');
        }

        toast.success('duplicate' in result && result.duplicate ? 'Existing lead opened' : 'Lead created successfully');
        setIsLeadFormOpen(false);
        await fetchLeads();
        handleOpenLead(result.leadId);
    };

    // Responsive negative margin: phone=-m-3 (matches ShellLayout p-3), tablet=-m-5, desktop=-m-6 md:-m-8
    const negativeMargin = isPhone ? '' : device === 'tablet' ? '-m-5' : '-m-6 md:-m-8';

    // Phone forces list view (grid cards too large)
    const effectiveView = isPhone ? 'list' : view;

    if (!selectedLeadId) {
        return (
            <div className={`h-full bg-slate-50 dark:bg-[#0b0d10] ${negativeMargin}`}>
                <ModuleLanding
                    title="Leads"
                    subtitle="Pipeline Intelligence"
                    onNew={() => setIsLeadFormOpen(true)}
                    searchPlaceholder="Search Leads Index..."
                    onSearch={setSearchQuery}
                    statsContent={<StatsHeader stats={stats} device={device} />}
                    view={effectiveView}
                    onViewChange={setView}
                    device={device}
                    hideActions={isReadOnly}
                >
                    {effectiveView === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                            {filteredLeads.map(lead => (
                                <div
                                    key={lead.id}
                                    onClick={() => handleOpenLead(lead.id)}
                                    className="group relative bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-500/30 overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                                                {formatDisplayId(lead.displayId)}
                                            </div>
                                            <div className="text-indigo-600 font-black text-sm italic tracking-tighter">
                                                {lead.intentScore}
                                            </div>
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase mb-2 truncate group-hover:text-indigo-600 transition-colors">
                                            {lead.customerName}
                                        </h3>
                                        <div className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-tighter truncate mb-6">
                                            {lead.phone}
                                        </div>
                                        <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-white/5">
                                            <div className="px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest bg-slate-100 dark:bg-white/5 text-slate-400">
                                                {lead.status}
                                            </div>
                                            <div className="text-[9px] font-bold text-slate-400">
                                                {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : '—'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : /* ── LIST VIEW: Phone-optimized cards vs Desktop table ── */
                    isPhone ? (
                        <div className="space-y-2 pb-4">
                            {/* Status filter chips */}
                            <div className="overflow-x-auto no-scrollbar -mx-4 px-4 mb-3">
                                <div className="flex gap-2" style={{ minWidth: 'max-content' }}>
                                    {['ALL', 'NEW', 'CONTACTED', 'QUALIFIED', 'HOT', 'QUOTE', 'BOOKING', 'JUNK'].map(
                                        chip => (
                                            <button
                                                key={chip}
                                                onClick={() => setStatusFilter(chip)}
                                                data-crm-allow
                                                className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                                                    statusFilter === chip
                                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                                        : 'bg-white dark:bg-white/5 text-slate-500 border border-slate-200 dark:border-white/10'
                                                }`}
                                            >
                                                {chip}
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>
                            {filteredLeads.map(lead => (
                                <button
                                    key={lead.id}
                                    onClick={() => handleOpenLead(lead.id)}
                                    className="w-full text-left bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden transition-all active:scale-[0.98] min-h-[56px]"
                                    data-crm-allow
                                >
                                    <div className="flex">
                                        <div className="w-1 shrink-0 bg-indigo-500" />
                                        <div className="flex-1 px-3.5 py-3 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                                                    {formatDisplayId(lead.displayId)}
                                                </span>
                                                <span className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600">
                                                    {lead.status || 'NEW'}
                                                </span>
                                            </div>
                                            <div className="text-[13px] font-black tracking-tight uppercase truncate text-slate-900 dark:text-white mb-0.5">
                                                {lead.customerName}
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-slate-400 truncate">
                                                    {lead.phone}
                                                </span>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <a
                                                        href={`tel:${lead.phone}`}
                                                        onClick={e => e.stopPropagation()}
                                                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 active:scale-90 transition-transform"
                                                        data-crm-allow
                                                    >
                                                        <PhoneIcon size={12} />
                                                    </a>
                                                    <span className="text-[9px] font-black text-slate-500">
                                                        {lead.intentScore || 'COLD'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-white/5">
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Lead ID
                                        </th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Customer
                                        </th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Phone
                                        </th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLeads.map(lead => (
                                        <tr
                                            key={lead.id}
                                            onClick={() => handleOpenLead(lead.id)}
                                            className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer border-b border-slate-50 dark:border-white/5 last:border-0"
                                        >
                                            <td className="p-6">
                                                <div className="text-xs font-black text-indigo-500 uppercase tracking-widest">
                                                    {formatDisplayId(lead.displayId)}
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="text-sm font-black italic uppercase tracking-tighter text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                                                    {lead.customerName}
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase">
                                                    {lead.phone}
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest inline-block bg-slate-100 dark:bg-white/5 text-slate-400">
                                                    {lead.status}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </ModuleLanding>
                <LeadForm
                    isOpen={isLeadFormOpen}
                    onClose={() => setIsLeadFormOpen(false)}
                    onSubmit={handleCreateLead}
                />
            </div>
        );
    }

    return (
        <div className={`h-full bg-slate-50 dark:bg-slate-950 flex overflow-hidden font-sans ${negativeMargin}`}>
            <MasterListDetailLayout
                mode="list-detail"
                listPosition="left"
                device={device}
                hasActiveDetail={!!selectedLeadId}
                onBack={handleCloseDetail}
            >
                <div className="h-full flex flex-col bg-white dark:bg-[#0b0d10] border-r border-slate-200 dark:border-white/5 w-full">
                    <div className="p-6 border-b border-slate-100 dark:border-white/5 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white">
                                Leads <span className="text-indigo-600">Index</span>
                            </h2>
                            <button
                                onClick={handleCloseDetail}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all text-slate-400"
                            >
                                <LayoutGrid size={18} />
                            </button>
                        </div>
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs font-bold focus:outline-none focus:border-indigo-500/50"
                                placeholder="Search leads..."
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-1.5 no-scrollbar">
                        {filteredLeads.map(lead => {
                            const isActive = selectedLeadId === lead.id;
                            return (
                                <button
                                    key={lead.id}
                                    onClick={() => handleOpenLead(lead.id)}
                                    className={`w-full text-left rounded-xl border transition-all duration-300 group overflow-hidden ${
                                        isActive
                                            ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-500/20 text-white'
                                            : 'bg-white dark:bg-white/[0.03] border-slate-100 dark:border-white/[0.06] hover:border-indigo-500/30 text-slate-900 dark:text-white hover:shadow-md'
                                    }`}
                                >
                                    <div className="flex">
                                        <div className={`w-1 shrink-0 ${isActive ? 'bg-white/30' : 'bg-indigo-500'}`} />
                                        <div className="flex-1 px-3.5 py-3 min-w-0">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span
                                                    className={`text-[9px] font-black uppercase tracking-wider ${
                                                        isActive ? 'text-white/70' : 'text-slate-400'
                                                    }`}
                                                >
                                                    {formatDisplayId(lead.displayId)}
                                                </span>
                                                <span
                                                    className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                                                        isActive
                                                            ? 'bg-white/20 text-white'
                                                            : 'bg-indigo-500/10 text-indigo-600'
                                                    }`}
                                                >
                                                    {lead.status || 'NEW'}
                                                </span>
                                            </div>
                                            <div
                                                className={`text-[12px] font-black tracking-tight uppercase truncate mb-0.5 ${
                                                    isActive ? 'text-white' : 'text-slate-800 dark:text-white'
                                                }`}
                                            >
                                                {lead.customerName}
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span
                                                    className={`text-[10px] font-bold truncate ${
                                                        isActive ? 'text-white/70' : 'text-slate-400'
                                                    }`}
                                                >
                                                    {lead.phone}
                                                </span>
                                                <span
                                                    className={`text-[9px] font-black ${isActive ? 'text-white' : 'text-slate-500'}`}
                                                >
                                                    {lead.intentScore || 'COLD'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="h-full flex flex-col overflow-y-auto no-scrollbar bg-slate-50 dark:bg-[#08090b]">
                    <LeadEditorWrapper leadId={selectedLeadId} />
                </div>
            </MasterListDetailLayout>
        </div>
    );
}
