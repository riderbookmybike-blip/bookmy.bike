'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import LeadList, { Lead } from '@/components/modules/leads/LeadList';
import { LeadOverview, LeadHistory, LeadActivity, LeadQuotes, LeadBookings, LeadDocuments } from '@/components/modules/leads/LeadTabs';
import { Button } from '@/components/ui/button';
import LeadForm from '@/components/modules/leads/LeadForm';
import { useTenant } from '@/lib/tenant/tenantContext';
import { getLeads, createLeadAction, createQuoteAction } from '@/actions/crm';
import QuoteForm from '@/components/modules/quotes/QuoteForm';
import MasterListDetailLayout from '@/components/templates/MasterListDetailLayout';
import StatsHeader from '@/components/modules/shared/StatsHeader';
import ModuleLanding from '@/components/modules/shared/ModuleLanding';
import {
    ArrowRight,
    Zap,
    Phone,
    Mail,
    Plus,
    FileText,
    History,
    Activity,
    CreditCard,
    Users,
    Flame,
    Target,
    TrendingUp,
    Clock,
    LayoutGrid,
    Search as SearchIcon,
    Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { useCelebration } from '@/components/providers/CelebrationProvider';

// The formatLeadId function is moved inside the component in the new code.
// const formatLeadId = (id: string) => {
//     const cleanId = id.replace(/-/g, '').toUpperCase();
//     return `${cleanId.slice(0, 3)}-${cleanId.slice(3, 6)}-${cleanId.slice(6, 9)}`;
// };

export default function LeadsPage() {
    const { tenantId } = useTenant();
    const { triggerCelebration } = useCelebration();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isQuoteFormOpen, setIsQuoteFormOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [view, setView] = useState<'grid' | 'list'>('list');

    const fetchLeads = async () => {
        if (!tenantId) return;
        setIsLoading(true);
        try {
            const data = await getLeads(tenantId);
            setLeads(data || []);
        } catch (error) {
            console.error('Failed to fetch leads:', error);
            toast.error('Intelligence system offline');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (tenantId) {
            fetchLeads();
        }
    }, [tenantId]);

    const handleNewLead = () => setIsFormOpen(true);

    const filteredLeads = leads.filter(l =>
        l.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.phone.includes(searchQuery)
    );

    const stats = [
        { label: 'Total Leads', value: leads.length, icon: Users, color: 'indigo' as const, trend: '+12.5%' },
        { label: 'Hot Leads', value: leads.filter(l => l.intentScore === 'HOT').length, icon: Flame, color: 'rose' as const, trend: 'Priority' },
        { label: 'Qualified', value: leads.filter(l => l.status !== 'NEW' && l.status !== 'JUNK').length, icon: Target, color: 'emerald' as const },
        { label: 'In Pipeline', value: leads.filter(l => ['QUOTE', 'BOOKING'].includes(l.status)).length, icon: TrendingUp, color: 'amber' as const },
        { label: 'Avg Speed', value: '4.2h', icon: Clock, color: 'blue' as const, trend: '-15m' },
    ];

    const formatLeadId = (id: string) => {
        const cleanId = id.replace(/-/g, '').toUpperCase();
        return `${cleanId.slice(0, 3)}-${cleanId.slice(3, 6)}-${cleanId.slice(6, 9)}`;
    };

    const handleFormSubmit = async (data: {
        customerName: string;
        phone: string;
        pincode: string;
        model?: string;
        dob?: string;
    }) => {
        try {
            if (!tenantId) return;
            await createLeadAction({
                ...data,
                customer_name: data.customerName,
                customer_phone: data.phone,
                customer_pincode: data.pincode,
                customer_dob: data.dob, // Fixed mapping
                owner_tenant_id: tenantId,
                source: 'MANUAL'
            });
            toast.success('Lead created successfully');
            triggerCelebration('LEAD_CREATED');
            await fetchLeads();
            setIsFormOpen(false);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to create lead');
            throw error; // Re-throw so LeadForm knows it failed
        }
    };

    const handleQuoteSubmit = async (data: {
        customerName: string;
        product: { id: string; label: string; sku: string };
        price: number;
        color?: string;
        colorId?: string;
    }) => {
        try {
            if (!tenantId || !selectedLead) return;
            const result = await createQuoteAction({
                tenant_id: tenantId as string,
                lead_id: selectedLead.id,
                variant_id: data.product.id,
                color_id: data.colorId,
                commercials: {
                    label: data.product.label,
                    grand_total: data.price,
                    variant_sku: data.product.sku,
                    color_name: data.color
                }
            });

            if (result.success) {
                toast.success('Quote generated successfully');
                await fetchLeads();
                setIsQuoteFormOpen(false);
            } else {
                console.error('Server reported failure creating quote:', result);
                toast.error(result.message || 'Failed to generate quote');
            }
        } catch (error) {
            console.error('Network or logic error during quote creation:', error);
            toast.error('Failed to generate quote');
        }
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: <Zap size={14} /> },
        { id: 'quotes', label: 'Quotes', icon: <FileText size={14} /> },
        { id: 'booking', label: 'Booking', icon: <CreditCard size={14} /> },
        { id: 'documents', label: 'Identity Vault', icon: <Shield size={14} /> },
        { id: 'history', label: 'Timeline', icon: <History size={14} /> },
        { id: 'activity', label: 'Activity', icon: <Activity size={14} /> },
    ];

    const renderTabContent = () => {
        if (!selectedLead) return null;
        switch (activeTab) {
            case 'overview': return <LeadOverview lead={selectedLead} />;
            case 'quotes': return <LeadQuotes leadId={selectedLead.id} />;
            case 'booking': return <LeadBookings leadId={selectedLead.id} />;
            case 'documents': return <LeadDocuments memberId={selectedLead.customerId} tenantId={tenantId as string} />;
            case 'history': return <LeadHistory customerId={selectedLead.customerId} />;
            case 'activity': return <LeadActivity lead={selectedLead} />;
            default: return <LeadOverview lead={selectedLead} />;
        }
    };

    // --- LANDING VIEW ---
    if (!selectedLead) {
        return (
            <div className="h-full bg-slate-50 dark:bg-[#0b0d10]">
                <ModuleLanding
                    title="Leads"
                    subtitle="Customer Acquisition Pipeline"
                    onNew={handleNewLead}
                    searchPlaceholder="Search Lead Index..."
                    onSearch={setSearchQuery}
                    statsContent={<StatsHeader stats={stats} />}
                    view={view}
                    onViewChange={setView}
                >
                    {view === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                            {filteredLeads.map((lead) => (
                                <div
                                    key={lead.id}
                                    onClick={() => setSelectedLead(lead)}
                                    className="group relative bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-500/30 overflow-hidden"
                                >
                                    {/* Active Glow */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                                                ID: {formatLeadId(lead.id)}
                                            </div>
                                            <div className={`w-2.5 h-2.5 rounded-full ${lead.intentScore === 'HOT' ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,1)] animate-pulse' :
                                                lead.intentScore === 'WARM' ? 'bg-amber-500' : 'bg-slate-300'
                                                }`} />
                                        </div>

                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase mb-2 truncate group-hover:text-indigo-600 transition-colors">
                                            {lead.customerName}
                                        </h3>

                                        <div className="flex flex-col gap-1 mb-6">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lead.phone}</div>
                                            <div className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-tighter truncate">
                                                {lead.interestModel || 'General Inquiry'}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-white/5">
                                            <div className="px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-xl text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                                {lead.status}
                                            </div>
                                            <div className="p-2 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all text-slate-300">
                                                <ArrowRight size={18} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-white/5">
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Lead Identifier</th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Customer Persona</th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Product Interest</th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Status Node</th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Created</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLeads.map((lead) => (
                                        <tr
                                            key={lead.id}
                                            onClick={() => setSelectedLead(lead)}
                                            className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer border-b border-slate-50 dark:border-white/5 last:border-0"
                                        >
                                            <td className="p-6">
                                                <div className="text-xs font-black text-indigo-500 uppercase tracking-widest">{formatLeadId(lead.id)}</div>
                                            </td>
                                            <td className="p-6">
                                                <div>
                                                    <div className="text-sm font-black italic uppercase tracking-tighter text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                                                        {lead.customerName}
                                                    </div>
                                                    <div className="text-[10px] font-bold text-slate-400">{lead.phone}</div>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase">
                                                    {lead.interestModel || 'GENERAL_ENQUIRY'}
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="px-3 py-1 bg-indigo-500/10 rounded-lg text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                                                        {lead.status}
                                                    </div>
                                                    {lead.intentScore === 'HOT' && (
                                                        <Flame size={14} className="text-rose-500 fill-rose-500/20" />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase">{lead.created_at?.split('T')[0] || 'N/A'}</div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </ModuleLanding>
                <LeadForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSubmit={handleFormSubmit} />
            </div>
        );
    }

    // --- ZOHO SIDEBAR DETAIL VIEW ---
    return (
        <div className="h-full bg-slate-50 dark:bg-slate-950 flex overflow-hidden font-sans">
            <MasterListDetailLayout mode="list-detail" listPosition="left">
                {/* Fixed Searchable Sidebar */}
                <div className="h-full flex flex-col bg-white dark:bg-[#0b0d10] border-r border-slate-200 dark:border-white/5 w-full">
                    <div className="p-6 border-b border-slate-100 dark:border-white/5 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white">
                                Leads <span className="text-indigo-600">Index</span>
                            </h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleNewLead}
                                    className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/10 active:scale-95 group"
                                    title="Add New Lead"
                                >
                                    <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                                </button>
                                <button
                                    onClick={() => setSelectedLead(null)}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all text-slate-400"
                                    title="Back to Grid"
                                >
                                    <LayoutGrid size={18} />
                                </button>
                            </div>
                        </div>
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs font-bold focus:outline-none focus:border-indigo-500/50"
                                placeholder="Search index..."
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                        {filteredLeads.map((lead) => (
                            <button
                                key={lead.id}
                                onClick={() => setSelectedLead(lead)}
                                className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 group ${selectedLead?.id === lead.id
                                    ? 'bg-indigo-600 border-indigo-500 shadow-xl shadow-indigo-500/20 text-white translate-x-2'
                                    : 'bg-white dark:bg-white/5 border-slate-100 dark:border-white/10 hover:border-indigo-500/30 text-slate-900 dark:text-white shadow-sm'
                                    }`}
                            >
                                <div className="text-[9px] font-black uppercase opacity-60 mb-1">
                                    {formatLeadId(lead.id)}
                                </div>
                                <div className="text-sm font-black italic tracking-tighter uppercase mb-1 truncate">
                                    {lead.customerName}
                                </div>
                                <div className={`text-[9px] font-bold ${selectedLead?.id === lead.id ? 'text-white/80' : 'text-slate-500'} flex items-center gap-2`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${lead.status === 'JUNK' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                                    {lead.status}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Detail Content */}
                <div className="h-full flex flex-col overflow-y-auto no-scrollbar bg-slate-50 dark:bg-[#08090b]">
                    <div className="p-10">
                        {/* Detail Header */}
                        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between items-start gap-8">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-[2rem] bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-600/20">
                                    <Zap size={40} className="text-white" />
                                </div>
                                <div>
                                    <div className="text-indigo-500 text-[10px] font-black uppercase tracking-[0.4em] mb-2 flex items-center gap-2">
                                        <span className="w-4 h-[2px] bg-indigo-500 rounded-full" />
                                        Profile Overview
                                    </div>
                                    <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase leading-none">
                                        {selectedLead.customerName}
                                    </h1>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex bg-white dark:bg-white/5 p-1.5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
                                    <a href={`tel:${selectedLead.phone}`} className="p-3 hover:bg-slate-50 dark:hover:bg-indigo-600/10 text-slate-400 hover:text-indigo-600 transition-all rounded-xl">
                                        <Phone size={20} />
                                    </a>
                                    <a href={`mailto:?subject=Booking inquiry`} className="p-3 hover:bg-slate-50 dark:hover:bg-purple-600/10 text-slate-400 hover:text-purple-600 transition-all rounded-xl">
                                        <Mail size={20} />
                                    </a>
                                </div>
                                <Button
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest px-8 rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-95 transition-all"
                                    onClick={() => {
                                        if (selectedLead) {
                                            window.open(`/store/catalog?leadId=${selectedLead.id}`, '_blank');
                                        }
                                    }}
                                >
                                    <Zap size={14} className="mr-2" />
                                    Generate Quote
                                </Button>
                            </div>
                        </div>

                        {/* Lifecycle Timeline */}
                        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-10 mb-12 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <TrendingUp size={120} />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-12">
                                    {['NEW', 'QUOTE', 'BOOKING', 'FINANCE', 'DELIVERED'].map((st, i) => {
                                        const isDone = ['NEW', 'QUOTE', 'BOOKING', 'FINANCE', 'DELIVERED'].indexOf(selectedLead.status) >= i;
                                        return (
                                            <div key={st} className="flex flex-col items-center gap-4 flex-1">
                                                <div className="w-full flex items-center gap-2 px-2">
                                                    <div className={`h-1 flex-1 rounded-full transition-all duration-1000 ${i === 0 ? 'bg-transparent' : isDone ? 'bg-indigo-500' : 'bg-slate-100 dark:bg-white/10'}`} />
                                                    <div className={`w-4 h-4 rounded-full border-2 transition-all duration-700 ${isDone ? 'bg-indigo-500 border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-slate-200 dark:bg-white/10 border-transparent'}`} />
                                                    <div className={`h-1 flex-1 rounded-full transition-all duration-1000 ${i === 4 ? 'bg-transparent' : isDone && ['NEW', 'QUOTE', 'BOOKING', 'FINANCE', 'DELIVERED'].indexOf(selectedLead.status) > i ? 'bg-indigo-500' : 'bg-slate-100 dark:bg-white/10'}`} />
                                                </div>
                                                <span className={`text-[10px] font-black tracking-widest uppercase ${isDone ? 'text-indigo-500' : 'text-slate-400'}`}>
                                                    {st}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Detail Navigation */}
                        <div className="flex gap-8 mb-12 border-b border-slate-200 dark:border-white/10">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-3 py-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === tab.id
                                        ? 'text-indigo-600'
                                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'
                                        }`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                    {activeTab === tab.id && (
                                        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-indigo-600 rounded-full" />
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="max-w-6xl animate-in fade-in slide-in-from-bottom-8 duration-700">
                            {renderTabContent()}
                        </div>
                    </div>
                </div>
            </MasterListDetailLayout>
            <QuoteForm
                isOpen={isQuoteFormOpen}
                onClose={() => setIsQuoteFormOpen(false)}
                onSubmit={handleQuoteSubmit}
                initialCustomerName={selectedLead?.customerName}
                pincode={selectedLead?.pincode}
            />
        </div>
    );
}
