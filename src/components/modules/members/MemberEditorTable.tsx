'use client';

import React, { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DisplayId } from '@/components/ui/DisplayId';
import {
    Calendar,
    ChevronDown,
    ChevronRight,
    Clock,
    FileText,
    MoreHorizontal,
    User,
    Wallet,
    Activity,
    ShieldCheck,
    Phone,
    Mail,
    MapPin,
    BadgeCheck,
    Plus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDisplayId } from '@/utils/displayId';
import { useBreakpoint } from '@/hooks/useBreakpoint';

interface MemberProfile {
    member: any;
    contacts: any[];
    addresses: any[];
    assets: any[];
    events: any[];
    payments: any[];
    bookings: any[];
    leads: any[];
    quotes: any[];
    wallet?: any;
    oclubLedger?: any[];
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

const formatAddressLines = (lines: Array<string | null | undefined>) => {
    const cleaned = lines.filter(Boolean);
    return cleaned.length > 0 ? cleaned.join(', ') : '—';
};

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}

export default function MemberEditorTable({ profile }: { profile: MemberProfile }) {
    const { device } = useBreakpoint();
    const isPhone = device === 'phone';

    const params = useParams();
    const router = useRouter();
    const slug = typeof params?.slug === 'string' ? params.slug : Array.isArray(params?.slug) ? params.slug[0] : '';

    const [activeTab, setActiveTab] = useState<
        'MEMBER' | 'OCLUB' | 'TRANSACTIONS' | 'TASKS' | 'NOTES' | 'DOCUMENTS' | 'TIMELINE'
    >('MEMBER');
    const [groups, setGroups] = useState({
        transactionLeads: true,
        transactionQuotes: true,
        transactionBookings: true,
        transactionReceipts: true,
    });

    const leadCount = profile.leads?.length || 0;
    const quoteCount = profile.quotes?.length || 0;
    const bookingCount = profile.bookings?.length || 0;
    const receiptCount = profile.payments?.length || 0;
    const timelineCount = profile.events?.length || 0;

    const tabs = useMemo(
        () => [
            { key: 'MEMBER', label: 'MEMBER', count: 0 },
            { key: 'OCLUB', label: "O'CLUB", count: profile.oclubLedger?.length || 0 },
            {
                key: 'TRANSACTIONS',
                label: 'TRANSACTIONS',
                count: leadCount + quoteCount + bookingCount + receiptCount,
            },
            { key: 'TASKS', label: 'TASKS', count: 0 },
            { key: 'NOTES', label: 'NOTES', count: 0 },
            { key: 'DOCUMENTS', label: 'DOCUMENTS', count: 0 },
            { key: 'TIMELINE', label: 'TIMELINE', count: timelineCount },
        ],
        [leadCount, quoteCount, bookingCount, receiptCount, timelineCount, profile.oclubLedger?.length]
    );

    const wallet = profile.wallet || {};

    // Phone-first layout mirrors Leads/Quote mobile accordions
    if (isPhone) {
        const transactionTotal = leadCount + quoteCount + bookingCount + receiptCount;
        return (
            <div className="h-full flex flex-col bg-white dark:bg-[#0b0d10]">
                <div className="px-3 pt-2 pb-3 space-y-2.5">
                    <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-base font-black shadow-lg shrink-0">
                            {(profile.member?.full_name || 'M').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white truncate">
                                    {profile.member?.full_name || 'Member'}
                                </h1>
                                <span className="px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest shrink-0 bg-indigo-500/10 text-indigo-600">
                                    {profile.member?.member_status || 'ACTIVE'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[9px] text-slate-400 font-bold flex-wrap">
                                <span className="font-black uppercase tracking-widest">
                                    {formatDisplayId(profile.member?.display_id || profile.member?.id || '')}
                                </span>
                                <span>•</span>
                                <span>{formatDate(profile.member?.created_at)}</span>
                            </div>
                            {profile.member?.primary_phone && (
                                <div className="flex items-center gap-1.5 mt-0.5 text-indigo-600">
                                    <Phone size={11} />
                                    <span className="text-[11px] font-black tracking-wide">
                                        {profile.member?.primary_phone}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div
                    className="flex-1 overflow-y-auto no-scrollbar bg-slate-50/80 dark:bg-slate-950 border-t border-slate-200 dark:border-white/5"
                    style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
                >
                    <PhoneSection title="Profile" defaultOpen>
                        <div className="space-y-2 text-[12px] text-slate-700 dark:text-slate-200">
                            <div className="flex items-center gap-2">
                                <Phone size={14} className="text-slate-400" />
                                <span className="font-black">{profile.member?.primary_phone || '—'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail size={14} className="text-slate-400" />
                                <span className="font-black">{profile.member?.email || '—'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-slate-400" />
                                <span className="font-black">{formatDate(profile.member?.dob)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <BadgeCheck size={14} className="text-slate-400" />
                                <span className="font-black">{profile.member?.kyc_status || 'KYC PENDING'}</span>
                            </div>
                        </div>
                    </PhoneSection>

                    <PhoneSection title="Addresses" count={profile.addresses?.length || 0}>
                        <div className="space-y-3 text-[11px] text-slate-700 dark:text-slate-200">
                            {(profile.addresses || []).slice(0, 4).map((addr, idx) => (
                                <div key={idx} className="flex items-start gap-2">
                                    <MapPin size={12} className="text-slate-400 mt-0.5" />
                                    <div className="space-y-0.5">
                                        <div className="font-black">{addr?.type || 'Address'}</div>
                                        <div className="text-[10px] text-slate-500">
                                            {formatAddressLines([
                                                addr?.line1,
                                                addr?.line2,
                                                addr?.city,
                                                addr?.state,
                                                addr?.pincode,
                                            ])}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {(profile.addresses?.length || 0) === 0 && (
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                    No addresses on file
                                </div>
                            )}
                        </div>
                    </PhoneSection>

                    <PhoneSection title="O'Club Wallet" count={profile.oclubLedger?.length || 0} defaultOpen>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between bg-indigo-600/10 border border-indigo-500/20 rounded-xl px-3 py-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700">
                                    Balance
                                </span>
                                <span className="text-sm font-black text-indigo-700">
                                    {wallet.balance !== undefined ? formatMoney(wallet.balance) : '—'}
                                </span>
                            </div>
                            {(profile.oclubLedger || []).slice(0, 5).map((entry, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between text-[11px] font-black text-slate-700 dark:text-slate-200"
                                >
                                    <span className="truncate">{entry?.description || 'Ledger entry'}</span>
                                    <span className={cn(entry?.amount >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
                                        {entry?.amount >= 0 ? '+' : ''}
                                        {entry?.amount}
                                    </span>
                                </div>
                            ))}
                            {(profile.oclubLedger?.length || 0) === 0 && (
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                    No ledger entries
                                </div>
                            )}
                        </div>
                    </PhoneSection>

                    <PhoneSection title="Transactions" count={transactionTotal} defaultOpen>
                        <div className="space-y-2 text-[11px] font-black text-slate-700 dark:text-slate-200">
                            <div className="flex items-center justify-between">
                                <span>Leads</span>
                                <span className="text-indigo-600">{leadCount}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Quotes</span>
                                <span className="text-indigo-600">{quoteCount}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Sales Orders</span>
                                <span className="text-indigo-600">{bookingCount}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Receipts</span>
                                <span className="text-indigo-600">{receiptCount}</span>
                            </div>
                        </div>
                    </PhoneSection>

                    <PhoneSection title="Timeline" count={timelineCount}>
                        <div className="space-y-3 text-[11px] text-slate-700 dark:text-slate-200">
                            {(profile.events || []).slice(0, 6).map((event, idx) => (
                                <div key={idx} className="flex items-start gap-2">
                                    <Clock size={12} className="text-slate-400 mt-0.5" />
                                    <div className="space-y-0.5">
                                        <div className="font-black">{event?.event || 'Event'}</div>
                                        <div className="text-[10px] text-slate-400">
                                            {formatDate(event?.created_at)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {timelineCount === 0 && (
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                    No events yet
                                </div>
                            )}
                        </div>
                    </PhoneSection>
                </div>
            </div>
        );
    }

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
                        <div className="px-4 pb-4 pt-4">{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

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
                    className="w-full flex items-center justify-between px-4 py-3 active:bg-slate-50 dark:active:bg-white/5 transition-colors"
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
                            <div className="px-4 pb-4">{children}</div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    if (isPhone) {
        const memberName = profile.member?.full_name || 'Member';
        const memberId = profile.member?.display_id || formatDisplayId(profile.member?.id);
        const oclubBalance = wallet.oclub_points_total || 0;

        return (
            <div className="h-full flex flex-col bg-white dark:bg-[#0b0d10] overflow-hidden">
                {/* Mobile Header */}
                <div className="px-4 pt-4 pb-3 border-b border-slate-100 dark:border-white/5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-sm font-black shadow-lg">
                                {memberName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-base font-black tracking-tight text-slate-900 dark:text-white truncate">
                                    {memberName}
                                </h1>
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                    {memberId}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-[8px] font-black uppercase tracking-widest border border-emerald-500/20">
                                Active
                            </span>
                        </div>
                    </div>

                    {/* O'CLUB QUICK VIEW */}
                    <div className="bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-600/20 p-4">
                        <div className="flex items-center justify-between text-indigo-100 text-[9px] font-black uppercase tracking-widest mb-1.5 opacity-80">
                            <span>O'Club Balance</span>
                            <Wallet size={12} />
                        </div>
                        <div className="text-xl font-black text-white">{oclubBalance.toLocaleString()} pts</div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
                    <PhoneSection title="Profile & Identity" defaultOpen={true}>
                        <div className="space-y-4 pt-3">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                        Phone
                                    </div>
                                    <div className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                                        {profile.member?.phone || '—'}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                        Email
                                    </div>
                                    <div className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate">
                                        {profile.member?.email || '—'}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                        PAN
                                    </div>
                                    <div className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-200">
                                        {profile.member?.pan_number || '—'}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                        Aadhaar
                                    </div>
                                    <div className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-200">
                                        {profile.member?.aadhaar_number || '—'}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 border-t border-slate-50 dark:border-white/5 pt-4">
                                <div className="space-y-1">
                                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                        Birthday
                                    </div>
                                    <div className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                                        {formatDate(profile.member?.dob)}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                        RTO
                                    </div>
                                    <div className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                        {profile.member?.rto || '—'}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1 border-t border-slate-50 dark:border-white/5 pt-4">
                                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                    Work / Company
                                </div>
                                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                                    {profile.member?.work_company || '—'}
                                </div>
                            </div>
                        </div>
                    </PhoneSection>

                    <PhoneSection
                        title="Addresses"
                        count={(profile.addresses?.length || 0) > 0 ? profile.addresses.length : undefined}
                    >
                        <div className="space-y-4 pt-3">
                            {/* Primary Addresses */}
                            <div className="space-y-3">
                                <div>
                                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                                        Current
                                    </div>
                                    <div className="text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-relaxed italic">
                                        {formatAddressLines([
                                            profile.member?.current_address1,
                                            profile.member?.current_address2,
                                            profile.member?.current_address3,
                                        ])}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                                        Permanent
                                    </div>
                                    <div className="text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-relaxed italic">
                                        {formatAddressLines([
                                            profile.member?.aadhaar_address1,
                                            profile.member?.aadhaar_address2,
                                            profile.member?.aadhaar_address3,
                                        ])}
                                    </div>
                                </div>
                            </div>

                            {/* Saved Addresses */}
                            {profile.addresses?.length > 0 && (
                                <div className="pt-3 border-t border-slate-50 dark:border-white/5 space-y-2">
                                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                        Saved Locations
                                    </div>
                                    {profile.addresses.map((addr: any) => (
                                        <div
                                            key={addr.id}
                                            className="bg-slate-50 dark:bg-white/5 p-2.5 rounded-xl border border-slate-100 dark:border-white/10"
                                        >
                                            <div className="text-[10px] font-black text-slate-900 dark:text-white mb-0.5">
                                                {addr.label || 'Address'}
                                            </div>
                                            <div className="text-[9px] text-slate-500 font-medium italic leading-relaxed">
                                                {formatAddressLines([
                                                    addr.line1,
                                                    addr.line2,
                                                    addr.line3,
                                                    addr.district,
                                                    addr.state,
                                                ])}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </PhoneSection>

                    <PhoneSection
                        title="Contacts"
                        count={(profile.contacts?.length || 0) > 0 ? profile.contacts.length : undefined}
                    >
                        <div className="space-y-2 pt-3">
                            {profile.contacts?.map((contact: any) => (
                                <div
                                    key={contact.id}
                                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/10"
                                >
                                    <div className="min-w-0">
                                        <div className="text-[10px] font-black text-slate-900 dark:text-white mb-0.5 truncate">
                                            {contact.label || contact.contact_type}
                                        </div>
                                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                            {contact.contact_type}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-xs font-black text-slate-900 dark:text-white">
                                            {contact.value}
                                        </div>
                                        {contact.contact_type?.toUpperCase() === 'PHONE' && (
                                            <a
                                                href={`tel:${contact.value}`}
                                                className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg active:scale-95 transition-transform"
                                            >
                                                <Phone size={12} />
                                            </a>
                                        )}
                                        {contact.contact_type?.toUpperCase() === 'EMAIL' && (
                                            <a
                                                href={`mailto:${contact.value}`}
                                                className="p-2 bg-indigo-500/10 text-indigo-600 rounded-lg active:scale-95 transition-transform"
                                            >
                                                <Mail size={12} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {(profile.contacts?.length || 0) === 0 && (
                                <div className="text-[10px] text-slate-400 font-bold py-4 text-center italic">
                                    No secondary contacts saved.
                                </div>
                            )}
                        </div>
                    </PhoneSection>

                    <PhoneSection title="O-Club Ledger" count={profile.oclubLedger?.length}>
                        <div className="space-y-2 pt-3">
                            {profile.oclubLedger?.map((entry: any, idx: number) => (
                                <div
                                    key={idx}
                                    className="bg-slate-50 dark:bg-white/5 rounded-xl p-3 flex items-center justify-between border border-slate-100 dark:border-white/10"
                                >
                                    <div className="min-w-0">
                                        <div className="text-[10px] font-black uppercase tracking-tight text-slate-900 dark:text-white truncate mb-0.5">
                                            {entry.reason || 'Point Transaction'}
                                        </div>
                                        <div className="text-[9px] font-bold text-slate-400 italic">
                                            {formatDate(entry.created_at)}
                                        </div>
                                    </div>
                                    <div
                                        className={cn(
                                            'text-xs font-black px-2 py-1 rounded bg-white dark:bg-black border border-slate-100 dark:border-white/5',
                                            entry.points >= 0 ? 'text-emerald-500' : 'text-rose-500'
                                        )}
                                    >
                                        {entry.points >= 0 ? '+' : ''}
                                        {entry.points}
                                    </div>
                                </div>
                            ))}
                            {(profile.oclubLedger?.length || 0) === 0 && (
                                <div className="text-[10px] text-slate-400 font-bold py-4 text-center italic">
                                    No ledger activity recorded.
                                </div>
                            )}
                        </div>
                    </PhoneSection>

                    <PhoneSection title="Transactions" count={leadCount + quoteCount + bookingCount + receiptCount}>
                        <div className="space-y-6 pt-4">
                            {bookingCount > 0 && (
                                <div>
                                    <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 px-1">
                                        Sales Orders
                                    </div>
                                    <div className="space-y-2">
                                        {profile.bookings.slice(0, 3).map((b: any) => (
                                            <div
                                                key={b.id}
                                                className="bg-slate-50 dark:bg-white/5 rounded-xl p-3 flex items-center justify-between border border-slate-100 dark:border-white/10 active:scale-[0.98] transition-all"
                                                onClick={() => slug && router.push(`/app/${slug}/sales-orders/${b.id}`)}
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight mb-0.5">
                                                        {formatDisplayId(b.display_id || b.id)}
                                                    </div>
                                                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                        {b.vehicle_name || 'BOOKING'} • {b.status}
                                                    </div>
                                                </div>
                                                <div className="text-[10px] font-black text-indigo-600">{b.status}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {quoteCount > 0 && (
                                <div>
                                    <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 px-1">
                                        Quotes
                                    </div>
                                    <div className="space-y-2">
                                        {profile.quotes.slice(0, 3).map((q: any) => (
                                            <div
                                                key={q.id}
                                                className="bg-slate-50 dark:bg-white/5 rounded-xl p-3 flex items-center justify-between border border-slate-100 dark:border-white/10 active:scale-[0.98] transition-all"
                                                onClick={() => slug && router.push(`/app/${slug}/quotes/${q.id}`)}
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight mb-0.5">
                                                        {formatDisplayId(q.displayId || q.id)}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                                            {q.status || 'DRAFT'}
                                                        </span>
                                                        <span className="text-[9px] text-slate-400 font-bold">
                                                            {q.created_at ? formatDate(q.created_at) : '—'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-xs font-black text-indigo-600 tabular-nums">
                                                    {formatMoney(q.pricing?.finalTotal || q.pricing?.summary?.payable)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {leadCount > 0 && (
                                <div>
                                    <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 px-1">
                                        Leads
                                    </div>
                                    <div className="space-y-2">
                                        {profile.leads.slice(0, 3).map((l: any) => (
                                            <div
                                                key={l.id}
                                                className="bg-slate-50 dark:bg-white/5 rounded-xl p-3 flex items-center justify-between border border-slate-100 dark:border-white/10 active:scale-[0.98] transition-all"
                                                onClick={() => slug && router.push(`/app/${slug}/leads/${l.id}`)}
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight mb-0.5">
                                                        {formatDisplayId(l.display_id || l.id)}
                                                    </div>
                                                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                        {l.intent_score || 'WARM'} • {l.status}
                                                    </div>
                                                </div>
                                                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[8px] font-black uppercase tracking-widest border border-amber-500/20">
                                                    {l.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {receiptCount > 0 && (
                                <div>
                                    <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 px-1">
                                        Receipts
                                    </div>
                                    <div className="space-y-2">
                                        {profile.payments.slice(0, 3).map((p: any) => (
                                            <div
                                                key={p.id}
                                                className="bg-slate-50 dark:bg-white/5 rounded-xl p-3 flex items-center justify-between border border-slate-100 dark:border-white/10 active:scale-[0.98] transition-all"
                                                onClick={() => slug && router.push(`/app/${slug}/receipts/${p.id}`)}
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight mb-0.5">
                                                        {formatDisplayId(p.display_id || p.id)}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                                            {p.status || 'PAID'}
                                                        </span>
                                                        <span className="text-[9px] text-slate-400 font-bold">
                                                            {p.method}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-xs font-black text-emerald-600 tabular-nums">
                                                    +{formatMoney(p.amount)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </PhoneSection>

                    <PhoneSection title="Timeline" count={timelineCount}>
                        <div className="space-y-5 pt-4 pb-4 px-1">
                            {profile.events?.slice(0, 10).map((event: any, idx: number) => (
                                <div key={event.id || idx} className="flex gap-4 relative">
                                    {idx !== profile.events.slice(0, 10).length - 1 && (
                                        <div className="absolute left-[3px] top-[14px] bottom-[-20px] w-px bg-slate-100 dark:bg-white/5" />
                                    )}
                                    <div className="w-2 h-2 rounded-full bg-indigo-500/20 border border-indigo-500/50 mt-1.5 shrink-0 z-10" />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">
                                                {event.event_type || 'Activity'}
                                            </div>
                                            <div className="text-[8px] font-black text-slate-400 tabular-nums">
                                                {formatDate(event.created_at)}
                                            </div>
                                        </div>
                                        <div className="text-[10px] text-slate-500 leading-relaxed italic opacity-80">
                                            {event.event_data?.message || event.description || 'System generated event'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {timelineCount === 0 && (
                                <div className="text-[10px] text-slate-400 font-bold py-6 text-center italic">
                                    No activity recorded for this member.
                                </div>
                            )}
                        </div>
                    </PhoneSection>

                    {/* Placeholders for future modules */}
                    <PhoneSection title="Notes & Tasks">
                        <div className="py-8 text-center space-y-2">
                            <Clock size={20} className="mx-auto text-slate-300 mb-2 opacity-50" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Collaboration Coming Soon
                            </p>
                            <p className="text-[9px] text-slate-500 italic">
                                Notes and Tasks will be available in the mobile view shortly.
                            </p>
                        </div>
                    </PhoneSection>

                    <PhoneSection title="Documents">
                        <div className="py-8 text-center space-y-2">
                            <FileText size={20} className="mx-auto text-slate-300 mb-2 opacity-50" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Vault Coming Soon
                            </p>
                            <p className="text-[9px] text-slate-500 italic">
                                Secure document access is being optimized for mobile.
                            </p>
                        </div>
                    </PhoneSection>
                </div>

                {/* Bottom Placeholder / Floating Action if needed */}
                <div
                    className="px-4 pt-3 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]"
                    style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
                >
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center italic">
                        Founder Member Identity • BookMy.Bike
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* HEADER */}
            <div className="bg-white dark:bg-[#0b0d10] border-b border-slate-100 dark:border-white/5">
                <div className="px-6 pt-6 pb-4 flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-lg font-black shadow-lg">
                                {(profile.member?.full_name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-xl font-black tracking-tight truncate">
                                        {profile.member?.full_name || 'Unnamed Member'}
                                    </h1>
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600">
                                        Verified Identity
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-slate-500">
                                    <DisplayId id={profile.member?.display_id || ''} />
                                    <span className="text-slate-300">|</span>
                                    <span className="flex items-center gap-1.5 font-bold">
                                        <Calendar size={12} /> Joined {formatDate(profile.member?.created_at)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="px-4 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors">
                                Edit
                            </button>
                            <div className="relative group">
                                <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-600/20 active:scale-95 transition-all">
                                    New Transaction <ChevronDown size={14} />
                                </button>
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#0f1115] border border-slate-200 dark:border-white/5 rounded-xl shadow-2xl opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all z-20">
                                    {['Sales Order', 'Receipt', 'Lead', 'Quote'].map(type => (
                                        <button
                                            key={type}
                                            className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/5 first:rounded-t-xl last:rounded-b-xl transition-colors"
                                        >
                                            New {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button className="p-2 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-400 hover:text-indigo-600 transition-colors">
                                <MoreHorizontal size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs - Sticky */}
            <div className="sticky top-0 z-10 bg-white/20 dark:bg-white/[0.03] backdrop-blur-xl mx-4 mt-4 rounded-2xl overflow-hidden border border-white/20 dark:border-white/5 shadow-sm">
                <div className="grid grid-cols-7 text-[9px] font-black uppercase tracking-widest w-full">
                    {tabs.map((tab, idx) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as any)}
                            className={cn(
                                'w-full py-3 text-center transition-all relative',
                                idx < 6 ? 'border-r border-slate-100 dark:border-white/10' : '',
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

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto no-scrollbar pb-24 bg-slate-50 dark:bg-slate-950">
                {activeTab === 'MEMBER' && (
                    <div className="mx-4 mt-4 space-y-4">
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-px bg-slate-100 dark:bg-white/5 rounded-2xl overflow-hidden border border-slate-100 dark:border-white/5">
                            <div className="bg-white dark:bg-[#0b0d10] p-6 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center">
                                    <User size={18} />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">
                                        Member Profile
                                    </span>
                                    <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tighter truncate leading-tight">
                                        {profile.member?.full_name || 'Unnamed Member'}
                                    </h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Phone size={12} className="text-slate-400" />
                                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                            {profile.member?.primary_phone || profile.member?.phone || '—'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Mail size={12} className="text-slate-400" />
                                        <span className="text-[10px] font-bold text-slate-500">
                                            {profile.member?.primary_email || profile.member?.email || '—'}
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
                                        Identity Status
                                    </span>
                                    <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tighter truncate leading-tight">
                                        Verified Identity
                                    </h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <BadgeCheck size={12} className="text-emerald-500" />
                                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                                            Active Member
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div className="bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/5 rounded-2xl p-6">
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
                                    Identity Information
                                </div>
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Phone
                                        </span>
                                        <span className="text-[12px] font-black text-slate-900 dark:text-white">
                                            {profile.member?.primary_phone || profile.member?.phone || '—'}
                                        </span>
                                    </div>
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Email
                                        </span>
                                        <span className="text-[12px] font-bold text-slate-600 dark:text-slate-300">
                                            {profile.member?.primary_email || profile.member?.email || '—'}
                                        </span>
                                    </div>
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            PAN
                                        </span>
                                        <span className="text-[12px] font-mono font-bold text-slate-700 dark:text-slate-200">
                                            {profile.member?.pan_number || '—'}
                                        </span>
                                    </div>
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Aadhaar
                                        </span>
                                        <span className="text-[12px] font-mono font-bold text-slate-700 dark:text-slate-200">
                                            {profile.member?.aadhaar_number || '—'}
                                        </span>
                                    </div>
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            DOB
                                        </span>
                                        <span className="text-[12px] font-bold text-slate-600 dark:text-slate-300">
                                            {formatDate(profile.member?.date_of_birth)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/5 rounded-2xl p-6">
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
                                    Addresses
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                                            Current
                                        </div>
                                        <div className="text-[12px] font-bold text-slate-700 dark:text-slate-200">
                                            {formatAddressLines([
                                                profile.member?.current_address1,
                                                profile.member?.current_address2,
                                                profile.member?.current_address3,
                                            ])}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                                            Work
                                        </div>
                                        <div className="text-[12px] font-bold text-slate-700 dark:text-slate-200">
                                            {formatAddressLines([
                                                profile.member?.work_address1,
                                                profile.member?.work_address2,
                                                profile.member?.work_address3,
                                            ])}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                                            Permanent
                                        </div>
                                        <div className="text-[12px] font-bold text-slate-700 dark:text-slate-200">
                                            {formatAddressLines([
                                                profile.member?.aadhaar_address1,
                                                profile.member?.aadhaar_address2,
                                                profile.member?.aadhaar_address3,
                                            ])}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/5 rounded-2xl p-6">
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
                                    Work & Location
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Company
                                        </span>
                                        <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200">
                                            {profile.member?.work_company || '—'}
                                        </span>
                                    </div>
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Designation
                                        </span>
                                        <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200">
                                            {profile.member?.work_designation || '—'}
                                        </span>
                                    </div>
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Work Email
                                        </span>
                                        <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200">
                                            {profile.member?.work_email || '—'}
                                        </span>
                                    </div>
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Work Phone
                                        </span>
                                        <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200">
                                            {profile.member?.work_phone || '—'}
                                        </span>
                                    </div>
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            RTO
                                        </span>
                                        <span className="text-[12px] font-black text-slate-900 dark:text-white">
                                            {profile.member?.rto || '—'}
                                        </span>
                                    </div>
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            District
                                        </span>
                                        <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200">
                                            {profile.member?.district || '—'}
                                        </span>
                                    </div>
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Taluka
                                        </span>
                                        <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200">
                                            {profile.member?.taluka || '—'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/5 rounded-2xl overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        Saved Contacts
                                    </div>
                                </div>
                                <div className="divide-y divide-slate-100 dark:divide-white/5">
                                    {(profile.contacts || []).map((contact: any) => (
                                        <div key={contact.id} className="px-6 py-4 flex items-center justify-between">
                                            <div>
                                                <div className="text-xs font-black text-slate-900 dark:text-white">
                                                    {contact.label || contact.contact_type}
                                                </div>
                                                <div className="text-[10px] text-slate-400">{contact.contact_type}</div>
                                            </div>
                                            <div className="text-xs font-black text-slate-900 dark:text-white">
                                                {contact.value}
                                            </div>
                                        </div>
                                    ))}
                                    {(profile.contacts || []).length === 0 && (
                                        <div className="px-6 py-6 text-xs text-slate-400">No contacts saved.</div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/5 rounded-2xl overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        Saved Addresses
                                    </div>
                                </div>
                                <div className="divide-y divide-slate-100 dark:divide-white/5">
                                    {(profile.addresses || []).map((address: any) => (
                                        <div key={address.id} className="px-6 py-4">
                                            <div className="text-xs font-black text-slate-900 dark:text-white">
                                                {address.label || 'Address'}
                                            </div>
                                            <div className="text-[10px] text-slate-400">
                                                {formatAddressLines([
                                                    address.line1,
                                                    address.line2,
                                                    address.line3,
                                                    address.taluka,
                                                    address.state,
                                                    address.pincode,
                                                ])}
                                            </div>
                                        </div>
                                    ))}
                                    {(profile.addresses || []).length === 0 && (
                                        <div className="px-6 py-6 text-xs text-slate-400">No addresses saved.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'OCLUB' && (
                    <div className="mx-4 mt-4 space-y-4">
                        <div className="bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/5 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                                        <Wallet size={18} />
                                    </div>
                                    <div>
                                        <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                                            O'Club Wallet
                                        </div>
                                        <div className="text-lg font-black text-slate-900 dark:text-white">
                                            Balance Overview
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5">
                                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                        System
                                    </div>
                                    <div className="text-xl font-black text-slate-900 dark:text-white">
                                        {wallet.available_system ?? 0}
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5">
                                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                        Referral
                                    </div>
                                    <div className="text-xl font-black text-slate-900 dark:text-white">
                                        {wallet.available_referral ?? 0}
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5">
                                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                        Sponsored
                                    </div>
                                    <div className="text-xl font-black text-slate-900 dark:text-white">
                                        {wallet.available_sponsored ?? 0}
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5">
                                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                        Locked
                                    </div>
                                    <div className="text-xl font-black text-slate-900 dark:text-white">
                                        {(wallet.locked_referral ?? 0) + (wallet.pending_sponsored ?? 0)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/5 rounded-2xl overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5">
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Ledger
                                </div>
                            </div>
                            <div className="divide-y divide-slate-100 dark:divide-white/5">
                                {(profile.oclubLedger || []).length === 0 && (
                                    <div className="px-6 py-6 text-xs text-slate-400">No ledger entries.</div>
                                )}
                                {(profile.oclubLedger || []).map((entry: any) => (
                                    <div key={entry.id} className="px-6 py-4 flex items-center justify-between">
                                        <div>
                                            <div className="text-xs font-black text-slate-900 dark:text-white">
                                                {entry.coin_type} {entry.status ? `• ${entry.status}` : ''}
                                            </div>
                                            <div className="text-[10px] text-slate-400">
                                                {entry.source_type || 'SYSTEM'} • {formatDate(entry.created_at)}
                                            </div>
                                        </div>
                                        <div className="text-sm font-black text-slate-900 dark:text-white">
                                            {entry.delta > 0 ? '+' : ''}
                                            {entry.delta}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'TRANSACTIONS' && (
                    <div className="p-6">
                        <div className="bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/10 rounded-[2rem] overflow-hidden">
                            <TransactionSection
                                title="Leads"
                                count={leadCount}
                                expanded={groups.transactionLeads}
                                onToggle={() => setGroups(g => ({ ...g, transactionLeads: !g.transactionLeads }))}
                            >
                                <div className="w-full overflow-x-auto">
                                    <table className="w-full min-w-[600px] text-left border-collapse">
                                        <thead className="bg-slate-50/50 dark:bg-white/[0.02]">
                                            <tr className="border-b border-slate-100 dark:border-white/5">
                                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                    Date
                                                </th>
                                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                    Lead ID
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
                                            {(profile.leads || []).map((lead: any) => (
                                                <tr
                                                    key={lead.id}
                                                    className="border-b border-slate-50 dark:border-white/[0.02] last:border-b-0 group"
                                                >
                                                    <td className="px-4 py-3 text-[10px] font-bold text-slate-500">
                                                        {formatDate(lead.created_at)}
                                                    </td>
                                                    <td className="px-4 py-3 text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                                        {formatDisplayId(lead.display_id || lead.id)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[8px] font-black uppercase tracking-widest">
                                                            {lead.status || 'OPEN'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <button
                                                            onClick={() =>
                                                                slug && router.push(`/app/${slug}/leads/${lead.id}`)
                                                            }
                                                            className="text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 transition-opacity"
                                                        >
                                                            View →
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {(profile.leads || []).length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={4}
                                                        className="py-12 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                                                    >
                                                        No leads found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </TransactionSection>

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
                                            {(profile.payments || []).map((receipt: any) => (
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
                                            {(profile.payments || []).length === 0 && (
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

                {activeTab === 'NOTES' && (
                    <div className="mx-4 mt-4 bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/5 rounded-2xl p-6 text-xs text-slate-400">
                        Notes module coming soon.
                    </div>
                )}

                {activeTab === 'TASKS' && (
                    <div className="mx-4 mt-4 bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/5 rounded-2xl p-6 text-xs text-slate-400">
                        Tasks module coming soon.
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
                            {(profile.events || []).map((event: any) => (
                                <div key={event.id} className="px-6 py-4 flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                                        <Activity size={14} className="text-slate-500" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-black text-slate-900 dark:text-white">
                                            {event.event_type || 'EVENT'}
                                        </div>
                                        <div className="text-[10px] text-slate-400">{formatDate(event.created_at)}</div>
                                    </div>
                                </div>
                            ))}
                            {(profile.events || []).length === 0 && (
                                <div className="px-6 py-6 text-xs text-slate-400">No timeline events.</div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
