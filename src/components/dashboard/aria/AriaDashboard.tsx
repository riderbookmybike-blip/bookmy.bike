'use client';

import React, { useState, useEffect } from 'react';
import {
    Activity,
    Layout,
    Zap,
    ShieldCheck,
    Layers,
    Compass,
    Search,
    Bell,
    Menu,
    User,
    Calendar,
    Clock,
    ArrowRight,
    Settings,
    TrendingUp,
    BarChart3,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AriaCard, AriaPulse, AriaNumber, EnterpriseTable } from './AriaPanels';
import { AUMSAria } from './AUMSAria';
import { DealerAria } from './DealerAria';
import { FinancerAria } from './FinancerAria';
import type { DashboardSkuTrends, DealerCrmInsights } from '@/actions/dashboardKpis';

type Persona = 'AUMS' | 'DEALERSHIP' | 'FINANCER';

interface AriaDashboardProps {
    initialPersona?: Persona;
    tenantName?: string;
    roleLabel?: string;
    kpis?: any;
    recentEvents?: any[];
    skuTrends?: DashboardSkuTrends | null;
    crmInsights?: DealerCrmInsights | null;
}

export default function AriaDashboard({
    initialPersona: persona = 'DEALERSHIP',
    tenantName = 'LOCAL_HOST',
    roleLabel = 'ROOT',
    kpis,
    recentEvents = [],
    skuTrends = null,
    crmInsights = null,
}: AriaDashboardProps) {
    const [greeting, setGreeting] = useState('');

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good Morning');
        else if (hour < 18) setGreeting('Good Afternoon');
        else setGreeting('Good Evening');
    }, []);

    const renderDeck = () => {
        switch (persona) {
            case 'AUMS':
                return <AUMSAria kpis={kpis} skuTrends={skuTrends} />;
            case 'DEALERSHIP':
                return <DealerAria kpis={kpis} skuTrends={skuTrends} crmInsights={crmInsights} />;
            case 'FINANCER':
                return <FinancerAria kpis={kpis} />;
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F5F9] text-[#697a8d] font-sans selection:bg-[#696CFF]/20 selection:text-[#696CFF]">
            <main className="max-w-[1600px] mx-auto p-8 lg:p-10 space-y-10">
                {/* Enterprise Header */}
                <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[11px] font-bold uppercase tracking-wide text-[#696CFF] bg-[#696CFF]/10 px-2 py-0.5 rounded">
                                aria / {persona.toLowerCase()}
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold text-slate-800 tracking-tight mb-1">
                            {greeting}, <span className="text-[#696CFF]">{roleLabel}</span>.
                        </h1>
                        <p className="text-sm text-slate-500 max-w-lg">
                            System initialized at <span className="font-semibold text-slate-700">{tenantName}</span>.
                            Global node active and synchronized.
                        </p>
                    </motion.div>

                    <div className="flex gap-4">
                        <AriaCard className="py-4 px-6 min-w-[180px]" variant="white">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                                    <TrendingUp size={18} />
                                </div>
                                <AriaNumber value={kpis?.leads?.total || 0} label="Network Traffic" />
                            </div>
                        </AriaCard>
                        <AriaCard className="py-4 px-6 min-w-[180px]" variant="white">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-[#696CFF]/10 text-[#696CFF] rounded-lg">
                                    <BarChart3 size={18} />
                                </div>
                                <AriaNumber value={kpis?.bookings?.total || 0} label="Conversion" />
                            </div>
                        </AriaCard>
                    </div>
                </header>

                {/* Perspective Viewport */}
                <div className="relative">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={persona}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.99 }}
                            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        >
                            {renderDeck()}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}

function Plus(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
    );
}
