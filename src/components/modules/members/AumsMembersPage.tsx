'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import {
    Activity,
    UserCheck,
    Users,
    Smartphone,
    Monitor,
    Clock,
    ChevronLeft,
    ChevronRight,
    Search,
    ChevronDown,
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

type MemberRow = {
    id: string;
    display_id: string | null;
    full_name: string | null;
    primary_phone: string | null;
    created_at: string | null;
    district: string | null;
    taluka: string | null;
    state: string | null;
    referral_code: string | null;
    total_sessions: number;
    total_time_ms: number;
    last_active_at: string | null;
    pdp_interests: string[];
};

type PresenceMapRow = PresenceRow;
type Filter = 'all' | 'hot' | 'warm' | 'cold';
type SortKey = 'name' | 'joined' | 'last_active' | 'visits' | 'time';

// Common Indian states for filter dropdown
const INDIAN_STATES = [
    'Maharashtra',
    'Delhi',
    'Karnataka',
    'Tamil Nadu',
    'Gujarat',
    'Rajasthan',
    'Uttar Pradesh',
    'West Bengal',
    'Telangana',
    'Kerala',
    'Madhya Pradesh',
    'Punjab',
    'Haryana',
    'Bihar',
    'Andhra Pradesh',
];

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

// ── Known Indian city → correct state (display-layer guard) ──────────────────
const CITY_STATE_CANON: Record<string, string> = {
    mumbai: 'Maharashtra',
    thane: 'Maharashtra',
    pune: 'Maharashtra',
    nashik: 'Maharashtra',
    nagpur: 'Maharashtra',
    aurangabad: 'Maharashtra',
    kolhapur: 'Maharashtra',
    solapur: 'Maharashtra',
    navi_mumbai: 'Maharashtra',
    delhi: 'Delhi',
    'new delhi': 'Delhi',
    bangalore: 'Karnataka',
    bengaluru: 'Karnataka',
    chennai: 'Tamil Nadu',
    coimbatore: 'Tamil Nadu',
    madurai: 'Tamil Nadu',
    hyderabad: 'Telangana',
    kolkata: 'West Bengal',
    ahmedabad: 'Gujarat',
    surat: 'Gujarat',
    vadodara: 'Gujarat',
    jaipur: 'Rajasthan',
    jodhpur: 'Rajasthan',
    lucknow: 'Uttar Pradesh',
    kanpur: 'Uttar Pradesh',
    agra: 'Uttar Pradesh',
    patna: 'Bihar',
    bhopal: 'Madhya Pradesh',
    indore: 'Madhya Pradesh',
    chandigarh: 'Punjab',
    guwahati: 'Assam',
};

