'use client';

import React from 'react';
import { Timer, ShoppingCart, Eye, Bike } from 'lucide-react';
import { AriaCard } from './AriaPanels';
import type { DashboardSkuTrends } from '@/actions/dashboardKpis';

interface SkuTrendWidgetProps {
    data: DashboardSkuTrends | null;
    title: string;
    className?: string;
}

function formatDwell(ms: number): string {
    const safe = Math.max(0, Number(ms) || 0);
    const minutes = safe / 60000;
    if (minutes >= 10) return `${minutes.toFixed(0)}m`;
    if (minutes >= 1) return `${minutes.toFixed(1)}m`;
    return `${Math.round(safe / 1000)}s`;
}

function formatDate(iso: string): string {
    if (!iso) return '-';
    try {
        return new Date(iso).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return '-';
    }
}

export default function SkuTrendWidget({ data, title, className = '' }: SkuTrendWidgetProps) {
    const bookedRows = data?.topBooked || [];
    const dwellRows = data?.topDwell || [];

    return (
        <AriaCard title="SKU Trend Engine" subtitle={title} icon={Bike} className={className}>
            <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    <span className="inline-flex items-center gap-1.5 rounded bg-slate-100 px-2 py-1 text-slate-600">
                        <ShoppingCart size={11} /> {data?.lookbackDays.bookings || 120}d bookings
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded bg-slate-100 px-2 py-1 text-slate-600">
                        <Timer size={11} /> {data?.lookbackDays.visitors || 30}d dwell
                    </span>
                    <span className="ml-auto text-slate-400">Updated: {formatDate(data?.updatedAt || '')}</span>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="rounded-lg border border-slate-100 bg-slate-50/40 p-3">
                        <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                            <ShoppingCart size={14} className="text-[#696CFF]" />
                            Top Booked SKUs
                        </div>
                        {bookedRows.length === 0 ? (
                            <p className="text-xs text-slate-400">No booking trend data yet.</p>
                        ) : (
                            <div className="space-y-2">
                                {bookedRows.map((row, index) => (
                                    <div
                                        key={`booked-${row.skuId}`}
                                        className="flex items-start justify-between rounded-md bg-white p-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                                    >
                                        <div className="min-w-0 pr-2">
                                            <p className="truncate text-sm font-semibold text-slate-700">
                                                {index + 1}. {row.label}
                                            </p>
                                            <p className="mt-0.5 text-[11px] uppercase tracking-wider text-slate-400">
                                                {row.skuId.slice(0, 8)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-base font-bold text-slate-800">
                                                {row.bookingCount.toLocaleString('en-IN')}
                                            </p>
                                            <p className="text-[10px] uppercase tracking-wider text-slate-400">
                                                bookings
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="rounded-lg border border-slate-100 bg-slate-50/40 p-3">
                        <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                            <Timer size={14} className="text-[#696CFF]" />
                            Top Dwell SKUs
                        </div>
                        {dwellRows.length === 0 ? (
                            <p className="text-xs text-slate-400">No visitor dwell trend data yet.</p>
                        ) : (
                            <div className="space-y-2">
                                {dwellRows.map((row, index) => (
                                    <div
                                        key={`dwell-${row.skuId}`}
                                        className="flex items-start justify-between rounded-md bg-white p-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                                    >
                                        <div className="min-w-0 pr-2">
                                            <p className="truncate text-sm font-semibold text-slate-700">
                                                {index + 1}. {row.label}
                                            </p>
                                            <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-400">
                                                <Eye size={10} /> {row.visitorViews.toLocaleString('en-IN')} views
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-base font-bold text-slate-800">
                                                {formatDwell(row.visitorDwellMs)}
                                            </p>
                                            <p className="text-[10px] uppercase tracking-wider text-slate-400">dwell</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AriaCard>
    );
}
