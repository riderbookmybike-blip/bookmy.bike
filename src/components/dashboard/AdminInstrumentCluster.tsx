'use client';

import React, { useState, useEffect } from 'react';
import {
    Activity,
    Server,
    Database,
    Zap,
    TrendingUp,
    Shield,
    Users,
    Landmark,
    LayoutDashboard,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Clock,
    Plus,
    BarChart3,
    CheckCircle2,
} from 'lucide-react';
import { useTenant } from '@/lib/tenant/tenantContext';
import { getPlatformDashboardKpis, type PlatformKpis } from '@/actions/dashboardKpis';
import { motion, AnimatePresence } from 'framer-motion';
import { TFTCluster } from './TFTCluster';
import { TFTGauge } from './TFTGauge';
import { TFTIndicator, TFTIndicatorBank } from './TFTIndicator';
import AnalyticsDashboard from '@/components/admin/analytics/AnalyticsDashboard';

export default function AdminInstrumentCluster() {
    const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'tenants' | 'users'>('overview');
    const [kpis, setKpis] = useState<PlatformKpis | null>(null);
    const [kpiLoading, setKpiLoading] = useState(true);

    useEffect(() => {
        setKpiLoading(true);
        getPlatformDashboardKpis()
            .then(data => setKpis(data))
            .catch(console.error)
            .finally(() => setKpiLoading(false));
    }, []);

    const indicators = [
        { icon: Activity, active: true, label: 'PLATFORM UP', color: 'var(--tft-success)' },
        { icon: Server, active: true, label: 'NODE ACTIVE', color: 'var(--tft-cyan)' },
        { icon: Database, active: false, label: 'SYNC LAG', color: 'var(--tft-warning)' },
        { icon: Shield, active: true, label: 'SECURE', color: 'var(--tft-cyan)' },
    ];

    if (kpiLoading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-12">
                <div className="w-full max-w-2xl space-y-8">
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 1.5, ease: 'easeInOut' }}
                            className="h-full bg-[#FFD700] tft-indicator-glow"
                        />
                    </div>
                    <p className="text-[10px] font-black text-center text-[#FFD700] uppercase tracking-[0.6em] animate-pulse">
                        Booting Admin Systems...
                    </p>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'tenants', label: 'Tenants', icon: Landmark },
        { id: 'users', label: 'Users', icon: Users },
    ] as const;

    return (
        <TFTCluster title="PLATFORM COMMAND CENTER" status="PIT_WALL_ACTIVE">
            {/* ── PIT WALL NAVIGATION ─────────────────────── */}
            <div className="flex items-center gap-4 mb-12 p-3 bg-white/5 rounded-2xl w-fit mx-auto border border-white/5 backdrop-blur-md">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            flex items-center gap-3 px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all
                            ${
                                activeTab === tab.id
                                    ? 'bg-[#FFD700] text-black shadow-[0_0_20px_rgba(255,215,0,0.4)] scale-105'
                                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                            }
                        `}
                    >
                        <tab.icon size={14} strokeWidth={3} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-12"
                >
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                            {/* Left: Performance Gauges */}
                            <div className="lg:col-span-8 space-y-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="tft-glass-panel rounded-3xl p-10 flex flex-col items-center justify-center min-h-[400px]">
                                        <TFTGauge
                                            value={kpis?.bookings.total || 0}
                                            max={100}
                                            label="PLATFORM SALES"
                                            unit="UNITS"
                                            color="var(--tft-success)"
                                            size={320}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-8">
                                        <div className="tft-glass-panel rounded-3xl p-8 flex-1 flex flex-col justify-center">
                                            <TFTGauge
                                                type="bar"
                                                value={kpis?.leads.total || 0}
                                                max={1000}
                                                label="NETWORK TRAFFIC"
                                                unit="LEADS"
                                                color="var(--tft-cyan)"
                                            />
                                        </div>
                                        <div className="tft-glass-panel rounded-3xl p-8 flex-1 flex flex-col justify-center">
                                            <TFTGauge
                                                type="bar"
                                                value={kpis?.activeDealers || 0}
                                                max={50}
                                                label="ACTIVE TENANTS"
                                                unit="LOAD"
                                                color="var(--tft-orange)"
                                            />
                                        </div>
                                        <TFTIndicatorBank indicators={indicators} />
                                    </div>
                                </div>

                                {/* Platform Vitals Feed (TFT Style) */}
                                <div className="tft-glass-panel rounded-3xl overflow-hidden mt-4">
                                    <div className="p-6 border-b border-white/5 bg-white/2 flex justify-between items-center">
                                        <h3 className="text-[10px] font-black text-white uppercase tracking-[0.4em] flex items-center gap-3">
                                            <Activity size={16} className="text-[#FFD700]" /> TERMINAL_LOG_STREAM
                                        </h3>
                                        <div className="flex items-center gap-3 bg-black/40 px-3 py-1 rounded-lg border border-white/5">
                                            <div className="h-2 w-2 rounded-full bg-[#FFD700] animate-pulse" />
                                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                                                PIT_WALL_SYNC
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-8 space-y-4">
                                        {[
                                            {
                                                msg: "Tenant 'Aapli Autofin' reconciled successfully",
                                                time: '0.2s ago',
                                                status: 'OK',
                                            },
                                            {
                                                msg: 'Lead distribution engine throttle check: 88%',
                                                time: '1.4s ago',
                                                status: 'WARN',
                                            },
                                            {
                                                msg: 'Supabase connection pool heartbeat stable',
                                                time: '3.5s ago',
                                                status: 'OK',
                                            },
                                        ].map((log, i) => (
                                            <div
                                                key={i}
                                                className="flex items-center gap-4 text-[10px] font-mono border-b border-white/5 pb-3"
                                            >
                                                <span className="text-slate-600">[{log.time}]</span>
                                                <span
                                                    className={
                                                        log.status === 'OK' ? 'text-tft-success' : 'text-tft-warning'
                                                    }
                                                >
                                                    {log.status}
                                                </span>
                                                <span className="text-white opacity-80">{log.msg}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Commercial Tactical */}
                            <div className="lg:col-span-4 space-y-10">
                                <div className="tft-glass-panel rounded-3xl p-10 min-h-[300px] border-t-4 border-[#FFD700]">
                                    <h3 className="text-[10px] font-black text-white uppercase tracking-[0.4em] mb-8">
                                        GLOBAL_REVENUE
                                    </h3>
                                    <div className="flex items-end gap-2 h-40">
                                        {[60, 40, 80, 50, 90, 70, 85].map((h, i) => (
                                            <div
                                                key={i}
                                                className="flex-1 bg-[#FFD700]/10 border-t border-[#FFD700]/30 rounded-t-sm"
                                                style={{ height: `${h}%` }}
                                            />
                                        ))}
                                    </div>
                                    <div className="mt-8">
                                        <p className="text-3xl font-black italic text-[#FFD700] tft-number">
                                            ₹{(Number(kpis?.bookings.value || 0) / 100000).toFixed(1)}L
                                        </p>
                                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                                            REVENUE_MTD
                                        </p>
                                    </div>
                                </div>

                                <div className="tft-glass-panel rounded-[40px] p-8 space-y-6">
                                    <h3 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">
                                        ADMIN_TRIGGERS
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { icon: Landmark, label: 'TENANTS', color: 'tft-cyan' },
                                            { icon: Users, label: 'MEMBERS', color: 'slate-400' },
                                            { icon: Database, label: 'REPLICON', color: 'slate-400' },
                                            { icon: Shield, label: 'SECURITY', color: 'tft-orange' },
                                        ].map((act, i) => (
                                            <button
                                                key={i}
                                                className="flex flex-col items-center justify-center p-6 bg-black/40 hover:bg-white/5 border border-white/5 rounded-3xl transition-all group"
                                            >
                                                <act.icon
                                                    size={20}
                                                    className={`text-${act.color} mb-3 group-hover:scale-110 transition-transform`}
                                                />
                                                <span className="text-[8px] font-black text-slate-500 group-hover:text-white uppercase tracking-widest text-center">
                                                    {act.label}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'analytics' && (
                        <div className="tft-glass-panel rounded-[32px] p-2 min-h-[800px] overflow-hidden">
                            <AnalyticsDashboard />
                        </div>
                    )}

                    {activeTab === 'tenants' && (
                        <div className="tft-glass-panel rounded-[32px] p-12 min-h-[400px] flex items-center justify-center italic text-slate-500 uppercase tracking-[0.5em] text-xs">
                            TFT_TENANT_LOADER_INCOMING...
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </TFTCluster>
    );
}

// ── DECOMMISSIONED: AdminDashboard.tsx is superseded by this component ──
