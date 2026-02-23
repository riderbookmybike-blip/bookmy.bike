import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
    Activity,
    AlertTriangle,
    BadgeIndianRupee,
    CheckCircle2,
    Filter,
    Package,
    Target,
    TrendingUp,
    Wallet,
} from 'lucide-react';
import { AriaCard, AriaNumber } from './AriaPanels';
import SkuTrendWidget from './SkuTrendWidget';
import type { DashboardSkuTrends, DealerCrmInsights, DealerStageCounts } from '@/actions/dashboardKpis';

type TabKey = 'scope' | 'operations' | 'wallet';

const DEFAULT_STAGE_COUNTS: DealerStageCounts = {
    quote: 0,
    booking: 0,
    payment: 0,
    finance: 0,
    allotment: 0,
    pdi: 0,
    insurance: 0,
    registration: 0,
    compliance: 0,
    delivery: 0,
    delivered: 0,
    feedback: 0,
};

const DEFAULT_INSIGHTS: DealerCrmInsights = {
    generatedAt: '',
    commercial: {
        avgQuoteValue: 0,
        avgBookingValue: 0,
    },
    operations: {
        openPipelineCount: 0,
        closedCount: 0,
        stageCounts: DEFAULT_STAGE_COUNTS,
        paymentPendingCount: 0,
        paymentClearedCount: 0,
        financeDisbursedCount: 0,
        financeDisbursedAmount: 0,
        allotmentPendingCount: 0,
        pdiPendingCount: 0,
        insurancePendingCount: 0,
        feedbackCapturedCount: 0,
        feedbackPendingCount: 0,
        avgNps: null,
    },
    wallet: {
        cashInCaptured: 0,
        cashInPending: 0,
        inventoryValue: 0,
        inventoryAvailableCount: 0,
        inventoryAllocatedCount: 0,
        inventorySoldCount: 0,
        procurementCommitted: 0,
        procurementReceivedValue: 0,
        procurementPendingValue: 0,
        netCashPosition: 0,
        payoutPressurePct: null,
    },
};

const formatINR = (value: number) => `₹${Math.round(value || 0).toLocaleString('en-IN')}`;
const formatPct = (value: number) => `${value.toFixed(1)}%`;
const asNumber = (value: unknown) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

