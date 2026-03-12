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
import { UserCheck, Activity, LayoutGrid, Search as SearchIcon, User } from 'lucide-react';
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
        if (memberIdParam) setSelectedMemberId(memberIdParam);
    }, [initialMemberId, memberIdParam]);

    const filteredMembers = useMemo(
        () =>
            members.filter(
                m =>
                    m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    formatDisplayId(m.displayId).toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (m.phone || '').toLowerCase().includes(searchQuery.toLowerCase())
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
        if (slug) router.push(`/app/${slug}/members/${memberId}`);
    };

    const handleCloseDetail = () => {
        setSelectedMemberId(null);
        if (slug) router.push(`/app/${slug}/members`);
    };

    const effectiveView = device === 'phone' ? 'list' : view;

    if (!selectedMemberId) {
        return (
            <div className="h-full bg-[#f8fafc]">
                <ModuleLanding
                    title="Members Hub"
                    subtitle="CORE_IDENTITY"
                    onNew={() => toast.info('Register via Leads module')}
                    searchPlaceholder="Search Members Hub..."
                    onSearch={setSearchQuery}
                    statsContent={<StatsHeader stats={stats} device={device} />}
                    view={effectiveView}
                    onViewChange={setView}
                    device={device}
                >
                    {effectiveView === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
                            {filteredMembers.map(member => (
                                <div
                                    key={member.id}
                                    onClick={() => handleOpenMember(member.id)}
                                    className="group bg-white border border-slate-200 rounded-xl p-5 cursor-pointer transition-all hover:shadow-lg hover:border-indigo-500/30 shadow-sm"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                                            {formatDisplayId(member.displayId)}
                                        </div>
                                        <div className="px-2 py-0.5 rounded bg-emerald-50 text-[9px] font-black uppercase text-emerald-600 border border-emerald-100">
                                            {member.status}
                                        </div>
                                    </div>
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-1 truncate">
                                        {member.fullName}
                                    </h3>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        {member.phone || 'No phone'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-200">
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                            Node ID
                                        </th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                            Identity
                                        </th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                            Communication
                                        </th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredMembers.map(member => (
                                        <tr
                                            key={member.id}
                                            onClick={() => handleOpenMember(member.id)}
                                            className="group hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-100 last:border-0"
                                        >
                                            <td className="px-6 py-4 text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                                                {formatDisplayId(member.displayId)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                                                        <User size={14} />
                                                    </div>
                                                    <div className="text-xs font-black text-slate-900 uppercase tracking-tight">
                                                        {member.fullName}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-bold text-slate-500">
                                                {member.phone || '—'}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="px-2.5 py-1 rounded inline-block text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">
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
        <div className="h-full bg-white flex overflow-hidden font-sans">
            <MasterListDetailLayout
                mode="list-detail"
                listPosition="left"
                device={device}
                hasActiveDetail={!!selectedMemberId}
                onBack={handleCloseDetail}
            >
                <div className="h-full flex flex-col bg-[#fdfdfd] border-r border-slate-200 w-full">
                    <div className="p-4 border-b border-slate-200 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">
                                Members <span className="text-indigo-600">Core</span>
                            </h2>
                            <button
                                onClick={handleCloseDetail}
                                className="p-1.5 hover:bg-slate-100 rounded-lg transition-all text-slate-400"
                            >
                                <LayoutGrid size={14} />
                            </button>
                        </div>
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-3 h-3" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-8 pr-4 text-[10px] font-bold text-slate-900 placeholder:text-slate-400 focus:border-indigo-500/50 shadow-sm"
                                placeholder="Search members core..."
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 no-scrollbar">
                        {filteredMembers.map(member => {
                            const isActive = selectedMemberId === member.id;
                            return (
                                <button
                                    key={member.id}
                                    onClick={() => handleOpenMember(member.id)}
                                    className={`w-full text-left rounded-lg p-3 transition-all border ${isActive ? 'bg-indigo-50 border-indigo-200 text-indigo-900' : 'bg-white border-transparent hover:bg-slate-50'}`}
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span
                                            className={`text-[8px] font-black uppercase tracking-widest ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}
                                        >
                                            {formatDisplayId(member.displayId)}
                                        </span>
                                        <div
                                            className={`w-1.5 h-1.5 rounded-full ${member.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-slate-300'}`}
                                        />
                                    </div>
                                    <div className="text-[11px] font-black text-slate-900 uppercase tracking-tight mb-1 truncate">
                                        {member.fullName}
                                    </div>
                                    <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                        {member.phone || '—'}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
                <div className="h-full flex flex-col overflow-y-auto no-scrollbar bg-white">
                    <MemberEditorWrapper memberId={selectedMemberId} />
                </div>
            </MasterListDetailLayout>
        </div>
    );
}
