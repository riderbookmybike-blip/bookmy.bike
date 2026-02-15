'use client';

import React, { useState, useEffect } from 'react';
import {
    Activity,
    Radar,
    Zap,
    ShieldCheck,
    Box,
    Navigation,
    LayoutGrid,
    Terminal,
    Search,
    Bell,
    Mic,
    MoreVertical,
    Plus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NexusCard, NexusTicker, NexusNumber } from './NexusPanels';
import { AUMSNexus } from './AUMSNexus';
import { DealerNexus } from './DealerNexus';
import { FinancerNexus } from './FinancerNexus';

type Persona = 'AUMS' | 'DEALERSHIP' | 'FINANCER';

interface NexusDashboardProps {
    initialPersona?: Persona;
    tenantName?: string;
    roleLabel?: string;
    kpis?: any;
    recentEvents?: any[];
}

export default function NexusDashboard({
    initialPersona = 'DEALERSHIP',
    tenantName = 'LOCAL_HOST',
    roleLabel = 'ROOT',
    kpis,
    recentEvents = [],
}: NexusDashboardProps) {
    const [persona, setPersona] = useState<Persona>(initialPersona);
    const [currentTime, setCurrentTime] = useState('');

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(
                new Date().toLocaleTimeString('en-US', {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                })
            );
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const renderDeck = () => {
        switch (persona) {
            case 'AUMS':
                return <AUMSNexus kpis={kpis} />;
            case 'DEALERSHIP':
                return <DealerNexus kpis={kpis} />;
            case 'FINANCER':
                return <FinancerNexus kpis={kpis} />;
        }
    };

    const pulseItems =
        recentEvents.length > 0
            ? recentEvents.map(e => `${e.event_name || e.event_type} @ ${e.taluka || 'SYSTEM'}`)
            : ['PENDING_TELEMETRY', 'SYSTEM_IDLE', 'NODE_01_ACTIVE', 'SIGNAL_STABLE_88%'];

    return (
        <div className="min-h-screen bg-[#050505] text-slate-400 font-sans selection:bg-[#FFD700] selection:text-black">
            {/* Global Telemetry Bar */}
            <div className="bg-black/20 backdrop-blur-md sticky top-0 z-50">
                <NexusTicker items={pulseItems} />
            </div>

            <main className="max-w-[1700px] mx-auto p-8 lg:p-12">
                {/* Mission HUD */}
                <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-12 mb-16">
                    <div>
                        <div className="flex items-center gap-4 mb-3">
                            <span className="px-3 py-1 bg-[#FFD700]/10 text-[#FFD700] text-[9px] font-black rounded-lg border border-[#FFD700]/20 tracking-widest uppercase">
                                Operational
                            </span>
                            <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                                ID: 0x{tenantName.slice(0, 8).toUpperCase()}
                            </span>
                        </div>
                        <h1 className="text-6xl font-black text-white tracking-tighter italic lowercase mb-2">
                            {persona}
                            <span className="text-[#FFD700]">_</span>deck
                        </h1>
                        <p className="text-sm font-bold text-slate-500 max-w-md">
                            Nexus orchestrating real-time node performance and capital displacement for{' '}
                            <span className="text-white">{tenantName}</span>.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <NexusCard className="w-48 py-4" glow>
                            <NexusNumber value={kpis?.leads?.total || 0} label="System Leads" trend="+12.4%" />
                        </NexusCard>
                        <NexusCard className="w-48 py-4">
                            <NexusNumber value={kpis?.quotes?.total || 0} label="Pending Quotes" trend="-2.8%" />
                        </NexusCard>
                    </div>
                </header>

                {/* Primary Content Grid */}
                <div className="grid grid-cols-12 gap-8">
                    {/* Left Rail: Node Telemetry */}
                    <div className="col-span-12 lg:col-span-3 space-y-8">
                        <NexusCard title="Node Identity" subtitle={roleLabel} icon={Terminal}>
                            <div className="space-y-4 mt-2">
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">
                                        Authorization
                                    </p>
                                    <p className="text-xs font-bold text-white uppercase italic">Level_04 Secure</p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">
                                        Encrypted Tunnel
                                    </p>
                                    <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest">
                                        0x918...42A // UP
                                    </p>
                                </div>
                            </div>
                        </NexusCard>

                        <NexusCard title="Live Activity" subtitle="Network Signals" icon={Radar} glow>
                            <div className="h-64 relative flex items-center justify-center">
                                {/* Synthetic Radar Mesh */}
                                <div className="absolute inset-0 border border-[#FFD700]/10 rounded-full animate-ping" />
                                <div className="absolute inset-4 border border-[#FFD700]/5 rounded-full" />
                                <Radar size={48} className="text-[#FFD700]/40 animate-pulse" />
                                <div className="absolute bottom-0 inset-x-0 text-center">
                                    <span className="text-[10px] font-black text-[#FFD700] uppercase animate-pulse">
                                        Scanning Waves...
                                    </span>
                                </div>
                            </div>
                        </NexusCard>
                    </div>

                    {/* Central Deck: Persona Views */}
                    <div className="col-span-12 lg:col-span-9">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={persona}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                            >
                                {renderDeck()}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </main>

            {/* AI Nexus Trigger */}
            <div className="fixed bottom-12 right-12 z-[100]">
                <button className="group relative">
                    <div className="absolute inset-0 bg-[#FFD700] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
                    <div className="relative w-16 h-16 bg-black border border-white/10 rounded-2xl flex items-center justify-center text-[#FFD700] hover:scale-110 active:scale-95 transition-all shadow-2xl">
                        <Mic size={24} />
                    </div>
                </button>
            </div>

            {/* Quick Actions Float */}
            <div className="fixed bottom-12 left-12 z-[100] flex gap-3">
                <button className="h-12 w-12 bg-[#FFD700] text-black rounded-xl flex items-center justify-center font-black shadow-[0_10px_30px_rgba(255,215,0,0.3)] hover:scale-110 active:scale-90 transition-all">
                    <Plus size={20} />
                </button>
                <div className="flex bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl p-1 shadow-2xl">
                    <button className="p-3 text-slate-500 hover:text-white transition-all">
                        <Box size={18} />
                    </button>
                    <button className="p-3 text-slate-500 hover:text-white transition-all">
                        <Navigation size={18} />
                    </button>
                    <button className="p-3 text-slate-500 hover:text-white transition-all">
                        <LayoutGrid size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
