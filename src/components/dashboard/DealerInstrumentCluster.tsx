'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Zap,
    Bell,
    Clock,
    ShieldAlert,
    Package,
    TrendingUp,
    Wallet,
    CheckCircle2,
    Target,
    Activity,
} from 'lucide-react';
import { useTenant } from '@/lib/tenant/tenantContext';
import { useDashboardKpis } from '@/hooks/useDashboardKpis';
import { motion } from 'framer-motion';
import { TFTCluster } from './TFTCluster';
import { TFTGauge } from './TFTGauge';
import { TFTIndicator, TFTIndicatorBank } from './TFTIndicator';
import { InventoryTable } from './InventoryTable';

export default function DealerInstrumentCluster() {
    const { tenant } = useTenant();
    const { kpis, loading: kpiLoading } = useDashboardKpis(tenant?.id);

    // ── TFT MAPPING ──────────────────────────────────────────────

    const indicators = [
        { icon: Zap, active: (kpis?.leads.newToday || 0) > 0, label: 'NEW LEADS', color: 'var(--tft-orange)' },
        { icon: Bell, active: true, label: 'SYSTEM OK', color: 'var(--tft-success)' },
        { icon: Clock, active: (kpis?.quotes.pending || 0) > 5, label: 'PENDING REQ', color: 'var(--tft-warning)' },
        { icon: ShieldAlert, active: false, label: 'ALERTS', color: 'var(--tft-critical)' },
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

    return (
        <TFTCluster title={tenant?.name || 'DEALERSHIP PANEL'} status="TFT_MODE_ACTIVE">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* ── CENTRAL INSTRUMENTATION ─────────────────────── */}
                <div className="lg:col-span-8 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* High-Contrast Velocity Meter */}
                        <div className="tft-glass-panel rounded-3xl p-10 flex flex-col items-center justify-center min-h-[450px] relative overflow-hidden">
                            <div className="absolute top-0 left-0 p-6">
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                                    Digital Meter / 1.0
                                </span>
                            </div>
                            <TFTGauge
                                value={kpis?.leads.total || 0}
                                max={500}
                                label="LEADS HEAT"
                                unit="Pipeline"
                                color="#FFD700"
                                size={350}
                            />
                            <div className="mt-6 flex flex-col items-center">
                                <span className="text-[10px] font-black text-[#FFD700] uppercase tracking-[0.4em] bg-[#FFD700]/10 px-4 py-1.5 rounded-full border border-[#FFD700]/20 animate-pulse">
                                    THROTTLE: {(Number(kpis?.leads.conversion || 0) / 10).toFixed(1)}x
                                </span>
                            </div>
                        </div>

                        {/* Secondary Status Column */}
                        <div className="flex flex-col gap-8">
                            <div className="tft-glass-panel rounded-3xl p-8 flex-1 flex flex-col justify-center">
                                <TFTGauge
                                    type="bar"
                                    value={kpis?.bookings.total || 0}
                                    max={50}
                                    label="BOOKINGS STATUS"
                                    unit="UNITS"
                                    color="#FFD700"
                                />
                            </div>
                            <div className="tft-glass-panel rounded-3xl p-8 flex-1 flex flex-col justify-center">
                                <TFTGauge
                                    type="bar"
                                    value={Number(kpis?.leads.conversion || 0)}
                                    max={100}
                                    label="DELIVERY SUCCESS"
                                    unit="%"
                                    color="#FFD700"
                                />
                            </div>
                            <TFTIndicatorBank indicators={indicators} />
                        </div>
                    </div>

                    {/* Integrated Log Panel */}
                    <div className="tft-glass-panel rounded-3xl overflow-hidden">
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
                        <InventoryTable />
                    </div>
                </div>

                {/* ── SIDE PANEL HUD ─────────────────────────────── */}
                <div className="lg:col-span-4 space-y-10">
                    {/* Revenue Telemetry */}
                    <div className="tft-glass-panel rounded-3xl p-10 flex flex-col min-h-[350px]">
                        <div className="flex items-center justify-between mb-10">
                            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">
                                REVENUE_VAR
                            </h3>
                            <TrendingUp size={16} className="text-[#FFD700] opacity-50" />
                        </div>
                        <div className="flex-1 flex items-end gap-3 px-2 pb-4">
                            {[45, 80, 55, 95, 75, 85, 60].map((h, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${h}%` }}
                                    transition={{ delay: i * 0.1, duration: 1.2, ease: 'anticipate' }}
                                    className="flex-1 bg-white/[0.03] border-t border-[#FFD700]/40 rounded-t-sm relative group"
                                >
                                    <div className="absolute inset-0 bg-[#FFD700]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </motion.div>
                            ))}
                        </div>
                        <div className="flex justify-between mt-4">
                            <span className="text-[8px] font-black text-slate-600 uppercase">D-7</span>
                            <span className="text-[8px] font-black text-[#FFD700] uppercase underline">
                                Peak Efficiency
                            </span>
                            <span className="text-[8px] font-black text-slate-600 uppercase">NOW</span>
                        </div>
                    </div>

                    {/* Mission Focus */}
                    <div className="tft-glass-panel rounded-3xl p-10 border-l-8 border-[#FFD700] relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 opacity-5 rotate-12">
                            <Target size={120} className="text-[#FFD700]" />
                        </div>
                        <div className="space-y-8 relative z-10">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">
                                        TARGET_VECTOR
                                    </h4>
                                    <p className="text-xl font-black text-white uppercase italic tracking-tighter racing-italic">
                                        SYNERGY_MTD
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-black italic text-[#FFD700] tft-number">72%</p>
                                </div>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                <div className="h-full w-[72%] bg-[#FFD700] tft-indicator-glow" />
                            </div>
                            <div className="flex justify-between pt-2">
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                                    Shift: Gamma-9
                                </span>
                                <span className="text-[8px] font-black text-white uppercase tracking-widest">
                                    12 Left
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Operational Triggers */}
                    <div className="tft-glass-panel rounded-[40px] p-8 space-y-6">
                        <h3 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">SYS_TRIGGERS</h3>
                        <div className="grid grid-cols-2 gap-5">
                            {[
                                { icon: Zap, label: 'NEW QUOTE', color: '#FFD700' },
                                { icon: Wallet, label: 'LEDGER', color: 'slate-400' },
                                { icon: Package, label: 'REQUISITION', color: 'slate-400' },
                                { icon: CheckCircle2, label: 'FINALIZE', color: '#FFD700' },
                            ].map((act, i) => (
                                <button
                                    key={i}
                                    className="flex flex-col items-center justify-center p-8 bg-black/40 hover:bg-white/5 border border-white/5 rounded-3xl transition-all group tft-beveled"
                                >
                                    <act.icon
                                        size={24}
                                        className={`mb-4 group-hover:scale-110 transition-transform ${act.color.startsWith('#') ? 'tft-indicator-glow' : `text-${act.color}`}`}
                                        style={{ color: act.color.startsWith('#') ? act.color : undefined }}
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
        </TFTCluster>
    );
}

// ── DECOMMISSIONED: DealerDashboard.tsx is superseded by this component ──
