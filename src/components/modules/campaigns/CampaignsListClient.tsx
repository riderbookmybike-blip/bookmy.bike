'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Send, Plus, X, Users, CheckCircle, XCircle, ChevronRight, MessageSquare } from 'lucide-react';
import type { WaCampaign } from '@/actions/wa-campaign';
import { createCampaign } from '@/actions/wa-campaign';

const STATUS_META: Record<string, { label: string; cls: string; dot: string }> = {
    DRAFT: { label: 'Draft', cls: 'bg-slate-100  text-slate-500', dot: 'bg-slate-400' },
    TEST: { label: 'Test', cls: 'bg-amber-50   text-amber-600', dot: 'bg-amber-400' },
    ACTIVE: { label: 'Active', cls: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
    PAUSED: { label: 'Paused', cls: 'bg-orange-50  text-orange-600', dot: 'bg-orange-400' },
    STOPPED: { label: 'Stopped', cls: 'bg-rose-50    text-rose-600', dot: 'bg-rose-400' },
    DONE: { label: 'Done', cls: 'bg-blue-50    text-blue-600', dot: 'bg-blue-400' },
};

type Campaign = Pick<
    WaCampaign,
    'id' | 'name' | 'status' | 'template_name' | 'eligible_count' | 'sent_count' | 'failed_count' | 'created_at'
>;

interface Props {
    campaigns: Campaign[];
}

function LabeledInput({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{label}</label>
            {children}
            {hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
        </div>
    );
}

export function CampaignsListClient({ campaigns }: Props) {
    const router = useRouter();
    const [showModal, setShowModal] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const [name, setName] = useState('');
    const [templateName, setTemplate] = useState('');
    const [offerStart, setOfferStart] = useState('');
    const [offerEnd, setOfferEnd] = useState('');
    const [batchSize, setBatchSize] = useState(100);
    const [batchDelay, setBatchDelay] = useState(0);

    const totalSent = campaigns.reduce((s, c) => s + c.sent_count, 0);
    const totalEligible = campaigns.reduce((s, c) => s + (c.eligible_count ?? 0), 0);
    const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE').length;

    const openModal = () => {
        setShowModal(true);
        setFormError(null);
        setName('');
        setTemplate('');
        setOfferStart('');
        setOfferEnd('');
        setBatchSize(100);
        setBatchDelay(0);
    };

    const handleCreate = () => {
        setFormError(null);
        startTransition(async () => {
            const res = await createCampaign({
                name,
                template_name: templateName,
                offer_start: offerStart || undefined,
                offer_end: offerEnd || undefined,
                batch_size: batchSize,
                batch_delay_min: batchDelay,
            });
            if (res.success && res.id) router.push(`/aums/campaigns/${res.id}`);
            else setFormError(res.error ?? 'Failed to create campaign');
        });
    };

    const inputCls =
        'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all';

    return (
        <div className="min-h-screen bg-[#f8f9fb]">
            <div className="max-w-5xl mx-auto px-6 py-10">
                {/* ── Page header ── */}
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-2.5 mb-1">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                                <MessageSquare className="h-4 w-4 text-emerald-600" />
                            </div>
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight">WhatsApp Campaigns</h1>
                        </div>
                        <p className="text-sm text-slate-500 ml-10.5">Controlled batch rollouts via MSG91</p>
                    </div>
                    <button
                        onClick={openModal}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm shadow-emerald-200 transition-all active:scale-[0.97]"
                    >
                        <Plus className="h-4 w-4" /> New Campaign
                    </button>
                </div>

                {/* ── Summary stats ── */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    {[
                        {
                            label: 'Total Campaigns',
                            value: campaigns.length,
                            icon: <Send className="h-4 w-4 text-slate-500" />,
                            color: 'text-slate-800',
                        },
                        {
                            label: 'Active Now',
                            value: activeCampaigns,
                            icon: <CheckCircle className="h-4 w-4 text-emerald-500" />,
                            color: 'text-emerald-700',
                        },
                        {
                            label: 'Total Sent',
                            value: totalSent.toLocaleString('en-IN'),
                            icon: <Users className="h-4 w-4 text-blue-500" />,
                            color: 'text-blue-700',
                        },
                    ].map(s => (
                        <div
                            key={s.label}
                            className="bg-white rounded-2xl border border-slate-200/80 px-5 py-4 flex items-center gap-3 shadow-sm"
                        >
                            <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                                {s.icon}
                            </div>
                            <div>
                                <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">
                                    {s.label}
                                </div>
                                <div className={`text-xl font-bold mt-0.5 ${s.color}`}>{s.value}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Campaign list ── */}
                {campaigns.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center py-20 text-slate-400">
                        <Send size={36} className="mb-3 opacity-30" />
                        <p className="text-sm font-semibold text-slate-500">No campaigns yet</p>
                        <p className="text-xs mt-1">Click &quot;New Campaign&quot; to get started</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {campaigns.map(c => {
                            const meta = STATUS_META[c.status] ?? STATUS_META.DRAFT;
                            return (
                                <Link
                                    key={c.id}
                                    href={`/aums/campaigns/${c.id}`}
                                    className="group bg-white rounded-2xl border border-slate-200/80 px-6 py-4 flex items-center gap-5 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all"
                                >
                                    {/* Status dot */}
                                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${meta.dot}`} />

                                    {/* Campaign info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-slate-800 group-hover:text-emerald-700 transition-colors truncate">
                                            {c.name}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <code className="text-[11px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                                                {c.template_name}
                                            </code>
                                            <span className="text-slate-200">·</span>
                                            <span className="text-[11px] text-slate-400">
                                                {new Date(c.created_at).toLocaleDateString('en-IN', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Status badge */}
                                    <span
                                        className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${meta.cls}`}
                                    >
                                        {meta.label}
                                    </span>

                                    {/* Stats */}
                                    <div className="hidden sm:flex items-center gap-6 text-right shrink-0">
                                        <div>
                                            <div className="text-[10px] text-slate-400 uppercase tracking-wide">
                                                Eligible
                                            </div>
                                            <div className="text-sm font-semibold text-slate-700 tabular-nums">
                                                {c.eligible_count?.toLocaleString('en-IN') ?? '—'}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-slate-400 uppercase tracking-wide">
                                                Sent
                                            </div>
                                            <div className="text-sm font-semibold text-emerald-600 tabular-nums">
                                                {c.sent_count.toLocaleString('en-IN')}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-slate-400 uppercase tracking-wide">
                                                Failed
                                            </div>
                                            <div
                                                className={`text-sm font-semibold tabular-nums ${c.failed_count > 0 ? 'text-rose-500' : 'text-slate-300'}`}
                                            >
                                                {c.failed_count > 0 ? c.failed_count.toLocaleString('en-IN') : '—'}
                                            </div>
                                        </div>
                                    </div>

                                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-400 shrink-0 transition-colors" />
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Create Campaign Modal ── */}
            {showModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4"
                    onClick={e => e.target === e.currentTarget && setShowModal(false)}
                >
                    <div className="bg-white rounded-2xl shadow-2xl shadow-black/10 w-full max-w-lg overflow-hidden">
                        {/* Modal header */}
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                                    <Plus className="h-4 w-4 text-emerald-600" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-slate-900 leading-tight">New Campaign</h2>
                                    <p className="text-xs text-slate-400">
                                        Created as DRAFT — ready to configure & launch
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Modal body */}
                        <div className="px-6 py-5 space-y-4">
                            <LabeledInput label="Campaign Name">
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="e.g. Year Ending Sale Activa 2026"
                                    className={inputCls}
                                    autoFocus
                                />
                            </LabeledInput>

                            <LabeledInput
                                label="MSG91 Template Name"
                                hint="Must match exactly with the approved template in MSG91 dashboard"
                            >
                                <input
                                    type="text"
                                    value={templateName}
                                    onChange={e => setTemplate(e.target.value)}
                                    placeholder="e.g. year_ending_sale_activa_2026"
                                    className={`${inputCls} font-mono`}
                                />
                            </LabeledInput>

                            <div className="grid grid-cols-2 gap-4">
                                <LabeledInput label="Offer Start">
                                    <input
                                        type="date"
                                        value={offerStart}
                                        onChange={e => setOfferStart(e.target.value)}
                                        className={inputCls}
                                    />
                                </LabeledInput>
                                <LabeledInput label="Offer End">
                                    <input
                                        type="date"
                                        value={offerEnd}
                                        onChange={e => setOfferEnd(e.target.value)}
                                        className={inputCls}
                                    />
                                </LabeledInput>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <LabeledInput label="Batch Size" hint="Recipients per batch">
                                    <input
                                        type="number"
                                        min={1}
                                        max={1000}
                                        value={batchSize}
                                        onChange={e => setBatchSize(Number(e.target.value))}
                                        className={inputCls}
                                    />
                                </LabeledInput>
                                <LabeledInput label="Batch Delay (min)" hint="Gap between batches">
                                    <input
                                        type="number"
                                        min={0}
                                        value={batchDelay}
                                        onChange={e => setBatchDelay(Number(e.target.value))}
                                        className={inputCls}
                                    />
                                </LabeledInput>
                            </div>

                            {formError && (
                                <div className="flex items-start gap-2.5 text-sm text-rose-700 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">
                                    <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                    {formError}
                                </div>
                            )}
                        </div>

                        {/* Modal footer */}
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={isPending || !name.trim() || !templateName.trim()}
                                onClick={handleCreate}
                                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2 rounded-xl transition-all active:scale-[0.97] shadow-sm shadow-emerald-200"
                            >
                                {isPending ? (
                                    <>
                                        <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                        Creating…
                                    </>
                                ) : (
                                    <>
                                        <Plus className="h-4 w-4" />
                                        Create Campaign
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
