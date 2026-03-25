'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
    getPlatformTemperatureSummary,
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
    referrer_name: string | null;
    referrer_display_id: string | null;
    referrer_member_id: string | null;
    total_sessions: number;
    total_time_ms: number;
    last_active_at: string | null;
    pdp_interests: string[];
    share_earn_clicks: number;
    referral_link_clicks: number;
    current_temperature?: string | null;
    has_saved_quote?: boolean;
    last_pdp_at?: string | null;
    last_catalog_at?: string | null;
    last_landing_at?: string | null;
    oclub_balance?: number;
};

type PresenceMapRow = PresenceRow;
type Filter = 'all' | 'live' | 'hot' | 'warm' | 'cold';
type SortKey = 'temperature' | 'name' | 'joined' | 'last_active' | 'visits' | 'time';

function tempRank(currentTemp: string | null | undefined, isLiveLanding: boolean): number {
    const t = String(currentTemp || '').toUpperCase();
    if (t === 'HOT') return 4;
    if (t === 'WARM') return 3;
    if (t === 'COLD') return 2;
    if (isLiveLanding) return 1;
    return 0;
}

function tempTone(temp: string): string {
    if (temp === 'HOT') return 'text-rose-700 bg-rose-50 border-rose-200';
    if (temp === 'WARM') return 'text-amber-700 bg-amber-50 border-amber-200';
    if (temp === 'COLD') return 'text-sky-700 bg-sky-50 border-sky-200';
    if (temp === 'LIVE') return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    return 'text-emerald-700 bg-emerald-50 border-emerald-200';
}

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
    referrerName,
    referrerDisplayId,
    referrerMemberId,
    currentTemp,
    hasSavedQuote,
    lastPdpAt,
    lastCatalogAt,
    lastActiveAt,
    sessionStartAt,
    pdpInterests,
    shareEarnClicks,
    referralLinkClicks,
    totalSessions,
    totalTimeMs,
    oclubBalance,
    onNavigate,
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
    referrerName: string | null;
    referrerDisplayId: string | null;
    referrerMemberId: string | null;
    currentTemp?: string | null;
    hasSavedQuote?: boolean;
    lastPdpAt: string | null;
    lastCatalogAt: string | null;
    lastActiveAt: string | null;
    sessionStartAt: string | null;
    pdpInterests: string[];
    shareEarnClicks: number;
    referralLinkClicks: number;
    totalSessions: number;
    totalTimeMs: number;
    oclubBalance: number;
    onNavigate: (memberId: string) => void;
}) {
    const city = taluka || district;
    const safeState = validateState(city, state);
    const locationLabel = [city, safeState].filter(Boolean).join(', ') || null;

    // HOT = has saved quote OR current DB temperature is HOT
    // WARM = current DB temperature is WARM
    // COLD = current DB temperature is COLD
    // LIVE = on site now but has no temperature tag
    const effectiveTemp = currentTemp ? currentTemp.toUpperCase() : null;
    const currentLabel = hasSavedQuote
        ? 'HOT'
        : effectiveTemp === 'HOT'
          ? 'HOT'
          : effectiveTemp === 'WARM'
            ? 'WARM'
            : effectiveTemp === 'COLD'
              ? 'COLD'
              : isLiveVal
                ? 'LIVE'
                : null;

    return (
        <tr
            onClick={() => !isAnon && onNavigate(id)}
            className={`border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors ${
                !isAnon ? 'cursor-pointer' : ''
            }`}
        >
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
                <div className="flex items-center gap-1.5 mt-1">
                    {currentLabel && (
                        <span
                            className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border ${tempTone(currentLabel)}`}
                        >
                            {currentLabel}
                        </span>
                    )}
                </div>
            </td>
            {/* Location */}
            <td className="px-3 py-3 text-[10px] font-bold text-slate-600">
                {locationLabel ?? <span className="text-slate-300">—</span>}
            </td>
            {/* Referred By */}
            <td className="px-3 py-3">
                {referrerMemberId || referrerName || referrerDisplayId ? (
                    <button
                        onClick={e => {
                            e.stopPropagation();
                            if (referrerMemberId) onNavigate(referrerMemberId);
                        }}
                        className="text-left group"
                    >
                        <div className="text-[10px] font-black text-indigo-600 group-hover:text-indigo-800 transition-colors leading-tight">
                            {referrerName || referrerDisplayId || 'Anonymous Referrer'}
                        </div>
                        {referrerDisplayId && referrerName && (
                            <div className="text-[9px] font-bold text-indigo-400 mt-0.5">{referrerDisplayId}</div>
                        )}
                        {referrerDisplayId && !referrerName && (
                            <div className="text-[9px] font-bold text-indigo-400 mt-0.5">ID: {referrerDisplayId}</div>
                        )}
                    </button>
                ) : (
                    <span className="text-[10px] text-slate-300">Organic</span>
                )}
            </td>
            {/* Share & Earn Clicks */}
            <td className="px-3 py-3 text-xs font-black text-slate-700">
                {shareEarnClicks > 0 ? shareEarnClicks : <span className="text-slate-300">—</span>}
            </td>
            {/* Referral Link Clicks */}
            <td className="px-3 py-3 text-xs font-black text-slate-700">
                {referralLinkClicks > 0 ? referralLinkClicks : <span className="text-slate-300">—</span>}
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
            {/* O' Circle Balance */}
            <td className="px-3 py-3">
                {oclubBalance > 0 ? (
                    <span className="text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                        🪙 {oclubBalance}
                    </span>
                ) : (
                    <span className="text-slate-300 text-[10px]">—</span>
                )}
            </td>
        </tr>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const FILTER_OPTIONS: { key: Filter; emoji: string; label: string }[] = [
    { key: 'all', emoji: '👥', label: 'All' },
    { key: 'live', emoji: '🟢', label: 'Live' },
    { key: 'hot', emoji: '🔥', label: 'Hot' },
    { key: 'warm', emoji: '🌡️', label: 'Warm' },
    { key: 'cold', emoji: '❄️', label: 'Cold' },
];

export default function AumsMembersPage() {
    const { device: _device } = useBreakpoint();
    const router = useRouter();

    const onNavigate = useCallback(
        (memberId: string) => {
            router.push(`/aums/members/${memberId}`);
        },
        [router]
    );
    const [members, setMembers] = useState<MemberRow[]>([]);
    const [page, setPage] = useState(1);
    const [totalMembers, setTotalMembers] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<Filter>('all');
    const [sort, setSort] = useState<SortKey>('temperature');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [stateFilter, setStateFilter] = useState('Maharashtra');
    const [stateOpen, setStateOpen] = useState(false);
    const [brandFilter, setBrandFilter] = useState('');

    const [activeMembers, setActiveMembers] = useState<LiveMemberRow[]>([]);
    const [presence, setPresence] = useState<Map<string, PresenceMapRow>>(new Map());
    const [liveNowCount, setLiveNowCount] = useState(0);
    const [active1hCount, setActive1hCount] = useState(0);
    const [tempCounts, setTempCounts] = useState<{ ALL?: number; HOT: number; WARM: number; COLD: number }>({
        HOT: 0,
        WARM: 0,
        COLD: 0,
    });
    const liveIds = useMemo(() => new Set(activeMembers.filter(isLive).map(m => m.member_id)), [activeMembers]);

    // ── Debounced search ─────────────────────────────────────────────────────
    useEffect(() => {
        const t = window.setTimeout(() => {
            setPage(1);
            setSearchQuery(searchInput.trim());
        }, 350);
        return () => window.clearTimeout(t);
    }, [searchInput]);

    // ── Load paginated members (unified for all tabs) ─────────────────────────
    useEffect(() => {
        let cancelled = false;
        setIsLoading(true);
        getAllPlatformMembers(searchQuery, page, PAGE_SIZE, stateFilter || undefined, filter)
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
            const [summary, live, temps] = await Promise.all([
                getPlatformPresenceSummary(),
                getLiveMembersWithDetails(),
                getPlatformTemperatureSummary(),
            ]);
            setLiveNowCount(summary.liveNowCount);
            setActive1hCount(summary.active1hCount);
            setActiveMembers(live);
            setTempCounts(temps);
        } catch {
            /* silent */
        }
    }, []);

    useEffect(() => {
        refreshActive();
        const t = window.setInterval(refreshActive, 30_000);
        return () => window.clearInterval(t);
    }, [refreshActive]);

    // ── Presence overlay for paginated members ────────────────────────────────
    useEffect(() => {
        if (!members.length) return;
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
        setIsLoading(true);
    }, [filter]);

    // ── Brand filter (client-side, current page only) ─────────────────────────
    const brandFilter_lc = brandFilter.toLowerCase();
    const filteredMembers = useMemo(() => {
        if (!brandFilter_lc) return members;
        return members.filter(m => (m.pdp_interests || []).some(i => i.toLowerCase().includes(brandFilter_lc)));
    }, [members, brandFilter_lc]);

    // ── Sort paginated rows client-side (current page only) ──────────────────
    const sortedMembers = useMemo(() => {
        const dir = sortDir === 'asc' ? 1 : -1;
        return [...filteredMembers].sort((a, b) => {
            if (sort === 'temperature') {
                const aLiveLanding = liveIds.has(a.id) && !a.current_temperature;
                const bLiveLanding = liveIds.has(b.id) && !b.current_temperature;
                const diff =
                    tempRank(b.current_temperature, bLiveLanding) - tempRank(a.current_temperature, aLiveLanding);
                return sortDir === 'asc' ? -diff : diff;
            }
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
    }, [filteredMembers, sort, sortDir, liveIds]);

    const displayCount = brandFilter_lc ? sortedMembers.length : totalMembers;

    // ── Filter counts ─────────────────────────────────────────────────────────
    const counts: Record<Filter, number | string> = useMemo(
        () => ({
            all: tempCounts.ALL ?? totalMembers,
            live: liveNowCount,
            hot: tempCounts.HOT,
            warm: tempCounts.WARM,
            cold: tempCounts.COLD,
        }),
        [totalMembers, tempCounts, liveNowCount]
    );

    // ── Sortable column headers ───────────────────────────────────────────────
    type ColDef = { label: string; key?: SortKey };
    const COLUMNS: ColDef[] = [
        { label: '' },
        { label: 'Member', key: 'temperature' },
        { label: 'Location' },
        { label: 'Referred By' },
        { label: 'S&E Clicks' },
        { label: 'Ref Link Clicks' },
        { label: 'Date Joined', key: 'joined' },
        { label: 'Last Active', key: 'last_active' },
        { label: 'Product Interest' },
        { label: 'Visits', key: 'visits' },
        { label: 'Time Spent', key: 'time' },
        { label: "O' Circle" },
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

            {/* ── Filter Cards ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {FILTER_OPTIONS.map(f => {
                    const isActive = filter === f.key;
                    let bgBase, textCount, textLabel;
                    if (f.key === 'hot') {
                        bgBase = isActive
                            ? 'bg-rose-50 border-rose-400 shadow-md ring-2 ring-rose-100'
                            : 'bg-white border-slate-200 hover:border-rose-300 hover:bg-rose-50/50';
                        textCount = 'text-rose-600';
                        textLabel = 'text-rose-500';
                    } else if (f.key === 'warm') {
                        bgBase = isActive
                            ? 'bg-amber-50 border-amber-400 shadow-md ring-2 ring-amber-100'
                            : 'bg-white border-slate-200 hover:border-amber-300 hover:bg-amber-50/50';
                        textCount = 'text-amber-600';
                        textLabel = 'text-amber-500';
                    } else if (f.key === 'cold') {
                        bgBase = isActive
                            ? 'bg-sky-50 border-sky-400 shadow-md ring-2 ring-sky-100'
                            : 'bg-white border-slate-200 hover:border-sky-300 hover:bg-sky-50/50';
                        textCount = 'text-sky-600';
                        textLabel = 'text-sky-500';
                    } else if (f.key === 'live') {
                        bgBase = isActive
                            ? 'bg-emerald-50 border-emerald-400 shadow-md ring-2 ring-emerald-100'
                            : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50';
                        textCount = 'text-emerald-600';
                        textLabel = 'text-emerald-500';
                    } else {
                        bgBase = isActive
                            ? 'bg-indigo-50 border-indigo-400 shadow-md ring-2 ring-indigo-100'
                            : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50';
                        textCount = 'text-indigo-600';
                        textLabel = 'text-indigo-500';
                    }

                    return (
                        <button
                            key={f.key}
                            onClick={() => {
                                setFilter(f.key);
                                setPage(1);
                                setStateFilter(''); // Clear sub-filters so counts match
                                setBrandFilter('');
                                setSearchInput('');
                            }}
                            className={`flex flex-col text-left p-4 md:p-5 rounded-2xl border transition-all duration-200 ease-out outline-none ${bgBase}`}
                        >
                            <div className="flex items-center justify-between w-full mb-2 lg:mb-3">
                                <span className="text-xl md:text-2xl drop-shadow-sm">{f.emoji}</span>
                                {f.key === 'live' && (
                                    <span
                                        className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}
                                    />
                                )}
                            </div>
                            <div className={`text-2xl md:text-3xl font-black ${textCount} tracking-tight`}>
                                {(counts[f.key] || 0).toLocaleString('en-IN')}
                            </div>
                            <div
                                className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest mt-1 opacity-80 ${textLabel}`}
                            >
                                {f.label} Members
                            </div>
                        </button>
                    );
                })}
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
                            {/* Unified paginated rows */}
                            {sortedMembers.map(m => {
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
                                        referrerName={m.referrer_name ?? null}
                                        referrerDisplayId={m.referrer_display_id ?? null}
                                        referrerMemberId={m.referrer_member_id ?? null}
                                        currentTemp={m.current_temperature ?? null}
                                        hasSavedQuote={m.has_saved_quote ?? false}
                                        lastPdpAt={m.last_pdp_at ?? null}
                                        lastCatalogAt={m.last_catalog_at ?? null}
                                        shareEarnClicks={m.share_earn_clicks ?? 0}
                                        referralLinkClicks={m.referral_link_clicks ?? 0}
                                        lastActiveAt={
                                            m.last_active_at && pres?.updated_at
                                                ? new Date(m.last_active_at).getTime() >
                                                  new Date(pres.updated_at).getTime()
                                                    ? m.last_active_at
                                                    : pres.updated_at
                                                : (pres?.updated_at ?? m.last_active_at ?? null)
                                        }
                                        sessionStartAt={null}
                                        pdpInterests={m.pdp_interests ?? []}
                                        totalSessions={m.total_sessions ?? 0}
                                        totalTimeMs={m.total_time_ms ?? 0}
                                        oclubBalance={m.oclub_balance ?? 0}
                                        onNavigate={onNavigate}
                                    />
                                );
                            })}

                            {/* Empty states */}
                            {sortedMembers.length === 0 && !isLoading && (
                                <tr>
                                    <td
                                        colSpan={12}
                                        className="px-5 py-16 text-center text-xs font-black text-slate-400 uppercase tracking-widest"
                                    >
                                        {filter === 'hot'
                                            ? '🔥 No Hot prospects yet.'
                                            : filter === 'warm'
                                              ? '🌡️ No Warm prospects yet.'
                                              : filter === 'cold'
                                                ? '❄️ No Cold prospects yet.'
                                                : filter === 'live'
                                                  ? '🟢 No Live members right now.'
                                                  : 'No members found.'}
                                    </td>
                                </tr>
                            )}
                            {isLoading && (
                                <tr>
                                    <td colSpan={12} className="px-5 py-12 text-center">
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

                {/* Unified Pagination */}
                {totalPages > 1 && (
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
