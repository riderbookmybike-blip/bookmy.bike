'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import ModuleLanding from '@/components/modules/shared/ModuleLanding';
import StatsHeader from '@/components/modules/shared/StatsHeader';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { Activity, UserCheck, Users, Flame, Smartphone, Monitor, Clock, Eye, TrendingUp } from 'lucide-react';
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

// ─── Sub-components ────────────────────────────────────────────────────────────

function DeviceIcon({ device }: { device: string | null }) {
    return device?.toLowerCase().includes('mobile') ? (
        <Smartphone className="w-3 h-3 text-slate-400" />
    ) : (
        <Monitor className="w-3 h-3 text-slate-400" />
    );
}

function ProductBadge({ url }: { url: string | null }) {
    const pdp = parsePDP(url);
    if (!pdp) return null;
    return (
        <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
            <span className="px-2 py-0.5 bg-orange-50 border border-orange-200 text-orange-700 text-[tenth] font-black uppercase tracking-wide rounded-full text-[9px]">
                {pdp.make}
            </span>
            <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 font-black uppercase tracking-wide rounded-full text-[9px]">
                {pdp.model}
            </span>
            {pdp.variant && (
                <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 font-black uppercase tracking-wide rounded-full text-[9px]">
                    {pdp.variant}
                </span>
            )}
        </div>
    );
}

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
    return <span className="text-emerald-600 font-black text-[10px] tabular-nums">{elapsed}</span>;
}

