'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import LeadList, { Lead } from '@/components/modules/leads/LeadList';
import { LeadOverview, LeadHistory, LeadActivity, LeadQuotes, LeadBookings } from '@/components/modules/leads/LeadTabs';
import { Button } from '@/components/ui/button';
import LeadForm from '@/components/modules/leads/LeadForm';
import { useTenant } from '@/lib/tenant/tenantContext';
import { getLeads, createLeadAction, createQuoteAction } from '@/actions/crm';
import QuoteForm from '@/components/modules/quotes/QuoteForm';
import MasterListDetailLayout from '@/components/templates/MasterListDetailLayout';
import {
    ArrowRight,
    Loader2,
    Zap,
    Phone,
    Mail,
    ChevronLeft,
    FileText,
    History,
    Activity,
    CreditCard
} from 'lucide-react';
import { toast } from 'sonner';
import { useCelebration } from '@/components/providers/CelebrationProvider';

const formatLeadId = (id: string) => {
    const cleanId = id.replace(/-/g, '').toUpperCase();
    return `${cleanId.slice(0, 3)}-${cleanId.slice(3, 6)}-${cleanId.slice(6, 9)}`;
};

export default function LeadsPage() {
    const { tenantId } = useTenant();
    const { triggerCelebration } = useCelebration();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isQuoteFormOpen, setIsQuoteFormOpen] = useState(false);

    const fetchLeads = async () => {
        if (!tenantId) return;
        setIsLoading(true);
        try {
            const data = await getLeads(tenantId);
            setLeads(data || []);
            // Zoho-style: Start with list only, no auto-selection
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

    const handleNewLead = () => {
        setIsFormOpen(true);
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
                customer_name: data.customerName,
                customer_phone: data.phone,
                customer_pincode: data.pincode,
                customer_dob: data.dob,
                interest_model: data.model,
                owner_tenant_id: tenantId,
                source: 'MANUAL'
            });

            toast.success('Lead created successfully');
            triggerCelebration('LEAD_CREATED');
            await fetchLeads();
            setIsFormOpen(false);
        } catch (error) {
            console.error('Failed to create lead:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to create lead');
        }
    };

    const handleQuoteSubmit = async (data: { customerName: string; product: { id: string; label: string; sku: string }; price: number }) => {
        try {
            if (!tenantId || !selectedLead) return;

            await createQuoteAction({
                tenant_id: tenantId,
                lead_id: selectedLead.id,
                variant_id: data.product.id,
                commercials: {
                    label: data.product.label,
                    grand_total: data.price,
                    variant_sku: data.product.sku
                }
            });

            toast.success('Quote generated successfully');
            triggerCelebration('QUOTE_CREATED');
            setIsQuoteFormOpen(false);
        } catch (error) {
            console.error('Failed to create quote:', error);
            toast.error('Failed to generate quote');
        }
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: <Zap size={14} /> },
        { id: 'quotes', label: 'Quotes', icon: <FileText size={14} /> },
        { id: 'booking', label: 'Booking', icon: <CreditCard size={14} /> },
        { id: 'history', label: 'Timeline', icon: <History size={14} /> },
        { id: 'activity', label: 'Activity', icon: <Activity size={14} /> },
    ];

    const renderTabContent = () => {
        if (!selectedLead) return null;
        switch (activeTab) {
            case 'overview': return <LeadOverview lead={selectedLead} />;
            case 'quotes': return <LeadQuotes leadId={selectedLead.id} />;
            case 'booking': return <LeadBookings leadId={selectedLead.id} />;
            case 'history': return <LeadHistory customerId={selectedLead.customerId} />;
            case 'activity': return <LeadActivity lead={selectedLead} />;
            default: return <LeadOverview lead={selectedLead} />;
        }
    };

    if (isLoading && leads.length === 0) {
        return (
            <div className="h-full bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Initializing_Intelligence...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full bg-slate-50 dark:bg-slate-950 flex overflow-hidden font-sans" style={{ height: '100%' }}>
            <MasterListDetailLayout
                mode={selectedLead ? 'list-detail' : 'list-only'}
                listPosition={selectedLead ? 'right' : 'left'}
            >
                {/* List Panel */}
                <div className={`h-full flex flex-col bg-slate-50/50 dark:bg-black/60 backdrop-blur-3xl transition-all duration-700 ${selectedLead ? 'border-l border-slate-200 dark:border-white/5' : ''}`}>
                    <LeadList
                        leads={leads}
                        selectedId={selectedLead?.id || null}
                        onSelect={setSelectedLead}
                        onNewLead={handleNewLead}
                        isSidebar={!!selectedLead}
                    />
                </div>

                {/* Detail Panel */}
                <div className="h-full flex flex-col overflow-y-auto no-scrollbar bg-white dark:bg-[#0b0d10]">
                    {!selectedLead ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                            <Zap className="w-12 h-12 text-slate-200 dark:text-white/10 animate-pulse mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-[0.6em] text-slate-300 dark:text-white/20">Select_Customer_Profile</p>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col">
                            {/* Premium Glass Header */}
                            <div className="p-8 border-b border-slate-200 dark:border-white/5 bg-white/80 dark:bg-white/[0.02] backdrop-blur-3xl sticky top-0 z-30 transition-colors">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-6">
                                        <button
                                            onClick={() => setSelectedLead(null)}
                                            className="p-3 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 dark:text-white/40 hover:text-slate-900 dark:hover:text-white transition-all rounded-2xl border border-slate-200 dark:border-white/5 active:scale-90"
                                        >
                                            <ChevronLeft size={20} />
                                        </button>
                                        <div className="flex items-center gap-5">
                                            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-500/20 dark:to-purple-500/20 border border-slate-200 dark:border-white/10 flex items-center justify-center shadow-lg dark:shadow-2xl relative group">
                                                <div className="absolute inset-0 bg-indigo-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <Zap size={32} className="text-indigo-600 dark:text-white relative z-10 text-glow" />
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black text-indigo-500 dark:text-indigo-400/80 uppercase tracking-[0.3em] mb-1.5 flex items-center gap-2">
                                                    <span className="w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,1)]" />
                                                    ID: {formatLeadId(selectedLead.id)}
                                                </div>
                                                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic text-glow leading-none uppercase">
                                                    {selectedLead.customerName}
                                                </h1>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1 p-1.5 bg-slate-100 dark:bg-white/[0.03] rounded-2xl border border-slate-200 dark:border-white/5">
                                            <a href={`tel:${selectedLead.phone}`} className="p-3 hover:bg-white dark:hover:bg-indigo-500/20 text-slate-400 dark:text-white/40 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all rounded-xl active:scale-95">
                                                <Phone size={18} />
                                            </a>
                                            <a href={`mailto:?subject=AUMS Intelligence Notification`} className="p-3 hover:bg-white dark:hover:bg-purple-500/20 text-slate-400 dark:text-white/40 hover:text-purple-600 dark:hover:text-purple-400 transition-all rounded-xl active:scale-95">
                                                <Mail size={18} />
                                            </a>
                                        </div>

                                        <Button
                                            onClick={() => setIsQuoteFormOpen(true)}
                                            className="glass-card bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 dark:hover:bg-emerald-500/20 font-black text-[10px] uppercase tracking-widest px-8 h-12 rounded-2xl shadow-sm dark:shadow-xl active:scale-95 transition-all"
                                        >
                                            Generate_Quote
                                        </Button>
                                        <Button
                                            className="glass-card bg-white text-slate-900 border-slate-200 hover:bg-slate-50 dark:bg-white/5 dark:text-white dark:border-white/10 dark:hover:bg-white/10 font-black text-[10px] uppercase tracking-widest px-8 h-12 rounded-2xl active:scale-95 transition-all"
                                        >
                                            Next_Action
                                        </Button>
                                    </div>
                                </div>

                                {/* Dynamic Lifecycle Timeline */}
                                <div className="relative mt-10 px-4">
                                    <div className="absolute top-[9px] left-8 right-8 h-[2px] bg-slate-200 dark:bg-white/5" />
                                    <div className="flex items-center justify-between relative z-10">
                                        {['NEW', 'QUOTE', 'BOOKING', 'FINANCE', 'DELIVERED'].map((status, index) => {
                                            const isActive = selectedLead.status === status;
                                            return (
                                                <div key={status} className="flex flex-col items-center gap-4">
                                                    <div className={`w-5 h-5 rounded-full border-4 transition-all duration-700 ${isActive
                                                        ? 'bg-indigo-600 dark:bg-indigo-500 border-white dark:border-black shadow-[0_0_20px_rgba(99,102,241,0.5)] scale-125'
                                                        : 'bg-slate-200 dark:bg-black border-slate-300 dark:border-white/10'
                                                        }`} />
                                                    <span className={`text-[9px] font-black tracking-[0.2em] transition-colors duration-500 ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-white/20'
                                                        }`}>{status}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Refined SaaS Sub-Navigation */}
                            <div className="px-8 border-b border-slate-200 dark:border-white/5 bg-slate-50/80 dark:bg-black/40 backdrop-blur-md sticky top-[184px] z-20 transition-colors">
                                <div className="flex gap-12">
                                    {tabs.map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex items-center gap-2.5 py-6 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative ${activeTab === tab.id
                                                ? 'text-slate-900 dark:text-white'
                                                : 'text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/50'
                                                }`}
                                        >
                                            <span className={`transition-transform duration-500 ${activeTab === tab.id ? 'scale-110' : 'scale-100'}`}>
                                                {tab.icon}
                                            </span>
                                            {tab.label}
                                            {activeTab === tab.id && (
                                                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-indigo-600 dark:bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Content Matrix */}
                            <div className="p-10 bg-slate-50 dark:bg-transparent">
                                <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both">
                                    {renderTabContent()}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </MasterListDetailLayout>

            <LeadForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSubmit={handleFormSubmit}
            />
            <QuoteForm
                isOpen={isQuoteFormOpen}
                onClose={() => setIsQuoteFormOpen(false)}
                onSubmit={handleQuoteSubmit}
                initialCustomerName={selectedLead?.customerName}
            />
        </div>
    );
}