function validateState(city: string | null, state: string | null): string | null {
    if (!city) return state;
    const canon = CITY_STATE_CANON[city.toLowerCase().replace(/\s+/g, '_')] ?? CITY_STATE_CANON[city.toLowerCase()];
    if (!canon) return state; // unknown city — trust DB
    if (!state) return null;
    // If state doesn't match the canonical state for this city, suppress it
    return state.toLowerCase() === canon.toLowerCase() ? state : null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parsePDP(url: string | null): { make: string; model: string; variant?: string } | null {
    if (!url) return null;
    const m = url.match(/^\/store\/([^/?#]+)\/([^/?#]+)(?:\/([^/?#]+))?/);
    if (!m) return null;
    const make = m[1].toLowerCase();
    if (NON_PRODUCT_PATHS.has(make)) return null;
    const capitalize = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return { make: capitalize(m[1]), model: capitalize(m[2]), variant: m[3] ? capitalize(m[3]) : undefined };
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

// ── Unified Table Row ─────────────────────────────────────────────────────────

function MemberTableRow({
    id,
    displayId,
    name,
    phone,
    isLiveVal,
    isAnon,
    joined,
    district,
    taluka,
    state,
    referralCode,
    lastActiveAt,
    sessionStartAt,
    pdpInterests,
    totalSessions,
    totalTimeMs,
}: {
    id: string;
    displayId: string | null;
    name: string | null;
    phone: string | null;
    isLiveVal: boolean;
    isAnon?: boolean;
    joined: string | null;
    district: string | null;
    taluka: string | null;
    state: string | null;
    referralCode: string | null;
    lastActiveAt: string | null;
    sessionStartAt: string | null;
    pdpInterests: string[];
    totalSessions: number;
    totalTimeMs: number;
}) {
    const city = taluka || district;
    const safeState = validateState(city, state);
    const locationLabel = [city, safeState].filter(Boolean).join(', ') || null;

    return (
        <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">
            {/* Status dot */}
            <td className="pl-5 pr-2 py-3 w-7">
                <span
                    className={`inline-block w-2 h-2 rounded-full ${
                        isLiveVal
                            ? 'bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.5)]'
                            : lastActiveAt
                              ? 'bg-amber-300'
                              : 'bg-slate-200'
                    }`}
                />
            </td>
            {/* Member */}
            <td className="px-3 py-3">
                <div className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                    {isAnon ? `Guest · ${id.slice(-6).toUpperCase()}` : formatDisplayId(displayId || id)}
                </div>
                <div className="text-xs font-black text-slate-900 mt-0.5">
                    {isAnon ? `Visitor ${id.slice(-6).toUpperCase()}` : name || 'Unnamed'}
                </div>
                <div className="text-[10px] text-slate-400 font-medium mt-0.5">{isAnon ? '—' : phone || '—'}</div>
            </td>
            {/* Location */}
            <td className="px-3 py-3 text-[10px] font-bold text-slate-600">
                {locationLabel ?? <span className="text-slate-300">—</span>}
            </td>
            {/* Referred By */}
            <td className="px-3 py-3">
                {referralCode ? (
                    <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                        {referralCode}
                    </span>
                ) : (
                    <span className="text-[10px] text-slate-300">Organic</span>
                )}
            </td>
            {/* Date Joined */}
            <td className="px-3 py-3 text-[10px] font-bold text-slate-500">
                {joined
                    ? new Date(joined).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })
                    : '—'}
            </td>
            {/* Last Active */}
            <td className="px-3 py-3 text-[10px] font-bold">
                {isLiveVal && sessionStartAt ? (
                    <span className="text-emerald-600 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                        <LiveSince iso={sessionStartAt} />
                    </span>
                ) : (
                    <span className="text-slate-500">{timeAgo(lastActiveAt)}</span>
                )}
            </td>
            {/* Product Interest */}
            <td className="px-3 py-3">
                {pdpInterests.length > 0 ? (
                    <div className="flex flex-col gap-0.5">
                        {pdpInterests.slice(0, 2).map(p => (
                            <span
                                key={p}
                                className="text-[9px] font-black text-orange-600 bg-orange-50 border border-orange-100 px-1.5 py-0.5 rounded-full w-fit"
                            >
                                🎯 {p}
                            </span>
                        ))}
                        {pdpInterests.length > 2 && (
                            <span className="text-[9px] text-slate-400 font-bold">+{pdpInterests.length - 2} more</span>
                        )}
                    </div>
                ) : (
                    <span className="text-slate-300 text-[10px]">N/A</span>
                )}
            </td>
            {/* Visits */}
            <td className="px-3 py-3 text-xs font-black text-slate-700">
                {totalSessions > 0 ? totalSessions : <span className="text-slate-300">—</span>}
            </td>
            {/* Time Spent */}
            <td className="px-3 py-3 text-[10px] font-bold text-slate-500">
                {totalTimeMs > 0 ? fmtTime(totalTimeMs) : <span className="text-slate-300">—</span>}
            </td>
        </tr>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const FILTER_OPTIONS: { key: Filter; emoji: string; label: string }[] = [
    { key: 'all', emoji: '👥', label: 'All' },
    { key: 'hot', emoji: '🔥', label: 'Hot' },
    { key: 'warm', emoji: '🌡️', label: 'Warm' },
    { key: 'cold', emoji: '❄️', label: 'Cold' },
];

export default function AumsMembersPage() {
    const { device: _device } = useBreakpoint();
    const [members, setMembers] = useState<MemberRow[]>([]);
    const [page, setPage] = useState(1);
    const [totalMembers, setTotalMembers] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<Filter>('all');
    const [sort, setSort] = useState<SortKey>('last_active');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [stateFilter, setStateFilter] = useState('Maharashtra');
    const [stateOpen, setStateOpen] = useState(false);
    const [brandFilter, setBrandFilter] = useState('');

    const [activeMembers, setActiveMembers] = useState<LiveMemberRow[]>([]);
    const [presence, setPresence] = useState<Map<string, PresenceMapRow>>(new Map());
    const [liveNowCount, setLiveNowCount] = useState(0);
    const [active1hCount, setActive1hCount] = useState(0);

    const hotRows = useMemo(() => activeMembers.filter(m => isLive(m) && !!parsePDP(m.current_url)), [activeMembers]);
    const warmRows = useMemo(() => activeMembers.filter(m => !!parsePDP(m.current_url) && !isLive(m)), [activeMembers]);
    const coldRows = useMemo(() => activeMembers.filter(m => !parsePDP(m.current_url)), [activeMembers]);
    const liveIds = useMemo(() => new Set(activeMembers.filter(isLive).map(m => m.member_id)), [activeMembers]);

    // ── Debounced search ─────────────────────────────────────────────────────
    useEffect(() => {
        const t = window.setTimeout(() => {
            setPage(1);
            setSearchQuery(searchInput.trim());
        }, 350);
        return () => window.clearTimeout(t);
    }, [searchInput]);

    // ── Load paginated all-members ────────────────────────────────────────────
    useEffect(() => {
        if (filter !== 'all') return;
        let cancelled = false;
        setIsLoading(true);
        getAllPlatformMembers(searchQuery, page, PAGE_SIZE, stateFilter || undefined)
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
    }, [page, searchQuery, filter, stateFilter]);

    // ── Load active members ───────────────────────────────────────────────────
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

    // ── Presence overlay for All tab ──────────────────────────────────────────
    useEffect(() => {
        if (filter !== 'all' || !members.length) return;
        getPresenceForPage(members.map(m => m.id))
            .then(rows => {
                setPresence(prev => {
                    const next = new Map(prev);
                    rows.forEach(row => next.set(row.member_id, row));
                    return next;
                });
            })
            .catch(() => {});
    }, [members, filter]);

    // ── Page reset on filter change ───────────────────────────────────────────
    useEffect(() => {
        setPage(1);
        setIsLoading(filter === 'all');
    }, [filter]);

    // ── Sort active rows client-side ──────────────────────────────────────────
    const brandFilter_lc = brandFilter.toLowerCase();
    const filteredByBrand = useCallback(
        (rows: LiveMemberRow[]) => {
            if (!brandFilter_lc) return rows;
            return rows.filter(m => {
                const pdp = parsePDP(m.current_url);
                return pdp
                    ? pdp.make.toLowerCase().includes(brandFilter_lc) ||
                          pdp.model.toLowerCase().includes(brandFilter_lc)
                    : false;
            });
        },
        [brandFilter_lc]
    );

    const sortedActive = useCallback(
        (rows: LiveMemberRow[]) => {
            const dir = sortDir === 'asc' ? 1 : -1;
            return [...rows].sort((a, b) => {
                if (sort === 'name') return dir * (a.full_name || '').localeCompare(b.full_name || '');
                if (sort === 'joined')
                    return dir * (new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
                if (sort === 'time') return dir * ((b.total_time_ms || 0) - (a.total_time_ms || 0));
                return dir * (new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
            });
        },
        [sort, sortDir]
    );

    // ── Sort paginated rows client-side (current page only) ──────────────────
    const sortedMembers = useMemo(() => {
        const dir = sortDir === 'asc' ? 1 : -1;
        return [...members].sort((a, b) => {
            if (sort === 'name') return dir * (a.full_name || '').localeCompare(b.full_name || '');
            if (sort === 'joined')
                return dir * (new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
            if (sort === 'visits') return dir * ((b.total_sessions || 0) - (a.total_sessions || 0));
            if (sort === 'time') return dir * ((b.total_time_ms || 0) - (a.total_time_ms || 0));
            return (
                dir *
                (new Date(b.last_active_at || b.created_at || '').getTime() -
                    new Date(a.last_active_at || a.created_at || '').getTime())
            );
        });
    }, [members, sort, sortDir]);

    // ── Select display rows ───────────────────────────────────────────────────
    const activeRows = useMemo(() => {
        if (filter === 'hot') return sortedActive(filteredByBrand(hotRows));
        if (filter === 'warm') return sortedActive(filteredByBrand(warmRows));
        if (filter === 'cold') return sortedActive(filteredByBrand(coldRows));
        return [];
    }, [filter, hotRows, warmRows, coldRows, sortedActive, filteredByBrand]);

    const displayCount = filter === 'all' ? totalMembers : activeRows.length;

    // ── Filter counts ─────────────────────────────────────────────────────────
    const counts: Record<Filter, number> = useMemo(
        () => ({
            all: totalMembers,
            hot: hotRows.length,
            warm: warmRows.length,
            cold: coldRows.length,
        }),
        [totalMembers, hotRows, warmRows, coldRows]
    );

    // ── Sortable column headers ───────────────────────────────────────────────
    type ColDef = { label: string; key?: SortKey };
    const COLUMNS: ColDef[] = [
        { label: '' },
        { label: 'Member', key: 'name' },
        { label: 'Location' },
        { label: 'Referred By' },
        { label: 'Date Joined', key: 'joined' },
        { label: 'Last Active', key: 'last_active' },
        { label: 'Product Interest' },
        { label: 'Visits', key: 'visits' },
        { label: 'Time Spent', key: 'time' },
    ];

    function handleColSort(key: SortKey) {
        if (sort === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
        else {
            setSort(key);
            setSortDir('desc');
        }
    }

    return (
        <div className="flex flex-col gap-6 p-6 min-h-screen bg-slate-50">
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        Platform Wide · CCTV
                    </p>
                    <h1 className="text-2xl font-black text-slate-900 mt-0.5">
                        AUMS Members<span className="text-brand-primary">.</span>
                    </h1>
                </div>
                <span className="text-[9px] font-black text-emerald-600 flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    REALTIME
                </span>
            </div>

            {/* ── Stats Cards ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-3 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
                            <Users className="w-4 h-4 text-indigo-500" />
                        </div>
                    </div>
                    <div className="text-3xl font-black text-indigo-600">{totalMembers.toLocaleString('en-IN')}</div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">
                        Total Members
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Platform-wide registry</div>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                            <Activity className="w-4 h-4 text-emerald-500" />
                        </div>
                        <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> LIVE
                        </span>
                    </div>
                    <div className="text-3xl font-black text-emerald-600">{liveNowCount}</div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">Live Now</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Active in last 10 min</div>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                            <UserCheck className="w-4 h-4 text-amber-500" />
                        </div>
                    </div>
                    <div className="text-3xl font-black text-amber-600">{active1hCount}</div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">
                        Active (1h)
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Seen in last 60 min</div>
                </div>
            </div>

            {/* ── Table Card ──────────────────────────────────────────────── */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                {/* Toolbar */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 flex-wrap">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                            placeholder="Search name, phone, ID…"
                            className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-indigo-300 focus:bg-white transition-all"
                        />
                    </div>

                    {/* Filter pills */}
                    <div className="flex items-center gap-1">
                        {FILTER_OPTIONS.map(f => (
                            <button
                                key={f.key}
                                onClick={() => setFilter(f.key)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                                    filter === f.key
                                        ? f.key === 'hot'
                                            ? 'bg-red-500 text-white shadow-sm'
                                            : f.key === 'warm'
                                              ? 'bg-orange-500 text-white shadow-sm'
                                              : f.key === 'cold'
                                                ? 'bg-sky-500 text-white shadow-sm'
                                                : 'bg-slate-900 text-white shadow-sm'
                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}
                            >
                                <span>{f.emoji}</span>
                                <span>{f.label}</span>
                                <span
                                    className={`ml-0.5 text-[9px] px-1.5 py-0.5 rounded-full font-black ${
                                        filter === f.key ? 'bg-white/20' : 'bg-slate-200 text-slate-600'
                                    }`}
                                >
                                    {counts[f.key]}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* State filter */}
                    <div className="relative">
                        <button
                            onClick={() => setStateOpen(v => !v)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider border rounded-xl transition-all ${
                                stateFilter
                                    ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            📍 {stateFilter || 'All States'}
                            <ChevronDown className="w-3 h-3" />
                        </button>
                        {stateOpen && (
                            <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden min-w-[160px] max-h-60 overflow-y-auto">
                                <button
                                    onClick={() => {
                                        setStateFilter('');
                                        setStateOpen(false);
                                        setPage(1);
                                    }}
                                    className={`w-full px-3 py-2 text-[10px] font-black uppercase tracking-wider text-left hover:bg-slate-50 ${
                                        !stateFilter ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600'
                                    }`}
                                >
                                    All States
                                </button>
                                {INDIAN_STATES.map(s => (
                                    <button
                                        key={s}
                                        onClick={() => {
                                            setStateFilter(s);
                                            setStateOpen(false);
                                            setPage(1);
                                        }}
                                        className={`w-full px-3 py-2 text-[10px] font-black uppercase tracking-wider text-left hover:bg-slate-50 ${
                                            stateFilter === s ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600'
                                        }`}
                                    >
                                        {stateFilter === s ? '✓ ' : ''}
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Brand filter (text input) */}
                    <input
                        value={brandFilter}
                        onChange={e => setBrandFilter(e.target.value)}
                        placeholder="Brand / Model…"
                        className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-orange-300 focus:bg-white transition-all w-32"
                    />

                    {/* Row count */}
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-auto">
                        {displayCount.toLocaleString('en-IN')} members
                    </span>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-100">
                                {COLUMNS.map((col, i) => (
                                    <th
                                        key={i}
                                        onClick={col.key ? () => handleColSort(col.key!) : undefined}
                                        className={`px-3 py-2.5 text-[8.5px] font-black uppercase tracking-widest text-slate-400 select-none whitespace-nowrap ${
                                            col.key
                                                ? 'cursor-pointer hover:text-slate-700 hover:bg-slate-100 transition-colors'
                                                : ''
                                        } ${sort === col.key ? 'text-indigo-500' : ''}`}
                                    >
                                        <span className="flex items-center gap-1">
                                            {col.label}
                                            {col.key && sort === col.key && (
                                                <span className="text-[10px] leading-none">
                                                    {sortDir === 'desc' ? '↓' : '↑'}
                                                </span>
                                            )}
                                            {col.key && sort !== col.key && (
                                                <span className="text-[10px] leading-none opacity-20">↕</span>
                                            )}
                                        </span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {/* Active rows (Hot / Warm / Cold filters) */}
                            {filter !== 'all' &&
                                activeRows.map(m => {
                                    const pdp = parsePDP(m.current_url);
                                    const pdpInterests = pdp
                                        ? [`${pdp.make} ${pdp.model}${pdp.variant ? ` · ${pdp.variant}` : ''}`]
                                        : [];
                                    return (
                                        <MemberTableRow
                                            key={m.member_id}
                                            id={m.member_id}
                                            displayId={m.display_id}
                                            name={m.full_name}
                                            phone={m.primary_phone}
                                            isLiveVal={isLive(m)}
                                            isAnon={m.is_anon}
                                            joined={m.created_at}
                                            district={m.district}
                                            taluka={m.taluka}
                                            state={m.state}
                                            referralCode={null}
                                            lastActiveAt={m.updated_at}
                                            sessionStartAt={m.session_start_at}
                                            pdpInterests={pdpInterests}
                                            totalSessions={0}
                                            totalTimeMs={m.total_time_ms ?? 0}
                                        />
                                    );
                                })}

                            {/* Paginated 'all' rows */}
                            {filter === 'all' &&
                                sortedMembers.map(m => {
                                    const pres = presence.get(m.id);
                                    return (
                                        <MemberTableRow
                                            key={m.id}
                                            id={m.id}
                                            displayId={m.display_id}
                                            name={m.full_name}
                                            phone={m.primary_phone}
                                            isLiveVal={liveIds.has(m.id)}
                                            joined={m.created_at}
                                            district={m.district}
                                            taluka={m.taluka}
                                            state={m.state}
                                            referralCode={m.referral_code}
                                            lastActiveAt={m.last_active_at ?? pres?.updated_at ?? null}
                                            sessionStartAt={null}
                                            pdpInterests={m.pdp_interests ?? []}
                                            totalSessions={m.total_sessions ?? 0}
                                            totalTimeMs={m.total_time_ms ?? 0}
                                        />
                                    );
                                })}

                            {/* Empty states */}
                            {filter !== 'all' && activeRows.length === 0 && !isLoading && (
                                <tr>
                                    <td
                                        colSpan={9}
                                        className="px-5 py-16 text-center text-xs font-black text-slate-400 uppercase tracking-widest"
                                    >
                                        {filter === 'hot'
                                            ? '🔥 No members live on PDP right now'
                                            : filter === 'warm'
                                              ? '🌡️ No recent PDP visitors'
                                              : '❄️ No cold traffic right now'}
                                    </td>
                                </tr>
                            )}
                            {filter === 'all' && sortedMembers.length === 0 && !isLoading && (
                                <tr>
                                    <td
                                        colSpan={9}
                                        className="px-5 py-16 text-center text-xs font-black text-slate-400 uppercase tracking-widest"
                                    >
                                        No members found.
                                    </td>
                                </tr>
                            )}
                            {isLoading && filter === 'all' && (
                                <tr>
                                    <td colSpan={9} className="px-5 py-12 text-center">
                                        <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-bold">
                                            <span className="w-4 h-4 border-2 border-slate-300 border-t-indigo-400 rounded-full animate-spin" />
                                            Loading members…
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination (All filter only) */}
                {filter === 'all' && totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            Page {page} of {totalPages} · {totalMembers.toLocaleString('en-IN')} members
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                disabled={page <= 1}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const p =
                                    page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                                return p >= 1 && p <= totalPages ? (
                                    <button
                                        key={p}
                                        onClick={() => setPage(p)}
                                        className={`w-7 h-7 flex items-center justify-center rounded-lg text-[10px] font-black transition-all ${
                                            p === page
                                                ? 'bg-slate-900 text-white'
                                                : 'border border-slate-200 text-slate-500 hover:bg-slate-50'
                                        }`}
                                    >
                                        {p}
                                    </button>
                                ) : null;
                            })}
                            <button
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
