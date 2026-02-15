'use client';

import React, { useState, useEffect } from 'react';
import { Users, Search, ShieldCheck, ShieldAlert, Loader2, X, Check, Phone, Mail, Building2 } from 'lucide-react';
import { getFinancerTeamAccess, updateFinancerUserAccess } from '@/actions/finance-partners';

interface FinancerAccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    dealerId: string;
    financeId: string;
    financeName: string;
}

export default function FinancerAccessModal({
    isOpen,
    onClose,
    dealerId,
    financeId,
    financeName,
}: FinancerAccessModalProps) {
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchAccess = async () => {
        setLoading(true);
        const res = await getFinancerTeamAccess(dealerId, financeId);
        if (res.success) {
            setMembers(res.members || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (isOpen && dealerId && financeId) {
            fetchAccess();
        }
    }, [isOpen, dealerId, financeId]);

    const handleToggleAccess = async (userId: string, currentAccess: boolean) => {
        setUpdating(userId);
        const res = await updateFinancerUserAccess(dealerId, financeId, userId, !currentAccess);
        if (res.success) {
            setMembers(prev => prev.map(m => (m.userId === userId ? { ...m, crmAccess: !currentAccess } : m)));
        }
        setUpdating(null);
    };

    if (!isOpen) return null;

    const filteredMembers = members.filter(
        m => m.name?.toLowerCase().includes(searchQuery.toLowerCase()) || m.phone?.includes(searchQuery)
    );

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 dark:border-white/5 animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <Users size={20} />
                            </div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                                Team Access Control
                            </h2>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-14">
                            Managing <span className="text-blue-500">{financeName}</span> Staff Access to your CRM
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors"
                    >
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-6 pb-0">
                    <div className="relative group">
                        <Search
                            className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
                            size={18}
                        />
                        <input
                            type="text"
                            placeholder="Search staff by name or phone..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-[20px] text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                        />
                    </div>
                </div>

                {/* Member List */}
                <div className="p-6 h-[400px] overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center gap-3">
                            <Loader2 className="animate-spin text-blue-500" size={32} />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Loading Partner Team...
                            </p>
                        </div>
                    ) : filteredMembers.length > 0 ? (
                        <div className="space-y-3">
                            {filteredMembers.map(member => (
                                <div
                                    key={member.userId}
                                    className="p-4 rounded-[24px] border border-slate-100 dark:border-white/5 bg-white dark:bg-white/2 hover:border-blue-500/30 transition-all flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400 font-black italic text-lg uppercase group-hover:text-blue-500 transition-colors">
                                            {member.name?.charAt(0) || <Users size={20} />}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1">
                                                {member.name}
                                            </h4>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    <Phone size={10} />
                                                    {member.phone}
                                                </div>
                                                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    <ShieldCheck size={10} />
                                                    {member.role || 'FINANCE'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => handleToggleAccess(member.userId, member.crmAccess)}
                                            disabled={!!updating}
                                            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                                                member.crmAccess
                                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                                    : 'bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                            }`}
                                        >
                                            {updating === member.userId ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : member.crmAccess ? (
                                                <ShieldCheck size={14} />
                                            ) : (
                                                <ShieldAlert size={14} />
                                            )}
                                            {member.crmAccess ? 'CRM Access Enabled' : 'Grant CRM Access'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center gap-4 border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[32px]">
                            <Users size={48} className="text-slate-200" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                {searchQuery ? 'No matching staff found' : 'No staff members found for this partner'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer Tip */}
                <div className="p-6 bg-blue-500/5 border-t border-slate-100 dark:border-white/5">
                    <div className="flex gap-3">
                        <ShieldCheck className="text-blue-500 shrink-0" size={18} />
                        <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 leading-relaxed uppercase tracking-widest">
                            Staff with CRM Access can create <span className="text-blue-600">Leads</span>, generate{' '}
                            <span className="text-blue-600">Quotes</span>, and book{' '}
                            <span className="text-blue-600">Orders</span> representing your dealership.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
