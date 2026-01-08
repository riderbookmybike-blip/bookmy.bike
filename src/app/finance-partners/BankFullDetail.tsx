'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { BankPartner, MOCK_BANK_PARTNERS } from '@/types/bankPartner';
import { ArrowLeft, Building2, MapPin, Users, Calculator } from 'lucide-react';
import OverviewTab from './tabs/OverviewTab';
import LocationsTab from './tabs/LocationsTab';
import TeamTab from './tabs/TeamTab';
import SchemesTab from './tabs/SchemesTab';

interface BankFullDetailProps {
    id: string;
}

export default function BankFullDetail({ id }: BankFullDetailProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = React.useState('schemes'); // Default to Schemes as requested for focus
    const partner = MOCK_BANK_PARTNERS.find(p => p.id === id);

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
                            onClick={() => router.push('/finance-partners')}
                            className="mt-2 p-3.5 rounded-2xl bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-400 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all border border-slate-200 dark:border-white/5 group shadow-sm dark:shadow-xl shadow-black/5"
                        >
                            <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                        </button>

                        <div>
                            <div className="flex items-center gap-4 mb-2">
                                <span className="text-[10px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-[0.4em]">Finance Partner</span>
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-800" />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Partner Entity</span>
                            </div>
                            <h1 className="text-8xl font-black italic text-slate-900 dark:text-white uppercase tracking-tighter leading-tight drop-shadow-sm dark:drop-shadow-2xl">
                                {partner.name}
                            </h1>
                            <div className="flex items-center gap-6 mt-3">
                                <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-white/5">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ID</span>
                                    <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400">{partner.displayId}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-white/5">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Web</span>
                                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 tracking-wider transition-colors hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">{partner.overview.website}</span>
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
                        <div className="flex -space-x-3">
                            {['A', 'B', 'C'].map((label, i) => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-950 bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-[10px] font-black text-slate-400 shadow-sm dark:shadow-xl ring-4 ring-slate-100 dark:ring-white/5">
                                    {label}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Studio Tabs */}
                <div className="mt-16 flex items-center gap-3 bg-white dark:bg-white/[0.03] p-2 rounded-[32px] w-fit border border-slate-200 dark:border-white/5 backdrop-blur-md shadow-sm dark:shadow-2xl">
                    {[
                        { id: 'overview', label: 'Overview', icon: Building2 },
                        { id: 'locations', label: 'Locations', icon: MapPin },
                        { id: 'team', label: 'Team', icon: Users },
                        { id: 'schemes', label: 'Schemes', icon: Calculator },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-3 px-8 py-3.5 rounded-[24px] text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                                ? 'bg-blue-600 text-white shadow-lg dark:shadow-2xl dark:shadow-blue-500/40 scale-[1.02]'
                                : 'text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'
                                }`}
                        >
                            <tab.icon size={16} className={activeTab === tab.id ? 'opacity-100' : 'opacity-40'} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Content */}
            <div className="w-full p-6">
                {activeTab === 'overview' && <OverviewTab partner={partner} />}
                {activeTab === 'locations' && <LocationsTab locations={partner.locations} />}
                {activeTab === 'team' && <TeamTab team={partner.team} />}
                {activeTab === 'schemes' && <SchemesTab schemes={partner.schemes} />}
            </div>
        </div>
    );
}
