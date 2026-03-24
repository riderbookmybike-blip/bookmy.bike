'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import ModuleLanding from '@/components/modules/shared/ModuleLanding';
import StatsHeader from '@/components/modules/shared/StatsHeader';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { Activity, UserCheck, Users } from 'lucide-react';
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
type PresenceFilter = 'all' | 'live' | 'recent';

const PAGE_SIZE = 50;

function urlToLabel(url: string | null): string {
    if (!url) return '';
    const parts = url
        .replace(/^\/store\//, '')
        .split('/')
        .filter(Boolean);
    if (parts.length === 0) return url;
    return parts.map(p => p.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())).join(' › ');
}

function MemberPresenceDot({ isLive, isRecent }: { isLive: boolean; isRecent: boolean }) {
    return (
        <span
            className={`inline-block w-2.5 h-2.5 rounded-full ${
                isLive ? 'bg-emerald-500 animate-pulse' : isRecent ? 'bg-amber-400' : 'bg-slate-200'
            }`}
        />
    );
}

export default function AumsMembersPage() {
    const { device } = useBreakpoint();
    const [members, setMembers] = useState<MemberRow[]>([]);
    const [page, setPage] = useState(1);
    const [totalMembers, setTotalMembers] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<PresenceFilter>('all');

    // Live members pinned to top — platform-wide, not page-scoped
    const [liveMembers, setLiveMembers] = useState<LiveMemberRow[]>([]);

    // Presence state for the current page — keyed by member_id
    const [presence, setPresence] = useState<Map<string, PresenceMapRow>>(new Map());
    const [liveNowCount, setLiveNowCount] = useState(0);
    const [active1hCount, setActive1hCount] = useState(0);

    // Ids of live members (for dedup in "All Members" list)
    const liveMemberIds = useMemo(() => new Set(liveMembers.map(m => m.member_id)), [liveMembers]);

    // Derived presence sets for current page
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

    // Debounced search
    useEffect(() => {
        const t = window.setTimeout(() => {
            setPage(1);
            setSearchQuery(searchInput.trim());
        }, 350);
        return () => window.clearTimeout(t);
    }, [searchInput]);

    // Load paginated members list
    useEffect(() => {
        let cancelled = false;
        setIsLoading(true);
        getAllPlatformMembers(searchQuery, page, PAGE_SIZE)
            .then(result => {
                if (cancelled) return;
                setMembers((result?.data || []) as MemberRow[]);
                setTotalMembers(result?.metadata?.total || 0);
                setTotalPages(result?.metadata?.totalPages || 1);
            })
            .catch(err => {
                if (cancelled) return;
                console.error('[AumsMembersPage] loadMembers failed:', err);
                toast.error(`Failed to load platform members: ${err?.message || 'Unknown error'}`);
                setMembers([]);
                setTotalMembers(0);
                setTotalPages(1);
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [page, searchQuery]);

    // Refresh aggregate counts + pinned live members
    const refreshLive = useCallback(async () => {
        try {
            const [summary, live] = await Promise.all([getPlatformPresenceSummary(), getLiveMembersWithDetails()]);
            setLiveNowCount(summary.liveNowCount);
            setActive1hCount(summary.active1hCount);
            setLiveMembers(live);
        } catch {
            /* silent */
        }
    }, []);

    useEffect(() => {
        refreshLive();
        const t = window.setInterval(refreshLive, 30_000);
        return () => window.clearInterval(t);
    }, [refreshLive]);

    // Bootstrap presence for current page
    useEffect(() => {
        if (!members.length) return;
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
    }, [members]);

    // Supabase Realtime — instant push from id_member_presence
    useEffect(() => {
        const supabase = createClient();
        const channel = supabase
            .channel('aums-member-presence')
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

                refreshLive();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [refreshLive]);

    // For "All" view: exclude live members from the paginated list (they're pinned above)
    const visibleMembers = useMemo(() => {
        if (filter === 'live') return []; // live members shown in pinned section only
        if (filter === 'recent') return members.filter(m => recentIds.has(m.id) && !liveMemberIds.has(m.id));
        return members.filter(m => !liveMemberIds.has(m.id)); // exclude pinned live from All list
    }, [filter, members, liveMemberIds, recentIds]);

    const stats = [
        { label: 'Total Members', value: totalMembers, icon: Users, color: 'indigo' as const },
        { label: 'Live Now', value: liveNowCount, icon: Activity, color: 'emerald' as const },
        { label: 'Active (1h)', value: active1hCount, icon: UserCheck, color: 'amber' as const },
    ];

    const tableHeader = (
        <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 w-10" />
            <th className="px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Member</th>
            <th className="px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Phone</th>
            <th className="px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Current Page</th>
            <th className="px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Joined</th>
        </tr>
    );

    return (
        <div className="h-full bg-[#f8fafc]">
            <ModuleLanding
                title="AUMS Members"
                subtitle="PLATFORM_WIDE"
                searchPlaceholder="Search by name, phone, or member ID..."
                onSearch={setSearchInput}
                statsContent={<StatsHeader stats={stats} device={device} />}
                device={device}
                hideActions
            >
                <div className="space-y-4">
                    {/* Filter tabs */}
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                            {(['all', 'live', 'recent'] as PresenceFilter[]).map(tab => {
                                const active = filter === tab;
                                const label =
                                    tab === 'all'
                                        ? 'All Members'
                                        : tab === 'live'
                                          ? '🟢 Live Now'
                                          : '🕐 Recently Active';
                                return (
                                    <button
                                        key={tab}
                                        onClick={() => setFilter(tab)}
                                        className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-colors ${
                                            active
                                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                                : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700'
                                        }`}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                            Realtime
                        </div>
                    </div>

                    {/* ✨ Pinned LIVE members — always visible, platform-wide */}
                    {liveMembers.length > 0 && filter !== 'recent' && (
                        <div className="bg-white border border-emerald-200 rounded-xl shadow-sm overflow-hidden">
                            <div className="px-5 py-2.5 bg-emerald-50 border-b border-emerald-100 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
                                    Live Now — {liveMembers.length} online
                                </span>
                            </div>
                            <table className="w-full text-left border-collapse">
                                <thead>{tableHeader}</thead>
                                <tbody>
                                    {liveMembers.map(m => (
                                        <tr
                                            key={m.member_id}
                                            className="border-b border-slate-100 last:border-0 bg-emerald-50/30"
                                        >
                                            <td className="px-5 py-3">
                                                <MemberPresenceDot isLive isRecent={false} />
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                                                    {formatDisplayId(m.display_id || m.member_id)}
                                                </div>
                                                <div className="text-xs font-black text-slate-900 uppercase tracking-tight mt-0.5">
                                                    {m.full_name || 'Unnamed'}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 text-xs font-bold text-slate-600">
                                                {m.primary_phone || '—'}
                                            </td>
                                            <td className="px-5 py-3">
                                                {m.current_url ? (
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wide">
                                                            {urlToLabel(m.current_url)}
                                                        </span>
                                                        <span className="text-[9px] text-slate-400 font-mono">
                                                            {m.current_url}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-300 text-xs">—</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 text-xs font-bold text-slate-500">—</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Paginated members table */}
                    {filter !== 'live' && (
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                            {liveMembers.length > 0 && filter === 'all' && (
                                <div className="px-5 py-2 bg-slate-50 border-b border-slate-100">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                        All Other Members
                                    </span>
                                </div>
                            )}
                            <table className="w-full text-left border-collapse">
                                <thead>{tableHeader}</thead>
                                <tbody>
                                    {visibleMembers.map(member => {
                                        const isLive = liveNowIds.has(member.id);
                                        const isRecent = recentIds.has(member.id);
                                        const pres = presence.get(member.id);

                                        return (
                                            <tr
                                                key={member.id}
                                                className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors"
                                            >
                                                <td className="px-5 py-3">
                                                    <MemberPresenceDot isLive={isLive} isRecent={isRecent} />
                                                </td>
                                                <td className="px-5 py-3">
                                                    <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                                                        {formatDisplayId(member.display_id || member.id)}
                                                    </div>
                                                    <div className="text-xs font-black text-slate-900 uppercase tracking-tight mt-0.5">
                                                        {member.full_name || 'Unnamed'}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3 text-xs font-bold text-slate-600">
                                                    {member.primary_phone || '—'}
                                                </td>
                                                <td className="px-5 py-3">
                                                    {isLive && pres?.current_url ? (
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wide">
                                                                {urlToLabel(pres.current_url)}
                                                            </span>
                                                            <span className="text-[9px] text-slate-400 font-mono">
                                                                {pres.current_url}
                                                            </span>
                                                        </div>
                                                    ) : isRecent && pres?.current_url ? (
                                                        <span className="text-[9px] font-mono text-slate-400">
                                                            {pres.current_url}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-300 text-xs">—</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3 text-xs font-bold text-slate-500">
                                                    {member.created_at
                                                        ? new Date(member.created_at).toLocaleDateString('en-IN')
                                                        : '—'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {!isLoading && visibleMembers.length === 0 && liveMembers.length === 0 && (
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
                    )}

                    {/* Live Now filter — shows pinned section only */}
                    {filter === 'live' && liveMembers.length === 0 && (
                        <div className="bg-white border border-slate-200 rounded-xl px-5 py-10 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                            No members live right now.
                        </div>
                    )}

                    {/* Pagination — hidden in live filter */}
                    {filter !== 'live' && (
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Page {page} / {Math.max(1, totalPages)} • {totalMembers.toLocaleString()} total members
                            </div>
                            <div className="flex items-center gap-2">
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
                    )}
                </div>
            </ModuleLanding>
        </div>
    );
}
