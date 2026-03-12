'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    Users,
    UserPlus,
    Shield,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Activity,
    Mail,
    Phone,
    MoreVertical,
} from 'lucide-react';
import { getErrorMessage } from '@/lib/utils/errorMessage';
import AddMemberModal from './AddMemberModal';
import { toast } from 'sonner';

type Member = {
    id: string;
    user_id: string;
    role: string;
    status: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
    created_at: string;
    profiles: {
        full_name: string;
        email: string | null;
        phone: string | null;
    };
};

interface TeamAccessProps {
    dealer: any;
}

export default function TeamAccess({ dealer }: TeamAccessProps) {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const fetchMembers = async () => {
        setLoading(true);
        const supabase = createClient();
        const { data, error } = await supabase
            .from('memberships')
            .select('*, profiles(full_name, email, phone)')
            .eq('tenant_id', (dealer.id as string) || '')
            .order('created_at', { ascending: false });

        if (data) setMembers(data as any);
        setLoading(false);
    };

    useEffect(() => {
        if (dealer.id) fetchMembers();
    }, [dealer.id]);

    const toggleStatus = async (memberId: string, currentStatus: string, name: string) => {
        const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
        const supabase = createClient();

        try {
            const { error } = await supabase.from('memberships').update({ status: newStatus }).eq('id', memberId);
            if (error) throw error;

            setMembers(prev => prev.map(m => (m.id === memberId ? { ...m, status: newStatus as any } : m)));
            toast.success(`${name} ${newStatus === 'ACTIVE' ? 'restored' : 'suspended'}`);
        } catch (err: any) {
            toast.error(getErrorMessage(err));
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header / Stats */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                        <Users size={24} />
                    </div>
                    <div>
                        <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">
                            Personnel Management Protocol
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-70">
                            Authenticated operators with nodal clearance levels.
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-lg shadow-slate-900/10"
                >
                    <UserPlus size={14} /> Add Operator
                </button>
            </div>

            {/* Registry Table */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                {loading ? (
                    <div className="p-24 flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="animate-spin text-indigo-600" size={32} />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Sychronizing Roster Context...
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-wider text-slate-400 border-r border-slate-100/50">
                                        Operator Identity
                                    </th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-wider text-slate-400 border-r border-slate-100/50">
                                        Clearance Tier
                                    </th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-wider text-slate-400 border-r border-slate-100/50">
                                        Encryption Status
                                    </th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-wider text-slate-400 text-right">
                                        Operational Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {members.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-24 text-center">
                                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                                <Shield size={24} className="text-slate-200" />
                                            </div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">
                                                No personnel registered to this node.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    members.map(member => (
                                        <tr key={member.id} className="group hover:bg-[#fcfdfe] transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-indigo-600 text-sm uppercase shadow-inner group-hover:scale-110 transition-transform">
                                                        {member.profiles?.full_name?.charAt(0) || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="text-[13px] font-black text-slate-900 uppercase tracking-tight">
                                                            {member.profiles?.full_name || 'Unknown'}
                                                        </p>
                                                        <div className="flex items-center gap-3 mt-1 text-[9px] text-slate-400 font-black uppercase tracking-widest opacity-70">
                                                            <span className="flex items-center gap-1">
                                                                <Mail size={10} /> {member.profiles?.email || 'OFFLINE'}
                                                            </span>
                                                            <span className="text-slate-200">|</span>
                                                            <span className="flex items-center gap-1">
                                                                <Phone size={10} /> {member.profiles?.phone || 'N/A'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 text-[9px] font-black text-slate-600 border border-slate-100 uppercase tracking-widest shadow-sm">
                                                    <Shield size={12} className="text-indigo-400" />
                                                    {member.role.replace('_', ' ')}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div
                                                    className={`inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${
                                                        member.status === 'ACTIVE'
                                                            ? 'text-emerald-600'
                                                            : member.status === 'SUSPENDED'
                                                              ? 'text-rose-600'
                                                              : 'text-amber-600'
                                                    }`}
                                                >
                                                    <div
                                                        className={`w-1.5 h-1.5 rounded-full ${
                                                            member.status === 'ACTIVE'
                                                                ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                                                                : member.status === 'SUSPENDED'
                                                                  ? 'bg-rose-500'
                                                                  : 'bg-amber-500'
                                                        }`}
                                                    />
                                                    {member.status}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2 outline-none">
                                                    <button
                                                        onClick={() =>
                                                            toggleStatus(
                                                                member.id,
                                                                member.status,
                                                                member.profiles?.full_name || 'Operator'
                                                            )
                                                        }
                                                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                                                            member.status === 'ACTIVE'
                                                                ? 'text-rose-600 border-rose-100 hover:bg-rose-50'
                                                                : 'text-emerald-600 border-emerald-100 hover:bg-emerald-50'
                                                        }`}
                                                    >
                                                        {member.status === 'ACTIVE' ? 'Suspend' : 'Establish'}
                                                    </button>
                                                    <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                                                        <MoreVertical size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <AddMemberModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                tenantId={dealer.id}
                onSuccess={fetchMembers}
            />
        </div>
    );
}