export const DealerAria = ({
    kpis,
    skuTrends,
    crmInsights,
}: {
    kpis: any;
    skuTrends?: DashboardSkuTrends | null;
    crmInsights?: DealerCrmInsights | null;
}) => {
    const [activeTab, setActiveTab] = useState<TabKey>('scope');

    const insights = crmInsights || DEFAULT_INSIGHTS;
    const ops = insights.operations;
    const wallet = insights.wallet;
    const stageCounts = ops.stageCounts || DEFAULT_STAGE_COUNTS;

    const leadsTotal = asNumber(kpis?.leads?.total);
    const quotesTotal = asNumber(kpis?.quotes?.total);
    const quotesPending = asNumber(kpis?.quotes?.pending);
    const bookingsTotal = asNumber(kpis?.bookings?.total);
    const bookingValue = asNumber(kpis?.bookings?.value);

    const avgTicket =
        insights.commercial.avgBookingValue ||
        insights.commercial.avgQuoteValue ||
        (bookingsTotal > 0 ? bookingValue / bookingsTotal : 0);

    const quoteCoveragePct = leadsTotal > 0 ? (quotesTotal / leadsTotal) * 100 : 0;
    const leadToBookingPct = leadsTotal > 0 ? (bookingsTotal / leadsTotal) * 100 : 0;
    const quoteToBookingPct = quotesTotal > 0 ? (bookingsTotal / quotesTotal) * 100 : 0;

    const leadsWithoutQuote = Math.max(leadsTotal - quotesTotal, 0);
    const projectedBusinessUnits = Math.max(0, Math.round(quotesPending * 0.45 + leadsWithoutQuote * 0.2));
    const projectedBusinessValue = Math.round(projectedBusinessUnits * avgTicket);

    const operationsRiskCount =
        ops.paymentPendingCount + ops.allotmentPendingCount + ops.pdiPendingCount + ops.insurancePendingCount;
    const operationsHealth =
        bookingsTotal > 0 ? Math.max(0, 100 - (operationsRiskCount / Math.max(bookingsTotal, 1)) * 100) : 100;

    const focusAreas = useMemo(() => {
        const items: string[] = [];
        if (quoteCoveragePct < 70) {
            items.push('Lead se quote conversion low hai. Same-day quote push aur callback SLA tighten karo.');
        }
        if (quoteToBookingPct < 35) {
            items.push('Quote se booking drop high hai. Negotiation scripts aur finance pre-check improve karo.');
        }
        if (ops.paymentPendingCount > ops.paymentClearedCount) {
            items.push('Payments bottleneck dikh raha hai. Advance follow-up aur reconciliation ko priority do.');
        }
        if (ops.pdiPendingCount > 0 || ops.insurancePendingCount > 0) {
            items.push('Allotment/PDI/Insurance pending items close karne se fast delivery aur feedback milega.');
        }
        if (items.length === 0) {
            items.push('Current pipeline healthy hai. Ab focus high-ticket variants aur repeat referrals par rakho.');
        }
        return items.slice(0, 4);
    }, [
        ops.insurancePendingCount,
        ops.paymentClearedCount,
        ops.paymentPendingCount,
        ops.pdiPendingCount,
        quoteCoveragePct,
        quoteToBookingPct,
    ]);

    const stageBarData = [
        { name: 'Payment', value: stageCounts.payment },
        { name: 'Finance', value: stageCounts.finance },
        { name: 'Allotment', value: stageCounts.allotment },
        { name: 'PDI', value: stageCounts.pdi },
        { name: 'Delivery', value: stageCounts.delivery + stageCounts.delivered },
    ];

    const tabs: Array<{ id: TabKey; label: string; subtitle: string }> = [
        { id: 'scope', label: 'Opportunity Radar', subtitle: 'Lead + Quote Potential' },
        { id: 'operations', label: 'Operations Pulse', subtitle: 'Booking Stage Control' },
        { id: 'wallet', label: 'Wallet Control', subtitle: 'Cash Flow + Inventory' },
    ];

    const walletAdvisories = useMemo(() => {
        const notes: string[] = [];
        if ((wallet.payoutPressurePct || 0) > 80) {
            notes.push('Procurement pressure high hai. Incoming cash cycle ko accelerate karo.');
        }
        if (wallet.netCashPosition < 0) {
            notes.push('Net cash negative hai. High-value collection aur non-critical PO hold recommend hai.');
        }
        if (wallet.inventoryAllocatedCount > wallet.inventoryAvailableCount) {
            notes.push('Allocated stock available se zyada hai. Fast inward ya transfer plan ki zarurat hai.');
        }
        if (notes.length === 0) {
            notes.push('Cash aur inventory balance stable hai. Controlled expansion possible hai.');
        }
        return notes.slice(0, 3);
    }, [
        wallet.inventoryAllocatedCount,
        wallet.inventoryAvailableCount,
        wallet.netCashPosition,
        wallet.payoutPressurePct,
    ]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <AriaCard
                title="Sales Velocity"
                subtitle="CRM Revenue Snapshot"
                icon={TrendingUp}
                className="lg:col-span-1"
            >
                <div className="mt-6 flex flex-col gap-4">
                    <AriaNumber value={bookingsTotal} label="Active Bookings" trend={Math.round(leadToBookingPct)} />
                    <div className="h-px bg-slate-100" />
                    <AriaNumber value={formatINR(bookingValue)} label="Booked Value" />
                </div>
            </AriaCard>

            <AriaCard title="Pipeline Heat" subtitle="Operational Stage Load" icon={Package} className="lg:col-span-2">
                <div className="h-[180px] mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stageBarData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip
                                cursor={{ fill: 'rgba(105, 108, 255, 0.08)' }}
                                contentStyle={{
                                    borderRadius: '12px',
                                    border: '1px solid #EEF0F4',
                                    boxShadow: '0 6px 18px rgba(15,23,42,0.08)',
                                }}
                            />
                            <Bar dataKey="value" fill="#696CFF" radius={[5, 5, 0, 0]} barSize={30} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </AriaCard>

            <AriaCard title="Leads Funnel" subtitle="Scope Readiness" icon={Filter} className="lg:col-span-1">
                <div className="mt-6 flex flex-col gap-4">
                    <AriaNumber value={leadsTotal} label="Total Leads" trend={Math.round(quoteCoveragePct)} />
                    <div className="h-px bg-slate-100" />
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                            <span>Quote Coverage</span>
                            <span>{formatPct(quoteCoveragePct)}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                            <span>Quote to Booking</span>
                            <span>{formatPct(quoteToBookingPct)}</span>
                        </div>
                    </div>
                </div>
            </AriaCard>

            <div className="lg:col-span-4 mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
                            <Target size={18} className="text-[#696CFF]" />
                            CRM Command Deck
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                            Scope, operations, and wallet ko ek jagah se monitor karo.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`text-left rounded-xl border px-4 py-3 transition-all ${
                                    activeTab === tab.id
                                        ? 'border-[#696CFF] bg-[#696CFF]/10 text-[#3F43DA]'
                                        : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                            >
                                <p className="text-[11px] font-bold">{tab.label}</p>
                                <p className="text-[10px] opacity-80">{tab.subtitle}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {activeTab === 'scope' && (
                    <div className="mt-6 space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                            <MetricTile
                                label="Signups / Leads"
                                value={leadsTotal.toLocaleString('en-IN')}
                                icon={Target}
                            />
                            <MetricTile
                                label="Pending Quotes"
                                value={quotesPending.toLocaleString('en-IN')}
                                icon={Activity}
                            />
                            <MetricTile
                                label="Projected Units"
                                value={projectedBusinessUnits.toLocaleString('en-IN')}
                                icon={Package}
                            />
                            <MetricTile
                                label="Potential Business"
                                value={formatINR(projectedBusinessValue)}
                                icon={BadgeIndianRupee}
                            />
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-[11px] font-bold text-slate-700 mb-3">Where to Focus</p>
                            <div className="space-y-2">
                                {focusAreas.map((item, index) => (
                                    <div
                                        key={`${item}-${index}`}
                                        className="text-[12px] text-slate-600 flex items-start gap-2"
                                    >
                                        <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'operations' && (
                    <div className="mt-6 space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                            <MetricTile
                                label="Operation Health"
                                value={formatPct(operationsHealth)}
                                icon={Activity}
                                tone={operationsHealth < 70 ? 'warning' : 'normal'}
                            />
                            <MetricTile
                                label="Payment Pending"
                                value={ops.paymentPendingCount.toLocaleString('en-IN')}
                                icon={AlertTriangle}
                                tone={ops.paymentPendingCount > 0 ? 'warning' : 'normal'}
                            />
                            <MetricTile
                                label="Finance Disbursed"
                                value={formatINR(ops.financeDisbursedAmount)}
                                icon={BadgeIndianRupee}
                            />
                            <MetricTile
                                label="Feedback Captured"
                                value={`${ops.feedbackCapturedCount.toLocaleString('en-IN')} / ${(ops.feedbackCapturedCount + ops.feedbackPendingCount).toLocaleString('en-IN')}`}
                                icon={CheckCircle2}
                            />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <StatusPill label="Allotment Pending" value={ops.allotmentPendingCount} />
                            <StatusPill label="PDI Pending" value={ops.pdiPendingCount} />
                            <StatusPill label="Insurance Pending" value={ops.insurancePendingCount} />
                            <StatusPill label="Feedback Pending" value={ops.feedbackPendingCount} />
                        </div>
                        <div className="rounded-xl border border-slate-200 p-4">
                            <p className="text-[11px] font-bold text-slate-700 mb-3">Stage Backlog</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                                <StageBox label="Booking" value={stageCounts.booking} />
                                <StageBox label="Payment" value={stageCounts.payment} />
                                <StageBox label="Finance" value={stageCounts.finance} />
                                <StageBox label="Allotment" value={stageCounts.allotment} />
                                <StageBox label="PDI" value={stageCounts.pdi} />
                                <StageBox label="Delivery" value={stageCounts.delivery + stageCounts.delivered} />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'wallet' && (
                    <div className="mt-6 space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                            <MetricTile
                                label="Cash In (Captured)"
                                value={formatINR(wallet.cashInCaptured)}
                                icon={Wallet}
                            />
                            <MetricTile
                                label="Cash In (Pending)"
                                value={formatINR(wallet.cashInPending)}
                                icon={AlertTriangle}
                            />
                            <MetricTile
                                label="Procurement Commitment"
                                value={formatINR(wallet.procurementCommitted)}
                                icon={Package}
                            />
                            <MetricTile
                                label="Net Cash Position"
                                value={formatINR(wallet.netCashPosition)}
                                icon={BadgeIndianRupee}
                                tone={wallet.netCashPosition < 0 ? 'warning' : 'normal'}
                            />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <StatusPill label="Inventory Available" value={wallet.inventoryAvailableCount} />
                            <StatusPill label="Inventory Allocated" value={wallet.inventoryAllocatedCount} />
                            <StatusPill label="Inventory Sold" value={wallet.inventorySoldCount} />
                            <StatusPill
                                label="Payout Pressure"
                                value={wallet.payoutPressurePct === null ? 0 : wallet.payoutPressurePct}
                                suffix={wallet.payoutPressurePct === null ? '' : '%'}
                            />
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-[11px] font-bold text-slate-700 mb-3">Cash Flow Advisory</p>
                            <div className="space-y-2">
                                {walletAdvisories.map((item, index) => (
                                    <div
                                        key={`${item}-${index}`}
                                        className="text-[12px] text-slate-600 flex items-start gap-2"
                                    >
                                        <CheckCircle2 size={14} className="text-[#696CFF] mt-0.5 shrink-0" />
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <SkuTrendWidget data={skuTrends || null} title="Dealership Trending Signals" className="lg:col-span-4" />
        </div>
    );
};

function MetricTile({
    label,
    value,
    icon: Icon,
    tone = 'normal',
}: {
    label: string;
    value: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    tone?: 'normal' | 'warning';
}) {
    return (
        <div
            className={`rounded-xl border p-4 ${
                tone === 'warning' ? 'border-amber-200 bg-amber-50/70' : 'border-slate-200 bg-white'
            }`}
        >
            <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">{label}</p>
                <Icon size={14} className={tone === 'warning' ? 'text-amber-600' : 'text-[#696CFF]'} />
            </div>
            <p className={`text-lg font-bold ${tone === 'warning' ? 'text-amber-700' : 'text-slate-800'}`}>{value}</p>
        </div>
    );
}

function StatusPill({ label, value, suffix = '' }: { label: string; value: number; suffix?: string }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">{label}</p>
            <p className="text-base font-bold text-slate-800">
                {value.toLocaleString('en-IN')}
                {suffix}
            </p>
        </div>
    );
}

function StageBox({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-white p-3 text-center">
            <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">{label}</p>
            <p className="text-base font-bold text-slate-800">{value.toLocaleString('en-IN')}</p>
        </div>
    );
}
