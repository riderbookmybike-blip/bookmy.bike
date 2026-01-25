'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useTenant } from '@/lib/tenant/tenantContext';
import { getMemberFullProfile, getMembersForTenant } from '@/actions/members';
import { DisplayId } from '@/components/ui/DisplayId';
import {
    ChevronLeft,
    Mail,
    Phone,
    MoreHorizontal,
    ExternalLink,
    Search,
    User,
    Calendar,
    BadgeCheck,
    Wallet,
    ShieldCheck,
    FileText,
    Activity,
    Clock,
    LayoutGrid,
    MapPin,
    Plus,
    ChevronDown,
    FileSearch
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
}

export default function MemberDetailPage() {
    const params = useParams();
    const slug = params.slug as string;
    const memberId = params.id as string;
    const searchParams = useSearchParams();
    const router = useRouter();
    const { tenantId } = useTenant();

    const [members, setMembers] = useState<Member[]>([]);
    const [profile, setProfile] = useState<MemberProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingList, setLoadingList] = useState(true);
    const [search, setSearch] = useState(searchParams.get('q') || '');
    const [activeTab, setActiveTab] = useState('overview');

    // Sync search input with local state and URL
    const handleSearchChange = (value: string) => {
        setSearch(value);
        const urlParams = new URLSearchParams(searchParams.toString());
        if (value) urlParams.set('q', value);
        else urlParams.delete('q');
        router.replace(`/app/${slug}/members/${memberId}?${urlParams.toString()}`);
    };

    // Fetch Mini-List (Side-list)
    useEffect(() => {
        if (!tenantId) return;
        setLoadingList(true);
        const search = searchParams.get('q') || '';
        getMembersForTenant(tenantId, search)
            .then(data => setMembers((data || []) as unknown as Member[]))
            .finally(() => setLoadingList(false));
    }, [tenantId, searchParams]);

    // Fetch Full Profile
    useEffect(() => {
        if (!memberId) return;
        setLoading(true);
        getMemberFullProfile(memberId)
            .then(data => setProfile(data as unknown as MemberProfile))
            .finally(() => setLoading(false))
            .catch(() => setProfile(null));
    }, [memberId]);

    const TABS = [
        { id: 'overview', label: 'Overview', icon: User },
        { id: 'comments', label: 'Comments', icon: Activity },
        { id: 'transactions', label: 'Transactions', icon: Wallet },
        { id: 'documents', label: 'Documents', icon: FileText },
        { id: 'activity', label: 'Timeline', icon: Clock },
    ];

    return (
        <div className="flex h-[calc(100vh-64px)] bg-[#f3f4f6] dark:bg-[#0b0d10] overflow-hidden">
            {/* 1. Main Detail Content */}
            <main className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-transparent border-r border-slate-200 dark:border-white/5">
                {loading ? (
                    <div className="p-12 space-y-8 animate-pulse">
                        <div className="h-40 bg-slate-100 dark:bg-white/5 rounded-[2.5rem]" />
                        <div className="h-64 bg-slate-100 dark:bg-white/5 rounded-[2.5rem]" />
                    </div>
                ) : profile ? (
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
                                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[9px] font-black rounded uppercase tracking-widest">Verified Identity</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-500">
                                            <DisplayId id={profile.member?.display_id || ''} />
                                            <span className="text-slate-300">|</span>
                                            <div className="flex items-center gap-1.5 text-xs font-bold">
                                                <Calendar size={14} /> Joined {new Date(profile.member?.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button className="px-4 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors">Edit</button>
                                    <div className="relative group/new">
                                        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-600/20 active:scale-95 transition-all">
                                            New Transaction <ChevronDown size={14} />
                                        </button>
                                        <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#0f1115] border border-slate-200 dark:border-white/5 rounded-xl shadow-2xl opacity-0 translate-y-2 pointer-events-none group-hover/new:opacity-100 group-hover/new:translate-y-0 group-hover/new:pointer-events-auto transition-all z-20">
                                            {['Sales Order', 'Payment', 'Lead', 'Quote'].map(type => (
                                                <button key={type} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/5 first:rounded-t-xl last:rounded-b-xl transition-colors">
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
                                        className={`pb-4 text-xs font-bold uppercase tracking-widest flex items-center gap-2 whitespace-nowrap border-b-2 transition-all ${activeTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
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
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Identity Information</h3>
                                            <div className="grid grid-cols-2 gap-8">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Phone Number</p>
                                                    <p className="font-bold text-sm">{profile.member?.phone || '—'}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Email Address</p>
                                                    <p className="font-bold text-sm">{profile.member?.email || '—'}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">PAN Number</p>
                                                    <p className="font-mono font-bold text-sm tracking-tighter uppercase">{profile.member?.pan_number || '—'}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Aadhaar Number</p>
                                                    <p className="font-mono font-bold text-sm tracking-tighter">{profile.member?.aadhaar_number || '—'}</p>
                                                </div>
                                            </div>
                                        </section>

                                        <section className="bg-white dark:bg-white/[0.03] p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 space-y-6 shadow-sm">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Address Directory</h3>
                                            {profile.addresses.length > 0 ? (
                                                <div className="grid grid-cols-1 gap-4">
                                                    {profile.addresses.map((addr, i) => (
                                                        <div key={i} className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                                                            <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500"><MapPin size={18} /></div>
                                                            <div>
                                                                <p className="text-sm font-bold">{addr.line1}</p>
                                                                <p className="text-xs text-slate-500">{addr.taluka}, {addr.state} - {addr.pincode}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs italic text-slate-500">No address records found.</p>
                                            )}
                                        </section>
                                    </div>

                                    <div className="space-y-8">
                                        <section className="bg-indigo-600 p-8 rounded-[2.5rem] text-white space-y-6 shadow-xl shadow-indigo-600/20">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Status Dashboard</h3>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold opacity-80">Primary Role</span>
                                                    <span className="text-xs font-black uppercase tracking-widest">MEMBER</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold opacity-80">Verification</span>
                                                    <BadgeCheck size={16} className="text-emerald-400" />
                                                </div>
                                                <div className="pt-4 border-t border-white/10">
                                                    <p className="text-4xl font-black italic tracking-tighter">Gold<span className="text-indigo-300">.</span></p>
                                                    <p className="text-[9px] uppercase font-bold opacity-60">Reward Tier</p>
                                                </div>
                                            </div>
                                        </section>

                                        <section className="bg-slate-50 dark:bg-white/[0.03] p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 space-y-4 shadow-sm">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Quick Stats</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-4 bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 text-center">
                                                    <p className="text-xl font-black">{profile.bookings.length}</p>
                                                    <p className="text-[9px] uppercase font-bold text-slate-500">Bookings</p>
                                                </div>
                                                <div className="p-4 bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 text-center">
                                                    <p className="text-xl font-black text-indigo-500">{profile.payments.length}</p>
                                                    <p className="text-[9px] uppercase font-bold text-slate-500">Payments</p>
                                                </div>
                                            </div>
                                        </section>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'comments' && (
                                <div className="p-8 space-y-6 max-w-2xl">
                                    <div className="bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 p-4">
                                        <textarea
                                            placeholder="Write a comment..."
                                            className="w-full bg-transparent border-none outline-none text-sm resize-none h-24"
                                        />
                                        <div className="flex justify-end mt-2">
                                            <button className="px-4 py-1.5 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-lg">Add Comment</button>
                                        </div>
                                    </div>
                                    <div className="py-20 text-center opacity-40 italic text-xs">No comments yet.</div>
                                </div>
                            )}

                            {activeTab === 'transactions' && (
                                <div className="space-y-12">
                                    {/* Bookings Section */}
                                    <section className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                <LayoutGrid size={16} className="text-indigo-500" /> Sales Orders
                                            </h3>
                                            <button className="text-[10px] font-black uppercase text-indigo-600 flex items-center gap-1 hover:underline">
                                                <Plus size={12} /> New Order
                                            </button>
                                        </div>
                                        <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 overflow-hidden shadow-sm">
                                            <table className="w-full text-left">
                                                <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                                                    <tr>
                                                        <th className="px-6 py-3 text-[9px] font-black uppercase text-slate-400">Date</th>
                                                        <th className="px-6 py-3 text-[9px] font-black uppercase text-slate-400">Order Number</th>
                                                        <th className="px-6 py-3 text-[9px] font-black uppercase text-slate-400">Status</th>
                                                        <th className="px-6 py-3 text-right text-[9px] font-black uppercase text-slate-400">Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50 dark:divide-white/[0.02]">
                                                    {profile.bookings.map(b => (
                                                        <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                                                            <td className="px-6 py-4 text-xs font-bold">{new Date(b.created_at).toLocaleDateString()}</td>
                                                            <td className="px-6 py-4">
                                                                <Link href={`/app/${slug}/bookings/${b.id}`} className="text-xs font-black text-indigo-600 hover:underline">
                                                                    {b.display_id}
                                                                </Link>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-white/10 rounded text-[8px] font-black uppercase">{b.status}</span>
                                                            </td>
                                                            <td className="px-6 py-4 text-right text-xs font-bold">₹0.00</td>
                                                        </tr>
                                                    ))}
                                                    {profile.bookings.length === 0 && (
                                                        <tr><td colSpan={4} className="px-6 py-10 text-center text-xs italic text-slate-500">No active orders found.</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </section>

                                    {/* Payments Section */}
                                    <section className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                <Wallet size={16} className="text-emerald-500" /> Customer Payments
                                            </h3>
                                            <button className="text-[10px] font-black uppercase text-indigo-600 flex items-center gap-1 hover:underline">
                                                <Plus size={12} /> Record Payment
                                            </button>
                                        </div>
                                        <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 overflow-hidden shadow-sm">
                                            <table className="w-full text-left">
                                                <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                                                    <tr>
                                                        <th className="px-6 py-3 text-[9px] font-black uppercase text-slate-400">Date</th>
                                                        <th className="px-6 py-3 text-[9px] font-black uppercase text-slate-400">Receipt ID</th>
                                                        <th className="px-6 py-3 text-[9px] font-black uppercase text-slate-400">Method</th>
                                                        <th className="px-6 py-3 text-right text-[9px] font-black uppercase text-slate-400">Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50 dark:divide-white/[0.02]">
                                                    {profile.payments.map(p => (
                                                        <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                                            <td className="px-6 py-4 text-xs font-bold">{new Date(p.created_at).toLocaleDateString()}</td>
                                                            <td className="px-6 py-4 text-xs font-mono">{p.id.slice(0, 8).toUpperCase()}</td>
                                                            <td className="px-6 py-4 text-[10px] uppercase font-black tracking-widest">{p.method}</td>
                                                            <td className="px-6 py-4 text-right text-xs font-black italic">₹{p.amount.toLocaleString()}</td>
                                                        </tr>
                                                    ))}
                                                    {profile.payments.length === 0 && (
                                                        <tr><td colSpan={4} className="px-6 py-10 text-center text-xs italic text-slate-500">No payment history.</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </section>

                                    {/* Quotes/Leads Section */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <section className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                    <FileSearch size={16} className="text-amber-500" /> Quotes
                                                </h3>
                                                <button className="text-[10px] font-black uppercase text-indigo-600 flex items-center gap-1 hover:underline">
                                                    <Plus size={12} /> New Quote
                                                </button>
                                            </div>
                                            <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 overflow-hidden shadow-sm">
                                                <table className="w-full text-left">
                                                    <tbody className="divide-y divide-slate-50 dark:divide-white/[0.02]">
                                                        {profile.quotes.map(q => (
                                                            <tr key={q.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                                                <td className="px-4 py-3 text-[10px] font-bold">{new Date(q.created_at).toLocaleDateString()}</td>
                                                                <td className="px-4 py-3">
                                                                    <Link href={`/app/${slug}/quotes/${q.id}`} className="text-[10px] font-black text-indigo-600 uppercase">QT-{q.id.slice(0, 4)}</Link>
                                                                </td>
                                                                <td className="px-4 py-3 text-right text-[10px] font-black italic">₹{q.on_road_price?.toLocaleString()}</td>
                                                            </tr>
                                                        ))}
                                                        {profile.quotes.length === 0 && (
                                                            <tr><td className="px-4 py-8 text-center text-[10px] italic text-slate-400">No quotes generated.</td></tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </section>
                                        <section className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                    <Activity size={16} className="text-rose-500" /> Leads
                                                </h3>
                                                <button className="text-[10px] font-black uppercase text-indigo-600 flex items-center gap-1 hover:underline">
                                                    <Plus size={12} /> New Lead
                                                </button>
                                            </div>
                                            <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 overflow-hidden shadow-sm">
                                                <table className="w-full text-left">
                                                    <tbody className="divide-y divide-slate-50 dark:divide-white/[0.02]">
                                                        {profile.leads.map(l => (
                                                            <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                                                <td className="px-4 py-3 text-[10px] font-bold">{new Date(l.created_at).toLocaleDateString()}</td>
                                                                <td className="px-4 py-3">
                                                                    <Link href={`/app/${slug}/leads/${l.id}`} className="text-[10px] font-black text-indigo-600 uppercase">LD-{l.id.slice(0, 4)}</Link>
                                                                </td>
                                                                <td className="px-4 py-3 text-right">
                                                                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-white/10 rounded text-[8px] font-black uppercase">{l.status}</span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {profile.leads.length === 0 && (
                                                            <tr><td className="px-4 py-8 text-center text-[10px] italic text-slate-400">No leads captured.</td></tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </section>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="p-20 text-center space-y-6 flex flex-col items-center justify-center min-h-full">
                        <div className="w-24 h-24 rounded-[2.5rem] bg-rose-500/10 text-rose-500 flex items-center justify-center">
                            <Activity size={48} strokeWidth={3} />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black italic tracking-tighter uppercase">Identity Fault</h2>
                            <p className="text-xs text-slate-500 max-w-xs mx-auto">This member does not exist in the active directory or the sync link is broken.</p>
                        </div>
                        <button onClick={() => router.push(`/app/${slug}/members`)} className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] active:scale-95 transition-all">Emergency Evac to List</button>
                    </div>
                )}
            </main>

            {/* 2. Mini List Sub-Sidebar (Zoho Style) */}
            <aside className="w-[350px] bg-white dark:bg-[#0f1115] border-l border-slate-200 dark:border-white/5 flex flex-col shadow-sm">
                <div className="p-4 border-b border-slate-100 dark:border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                        <Link href={`/app/${slug}/members`} className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:underline">
                            <ChevronLeft size={14} /> Back to List
                        </Link>
                        <Plus size={16} className="text-slate-400 cursor-pointer hover:text-indigo-600" />
                    </div>
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input
                            value={search}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            placeholder="Search list..."
                            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg py-2 pl-9 pr-4 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-inner"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {loadingList ? (
                        <div className="p-4 space-y-4">
                            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-14 bg-slate-100 dark:bg-white/5 rounded-xl animate-pulse" />)}
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50 dark:divide-white/[0.02]">
                            {members.map(m => (
                                <Link
                                    key={m.id}
                                    href={`/app/${slug}/members/${m.id}`}
                                    className={`flex flex-col p-4 transition-all hover:bg-slate-50 dark:hover:bg-white/[0.02] border-r-4 ${m.id === memberId ? 'border-indigo-600 bg-slate-50 dark:bg-white/[0.04]' : 'border-transparent'}`}
                                >
                                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{m.full_name}</span>
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-[10px] text-slate-500 font-mono tracking-tight">{m.display_id}</span>
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-black tracking-widest ${m.member_status === 'ACTIVE' ? 'text-emerald-500 bg-emerald-500/10' : 'text-slate-400 bg-slate-400/10'}`}>
                                            {m.member_status || 'ACTIVE'}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </aside>
        </div>
    );
}
