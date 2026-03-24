'use client';

import React, { useEffect, useMemo, useState } from 'react';
import ModuleLanding from '@/components/modules/shared/ModuleLanding';
import StatsHeader from '@/components/modules/shared/StatsHeader';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { Activity, UserCheck, Users } from 'lucide-react';
import { toast } from 'sonner';
import { getAllPlatformMembers, getPlatformPresenceSummary, getPresenceForPage } from '@/actions/aums-presence';
import { formatDisplayId } from '@/utils/displayId';

type MemberRow = {
    id: string;
    display_id: string | null;
    full_name: string | null;
    primary_phone: string | null;
    created_at: string | null;
};

type PresenceFilter = 'all' | 'live' | 'recent';

const PAGE_SIZE = 50;

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
    const [liveNowIds, setLiveNowIds] = useState<Set<string>>(new Set());
    const [recentlyActiveIds, setRecentlyActiveIds] = useState<Set<string>>(new Set());
    const [liveNowCount, setLiveNowCount] = useState(0);
    const [active1hCount, setActive1hCount] = useState(0);
    const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

    useEffect(() => {
        const handle = window.setTimeout(() => {
            setPage(1);
            setSearchQuery(searchInput.trim());
        }, 350);
        return () => window.clearTimeout(handle);
    }, [searchInput]);

    useEffect(() => {
        let cancelled = false;
        const loadMembers = async () => {
            setIsLoading(true);
            try {
                const result = await getAllPlatformMembers(searchQuery, page, PAGE_SIZE);
                if (cancelled) return;
                setMembers((result?.data || []) as MemberRow[]);
                setTotalMembers(result?.metadata?.total || 0);
                setTotalPages(result?.metadata?.totalPages || 1);
            } catch (error) {
                if (cancelled) return;
                console.error('[AumsMembersPage] loadMembers failed:', error);
                toast.error('Failed to load platform members');
                setMembers([]);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        loadMembers();
        return () => {
            cancelled = true;
        };
    }, [page, searchQuery]);

    useEffect(() => {
        let cancelled = false;

        const refreshPresence = async () => {
            try {
                const ids = members.map(m => m.id).filter(Boolean);
                const [summary, perPage] = await Promise.all([getPlatformPresenceSummary(), getPresenceForPage(ids)]);
                if (cancelled) return;
                setLiveNowCount(summary.liveNowCount);
                setActive1hCount(summary.active1hCount);
                setLiveNowIds(new Set(perPage.liveIds));
                setRecentlyActiveIds(new Set(perPage.recentIds));
                setLastUpdatedAt(new Date());
            } catch (error) {
                if (!cancelled) {
                    console.error('[AumsMembersPage] refreshPresence failed:', error);
                }
            }
        };

        refreshPresence();
        const interval = window.setInterval(refreshPresence, 30000);
        return () => {
            cancelled = true;
            window.clearInterval(interval);
        };
    }, [members]);

    const visibleMembers = useMemo(() => {
        return members.filter(member => {
            if (filter === 'live') return liveNowIds.has(member.id);
            if (filter === 'recent') return recentlyActiveIds.has(member.id);
            return true;
        });
    }, [filter, liveNowIds, members, recentlyActiveIds]);

    const stats = [
        { label: 'Total Members', value: totalMembers, icon: Users, color: 'indigo' as const },
        { label: 'Live Now', value: liveNowCount, icon: Activity, color: 'emerald' as const },
        { label: 'Active (1h)', value: active1hCount, icon: UserCheck, color: 'amber' as const },
    ];

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
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                            {(['all', 'live', 'recent'] as PresenceFilter[]).map(tab => {
                                const active = filter === tab;
                                const label =
                                    tab === 'all' ? 'All Members' : tab === 'live' ? 'Live Now' : 'Recently Active';
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
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Last Sync:{' '}
                            {lastUpdatedAt
                                ? lastUpdatedAt.toLocaleTimeString('en-IN', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      second: '2-digit',
                                  })
                                : '—'}
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                        Presence
                                    </th>
                                    <th className="px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                        Member
                                    </th>
                                    <th className="px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                        Phone
                                    </th>
                                    <th className="px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                        Joined
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleMembers.map(member => {
                                    const isLive = liveNowIds.has(member.id);
                                    const isRecent = recentlyActiveIds.has(member.id);
                                    const dotClass = isLive
                                        ? 'bg-emerald-500 animate-pulse'
                                        : isRecent
                                          ? 'bg-amber-500'
                                          : 'bg-slate-300';

                                    return (
                                        <tr key={member.id} className="border-b border-slate-100 last:border-0">
                                            <td className="px-5 py-3">
                                                <span className={`inline-block w-2.5 h-2.5 rounded-full ${dotClass}`} />
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                                                    {formatDisplayId(member.display_id || member.id)}
                                                </div>
                                                <div className="text-xs font-black text-slate-900 uppercase tracking-tight mt-1">
                                                    {member.full_name || 'Unnamed'}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 text-xs font-bold text-slate-600">
                                                {member.primary_phone || '—'}
                                            </td>
                                            <td className="px-5 py-3 text-xs font-bold text-slate-500">
                                                {member.created_at
                                                    ? new Date(member.created_at).toLocaleDateString('en-IN')
                                                    : '—'}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {!isLoading && visibleMembers.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-5 py-10 text-center text-xs font-bold text-slate-400 uppercase tracking-wider"
                                        >
                                            No members found for this filter.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Page {page} / {Math.max(1, totalPages)} • Showing {visibleMembers.length} of{' '}
                            {members.length} on this page
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                                disabled={page <= 1 || isLoading}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest text-slate-600 disabled:opacity-50"
                            >
                                Prev
                            </button>
                            <button
                                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={page >= totalPages || isLoading}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest text-slate-600 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </ModuleLanding>
        </div>
    );
}
