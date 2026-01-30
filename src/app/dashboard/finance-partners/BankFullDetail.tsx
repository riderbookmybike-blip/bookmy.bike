'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { BankPartner, MOCK_BANK_PARTNERS } from '@/types/bankPartner';
import { ArrowLeft, Building2, MapPin, Users, Calculator, Loader2 } from 'lucide-react';
import OverviewTab from './tabs/OverviewTab';
import LocationsTab from './tabs/LocationsTab';
import TeamTab from './tabs/TeamTab';
import SchemesTab from './tabs/SchemesTab';
import ManagementTab from './tabs/ManagementTab';
import ServiceabilityTab from './tabs/ServiceabilityTab';
import ChargesTab from './tabs/ChargesTab';
import { createClient } from '@/lib/supabase/client';
import { formatDisplayIdForUI } from '@/lib/displayId';
import { Shield, Map, CreditCard, Target, CircleDollarSign } from 'lucide-react';
import TargetsTab from './tabs/TargetsTab';
import PayoutsTab from './tabs/PayoutsTab';

interface BankFullDetailProps {
    id: string;
}

export default function BankFullDetail({ id }: BankFullDetailProps) {
    const router = useRouter();
    const params = useParams();
    const slug = params?.slug as string;
    const [activeTab, setActiveTab] = useState('schemes');
    const [realPartner, setRealPartner] = useState<BankPartner | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPartner = async () => {
            // First check mocks
            const mock = MOCK_BANK_PARTNERS.find(p => p.id === id);
            if (mock) {
                setRealPartner(mock);
                setLoading(false);
                return;
            }

            // Then check DB
            setLoading(true);
            const supabase = createClient();
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

            let query = supabase
                .from('id_tenants')
                .select('*')
                .eq('type', 'BANK');

            if (isUUID) {
                query = query.eq('id', id);
            } else {
                query = query.eq('slug', id);
            }

            const { data, error } = await query.maybeSingle();

            if (data) {
                const mapped: BankPartner = {
                    id: data.id,
                    displayId: data.display_id || data.id.slice(0, 8).toUpperCase(),
                    name: data.name,
                    status: data.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
                    identity: {
                        fullLogo: data.config?.fullLogo,
                        iconLogo: data.config?.iconLogo
                    },
                    admin: data.config?.admin,
                    overview: {
                        description: data.config?.overview?.description || 'Financing partner on the BookMyBike platform.',
                        website: data.config?.overview?.website || data.config?.website || 'https://bookmy.bike',
                        supportEmail: data.config?.overview?.supportEmail,
                        supportPhone: data.config?.overview?.supportPhone,
                        whatsapp: data.config?.overview?.whatsapp,
                        customerCare: data.config?.overview?.customerCare,
                        helpline: data.config?.overview?.helpline,
                        appLinks: data.config?.overview?.appLinks
                    },
                    locations: data.config?.locations || [],
                    team: data.config?.team || [],
                    schemes: data.config?.schemes || [],
                    chargesMaster: data.config?.chargesMaster || [],
                    management: data.config?.management || { states: [], areas: [], dealerIds: [] }
                };
                setRealPartner(mapped);
            }
            setLoading(false);
        };

        fetchPartner();
    }, [id]);

    const partner = realPartner;
    const basePath = slug ? `/app/${slug}/dashboard/finance-partners` : '/dashboard/finance-partners';

    if (!partner) {
        return (
            <div className="p-10 text-center">
                <h2 className="text-xl font-bold text-red-500">Finance Partner Not Found</h2>
                <button onClick={() => router.back()} className="mt-4 text-blue-500 underline">Go Back</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 pb-20 transition-colors duration-500">
            {/* Studio Header */}
            <div className="px-12 pt-12 pb-8 border-b border-slate-200 dark:border-white/5 relative overflow-hidden bg-slate-50/30 dark:bg-transparent">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-1/3 h-full bg-blue-600/5 blur-[120px] -z-10" />

                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-8">
                        <button
                            onClick={() => router.push(basePath)}
                            className="mt-2 p-3.5 rounded-2xl bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-400 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all border border-slate-200 dark:border-white/5 group shadow-sm dark:shadow-xl shadow-black/5"
                        >
                            <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                        </button>

                        <div className="flex items-center gap-6">
                            {partner.identity?.iconLogo && (
                                <div className="w-20 h-20 rounded-[28px] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center p-3 shadow-2xl shadow-blue-500/10 dark:shadow-blue-500/5 ring-8 ring-blue-500/[0.02] -rotate-3 hover:rotate-0 transition-transform duration-500">
                                    <img src={partner.identity.iconLogo} alt={partner.name} className="w-full h-full object-contain" />
                                </div>
                            )}
                            <div>
                                <div className="flex items-center gap-4 mb-2">
                                    <span className="text-[10px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-[0.4em]">Finance Partner</span>
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-800" />
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Partner Entity</span>
                                </div>
                                <h1 className="text-8xl font-black italic text-slate-900 dark:text-white uppercase tracking-tighter leading-none drop-shadow-sm dark:drop-shadow-2xl">
                                    {partner.name}
                                </h1>
                                <div className="flex items-center gap-4 mt-5">
                                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-white/5">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ID</span>
                                        <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400">{formatDisplayIdForUI(partner.displayId)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-white/5 hidden md:flex">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Web</span>
                                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 tracking-wider transition-colors hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">{partner.overview.website}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-6 pt-2">
                        <div className="relative">
                            <div className={`absolute inset-0 blur-xl opacity-20 ${partner.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                            <span className={`relative px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border shadow-sm dark:shadow-2xl ${partner.status === 'ACTIVE'
                                ? 'bg-emerald-500 text-white dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-500/20 shadow-emerald-500/10'
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-500/10 dark:text-slate-400 border-slate-200 dark:border-white/10'
                                }`}>
                                {partner.status}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Studio Tabs */}
                <div className="mt-16 flex items-center gap-2 bg-white dark:bg-white/[0.03] p-1.5 rounded-[32px] w-full border border-slate-200 dark:border-white/5 backdrop-blur-md shadow-sm dark:shadow-2xl overflow-x-auto no-scrollbar">
                    {[
                        { id: 'overview', label: 'Overview', icon: Building2 },
                        { id: 'management', label: 'Management', icon: Shield },
                        { id: 'serviceability', label: 'Serviceability', icon: Map },
                        { id: 'charges', label: 'Charges', icon: CreditCard },
                        { id: 'schemes', label: 'Schemes', icon: Calculator },
                        { id: 'targets', label: 'Targets', icon: Target },
                        { id: 'payouts', label: 'Payouts', icon: CircleDollarSign },
                        { id: 'team', label: 'Team', icon: Users },
                        { id: 'locations', label: 'Locations', icon: MapPin },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-[24px] text-[10px] font-black uppercase tracking-widest transition-all flex-1 min-w-fit whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-blue-600 text-white shadow-lg dark:shadow-2xl dark:shadow-blue-500/40 scale-[1.02]'
                                : 'text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'
                                }`}
                        >
                            <tab.icon size={14} className={activeTab === tab.id ? 'opacity-100' : 'opacity-40'} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="w-full p-6">
                {activeTab === 'overview' && <OverviewTab partner={partner} />}
                {activeTab === 'management' && <ManagementTab partner={partner} />}
                {activeTab === 'serviceability' && <ServiceabilityTab partner={partner} />}
                {activeTab === 'charges' && (
                    <ChargesTab
                        partner={partner}
                        onSaveSuccess={(chargesMaster) => {
                            setRealPartner(prev => prev ? { ...prev, chargesMaster } : prev);
                        }}
                    />
                )}
                {activeTab === 'targets' && <TargetsTab partner={partner} />}
                {activeTab === 'payouts' && <PayoutsTab partner={partner} />}
                {activeTab === 'locations' && <LocationsTab locations={partner.locations} />}
                {activeTab === 'team' && <TeamTab team={partner.team} admin={partner.admin} />}
                {activeTab === 'schemes' && (
                    <SchemesTab
                        schemes={partner.schemes}
                        bankId={partner.id}
                        chargesMaster={partner.chargesMaster}
                        onSchemesUpdated={(schemes) => {
                            setRealPartner(prev => prev ? { ...prev, schemes } : prev);
                        }}
                    />
                )}
            </div>
        </div>
    );
}
