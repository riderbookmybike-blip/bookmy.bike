'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTenant } from '@/lib/tenant/tenantContext';
import { getMembersForTenant } from '@/actions/members';
import { createClient } from '@/lib/supabase/client';
import MasterListDetailLayout from '@/components/templates/MasterListDetailLayout';
import StatsHeader from '@/components/modules/shared/StatsHeader';
import ModuleLanding from '@/components/modules/shared/ModuleLanding';
import MemberEditorWrapper from '@/components/modules/members/MemberEditorWrapper';
import { UserCheck, Activity, LayoutGrid, Search as SearchIcon } from 'lucide-react';
import { toast } from 'sonner';
import { formatDisplayId } from '@/utils/displayId';
import { useBreakpoint } from '@/hooks/useBreakpoint';

export interface MemberRow {
    id: string;
    displayId: string;
    fullName: string;
    phone?: string | null;
    status?: string | null;
    createdAt?: string | null;
}

export default function MembersPage({ initialMemberId }: { initialMemberId?: string }) {
    const { tenantId } = useTenant();
    const router = useRouter();
    const params = useParams();
    const { device } = useBreakpoint();
    const slug = typeof params?.slug === 'string' ? params.slug : Array.isArray(params?.slug) ? params.slug[0] : '';
    const memberIdParam =
        typeof params?.memberId === 'string'
            ? params.memberId
            : Array.isArray(params?.memberId)
              ? params.memberId[0]
              : null;

    const [members, setMembers] = useState<MemberRow[]>([]);
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(initialMemberId || null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [view, setView] = useState<'grid' | 'list'>('list');

    const fetchMembers = useCallback(async () => {
        if (!tenantId) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const result = await getMembersForTenant(tenantId, searchQuery, 1, 80);
            const mapped = (result?.data || []).map((m: any) => ({
                id: m.id,
                displayId: m.display_id || formatDisplayId(m.id),
                fullName: m.full_name || 'Unnamed',
                phone: m.primary_phone || m.phone || null,
                status: m.member_status || 'ACTIVE',
                createdAt: m.created_at || null,
            }));
            setMembers(mapped);
        } catch (error) {
            console.error('Failed to fetch members:', error);
            toast.error('Failed to load members');
        } finally {
            setIsLoading(false);
        }
    }, [tenantId, searchQuery]);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    useEffect(() => {
        if (!tenantId) return;
        const supabase = createClient();
        const channel = supabase
            .channel('members-live')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'id_members', filter: `tenant_id=eq.${tenantId}` },
                () => fetchMembers()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchMembers, tenantId]);

    useEffect(() => {
        if (initialMemberId) {
            setSelectedMemberId(initialMemberId);
            return;
        }
        if (memberIdParam) {
            setSelectedMemberId(memberIdParam);
        }
    }, [initialMemberId, memberIdParam]);

    const filteredMembers = useMemo(
        () =>
            members.filter(
                m =>
                    m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    formatDisplayId(m.displayId).toLowerCase().includes(searchQuery.toLowerCase())
            ),
        [members, searchQuery]
    );

    const stats = [
        { label: 'Total Members', value: members.length, icon: UserCheck, color: 'indigo' as const, trend: '+3.2%' },
        {
            label: 'Active',
            value: members.filter(m => m.status === 'ACTIVE').length,
            icon: Activity,
            color: 'emerald' as const,
        },
    ];

    const handleOpenMember = (memberId: string) => {
        setSelectedMemberId(memberId);
        if (slug) {
            router.push(`/app/${slug}/members/${memberId}`);
        }
    };

    const handleCloseDetail = () => {
        setSelectedMemberId(null);
        if (slug) {
            router.push(`/app/${slug}/members`);
        }
    };

    if (!selectedMemberId) {
        return (
            <div className="h-full bg-slate-50 dark:bg-[#0b0d10] -m-6 md:-m-8">
                <ModuleLanding
                    title="Members"
                    subtitle="Customer Profiles"
                    onNew={() => toast.info('Create Member from Leads/Signup')}
                    searchPlaceholder="Search Members..."
                    onSearch={setSearchQuery}
                    statsContent={<StatsHeader stats={stats} device={device} />}
                    view={device === 'phone' ? 'list' : view}
                    onViewChange={setView}
                    device={device}
                >
                    {isLoading ? (
                        <div className="py-10 text-center text-xs font-bold text-slate-400 uppercase tracking-[0.3em]">
                            Loading members…
                        </div>
                    ) : filteredMembers.length === 0 ? (
                        <div className="py-10 text-center text-xs font-bold text-slate-400 uppercase tracking-[0.3em]">
                            No members found
                        </div>
                    ) : view === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                            {filteredMembers.map(member => (
                                <div
                                    key={member.id}
                                    onClick={() => handleOpenMember(member.id)}
                                    className="group relative bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-500/30 overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                                                {formatDisplayId(member.displayId)}
                                            </div>
                                            <div className="text-indigo-600 font-black text-sm italic tracking-tighter">
                                                {member.status}
                                            </div>
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase mb-2 truncate group-hover:text-indigo-600 transition-colors">
                                            {member.fullName}
                                        </h3>
                                        <div className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-tighter truncate mb-6">
                                            {member.phone || 'No phone'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : /* ── LIST VIEW: Phone-optimized cards vs Desktop table ── */
                    device === 'phone' ? (
                        <div className="space-y-2 pb-4">
                            {filteredMembers.map(member => (
                                <button
                                    key={member.id}
                                    onClick={() => handleOpenMember(member.id)}
                                    className="w-full text-left bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden transition-all active:scale-[0.98] min-h-[56px]"
                                >
                                    <div className="flex">
                                        <div className="w-1 shrink-0 bg-indigo-500" />
                                        <div className="flex-1 px-4 py-3 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                                                    {formatDisplayId(member.displayId)}
                                                </span>
                                                <span className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600">
                                                    {member.status || 'ACTIVE'}
                                                </span>
                                            </div>
                                            <div className="text-[14px] font-black tracking-tight uppercase truncate text-slate-900 dark:text-white mb-0.5">
                                                {member.fullName}
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-slate-400 truncate">
                                                    {member.phone || '—'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-white/5">
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Member ID
                                        </th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Name
                                        </th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Phone
                                        </th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredMembers.map(member => (
                                        <tr
                                            key={member.id}
                                            onClick={() => handleOpenMember(member.id)}
                                            className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer border-b border-slate-50 dark:border-white/5 last:border-0"
                                        >
                                            <td className="p-6">
                                                <div className="text-xs font-black text-indigo-500 uppercase tracking-widest">
                                                    {formatDisplayId(member.displayId)}
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="text-sm font-black italic uppercase tracking-tighter text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                                                    {member.fullName}
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase">
                                                    {member.phone || '—'}
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest inline-block bg-slate-100 dark:bg-white/5 text-slate-400">
                                                    {member.status}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </ModuleLanding>
            </div>
        );
    }

    return (
        <div className="h-full bg-slate-50 dark:bg-slate-950 flex overflow-hidden font-sans -m-6 md:-m-8">
            <MasterListDetailLayout
                mode="list-detail"
                listPosition="left"
                device={device}
                hasActiveDetail={!!selectedMemberId}
                onBack={handleCloseDetail}
            >
                <div className="h-full flex flex-col bg-white dark:bg-[#0b0d10] border-r border-slate-200 dark:border-white/5 w-full">
                    <div className="p-6 border-b border-slate-100 dark:border-white/5 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white">
                                Members <span className="text-indigo-600">Index</span>
                            </h2>
                            <button
                                onClick={handleCloseDetail}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all text-slate-400"
                            >
                                <LayoutGrid size={18} />
                            </button>
                        </div>
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs font-bold focus:outline-none focus:border-indigo-500/50"
                                placeholder="Search members..."
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-1.5 no-scrollbar">
                        {filteredMembers.map(member => {
                            const isActive = selectedMemberId === member.id;
                            return (
                                <button
                                    key={member.id}
                                    onClick={() => handleOpenMember(member.id)}
                                    className={`w-full text-left rounded-xl border transition-all duration-300 group overflow-hidden ${
                                        isActive
                                            ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-500/20 text-white'
                                            : 'bg-white dark:bg-white/[0.03] border-slate-100 dark:border-white/[0.06] hover:border-indigo-500/30 text-slate-900 dark:text-white hover:shadow-md'
                                    }`}
                                >
                                    <div className="flex">
                                        <div className={`w-1 shrink-0 ${isActive ? 'bg-white/30' : 'bg-indigo-500'}`} />
                                        <div className="flex-1 px-3.5 py-3 min-w-0">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span
                                                    className={`text-[9px] font-black uppercase tracking-wider ${isActive ? 'text-white/70' : 'text-slate-400'}`}
                                                >
                                                    {formatDisplayId(member.displayId)}
                                                </span>
                                                <span
                                                    className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                                                        isActive
                                                            ? 'bg-white/20 text-white'
                                                            : 'bg-indigo-500/10 text-indigo-600'
                                                    }`}
                                                >
                                                    {member.status || 'ACTIVE'}
                                                </span>
                                            </div>
                                            <div
                                                className={`text-[12px] font-black tracking-tight uppercase truncate mb-0.5 ${isActive ? 'text-white' : 'text-slate-800 dark:text-white'}`}
                                            >
                                                {member.fullName}
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span
                                                    className={`text-[10px] font-bold truncate ${isActive ? 'text-white/70' : 'text-slate-400'}`}
                                                >
                                                    {member.phone || '—'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="h-full flex flex-col overflow-y-auto no-scrollbar bg-slate-50 dark:bg-[#08090b]">
                    <MemberEditorWrapper memberId={selectedMemberId} />
                </div>
            </MasterListDetailLayout>
        </div>
    );
}
