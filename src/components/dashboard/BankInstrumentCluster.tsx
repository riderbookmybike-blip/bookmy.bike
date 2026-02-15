'use client';

import React from 'react';
import { Wallet, Landmark, Zap, CheckCircle2, Clock, TrendingUp, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { TFTCluster } from './TFTCluster';
import { TFTGauge } from './TFTGauge';
import { TFTIndicator, TFTIndicatorBank } from './TFTIndicator';
import { RecentActivity } from './DashboardWidgets';

export default function BankInstrumentCluster() {
    const bankIndicators = [
        { icon: Landmark, active: true, label: 'BANK SYNC', color: 'var(--tft-success)' },
        { icon: ShieldCheck, active: true, label: 'SECURE', color: 'var(--tft-cyan)' },
        { icon: Zap, active: true, label: 'MT_HUB', color: 'var(--tft-orange)' },
    ];

    return (
        <TFTCluster title="FINANCE INSTRUMENT CLUSTER" status="VAULT_LOCKED">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* ── CENTRAL FINANCE HUB ─────────────────────── */}
                <div className="lg:col-span-8 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Application Throttle Meter */}
                        <div className="tft-glass-panel rounded-3xl p-10 flex flex-col items-center justify-center min-h-[450px]">
                            <TFTGauge
                                value={85}
                                max={100}
                                label="APP FLOW"
                                unit="ACTIVE"
                                color="var(--tft-cyan)"
                                size={350}
                            />
                        </div>

                        {/* Financial Metrics */}
                        <div className="flex flex-col gap-8">
                            <div className="tft-glass-panel rounded-3xl p-8 flex-1 flex flex-col justify-center">
                                <TFTGauge
                                    type="bar"
                                    value={12}
                                    max={20}
                                    label="PARTNER DEALERS"
                                    unit="SYNCED"
                                    color="var(--tft-orange)"
                                />
                            </div>
                            <div className="tft-glass-panel rounded-3xl p-8 flex-1 flex flex-col justify-center">
                                <TFTGauge
                                    type="bar"
                                    value={98}
                                    max={100}
                                    label="DEDUPE SUCCESS"
                                    unit="%"
                                    color="var(--tft-success)"
                                />
                            </div>
                            <TFTIndicatorBank indicators={bankIndicators} />
                        </div>
                    </div>

                    {/* Integrated Finance Logs */}
                    <div className="tft-glass-panel rounded-3xl p-8">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">
                                RECENT_VAULT_ACTIVITY
                            </h3>
                            <Clock size={16} className="text-slate-500" />
                        </div>
                        <RecentActivity />
                    </div>
                </div>

                {/* ── SIDE PANEL HUD ─────────────────────────────── */}
                <div className="lg:col-span-4 space-y-10">
                    <div className="tft-glass-panel rounded-3xl p-10 min-h-[350px] border-t-4 border-[#FFD700]">
                        <h3 className="text-[10px] font-black text-white uppercase tracking-[0.4em] mb-10">
                            DISBURSE_VAR
                        </h3>
                        <div className="flex-1 flex items-end gap-3 h-40">
                            {[30, 60, 40, 80, 50, 70, 90].map((h, i) => (
                                <div
                                    key={i}
                                    className="flex-1 bg-[#FFD700]/10 border-t border-[#FFD700]/30 rounded-t-sm"
                                    style={{ height: `${h}%` }}
                                />
                            ))}
                        </div>
                        <div className="mt-8 flex justify-between items-end">
                            <div>
                                <p className="text-2xl font-black italic text-[#FFD700] tft-number">₹8.4Cr</p>
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                                    TOTAL_BOOK
                                </p>
                            </div>
                            <ArrowUpRight size={24} className="text-[#FFD700]" />
                        </div>
                    </div>

                    {/* Quick Access Node */}
                    <div className="tft-glass-panel rounded-[40px] p-8 space-y-6">
                        <h3 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">VAULT_TRIGGERS</h3>
                        <div className="grid grid-cols-1 gap-4">
                            {[
                                { icon: Wallet, label: 'DISBURSEMENTS', color: 'tft-cyan' },
                                { icon: ShieldCheck, label: 'USER AUTH', color: 'slate-400' },
                                { icon: TrendingUp, label: 'LTV REPORT', color: 'tft-orange' },
                            ].map((act, i) => (
                                <button
                                    key={i}
                                    className="flex items-center gap-6 p-6 bg-black/40 hover:bg-white/5 border border-white/5 rounded-2xl transition-all group"
                                >
                                    <act.icon
                                        size={22}
                                        className={`text-${act.color} group-hover:scale-110 transition-transform`}
                                    />
                                    <span className="text-[10px] font-black text-slate-500 group-hover:text-white uppercase tracking-[0.3em]">
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

// ── DECOMMISSIONED: BankDashboard.tsx is superseded by this component ──
