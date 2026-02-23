'use client';

import React, { useState, useEffect } from 'react';
import {
    Users,
    Search,
    Plus,
    Mail,
    Phone,
    Shield,
    UserCheck,
    ListFilter,
    Zap,
    LayoutGrid,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useParams } from 'next/navigation';

interface TeamMember {
    id: string;
    user_id: string | null;
    tenant_id: string;
    role: string;
    status: string;
    created_at: string;
    user?: {
        id: string;
        full_name: string | null;
        email: string | null;
        primary_phone: string | null;
    } | null;
}

export default function UsersPage() {
    const params = useParams();
    const slug = params?.slug as string;
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchMembers = async () => {
        setLoading(true);
        const supabase = createClient();

        // First resolve the tenant ID from slug
        const { data: tenant } = await supabase.from('id_tenants').select('id').eq('slug', slug).single();
        if (!tenant) {
            setLoading(false);
            return;
        }

        // Fetch team records
        const { data: team } = await supabase
            .from('id_team')
            .select('*')
            .eq('tenant_id', tenant.id)
            .order('created_at', { ascending: false });

        if (team && team.length > 0) {
            const memberIds = team.map(t => t.user_id).filter((uid): uid is string => uid !== null);

            if (memberIds.length > 0) {
                const { data: memberDetails } = await supabase
                    .from('id_members')
                    .select('id, full_name, email, primary_phone')
                    .in('id', memberIds);

                const enriched = team.map(t => ({
                    ...t,
                    user: memberDetails?.find((m: any) => m.id === t.user_id) || null,
                }));
                setMembers(enriched as any);
            } else {
                setMembers(team as any);
            }
        } else {
            setMembers([]);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (slug) fetchMembers();
    }, [slug]);

    const filteredMembers = members.filter(m => {
        const q = searchQuery.toLowerCase();
        return (
            m.user?.full_name?.toLowerCase().includes(q) ||
            m.user?.email?.toLowerCase().includes(q) ||
            m.role?.toLowerCase().includes(q)
        );
    });

    const activeCount = filteredMembers.filter(m => m.status === 'ACTIVE').length;

    const getRoleColor = (role: string) => {
        const r = role?.toUpperCase();
        if (r === 'OWNER' || r === 'SUPER_ADMIN') return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
        if (r === 'ADMIN' || r === 'MARKETPLACE_ADMIN') return 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20';
        if (r?.includes('STAFF')) return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20">
            {/* Header */}
            <div className="relative rounded-3xl p-8 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10 backdrop-blur-3xl" />
                <div className="absolute inset-0 border border-white/10 rounded-3xl" />
                <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-3 py-1 bg-white/50 dark:bg-white/10 backdrop-blur-md border border-white/20 rounded-full w-fit shadow-sm">
                            <Users size={12} className="text-purple-600 dark:text-purple-400" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-900 dark:text-purple-200">
                                Team Management
                            </span>
                        </div>
                        <div>
                            <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                                System <span className="text-purple-600 dark:text-purple-400">Users</span>
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-2 max-w-lg leading-relaxed">
                                Manage team members, roles, and access controls across the platform.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats & Search */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-2 relative group z-10">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-indigo-500/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl flex items-center p-1.5 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all shadow-sm group-hover:shadow-md">
                        <div className="pl-4 text-slate-400 group-focus-within:text-purple-500 transition-colors">
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by name, email, or role..."
                            className="w-full bg-transparent border-none px-4 py-2 text-sm font-medium focus:ring-0 outline-none placeholder:text-slate-400 text-slate-900 dark:text-white"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                        <div className="pr-1.5">
                            <button className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl text-slate-400 transition-colors">
                                <ListFilter size={16} />
                            </button>
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-2 flex gap-4">
                    <div className="flex-1 bg-white dark:bg-slate-900/50 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                        <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Users</div>
                            <div className="text-2xl font-black text-slate-900 dark:text-white">{members.length}</div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                            <LayoutGrid size={18} className="text-purple-500" />
                        </div>
                    </div>
                    <div className="flex-1 bg-white dark:bg-slate-900/50 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                        <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Active</div>
                            <div className="text-2xl font-black text-slate-900 dark:text-white">{activeCount}</div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                            <Zap size={18} className="text-emerald-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Users List */}
            {loading ? (
                <div className="py-32 flex flex-col items-center justify-center gap-6">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-purple-100 dark:border-purple-900/30 rounded-full" />
                        <div className="absolute inset-0 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                    <p className="text-sm text-slate-400 font-medium animate-pulse">Loading team members...</p>
                </div>
            ) : filteredMembers.length > 0 ? (
                <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
                    <div className="divide-y divide-slate-100 dark:divide-white/5">
                        {filteredMembers.map(member => (
                            <div
                                key={member.id}
                                className="p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 flex items-center justify-center text-purple-700 dark:text-purple-300 font-black text-sm ring-1 ring-purple-500/10">
                                        {member.user?.full_name?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors">
                                            {member.user?.full_name || 'Unknown User'}
                                        </p>
                                        <div className="flex items-center gap-3 mt-1">
                                            {member.user?.email && (
                                                <span className="flex items-center gap-1 text-xs text-slate-400">
                                                    <Mail size={10} /> {member.user.email}
                                                </span>
                                            )}
                                            {member.user?.primary_phone && (
                                                <span className="flex items-center gap-1 text-xs text-slate-400">
                                                    <Phone size={10} /> {member.user.primary_phone}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span
                                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getRoleColor(member.role)}`}
                                    >
                                        <Shield size={10} className="inline mr-1" />
                                        {member.role?.replace(/_/g, ' ')}
                                    </span>
                                    <span
                                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${member.status === 'ACTIVE'
                                                ? 'bg-emerald-500/10 text-emerald-600'
                                                : 'bg-slate-500/10 text-slate-500'
                                            }`}
                                    >
                                        {member.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="py-24 text-center bg-white/5 border border-dashed border-slate-200 dark:border-white/10 rounded-3xl">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <UserCheck className="text-slate-400" size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">No users found</h3>
                    <p className="text-sm text-slate-500 max-w-xs mx-auto mt-2">
                        No team members match your search criteria.
                    </p>
                </div>
            )}
        </div>
    );
}