function MemberCard({ m, highlight }: { m: LiveMemberRow; highlight: 'live' | 'hot' | 'recent' }) {
    const pdp = parsePDP(m.current_url);
    const colors = {
        live: {
            bg: 'bg-emerald-50',
            border: 'border-emerald-200',
            dot: 'bg-emerald-500 animate-pulse',
            badge: 'bg-emerald-100 text-emerald-700',
        },
        hot: {
            bg: 'bg-orange-50',
            border: 'border-orange-200',
            dot: 'bg-orange-500',
            badge: 'bg-orange-100 text-orange-700',
        },
        recent: {
            bg: 'bg-blue-50/50',
            border: 'border-blue-100',
            dot: 'bg-blue-400',
            badge: 'bg-blue-50 text-blue-600',
        },
    }[highlight];

    const initial = (m.full_name || '?')[0].toUpperCase();

    return (
        <div className={`rounded-xl border ${colors.border} ${colors.bg} p-4 space-y-3 hover:shadow-md transition-all`}>
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                    <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm text-white ${highlight === 'live' ? 'bg-emerald-500' : highlight === 'hot' ? 'bg-orange-500' : 'bg-blue-400'}`}
                    >
                        {initial}
                    </div>
                    <div>
                        <div className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">
                            {formatDisplayId(m.display_id || m.member_id)}
                        </div>
                        <div className="text-sm font-black text-slate-900 uppercase tracking-tight leading-tight">
                            {m.full_name || 'Unnamed'}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium mt-0.5">{m.primary_phone || '—'}</div>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide ${colors.badge}`}
                    >
                        <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                        {highlight === 'live' ? 'Live' : highlight === 'hot' ? '🔥 Hot' : 'Recent'}
                    </span>
                    <DeviceIcon device={m.device} />
                </div>
            </div>

            {/* Product Interest */}
            {pdp ? (
                <div className="rounded-lg bg-white/80 border border-orange-100 px-3 py-2">
                    <div className="text-[9px] font-black uppercase tracking-widest text-orange-500 mb-1">
                        🎯 Interested In
                    </div>
                    <div className="text-xs font-black text-slate-900">
                        {pdp.make} {pdp.model}
                        {pdp.variant ? ` — ${pdp.variant}` : ''}
                    </div>
                    <div className="text-[9px] font-mono text-slate-400 mt-0.5 truncate">{m.current_url}</div>
                </div>
            ) : m.current_url ? (
                <div className="rounded-lg bg-white/60 border border-slate-100 px-3 py-2">
                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                        Current Page
                    </div>
                    <div className="text-[10px] font-bold text-slate-600">{pageLabel(m.current_url)}</div>
                </div>
            ) : null}

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-2 text-[9px]">
                {highlight === 'live' && (
                    <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-500" />
                        <span className="text-slate-500 font-bold uppercase">Live since</span>
                        <LiveSince iso={m.session_start_at} />
                    </div>
                )}
                <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3 text-slate-400" />
                    <span className="text-slate-500 font-bold uppercase">Last seen</span>
                    <span className="text-slate-700 font-black">{timeAgo(m.updated_at)}</span>
                </div>
                {m.first_visit_at && (
                    <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-slate-400" />
                        <span className="text-slate-500 font-bold uppercase">1st visit</span>
                        <span className="text-slate-700 font-black">{timeAgo(m.first_visit_at)}</span>
                    </div>
                )}
                {m.total_time_ms > 0 && (
                    <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span className="text-slate-500 font-bold uppercase">Total time</span>
                        <span className="text-slate-700 font-black">{fmtTime(m.total_time_ms)}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AumsMembersPage() {
    const { device } = useBreakpoint();
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
                toast.error(`Failed to load members: ${err?.message || 'Unknown error'}`);
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [page, searchQuery, tab]);

    // Refresh active members + stats
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

    // Bootstrap presence for current All-Members page
    useEffect(() => {
        if (tab !== 'all' || !members.length) return;
        const ids = members.map(m => m.id);
        getPresenceForPage(ids)
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

    const stats = [
        { label: 'Total Members', value: totalMembers, icon: Users, color: 'indigo' as const },
        { label: 'Live Now', value: liveNowCount, icon: Activity, color: 'emerald' as const },
        { label: 'Active (1h)', value: active1hCount, icon: UserCheck, color: 'amber' as const },
    ];

    const tabs: { id: Tab; label: string; count: number }[] = [
        { id: 'live', label: '🟢 Live Now', count: liveList.length },
        { id: 'hot', label: '🔥 Hot (PDP)', count: hotList.length },
        { id: 'recent', label: '🕐 Recently Active', count: recentList.length },
        { id: 'all', label: 'All Members', count: totalMembers },
    ];

    return (
        <div className="h-full bg-[#f5f7fa]">
            <ModuleLanding
                title="AUMS Members"
                subtitle="PLATFORM_WIDE · CCTV"
                searchPlaceholder="Search by name, phone, or member ID..."
                onSearch={setSearchInput}
                statsContent={<StatsHeader stats={stats} device={device} />}
                device={device}
                hideActions
            >
                <div className="space-y-5">
                    {/* Tab bar */}
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                            {tabs.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setTab(t.id)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                        tab === t.id
                                            ? 'bg-indigo-600 text-white shadow-sm'
                                            : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    {t.label}
                                    {t.count > 0 && (
                                        <span
                                            className={`px-1.5 py-0.5 rounded-full text-[8px] font-black ${tab === t.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}
                                        >
                                            {t.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                            Realtime
                        </div>
                    </div>

                    {/* ── LIVE tab ── */}
                    {tab === 'live' &&
                        (liveList.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {liveList.map(m => (
                                    <MemberCard key={m.member_id} m={m} highlight="live" />
                                ))}
                            </div>
                        ) : (
                            <Empty icon="🟢" message="No members live right now." />
                        ))}

                    {/* ── HOT tab ── */}
                    {tab === 'hot' && (
                        <>
                            {/* Also show live PDP visitors at top */}
                            {liveList.filter(m => parsePDP(m.current_url)).length > 0 && (
                                <>
                                    <SectionHeader
                                        icon={<span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                                        label="Live on PDP"
                                    />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {liveList
                                            .filter(m => parsePDP(m.current_url))
                                            .map(m => (
                                                <MemberCard key={m.member_id} m={m} highlight="live" />
                                            ))}
                                    </div>
                                </>
                            )}
                            {hotList.length > 0 ? (
                                <>
                                    <SectionHeader
                                        icon={<Flame className="w-3 h-3 text-orange-500" />}
                                        label="Recently on PDP (last 30 min)"
                                    />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {hotList.map(m => (
                                            <MemberCard key={m.member_id} m={m} highlight="hot" />
                                        ))}
                                    </div>
                                </>
                            ) : (
                                liveList.filter(m => parsePDP(m.current_url)).length === 0 && (
                                    <Empty icon="🔥" message="No PDP visitors right now." />
                                )
                            )}
                        </>
                    )}

                    {/* ── RECENT tab ── */}
                    {tab === 'recent' &&
                        (recentList.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {recentList.map(m => (
                                    <MemberCard key={m.member_id} m={m} highlight="recent" />
                                ))}
                            </div>
                        ) : (
                            <Empty icon="🕐" message="No recently active members (last 60 min)." />
                        ))}

                    {/* ── ALL MEMBERS tab ── */}
                    {tab === 'all' && (
                        <>
                            {/* Pinned active members */}
                            {activeMembers.length > 0 && (
                                <div className="bg-white border border-emerald-200 rounded-xl overflow-hidden shadow-sm">
                                    <div className="px-5 py-2.5 bg-gradient-to-r from-emerald-50 to-transparent border-b border-emerald-100 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
                                            Active — {activeMembers.length} online
                                        </span>
                                    </div>
                                    <table className="w-full text-left">
                                        <thead>
                                            <AllTableHeader />
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

                            {/* Paginated all-members */}
                            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                                {activeMembers.length > 0 && (
                                    <div className="px-5 py-2 bg-slate-50 border-b border-slate-100">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                            All Other Members
                                        </span>
                                    </div>
                                )}
                                <table className="w-full text-left">
                                    <thead>
                                        <AllTableHeader />
                                    </thead>
                                    <tbody>
                                        {allPageVisible.map(m => {
                                            const lv = liveNowIds.has(m.id);
                                            const rc = recentIds.has(m.id);
                                            const pres = presence.get(m.id);
                                            return (
                                                <AllTableRow
                                                    key={m.id}
                                                    id={m.id}
                                                    displayId={m.display_id}
                                                    name={m.full_name}
                                                    phone={m.primary_phone}
                                                    isLiveVal={lv}
                                                    isRecent={rc}
                                                    joined={m.created_at}
                                                    currentUrl={pres?.current_url ?? null}
                                                />
                                            );
                                        })}
                                        {!isLoading && allPageVisible.length === 0 && activeMembers.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={5}
                                                    className="px-5 py-10 text-center text-xs font-bold text-slate-400 uppercase tracking-wider"
                                                >
                                                    No members found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    Page {page} / {Math.max(1, totalPages)} · {totalMembers.toLocaleString()} members
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page <= 1 || isLoading}
                                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest text-slate-600 disabled:opacity-40"
                                    >
                                        Prev
                                    </button>
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page >= totalPages || isLoading}
                                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest text-slate-600 disabled:opacity-40"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </ModuleLanding>
        </div>
    );
}

// ─── Shared sub-components ─────────────────────────────────────────────────────

function Empty({ icon, message }: { icon: string; message: string }) {
    return (
        <div className="bg-white border border-slate-200 rounded-xl px-5 py-16 text-center">
            <div className="text-4xl mb-3">{icon}</div>
            <div className="text-xs font-black text-slate-400 uppercase tracking-widest">{message}</div>
        </div>
    );
}

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <div className="flex items-center gap-2">
            {icon}
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</span>
        </div>
    );
}

function AllTableHeader() {
    return (
        <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 w-10" />
            <th className="px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Member</th>
            <th className="px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Phone</th>
            <th className="px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Current Page / Interest
            </th>
            <th className="px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Joined</th>
        </tr>
    );
}

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
        <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
            <td className="px-5 py-3">
                <span
                    className={`inline-block w-2.5 h-2.5 rounded-full ${isLiveVal ? 'bg-emerald-500 animate-pulse' : isRecent ? 'bg-amber-400' : 'bg-slate-200'}`}
                />
            </td>
            <td className="px-5 py-3">
                <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                    {formatDisplayId(displayId || id)}
                </div>
                <div className="text-xs font-black text-slate-900 uppercase tracking-tight mt-0.5">
                    {name || 'Unnamed'}
                </div>
            </td>
            <td className="px-5 py-3 text-xs font-bold text-slate-600">{phone || '—'}</td>
            <td className="px-5 py-3">
                {pdp ? (
                    <div>
                        <div className="text-[10px] font-black text-orange-600 uppercase tracking-wide">
                            🎯 {pdp.make} {pdp.model}
                            {pdp.variant ? ` · ${pdp.variant}` : ''}
                        </div>
                        <div className="text-[9px] text-slate-400 font-mono mt-0.5">{currentUrl}</div>
                    </div>
                ) : currentUrl ? (
                    <span className="text-[10px] font-bold text-slate-500">{pageLabel(currentUrl)}</span>
                ) : (
                    <span className="text-slate-300 text-xs">—</span>
                )}
            </td>
            <td className="px-5 py-3 text-xs font-bold text-slate-500">
                {joined ? new Date(joined).toLocaleDateString('en-IN') : '—'}
            </td>
        </tr>
    );
}
