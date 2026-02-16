'use client';

import React, { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useTenant } from '@/lib/tenant/tenantContext';
import {
    Calendar,
    ChevronDown,
    ChevronRight,
    Clock,
    MoreHorizontal,
    User,
    Activity,
    ShieldCheck,
    Phone,
    Mail,
    BadgeCheck,
    Plus,
    Target,
    Flame,
    MapPin,
    FileText,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDisplayId } from '@/utils/displayId';
import { toast } from 'sonner';

interface LeadProfile {
    lead: any;
    quotes: any[];
    bookings: any[];
    receipts: any[];
}

const formatDate = (value?: string | null) => {
    if (!value) return '—';
    try {
        return new Date(value).toLocaleDateString();
    } catch {
        return value;
    }
};

const formatMoney = (value?: number | null) => {
    if (value === null || value === undefined) return '—';
    return `₹${value.toLocaleString()}`;
};

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}

export default function LeadEditorTable({ profile }: { profile: LeadProfile }) {
    const params = useParams();
    const router = useRouter();
    const slug = typeof params?.slug === 'string' ? params.slug : Array.isArray(params?.slug) ? params.slug[0] : '';
    const { device } = useBreakpoint();
    const isPhone = device === 'phone';
    const { tenantSlug } = useTenant();

    const [activeTab, setActiveTab] = useState<
        'LEAD' | 'FINANCE' | 'TRANSACTIONS' | 'MEMBER' | 'DOCUMENTS' | 'TASKS' | 'NOTES' | 'TIMELINE' | 'OCLUB'
    >('LEAD');
    const [groups, setGroups] = useState({
        transactionQuotes: true,
        transactionBookings: true,
        transactionReceipts: true,
    });

    const quoteCount = profile.quotes?.length || 0;
    const bookingCount = profile.bookings?.length || 0;
    const receiptCount = profile.receipts?.length || 0;

    const tabs = useMemo(
        () => [
            { key: 'LEAD', label: 'LEAD', count: 0 },
            { key: 'FINANCE', label: 'FINANCE', count: quoteCount },
            { key: 'TRANSACTIONS', label: 'TRANSACTION', count: quoteCount + bookingCount + receiptCount },
            { key: 'MEMBER', label: 'MEMBER', count: 0 },
            { key: 'DOCUMENTS', label: 'DOCUMENTS', count: 0 },
            { key: 'TASKS', label: 'TASK', count: 0 },
            { key: 'NOTES', label: 'NOTES', count: 0 },
            { key: 'TIMELINE', label: 'TIMELINE', count: 0 },
            { key: 'OCLUB', label: 'O CLUB', count: 0 },
        ],
        [quoteCount, bookingCount, receiptCount]
    );

    const TransactionSection = ({
        title,
        count,
        expanded,
        onToggle,
        children,
    }: {
        title: string;
        count: number;
        expanded: boolean;
        onToggle: () => void;
        children: React.ReactNode;
    }) => (
        <div className="border-b border-slate-100 dark:border-white/5 last:border-b-0">
            <div
                className={cn(
                    'flex items-center justify-between px-6 py-2.5 transition-colors',
                    expanded
                        ? 'bg-slate-50 dark:bg-white/[0.04] border-b border-slate-100 dark:border-white/5'
                        : 'hover:bg-slate-50/50 dark:hover:bg-white/[0.02]'
                )}
            >
                <button onClick={onToggle} className="flex items-center gap-3">
                    <div className={cn('transition-transform duration-200', expanded ? 'rotate-90' : 'rotate-0')}>
                        <ChevronRight size={14} className="text-slate-400 group-hover:text-slate-600" />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">
                            {title}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-[8px] font-black text-slate-500">
                            {count}
                        </span>
                    </div>
                </button>
                <div className="flex items-center gap-4">
                    <button className="text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 px-3 py-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors">
                        <Plus size={10} /> New
                    </button>
                </div>
            </div>
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="px-6 pb-6 pt-4">{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    const lead = profile.lead || {};
    const handleGenerateQuote = () => {
        if (!lead?.id) {
            toast.error('Lead context missing. Please refresh and try again.');
            return;
        }
        window.location.href = `/store/catalog?leadId=${encodeURIComponent(lead.id)}`;
    };

    const intentBadge =
        lead.intentScore === 'HOT'
            ? 'bg-rose-500/10 text-rose-600'
            : lead.intentScore === 'WARM'
              ? 'bg-amber-500/10 text-amber-600'
              : 'bg-slate-100 text-slate-600';

    // ── PHONE DETAIL VIEW ──────────────────────────────────────────
    if (isPhone) {
        const resolveHref = (path: string) => (tenantSlug ? `/app/${tenantSlug}${path}` : path);
        const phoneNumber = lead.phone?.replace(/\D/g, '') || '';
        const waPhone = phoneNumber.startsWith('91') ? phoneNumber : `91${phoneNumber}`;
        const timelineEvents = (lead as any).events_log || [];

        const PhoneSection = ({
            title,
            defaultOpen = false,
            count,
            children,
        }: {
            title: string;
            defaultOpen?: boolean;
            count?: number;
            children: React.ReactNode;
        }) => {
            const [open, setOpen] = useState(defaultOpen);
            return (
                <div className="border-b border-slate-100 dark:border-white/5">
                    <button
                        onClick={() => setOpen(!open)}
                        data-crm-allow
                        className="w-full flex items-center justify-between px-3 py-3 active:bg-slate-50 dark:active:bg-white/5 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <ChevronRight
                                size={14}
                                className={cn('text-slate-400 transition-transform duration-200', open && 'rotate-90')}
                            />
                            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-700 dark:text-slate-200">
                                {title}
                            </span>
                            {count !== undefined && count > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-[8px] font-black text-indigo-600">
                                    {count}
                                </span>
                            )}
                        </div>
                        <ChevronDown
                            size={14}
                            className={cn('text-slate-300 transition-transform duration-200', open && 'rotate-180')}
                        />
                    </button>
                    <AnimatePresence>
                        {open && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="px-3 pb-3">{children}</div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            );
        };

        return (
            <div className="h-full flex flex-col bg-white dark:bg-[#0b0d10]">
                {/* Contact Card Hero */}
                <div className="px-3 pt-1 pb-3 space-y-2.5">
                    <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-base font-black shadow-lg shrink-0">
                            {(lead.customerName || 'L').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white truncate">
                                    {lead.customerName || 'Lead'}
                                </h1>
                                <span
                                    className={cn(
                                        'px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest shrink-0',
                                        intentBadge
                                    )}
                                >
                                    {lead.intentScore || 'COLD'}
                                </span>
                            </div>
                            {phoneNumber && (
                                <a
                                    href={`tel:${phoneNumber}`}
                                    className="flex items-center gap-1.5 mt-0.5 text-indigo-600"
                                >
                                    <Phone size={11} />
                                    <span className="text-[11px] font-black tracking-wide">{lead.phone}</span>
                                </a>
                            )}
                            <div className="flex items-center gap-2 mt-0.5 text-[9px] text-slate-400 font-bold flex-wrap">
                                <span className="font-black uppercase tracking-widest">
                                    {formatDisplayId(lead.displayId || lead.id)}
                                </span>
                                <span>•</span>
                                <span>{formatDate(lead.created_at)}</span>
                                {lead.pincode && (
                                    <>
                                        <span>•</span>
                                        <span>📍 {lead.pincode}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex gap-1.5">
                        {phoneNumber && (
                            <a
                                href={`tel:${phoneNumber}`}
                                className="flex-1 flex items-center justify-center gap-1 py-2 bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest active:scale-95 transition-transform"
                            >
                                <Phone size={13} /> Call
                            </a>
                        )}
                        {phoneNumber && (
                            <a
                                href={`https://wa.me/${waPhone}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-1 py-2 bg-[#25D366] text-white rounded-lg text-[9px] font-black uppercase tracking-widest active:scale-95 transition-transform"
                            >
                                💬 WhatsApp
                            </a>
                        )}
                        <Link
                            href={resolveHref(`/quotes`)}
                            className="flex-1 flex items-center justify-center gap-1 py-2 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest active:scale-95 transition-transform"
                        >
                            <FileText size={13} /> Quote
                        </Link>
                    </div>
                </div>

                {/* Accordion Sections */}
                <div
                    className="flex-1 overflow-y-auto no-scrollbar bg-slate-50/80 dark:bg-slate-950 border-t border-slate-200 dark:border-white/5"
                    style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
                >
                    {/* Lead Info */}
                    <PhoneSection title="Lead Info" defaultOpen={true}>
                        <div className="space-y-0">
                            {[
                                { label: 'Status', value: lead.status || 'NEW' },
                                { label: 'Source', value: lead.source || '—' },
                                { label: 'Score', value: lead.intentScore || 'COLD' },
                                { label: 'Interest', value: lead.interestModel || '—' },
                                { label: 'Referral', value: lead.referralSource || '—' },
                                { label: 'Phone', value: lead.phone || '—' },
                                { label: 'DOB', value: formatDate(lead.dob) },
                                { label: 'Pincode', value: lead.pincode || '—' },
                                { label: 'Taluka', value: lead.taluka || '—' },
                            ].map(row => (
                                <div
                                    key={row.label}
                                    className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-white/5 last:border-0"
                                >
                                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">
                                        {row.label}
                                    </span>
                                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 text-right">
                                        {row.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </PhoneSection>

                    {/* Quotes */}
                    <PhoneSection title="Quotes" count={quoteCount}>
                        {quoteCount === 0 ? (
                            <p className="text-[10px] text-slate-400 font-bold py-2">No quotes yet</p>
                        ) : (
                            <div className="space-y-1.5">
                                {(profile.quotes || []).map((q: any) => {
                                    const statusColor =
                                        q.status === 'APPROVED' || q.status === 'SENT'
                                            ? 'bg-emerald-500/10 text-emerald-600'
                                            : q.status === 'DRAFT'
                                              ? 'bg-slate-100 text-slate-600'
                                              : 'bg-amber-500/10 text-amber-600';
                                    return (
                                        <Link
                                            key={q.id}
                                            href={resolveHref(`/quotes/${q.id}`)}
                                            className="block bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-lg p-2.5 active:scale-[0.98] transition-transform"
                                        >
                                            <div className="flex items-center justify-between mb-0.5">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">
                                                    {formatDisplayId(q.displayId || q.id)}
                                                </span>
                                                <span
                                                    className={cn(
                                                        'px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest',
                                                        statusColor
                                                    )}
                                                >
                                                    {q.status}
                                                </span>
                                            </div>
                                            <div className="text-[9px] text-slate-400 font-bold">
                                                {formatDate(q.created_at)}
                                                {q.commercials?.grand_total && (
                                                    <> • {formatMoney(q.commercials.grand_total)}</>
                                                )}
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </PhoneSection>

                    {/* Bookings */}
                    <PhoneSection title="Bookings" count={bookingCount}>
                        {bookingCount === 0 ? (
                            <p className="text-[10px] text-slate-400 font-bold py-2">No bookings yet</p>
                        ) : (
                            <div className="space-y-1.5">
                                {(profile.bookings || []).map((b: any) => (
                                    <div
                                        key={b.id}
                                        className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-lg p-2.5"
                                    >
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">
                                                {formatDisplayId(b.displayId || b.id)}
                                            </span>
                                            <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-[8px] font-black text-indigo-600 uppercase tracking-widest">
                                                {b.status || 'ACTIVE'}
                                            </span>
                                        </div>
                                        <div className="text-[9px] text-slate-400 font-bold">
                                            {formatDate(b.created_at)}
                                            {b.amount && <> • {formatMoney(b.amount)}</>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </PhoneSection>

                    {/* Receipts */}
                    <PhoneSection title="Receipts" count={profile.receipts?.length || 0}>
                        {(profile.receipts?.length || 0) === 0 ? (
                            <p className="text-[10px] text-slate-400 font-bold py-2">No receipts yet</p>
                        ) : (
                            <div className="space-y-1.5">
                                {(profile.receipts || []).map((r: any) => (
                                    <div
                                        key={r.id}
                                        className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-lg p-2.5"
                                    >
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">
                                                {formatDisplayId(r.displayId || r.id)}
                                            </span>
                                            <span className="text-[10px] font-black text-emerald-600">
                                                {formatMoney(r.amount)}
                                            </span>
                                        </div>
                                        <div className="text-[9px] text-slate-400 font-bold">
                                            {formatDate(r.created_at)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </PhoneSection>

                    {/* Notes */}
                    <PhoneSection title="Notes">
                        <textarea
                            placeholder="Add a note about this lead..."
                            className="w-full h-24 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg p-3 text-[11px] font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 placeholder:text-slate-400 resize-none"
                        />
                    </PhoneSection>

                    {/* Tasks */}
                    <PhoneSection title="Tasks">
                        <div className="py-4 text-center">
                            <Clock size={28} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                Tasks coming soon
                            </p>
                        </div>
                    </PhoneSection>

                    {/* Documents */}
                    <PhoneSection title="Documents">
                        <div className="py-4 text-center">
                            <FileText size={28} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                Documents coming soon
                            </p>
                        </div>
                    </PhoneSection>

                    {/* Timeline */}
                    <PhoneSection title="Timeline" count={timelineEvents.length || undefined}>
                        {timelineEvents.length === 0 ? (
                            <div className="py-4 text-center">
                                <Clock size={28} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                    No timeline events
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-1.5">
                                {timelineEvents.map((ev: any, i: number) => (
                                    <div
                                        key={i}
                                        className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-lg p-2.5"
                                    >
                                        <div className="text-[10px] font-black text-slate-700 dark:text-slate-200">
                                            {ev.title || ev.type?.replace('_', ' ')}
                                        </div>
                                        <div className="text-[9px] text-slate-400 font-bold mt-0.5">
                                            {ev.description || 'System event'}
                                            {ev.timestamp && <> • {new Date(ev.timestamp).toLocaleDateString()}</>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </PhoneSection>
                </div>
            </div>
        );
    }

    // ── DESKTOP DETAIL VIEW (unchanged) ──────────────────────────────
    return (
        <div className="h-full flex flex-col">
            {/* HEADER */}
            <div className="bg-white dark:bg-[#0b0d10] border-b border-slate-100 dark:border-white/5">
                <div className="px-6 pt-6 pb-4 flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-lg font-black shadow-lg">
                                {(lead.customerName || 'L').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-xl font-black tracking-tight truncate">
                                        {lead.customerName || 'Lead'}
                                    </h1>
                                    <span
                                        className={cn(
                                            'px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest',
                                            intentBadge
                                        )}
                                    >
                                        {lead.intentScore || 'COLD'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-slate-500">
                                    <span className="font-black uppercase tracking-widest text-[9px]">
                                        {formatDisplayId(lead.displayId || lead.id)}
                                    </span>
                                    <span className="text-slate-300">|</span>
                                    <span className="flex items-center gap-1.5 font-bold">
                                        <Calendar size={12} /> Captured {formatDate(lead.created_at)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="px-4 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors">
                                Edit
                            </button>
                            <button
                                onClick={handleGenerateQuote}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
                            >
                                Generate Quote <ChevronDown size={14} />
                            </button>
                            <button className="p-2 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-400 hover:text-indigo-600 transition-colors">
                                <MoreHorizontal size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div
                className={cn(
                    'sticky top-0 z-10 bg-white/20 dark:bg-white/[0.03] backdrop-blur-xl rounded-2xl overflow-hidden border border-white/20 dark:border-white/5 shadow-sm',
                    'mx-4 mt-4'
                )}
            >
                <div className={cn('text-[9px] font-black uppercase tracking-widest w-full', 'grid grid-cols-9')}>
                    {tabs.map((tab, idx) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as any)}
                            className={cn(
                                'py-3 text-center transition-all relative whitespace-nowrap',
                                'w-full',
                                idx < 8 ? 'border-r border-slate-100 dark:border-white/10' : '',
                                activeTab === tab.key
                                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                    : 'bg-transparent text-slate-400 hover:text-slate-600 hover:bg-white/30 dark:hover:bg-white/10'
                            )}
                        >
                            {tab.label}
                            {tab.count > 0 && (
                                <span
                                    className={cn(
                                        'ml-1 inline-flex items-center justify-center min-w-[14px] h-[14px] px-1 rounded-full text-[7px] font-black',
                                        activeTab === tab.key
                                            ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                                            : 'bg-indigo-500/10 text-indigo-600 dark:bg-white/10 dark:text-white/60'
                                    )}
                                >
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar pb-24 bg-slate-50 dark:bg-slate-950">
                {activeTab === 'LEAD' && (
                    <div className="mx-4 mt-4 space-y-4">
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-px bg-slate-100 dark:bg-white/5 rounded-2xl overflow-hidden border border-slate-100 dark:border-white/5">
                            <div className="bg-white dark:bg-[#0b0d10] p-6 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center">
                                    <User size={18} />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">
                                        Lead Profile
                                    </span>
                                    <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tighter truncate leading-tight">
                                        {lead.customerName || 'Lead'}
                                    </h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Phone size={12} className="text-slate-400" />
                                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                            {lead.phone || '—'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <MapPin size={12} className="text-slate-400" />
                                        <span className="text-[10px] font-bold text-slate-500">
                                            {lead.pincode || '—'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-[#0b0d10] p-6 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                                    <ShieldCheck size={18} />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">
                                        Lead Status
                                    </span>
                                    <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tighter truncate leading-tight">
                                        {lead.status || 'NEW'}
                                    </h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <BadgeCheck size={12} className="text-emerald-500" />
                                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                                            {lead.source || 'SOURCE'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div className="bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/5 rounded-2xl p-6">
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
                                    Identity
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Phone
                                        </span>
                                        <span className="text-[12px] font-black text-slate-900 dark:text-white">
                                            {lead.phone || '—'}
                                        </span>
                                    </div>
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            DOB
                                        </span>
                                        <span className="text-[12px] font-bold text-slate-600 dark:text-slate-300">
                                            {formatDate(lead.dob)}
                                        </span>
                                    </div>
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Pincode
                                        </span>
                                        <span className="text-[12px] font-bold text-slate-600 dark:text-slate-300">
                                            {lead.pincode || '—'}
                                        </span>
                                    </div>
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Taluka
                                        </span>
                                        <span className="text-[12px] font-bold text-slate-600 dark:text-slate-300">
                                            {lead.taluka || '—'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/5 rounded-2xl p-6">
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
                                    Intent
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Score
                                        </span>
                                        <span className="text-[12px] font-black text-slate-900 dark:text-white">
                                            {lead.intentScore || 'COLD'}
                                        </span>
                                    </div>
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Interest
                                        </span>
                                        <span className="text-[12px] font-bold text-slate-600 dark:text-slate-300">
                                            {lead.interestModel || '—'}
                                        </span>
                                    </div>
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Referral
                                        </span>
                                        <span className="text-[12px] font-bold text-slate-600 dark:text-slate-300">
                                            {lead.referralSource || '—'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/5 rounded-2xl p-6">
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
                                    Activity
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Source
                                        </span>
                                        <span className="text-[12px] font-bold text-slate-600 dark:text-slate-300">
                                            {lead.source || '—'}
                                        </span>
                                    </div>
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Created
                                        </span>
                                        <span className="text-[12px] font-bold text-slate-600 dark:text-slate-300">
                                            {formatDate(lead.created_at)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'FINANCE' && (
                    <div className="p-6">
                        <div className="bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/10 rounded-[2rem] overflow-hidden">
                            <TransactionSection
                                title="Finance / Quotes"
                                count={quoteCount}
                                expanded={true}
                                onToggle={() => null}
                            >
                                <div className="w-full overflow-x-auto">
                                    <table className="w-full min-w-[700px] text-left border-collapse">
                                        <thead className="bg-slate-50/50 dark:bg-white/[0.02]">
                                            <tr className="border-b border-slate-100 dark:border-white/5">
                                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                    Date
                                                </th>
                                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                    ID
                                                </th>
                                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                    Status
                                                </th>
                                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(profile.quotes || []).map((quote: any) => (
                                                <tr
                                                    key={quote.id}
                                                    className="border-b border-slate-50 dark:border-white/[0.02] last:border-b-0 group"
                                                >
                                                    <td className="px-4 py-3 text-[10px] font-bold text-slate-500">
                                                        {formatDate(quote.created_at)}
                                                    </td>
                                                    <td className="px-4 py-3 text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                                        {formatDisplayId(quote.display_id || quote.id)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[8px] font-black uppercase tracking-widest">
                                                            {quote.status || 'DRAFT'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <button
                                                            onClick={() =>
                                                                slug && router.push(`/app/${slug}/quotes/${quote.id}`)
                                                            }
                                                            className="text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 transition-opacity"
                                                        >
                                                            View →
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {(profile.quotes || []).length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={4}
                                                        className="py-12 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                                                    >
                                                        No quotes found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </TransactionSection>
                        </div>
                    </div>
                )}

                {activeTab === 'MEMBER' && (
                    <div className="p-6">
                        <div className="bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/10 rounded-[2rem] p-6">
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
                                Member Profile
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 rounded-xl p-4">
                                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                        Name
                                    </div>
                                    <div className="text-sm font-black text-slate-900 dark:text-white">
                                        {lead.customerName || '—'}
                                    </div>
                                </div>
                                <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 rounded-xl p-4">
                                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                        Phone
                                    </div>
                                    <div className="text-sm font-black text-slate-900 dark:text-white">
                                        {lead.phone || '—'}
                                    </div>
                                </div>
                                <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 rounded-xl p-4">
                                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                        Pincode
                                    </div>
                                    <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                        {lead.pincode || '—'}
                                    </div>
                                </div>
                                <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 rounded-xl p-4">
                                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                        Member ID
                                    </div>
                                    <div className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">
                                        {lead.customerId || 'Not linked'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'TRANSACTIONS' && (
                    <div className="p-6">
                        <div className="bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/10 rounded-[2rem] overflow-hidden">
                            <TransactionSection
                                title="Quotes"
                                count={quoteCount}
                                expanded={groups.transactionQuotes}
                                onToggle={() => setGroups(g => ({ ...g, transactionQuotes: !g.transactionQuotes }))}
                            >
                                <div className="w-full overflow-x-auto">
                                    <table className="w-full min-w-[700px] text-left border-collapse">
                                        <thead className="bg-slate-50/50 dark:bg-white/[0.02]">
                                            <tr className="border-b border-slate-100 dark:border-white/5">
                                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                    Date
                                                </th>
                                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                    ID
                                                </th>
                                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                    Status
                                                </th>
                                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(profile.quotes || []).map((quote: any) => (
                                                <tr
                                                    key={quote.id}
                                                    className="border-b border-slate-50 dark:border-white/[0.02] last:border-b-0 group"
                                                >
                                                    <td className="px-4 py-3 text-[10px] font-bold text-slate-500">
                                                        {formatDate(quote.created_at)}
                                                    </td>
                                                    <td className="px-4 py-3 text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                                        {formatDisplayId(quote.display_id || quote.id)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[8px] font-black uppercase tracking-widest">
                                                            {quote.status || 'DRAFT'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <button
                                                            onClick={() =>
                                                                slug && router.push(`/app/${slug}/quotes/${quote.id}`)
                                                            }
                                                            className="text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 transition-opacity"
                                                        >
                                                            View →
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {(profile.quotes || []).length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={4}
                                                        className="py-12 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                                                    >
                                                        No quotes found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </TransactionSection>

                            <TransactionSection
                                title="Sales Orders"
                                count={bookingCount}
                                expanded={groups.transactionBookings}
                                onToggle={() => setGroups(g => ({ ...g, transactionBookings: !g.transactionBookings }))}
                            >
                                <div className="w-full overflow-x-auto">
                                    <table className="w-full min-w-[600px] text-left border-collapse">
                                        <thead className="bg-slate-50/50 dark:bg-white/[0.02]">
                                            <tr className="border-b border-slate-100 dark:border-white/5">
                                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                    Date
                                                </th>
                                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                    Sales Order
                                                </th>
                                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                    Status
                                                </th>
                                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                    Amount
                                                </th>
                                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(profile.bookings || []).map((booking: any) => (
                                                <tr
                                                    key={booking.id}
                                                    className="border-b border-slate-50 dark:border-white/[0.02] last:border-b-0 group"
                                                >
                                                    <td className="px-4 py-3 text-[10px] font-bold text-slate-500">
                                                        {formatDate(booking.created_at)}
                                                    </td>
                                                    <td className="px-4 py-3 text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                                        {formatDisplayId(booking.display_id || booking.id)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 text-[8px] font-black uppercase tracking-widest">
                                                            {booking.status || 'BOOKED'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 text-[10px] font-black text-slate-900 dark:text-white">
                                                        {formatMoney(booking.booking_amount_received || 0)}
                                                    </td>
                                                    <td className="py-3 text-right">
                                                        <button
                                                            onClick={() =>
                                                                slug &&
                                                                router.push(`/app/${slug}/sales-orders/${booking.id}`)
                                                            }
                                                            className="text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            Manage
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {(profile.bookings || []).length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={5}
                                                        className="py-12 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                                                    >
                                                        No sales orders found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </TransactionSection>

                            <TransactionSection
                                title="Receipts"
                                count={receiptCount}
                                expanded={groups.transactionReceipts}
                                onToggle={() => setGroups(g => ({ ...g, transactionReceipts: !g.transactionReceipts }))}
                            >
                                <div className="w-full overflow-x-auto">
                                    <table className="w-full min-w-[600px] text-left border-collapse">
                                        <thead className="bg-slate-50/50 dark:bg-white/[0.02]">
                                            <tr className="border-b border-slate-100 dark:border-white/5">
                                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                    Date
                                                </th>
                                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                    Receipt ID
                                                </th>
                                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                    Method
                                                </th>
                                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                    Amount
                                                </th>
                                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">
                                                    Status
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(profile.receipts || []).map((receipt: any) => (
                                                <tr
                                                    key={receipt.id}
                                                    className="border-b border-slate-50 dark:border-white/[0.02] last:border-b-0 group cursor-pointer"
                                                    onClick={() =>
                                                        slug && router.push(`/app/${slug}/receipts/${receipt.id}`)
                                                    }
                                                >
                                                    <td className="px-4 py-3 text-[10px] font-bold text-slate-500">
                                                        {formatDate(receipt.created_at)}
                                                    </td>
                                                    <td className="px-4 py-3 text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                                        {formatDisplayId(receipt.display_id || receipt.id)}
                                                    </td>
                                                    <td className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">
                                                        {receipt.method || '—'}
                                                    </td>
                                                    <td className="px-4 py-3 text-[10px] font-black text-slate-900 dark:text-white">
                                                        {formatMoney(receipt.amount)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <span
                                                            className={cn(
                                                                'px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest',
                                                                receipt.status === 'captured' ||
                                                                    receipt.status === 'success'
                                                                    ? 'bg-emerald-500/10 text-emerald-600'
                                                                    : 'bg-amber-500/10 text-amber-600'
                                                            )}
                                                        >
                                                            {receipt.status || 'pending'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {(profile.receipts || []).length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={5}
                                                        className="py-12 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                                                    >
                                                        No receipts found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </TransactionSection>
                        </div>
                    </div>
                )}

                {activeTab === 'TASKS' && (
                    <div className="mx-4 mt-4 bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/5 rounded-2xl p-6 text-xs text-slate-400">
                        Tasks module coming soon.
                    </div>
                )}

                {activeTab === 'NOTES' && (
                    <div className="mx-4 mt-4 bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/5 rounded-2xl p-6 text-xs text-slate-400">
                        Notes module coming soon.
                    </div>
                )}

                {activeTab === 'DOCUMENTS' && (
                    <div className="mx-4 mt-4 bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/5 rounded-2xl p-6 text-xs text-slate-400">
                        Documents module coming soon.
                    </div>
                )}

                {activeTab === 'TIMELINE' && (
                    <div className="mx-4 mt-4 bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/5 rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5">
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Timeline
                            </div>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-white/5">
                            <div className="px-6 py-6 text-xs text-slate-400">No timeline events.</div>
                        </div>
                    </div>
                )}

                {activeTab === 'OCLUB' && (
                    <div className="mx-4 mt-4 bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/5 rounded-2xl p-6 text-xs text-slate-400">
                        O Club module coming soon.
                    </div>
                )}
            </div>
        </div>
    );
}
