'use client';

import React, { useState } from 'react';
import {
    Search,
    Bell,
    Plus,
    Mic,
    ChevronRight,
    Filter,
    Settings,
    ShieldCheck,
    Building2,
    Landmark,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AUMSBento } from './AUMSBento';
import { DealerBento } from './DealerBento';
import { FinancerBento } from './FinancerBento';

type Persona = 'AUMS' | 'DEALERSHIP' | 'FINANCER';
type Section = 'ANALYTICS' | 'OPERATIONS' | 'FINANCIALS';

interface BentoDashboardProps {
    initialPersona?: Persona;
    tenantName?: string;
    roleLabel?: string;
    userAvatar?: string;
}

export default function BentoDashboard({
    initialPersona = 'DEALERSHIP',
    tenantName = 'Command Node',
    roleLabel = 'User',
    userAvatar,
}: BentoDashboardProps) {
    const [persona, setPersona] = useState<Persona>(initialPersona);
    const [section, setSection] = useState<Section>('ANALYTICS');

    const renderContent = () => {
        let Views;
        switch (persona) {
            case 'AUMS':
                Views = AUMSBento;
                break;
            case 'DEALERSHIP':
                Views = DealerBento;
                break;
            case 'FINANCER':
                Views = FinancerBento;
                break;
        }

        switch (section) {
            case 'ANALYTICS':
                return <Views.ANALYTICS />;
            case 'OPERATIONS':
                return <Views.OPERATIONS />;
            case 'FINANCIALS':
                return <Views.FINANCIALS />;
        }
    };

    const personaConfig = {
        AUMS: { icon: ShieldCheck, label: 'AUMS Master' },
        DEALERSHIP: { icon: Building2, label: 'Dealer Hub' },
        FINANCER: { icon: Landmark, label: 'Capital Node' },
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#050505] pb-40 selection:bg-[#FFD700]/30 selection:text-black">
            <div className="max-w-[1400px] mx-auto mt-12 px-6">
                {/* SECTION NAVIGATION */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-12">
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white lowercase mb-1 underline decoration-[#FFD700] decoration-4 underline-offset-4">
                            {persona}
                        </h1>
                        <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.5em]">
                            {tenantName} // 0xACTIVE
                        </p>
                    </div>
                    <div className="flex gap-8 lg:gap-12 border-b-2 border-slate-100 dark:border-white/5 pb-2">
                        {(['ANALYTICS', 'OPERATIONS', 'FINANCIALS'] as Section[]).map(s => (
                            <button
                                key={s}
                                onClick={() => setSection(s)}
                                className={`text-[10px] font-black uppercase tracking-widest transition-all relative ${section === s ? 'text-black dark:text-white' : 'text-slate-300 dark:text-slate-700 hover:text-slate-600 dark:hover:text-slate-400'}`}
                            >
                                {s}
                                {section === s && (
                                    <motion.div
                                        layoutId="navline"
                                        className="absolute -bottom-[10px] left-0 right-0 h-0.5 bg-black dark:bg-white"
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* AI GREETING */}
                <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-8 mb-16">
                    <div className="flex-1">
                        <h2 className="text-4xl lg:text-5xl font-black tracking-tighter text-slate-900 dark:text-white mb-2">
                            Hey, Need help?
                        </h2>
                        <div className="flex items-center gap-4">
                            <p className="text-2xl lg:text-4xl text-slate-300 dark:text-slate-700 font-bold tracking-tight italic">
                                Just ask me anything!
                            </p>
                            <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-full shadow-lg flex items-center justify-center text-slate-900 dark:text-white border border-slate-100 dark:border-white/5 animate-bounce">
                                <Mic size={20} />
                            </div>
                        </div>
                    </div>
                    <button className="w-fit px-10 py-5 bg-[#FFD700] text-black rounded-full text-sm font-black uppercase tracking-widest shadow-[0_20px_50px_rgba(255,215,0,0.3)] group active:scale-95 transition-all">
                        Execute Workflow{' '}
                        <ChevronRight
                            size={20}
                            className="inline ml-2 group-hover:translate-x-1 transition-transform"
                        />
                    </button>
                </div>

                {/* BENTO STAGE */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${persona}-${section}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    >
                        {renderContent()}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* FLOATING ACTION TOOLBAR */}
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/80 dark:bg-black/80 backdrop-blur-xl px-4 py-3 rounded-full border border-white/20 dark:border-white/5 shadow-2xl z-50">
                <button className="p-4 bg-black dark:bg-[#FFD700] text-white dark:text-black rounded-full shadow-xl hover:scale-110 transition-all hover:bg-[#FFD700] dark:hover:bg-white mt-0 flex items-center justify-center group">
                    <Plus size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                </button>
                <div className="h-8 w-px bg-slate-200 dark:bg-white/10" />
                <button className="p-4 text-slate-400 dark:text-slate-500 hover:text-black dark:hover:text-white transition-all hover:bg-slate-50 dark:hover:bg-white/5 rounded-full">
                    <Search size={20} />
                </button>
                <button className="p-4 text-slate-400 dark:text-slate-500 hover:text-black dark:hover:text-white transition-all hover:bg-slate-50 dark:hover:bg-white/5 rounded-full">
                    <Filter size={20} />
                </button>
                <button className="p-4 text-slate-400 dark:text-slate-500 hover:text-black dark:hover:text-white transition-all hover:bg-slate-50 dark:hover:bg-white/5 rounded-full">
                    <Settings size={20} />
                </button>
            </div>
        </div>
    );
}
