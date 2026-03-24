'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import {
    Activity,
    UserCheck,
    Users,
    Flame,
    Smartphone,
    Monitor,
    Clock,
    Eye,
    TrendingUp,
    ChevronLeft,
    ChevronRight,
    Search,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    getAllPlatformMembers,
    getPlatformPresenceSummary,
    getPresenceForPage,
    getLiveMembersWithDetails,
    type PresenceRow,
    type LiveMemberRow,
} from '@/actions/aums-presence';
import { formatDisplayId } from '@/utils/displayId';
import { createClient } from '@/lib/supabase/client';

type MemberRow = {
    id: string;
    display_id: string | null;
    full_name: string | null;
    primary_phone: string | null;
    created_at: string | null;
};

type PresenceMapRow = PresenceRow;
type Tab = 'live' | 'hot' | 'recent' | 'all';

const PAGE_SIZE = 50;
const NON_PRODUCT_PATHS = new Set([
    'catalog',
    'compare',
    'search',
    'ocircle',
    'login',
    'booking',
    'cart',
    'checkout',
    'wishlist',
    'payment',
]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parsePDP(url: string | null): { make: string; model: string; variant?: string } | null {
    if (!url) return null;
    const m = url.match(/^\/store\/([^/?#]+)\/([^/?#]+)(?:\/([^/?#]+))?/);
    if (!m) return null;
    const make = m[1].toLowerCase();
    if (NON_PRODUCT_PATHS.has(make)) return null;
    const capitalize = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return { make: capitalize(m[1]), model: capitalize(m[2]), variant: m[3] ? capitalize(m[3]) : undefined };
}

function pageLabel(url: string | null): string {
    if (!url) return '—';
    if (url === '/' || url === '/store') return 'Home';
    if (url.includes('/catalog')) return 'Catalog';
    if (url.includes('/compare')) return 'Compare';
    if (url.includes('/ocircle')) return 'O-Circle';
    if (url.includes('/booking')) return 'Booking';
    const pdp = parsePDP(url);
    if (pdp) return `${pdp.make} ${pdp.model}${pdp.variant ? ' · ' + pdp.variant : ''}`;
    return url.split('/').filter(Boolean).join(' › ');
}

function timeAgo(iso: string | null): string {
    if (!iso) return '—';
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'Just now';
    if (min < 60) return `${min}m ago`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h}h ago`;
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function fmtTime(ms: number): string {
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
}

function isLive(m: LiveMemberRow): boolean {
    return Date.now() - new Date(m.updated_at).getTime() < 10 * 60 * 1000;
}

function isHot(m: LiveMemberRow): boolean {
    const recent = Date.now() - new Date(m.updated_at).getTime() < 30 * 60 * 1000;
    return recent && !!parsePDP(m.current_url);
}

// ─── Live since ticker ──────────────────────────────────────────────────────

function LiveSince({ iso }: { iso: string | null }) {
    const [elapsed, setElapsed] = useState('');
    useEffect(() => {
        if (!iso) return;
        const update = () => {
            const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
            if (s < 60) setElapsed(`${s}s`);
            else if (s < 3600) setElapsed(`${Math.floor(s / 60)}m ${s % 60}s`);
            else setElapsed(`${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`);
        };
        update();
        const t = setInterval(update, 1000);
        return () => clearInterval(t);
    }, [iso]);
    if (!iso) return null;
    return <span className="font-black tabular-nums">{elapsed}</span>;
}

// ─── Member Card ─────────────────────────────────────────────────────────────

function MemberCard({ m, highlight }: { m: LiveMemberRow; highlight: 'live' | 'hot' | 'recent' }) {
    const pdp = parsePDP(m.current_url);
    const isAnon = m.is_anon;
    const guestCode = isAnon ? m.member_id.slice(-6).toUpperCase() : null;
    const initial = isAnon ? '👤' : (m.full_name || '?')[0].toUpperCase();

    const config = {
        live: {
            badge: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
            label: isAnon ? '● GUEST' : '● LIVE',
            avatarBg: isAnon ? 'bg-slate-400' : 'bg-emerald-500',
            border: 'border-l-4 border-l-emerald-400 border border-slate-200',
            bg: 'bg-white',
        },
        hot: {
            badge: 'bg-orange-100 text-orange-700 border border-orange-200',
            label: isAnon ? '🔥 GUEST' : '🔥 HOT',
            avatarBg: isAnon ? 'bg-slate-400' : 'bg-orange-500',
            border: 'border-l-4 border-l-orange-400 border border-slate-200',
            bg: 'bg-white',
        },
        recent: {
            badge: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
            label: isAnon ? '🕐 GUEST' : '🕐 RECENT',
            avatarBg: isAnon ? 'bg-slate-400' : 'bg-indigo-500',
            border: 'border-l-4 border-l-indigo-400 border border-slate-200',
            bg: 'bg-white',
        },
    }[highlight];

    return (
        <div
            className={`relative rounded-xl ${config.border} ${config.bg} p-4 space-y-3 overflow-hidden transition-all hover:shadow-md`}
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                    <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white ${config.avatarBg}`}
                    >
                        {initial}
                    </div>
                    <div>
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            {isAnon ? `Guest · ${guestCode}` : formatDisplayId(m.display_id || m.member_id)}
                        </div>
                        <div className="text-sm font-black text-slate-900 uppercase tracking-tight leading-tight">
                            {isAnon ? `Visitor ${guestCode}` : m.full_name || 'Unnamed'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                            {isAnon ? 'Anonymous · Not logged in' : m.primary_phone || '—'}
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${config.badge}`}>
                        {config.label}
                    </span>
                    {m.device?.toLowerCase().includes('mobile') ? (
                        <Smartphone className="w-3 h-3 text-slate-500" />
                    ) : (
                        <Monitor className="w-3 h-3 text-slate-500" />
                    )}
                </div>
            </div>

            {/* Product interest / current page */}
            {pdp ? (
                <div className="rounded-lg bg-orange-50 border border-orange-100 px-3 py-2">
                    <div className="text-[9px] font-black uppercase tracking-widest text-orange-500 mb-0.5">
                        🎯 Interested In
                    </div>
                    <div className="text-xs font-black text-slate-900">
                        {pdp.make} {pdp.model}
                        {pdp.variant ? ` — ${pdp.variant}` : ''}
                    </div>
                </div>
            ) : m.current_url ? (
                <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                        Current Page
                    </div>
                    <div className="text-[10px] font-bold text-slate-600">{pageLabel(m.current_url)}</div>
                </div>
            ) : null}

            {/* Stats row */}
            <div className="flex items-center gap-3 text-[9px] text-slate-400 font-bold uppercase flex-wrap">
                {highlight === 'live' && !isAnon && (
                    <span className="flex items-center gap-1 text-emerald-600">
                        <Clock className="w-3 h-3" /> <LiveSince iso={m.session_start_at} />
                    </span>
                )}
                <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span className="text-slate-500">{timeAgo(m.updated_at)}</span>
                </span>
                {m.total_time_ms > 0 && (
                    <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        <span className="text-slate-500">{fmtTime(m.total_time_ms)}</span>
                    </span>
                )}
            </div>
        </div>
    );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function Empty({ icon, message }: { icon: string; message: string }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-20 text-center">
            <div className="text-5xl mb-4">{icon}</div>
            <div className="text-xs font-black text-slate-400 uppercase tracking-widest">{message}</div>
        </div>
    );
}

// ─── All-members table ────────────────────────────────────────────────────────

function AllTableRow({
    id,
    displayId,
    name,
    phone,
    isLiveVal,
    isRecent,
    joined,
    currentUrl,
}: {
    id: string;
    displayId: string | null;
    name: string | null;
    phone: string | null;
    isLiveVal: boolean;
    isRecent: boolean;
    joined: string | null;
    currentUrl: string | null;
}) {
    const pdp = parsePDP(currentUrl);
    return (
        <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
            <td className="px-5 py-3 w-8">
                <span
                    className={`inline-block w-2.5 h-2.5 rounded-full ${isLiveVal ? 'bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.5)]' : isRecent ? 'bg-amber-400' : 'bg-slate-200'}`}
                />
            </td>
            <td className="px-4 py-3">
                <div className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">
                    {formatDisplayId(displayId || id)}
                </div>
                <div className="text-xs font-black text-slate-900 uppercase tracking-tight mt-0.5">
                    {name || 'Unnamed'}
                </div>
            </td>
            <td className="px-4 py-3 text-xs font-bold text-slate-600">{phone || '—'}</td>
            <td className="px-4 py-3">
                {pdp ? (
                    <span className="text-[10px] font-black text-orange-600">
                        🎯 {pdp.make} {pdp.model}
                        {pdp.variant ? ` · ${pdp.variant}` : ''}
                    </span>
                ) : currentUrl ? (
                    <span className="text-[10px] font-bold text-slate-500">{pageLabel(currentUrl)}</span>
                ) : (
                    <span className="text-slate-300 text-xs">—</span>
                )}
            </td>
            <td className="px-4 py-3 text-[10px] font-bold text-slate-400">
                {joined ? new Date(joined).toLocaleDateString('en-IN') : '—'}
            </td>
        </tr>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AumsMembersPage() {
    const { device: _device } = useBreakpoint();
    const [members, setMembers] = useState<MemberRow[]>([]);
    const [page, setPage] = useState(1);
    const [totalMembers, setTotalMembers] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [tab, setTab] = useState<Tab>('live');

    const [activeMembers, setActiveMembers] = useState<LiveMemberRow[]>([]);
    const [presence, setPresence] = useState<Map<string, PresenceMapRow>>(new Map());
    const [liveNowCount, setLiveNowCount] = useState(0);
    const [active1hCount, setActive1hCount] = useState(0);

    const liveList = useMemo(() => activeMembers.filter(isLive), [activeMembers]);
    const hotList = useMemo(() => activeMembers.filter(m => isHot(m) && !isLive(m)), [activeMembers]);
    const recentList = useMemo(() => activeMembers.filter(m => !isLive(m) && !isHot(m)), [activeMembers]);
    const activeMemberIds = useMemo(() => new Set(activeMembers.map(m => m.member_id)), [activeMembers]);

    // Debounced search
    useEffect(() => {
        const t = window.setTimeout(() => {
            setPage(1);
            setSearchQuery(searchInput.trim());
        }, 350);
        return () => window.clearTimeout(t);
    }, [searchInput]);

    // Load paginated all-members list
    useEffect(() => {
        if (tab !== 'all') return;
        let cancelled = false;
        setIsLoading(true);
        getAllPlatformMembers(searchQuery, page, PAGE_SIZE)
            .then(r => {
                if (cancelled) return;
                setMembers((r?.data || []) as MemberRow[]);
                setTotalMembers(r?.metadata?.total || 0);
                setTotalPages(r?.metadata?.totalPages || 1);
            })
            .catch(err => {
                if (cancelled) return;
                toast.error(`Failed: ${err?.message}`);
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [page, searchQuery, tab]);

    // Refresh active members
    const refreshActive = useCallback(async () => {
        try {
            const [summary, live] = await Promise.all([getPlatformPresenceSummary(), getLiveMembersWithDetails()]);
            setLiveNowCount(summary.liveNowCount);
            setActive1hCount(summary.active1hCount);
            setActiveMembers(live);
        } catch {
            /* silent */
        }
    }, []);

    useEffect(() => {
        refreshActive();
        const t = window.setInterval(refreshActive, 30_000);
        return () => window.clearInterval(t);
    }, [refreshActive]);

    // Presence for All tab
    useEffect(() => {
        if (tab !== 'all' || !members.length) return;
        getPresenceForPage(members.map(m => m.id))
            .then(rows => {
                setPresence(prev => {
                    const next = new Map(prev);
                    rows.forEach(row => next.set(row.member_id, row));
                    return next;
                });
            })
            .catch(() => {});
    }, [members, tab]);

    // Supabase Realtime
    useEffect(() => {
        const supabase = createClient();
        const ch = supabase
            .channel('aums-presence-v2')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'id_member_presence' }, payload => {
                const row = (payload.new || payload.old) as PresenceMapRow | undefined;
                if (!row?.member_id) return;
                setPresence(prev => {
                    const next = new Map(prev);
                    if (payload.eventType === 'DELETE' || (payload.new as any)?.event_type === 'SESSION_END') {
                        next.delete(row.member_id);
                    } else {
                        next.set(row.member_id, row as PresenceMapRow);
                    }
                    return next;
                });
                refreshActive();
            })
            .subscribe();
        return () => {
            supabase.removeChannel(ch);
        };
    }, [refreshActive]);

    const liveNowIds = useMemo(() => {
        const now = Date.now();
        const ids = new Set<string>();
        presence.forEach((row, id) => {
            if (!row.event_type || row.event_type === 'SESSION_END') return;
            if (now - new Date(row.updated_at).getTime() < 10 * 60 * 1000) ids.add(id);
        });
        return ids;
    }, [presence]);

    const recentIds = useMemo(() => {
        const now = Date.now();
        const ids = new Set<string>();
        presence.forEach((row, id) => {
            if (now - new Date(row.updated_at).getTime() < 60 * 60 * 1000) ids.add(id);
        });
        return ids;
    }, [presence]);

    const allPageVisible = useMemo(() => members.filter(m => !activeMemberIds.has(m.id)), [members, activeMemberIds]);

    const tabs: { id: Tab; emoji: string; label: string; count: number; color: string; activeClass: string }[] = [
        {
            id: 'live',
            emoji: '🟢',
            label: 'Live Now',
            count: liveList.length,
            color: 'text-emerald-400',
            activeClass: 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]',
        },
        {
            id: 'hot',
            emoji: '🔥',
            label: 'Hot (PDP)',
            count: hotList.length + liveList.filter(m => parsePDP(m.current_url)).length,
            color: 'text-orange-400',
            activeClass: 'bg-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.4)]',
        },
        {
            id: 'recent',
            emoji: '🕐',
            label: 'Recently Active',
            count: recentList.length,
            color: 'text-indigo-400',
            activeClass: 'bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]',
        },
        {
            id: 'all',
            emoji: '👥',
            label: 'All Members',
            count: totalMembers,
            color: 'text-slate-400',
            activeClass: 'bg-white text-slate-900',
        },
    ];

    return (
        <div className="min-h-screen bg-[#f5f7fa] text-slate-900">
            {/* ── Top bar ── */}
            <div className="border-b border-slate-200 bg-white px-8 py-5 flex items-center justify-between">
                <div>
                    <div className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 flex items-center gap-2 mb-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                        Platform Wide · CCTV
                    </div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900">
                        AUMS Members<span className="text-emerald-500">.</span>
                    </h1>
                </div>
                {/* Search */}
                <div className="relative w-72">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        value={searchInput}
                        onChange={e => setSearchInput(e.target.value)}
                        placeholder="Search by name, phone, or member ID..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                </div>
                {/* Realtime badge */}
                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-emerald-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" /> Realtime
                </div>
            </div>

            <div className="px-8 py-6 space-y-6">
                {/* ── Hero Stat Cards — full width ── */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        {
                            label: 'Total Members',
                            value: totalMembers.toLocaleString(),
                            icon: Users,
                            color: '#6366f1',
                            bg: 'bg-indigo-50',
                            border: 'border-indigo-100',
                            iconBg: 'bg-indigo-100',
                            sub: 'Platform-wide registry',
                        },
                        {
                            label: 'Live Now',
                            value: liveNowCount,
                            icon: Activity,
                            color: '#10b981',
                            bg: 'bg-emerald-50',
                            border: 'border-emerald-100',
                            iconBg: 'bg-emerald-100',
                            sub: 'Active in last 10 min',
                            pulse: true,
                        },
                        {
                            label: 'Active (1h)',
                            value: active1hCount,
                            icon: UserCheck,
                            color: '#f59e0b',
                            bg: 'bg-amber-50',
                            border: 'border-amber-100',
                            iconBg: 'bg-amber-100',
                            sub: 'Seen in last 60 min',
                        },
                    ].map(stat => {
                        const Icon = stat.icon;
                        return (
                            <div
                                key={stat.label}
                                className={`relative rounded-2xl border ${stat.border} ${stat.bg} p-6 overflow-hidden`}
                            >
                                <div
                                    className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
                                    style={{ background: stat.color }}
                                />
                                <div className="flex items-start justify-between mb-4">
                                    <div
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.iconBg}`}
                                    >
                                        <Icon className="w-5 h-5" style={{ color: stat.color }} />
                                    </div>
                                    {stat.pulse && (
                                        <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-600">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />{' '}
                                            Live
                                        </span>
                                    )}
                                </div>
                                <div className="text-4xl font-black tracking-tight" style={{ color: stat.color }}>
                                    {stat.value}
                                </div>
                                <div className="text-xs font-black text-slate-700 uppercase tracking-widest mt-1">
                                    {stat.label}
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5">{stat.sub}</div>
                            </div>
                        );
                    })}
                </div>

                {/* ── Full-width sortable tabs ── */}
                <div className="grid grid-cols-4 gap-2">
                    {tabs.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`relative flex items-center justify-between px-5 py-4 rounded-2xl border transition-all font-black text-sm ${
                                tab === t.id
                                    ? `${t.activeClass} border-transparent`
                                    : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                            }`}
                        >
                            <span className="flex items-center gap-2">
                                <span className="text-base">{t.emoji}</span>
                                <span className="text-xs font-black uppercase tracking-wider">{t.label}</span>
                            </span>
                            {t.count > 0 && (
                                <span
                                    className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                        tab === t.id ? 'bg-black/15 text-white' : 'bg-slate-100 text-slate-500'
                                    }`}
                                >
                                    {t.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ── Tab content ── */}

                {/* LIVE */}
                {tab === 'live' &&
                    (liveList.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {liveList.map(m => (
                                <MemberCard key={m.member_id} m={m} highlight="live" />
                            ))}
                        </div>
                    ) : (
                        <Empty icon="🟢" message="No members live right now." />
                    ))}

                {/* HOT */}
                {tab === 'hot' &&
                    (() => {
                        const livePDP = liveList.filter(m => parsePDP(m.current_url));
                        return (
                            <div className="space-y-5">
                                {livePDP.length > 0 && (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                                                Live on PDP
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                            {livePDP.map(m => (
                                                <MemberCard key={m.member_id} m={m} highlight="live" />
                                            ))}
                                        </div>
                                    </>
                                )}
                                {hotList.length > 0 ? (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <Flame className="w-3 h-3 text-orange-400" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">
                                                Recently on PDP (30 min)
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                            {hotList.map(m => (
                                                <MemberCard key={m.member_id} m={m} highlight="hot" />
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    livePDP.length === 0 && <Empty icon="🔥" message="No PDP visitors right now." />
                                )}
                            </div>
                        );
                    })()}

                {/* RECENT */}
                {tab === 'recent' &&
                    (recentList.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {recentList.map(m => (
                                <MemberCard key={m.member_id} m={m} highlight="recent" />
                            ))}
                        </div>
                    ) : (
                        <Empty icon="🕐" message="No recently active members (last 60 min)." />
                    ))}

                {/* ALL MEMBERS */}
                {tab === 'all' && (
                    <div className="space-y-4">
                        {/* Pinned active */}
                        {activeMembers.length > 0 && (
                            <div className="rounded-2xl border border-emerald-200 bg-white overflow-hidden shadow-sm">
                                <div className="px-5 py-3 border-b border-emerald-100 bg-emerald-50 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
                                        Active — {activeMembers.length} online
                                    </span>
                                </div>
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50">
                                            <th className="px-5 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400 w-8" />
                                            <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                Member
                                            </th>
                                            <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                Phone
                                            </th>
                                            <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                Page / Interest
                                            </th>
                                            <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                Joined
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activeMembers.map(m => (
                                            <AllTableRow
                                                key={m.member_id}
                                                id={m.member_id}
                                                displayId={m.display_id}
                                                name={m.full_name}
                                                phone={m.primary_phone}
                                                isLiveVal={isLive(m)}
                                                isRecent
                                                joined={null}
                                                currentUrl={m.current_url}
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* All others */}
                        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                            {activeMembers.length > 0 && (
                                <div className="px-5 py-2.5 border-b border-slate-100 bg-slate-50">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                        All Other Members
                                    </span>
                                </div>
                            )}
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50">
                                        <th className="px-5 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400 w-8" />
                                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                            Member
                                        </th>
                                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                            Phone
                                        </th>
                                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                            Page / Interest
                                        </th>
                                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                            Joined
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allPageVisible.map(m => {
                                        const pres = presence.get(m.id);
                                        return (
                                            <AllTableRow
                                                key={m.id}
                                                id={m.id}
                                                displayId={m.display_id}
                                                name={m.full_name}
                                                phone={m.primary_phone}
                                                isLiveVal={liveNowIds.has(m.id)}
                                                isRecent={recentIds.has(m.id)}
                                                joined={m.created_at}
                                                currentUrl={pres?.current_url ?? null}
                                            />
                                        );
                                    })}
                                    {!isLoading && allPageVisible.length === 0 && activeMembers.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="px-5 py-16 text-center text-xs font-black text-slate-400 uppercase tracking-wider"
                                            >
                                                No members found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between gap-3">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Page {page} / {Math.max(1, totalPages)} · {totalMembers.toLocaleString()} members
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page <= 1 || isLoading}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-all"
                                >
                                    <ChevronLeft className="w-3 h-3" /> Prev
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page >= totalPages || isLoading}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-all"
                                >
                                    Next <ChevronRight className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
