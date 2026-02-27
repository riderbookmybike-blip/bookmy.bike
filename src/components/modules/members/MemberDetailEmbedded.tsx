'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTenant } from '@/lib/tenant/tenantContext';
import { getMemberFullProfile } from '@/actions/members';
import { DisplayId } from '@/components/ui/DisplayId';
import {
    Mail,
    Phone,
    MoreHorizontal,
    User,
    Calendar,
    Wallet,
    FileText,
    Activity,
    Clock,
    MapPin,
    ChevronDown,
} from 'lucide-react';

// --- Types ---
interface Member {
    id: string;
    display_id: string;
    full_name: string;
    phone: string;
    email: string;
    member_status: string;
    created_at: string;
    pan_number?: string;
    aadhaar_number?: string;
}

interface MemberProfile {
    member: Member;
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

export default function MemberDetailEmbedded({ memberId }: { memberId: string }) {
    const params = useParams();
    const { tenantId } = useTenant();
    const slug = typeof params?.slug === 'string' ? params.slug : Array.isArray(params?.slug) ? params.slug[0] : '';

    const [profile, setProfile] = useState<MemberProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!memberId) return;
        setLoading(true);
        setErrorMessage(null);
        getMemberFullProfile(memberId)
            .then(data => setProfile(data as unknown as MemberProfile))
            .catch(error => {
                console.error('MemberDetailEmbedded: failed to load profile', { memberId, error });
                setProfile(null);
                const serialized = typeof error === 'string' ? error : JSON.stringify(error, null, 2);
                setErrorMessage(serialized || error?.message || 'Failed to load member profile.');
            })
            .finally(() => setLoading(false));
    }, [memberId, tenantId]);

    const TABS = [
        { id: 'overview', label: 'Overview', icon: User },
        { id: 'comments', label: 'Comments', icon: Activity },
        { id: 'transactions', label: 'Transactions', icon: Wallet },
        { id: 'documents', label: 'Documents', icon: FileText },
        { id: 'activity', label: 'Timeline', icon: Clock },
    ];

    if (loading) {
        return (
            <div className="p-12 space-y-8 animate-pulse">
                <div className="h-40 bg-slate-100 dark:bg-white/5 rounded-[2.5rem]" />
                <div className="h-64 bg-slate-100 dark:bg-white/5 rounded-[2.5rem]" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="p-12 space-y-2 text-sm text-slate-400">
                <div>Member not found.</div>
                {errorMessage ? (
                    <pre className="text-[11px] text-rose-500 whitespace-pre-wrap break-words bg-rose-500/10 border border-rose-500/20 rounded-lg p-3">
                        {errorMessage}
                    </pre>
                ) : null}
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-full">
            {/* Detail Header */}
            <header className="p-8 pb-0 bg-white dark:bg-transparent sticky top-0 z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-white/5">
                    <div className="flex items-start gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-2xl font-black text-white shadow-lg">
                            {(profile.member?.full_name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-black tracking-tight">{profile.member?.full_name}</h1>
                                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[9px] font-black rounded uppercase tracking-widest">
                                    Verified Identity
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-500">
                                <DisplayId id={profile.member?.display_id || ''} />
                                <span className="text-slate-300">|</span>
                                <div className="flex items-center gap-1.5 text-xs font-bold">
                                    <Calendar size={14} /> Joined{' '}
                                    {new Date(profile.member?.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="px-4 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors">
                            Edit
                        </button>
                        <div className="relative group/new">
                            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-600/20 active:scale-95 transition-all">
                                New Transaction <ChevronDown size={14} />
                            </button>
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#0f1115] border border-slate-200 dark:border-white/5 rounded-xl shadow-2xl opacity-0 translate-y-2 pointer-events-none group-hover/new:opacity-100 group-hover/new:translate-y-0 group-hover/new:pointer-events-auto transition-all z-20">
                                {['Booking', 'Receipt', 'Lead', 'Quote'].map(type => (
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
                            <MoreHorizontal size={20} />
                        </button>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <nav className="flex items-center gap-8 mt-4 overflow-x-auto no-scrollbar">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`pb-4 text-xs font-bold uppercase tracking-widest flex items-center gap-2 whitespace-nowrap border-b-2 transition-all ${
                                activeTab === tab.id
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                            }`}
                        >
                            <tab.icon size={14} /> {tab.label}
                        </button>
                    ))}
                </nav>
            </header>

            {/* Tab Content */}
            <div className="p-8 flex-1">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-8">
                            <section className="bg-slate-50 dark:bg-white/[0.03] p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 space-y-6 shadow-sm">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                    Identity Information
                                </h3>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">
                                            Phone Number
                                        </p>
                                        <p className="font-bold text-sm">{profile.member?.phone || '—'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">
                                            Email Address
                                        </p>
                                        <p className="font-bold text-sm">{profile.member?.email || '—'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">
                                            PAN Number
                                        </p>
                                        <p className="font-mono font-bold text-sm tracking-tighter uppercase">
                                            {profile.member?.pan_number || '—'}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">
                                            Aadhaar Number
                                        </p>
                                        <p className="font-mono font-bold text-sm tracking-tighter">
                                            {profile.member?.aadhaar_number || '—'}
                                        </p>
                                    </div>
                                </div>
                            </section>
                        </div>

                        <div className="space-y-8">
                            <section className="bg-white dark:bg-white/[0.02] p-6 rounded-[2.5rem] border border-slate-100 dark:border-white/5">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
                                    Contact
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm font-bold">
                                        <Phone size={14} className="text-indigo-500" />
                                        {profile.member?.phone || '—'}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm font-bold">
                                        <Mail size={14} className="text-indigo-500" />
                                        {profile.member?.email || '—'}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm font-bold">
                                        <MapPin size={14} className="text-indigo-500" />
                                        {profile.addresses?.[0]?.address_line_1 || 'Address not set'}
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                )}

                {activeTab === 'comments' && <div className="text-sm text-slate-400">Comments module coming here.</div>}

                {activeTab === 'transactions' && (
                    <div className="text-sm text-slate-400">Transactions module coming here.</div>
                )}

                {activeTab === 'documents' && (
                    <div className="text-sm text-slate-400">Documents module coming here.</div>
                )}

                {activeTab === 'activity' && <div className="text-sm text-slate-400">Timeline module coming here.</div>}
            </div>
        </div>
    );
}
