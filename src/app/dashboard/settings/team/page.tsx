'use client';

import React, { useState, useEffect } from 'react';
import { useTenant } from '@/lib/tenant/tenantContext';
import { createClient } from '@/lib/supabase/client';
import { Users, UserPlus, MoreVertical, Shield, Search, X } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

import { can } from '@/lib/auth/rbac';
import { getErrorMessage } from '@/lib/utils/errorMessage';

type Member = {
    id: string; // membership id
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

export default function TeamPage() {
    const { tenantId, userRole, tenantSlug } = useTenant();
    const basePath = tenantSlug ? `/app/${tenantSlug}/dashboard` : '/dashboard';
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const fetchUser = async () => {
            const supabase = createClient();
            const { data } = await supabase.auth.getUser();
            setCurrentUser(data.user);
        };
        fetchUser();
    }, []);

    useEffect(() => {
        if (tenantId) fetchMembers();
    }, [tenantId]);

    const fetchMembers = async () => {
        setLoading(true);
        const supabase = createClient();
        const { data, error } = await supabase
            .from('memberships')
            .select('*, profiles(full_name, email, phone)')
            .eq('tenant_id', (tenantId as string) || '')
            .order('created_at', { ascending: false });

        if (data) setMembers(data as any);
        setLoading(false);
    };

    const toggleStatus = async (memberId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
        // Optimistic update
        setMembers(prev => prev.map(m => (m.id === memberId ? { ...m, status: newStatus as any } : m)));

        const supabase = createClient();
        await supabase.from('memberships').update({ status: newStatus }).eq('id', memberId);
    };

    // Transfer Logic
    const [transferTarget, setTransferTarget] = useState<{ id: string; name: string } | null>(null);

    const handleTransferOwnership = (targetUserId: string, targetName: string) => {
        setTransferTarget({ id: targetUserId, name: targetName });
    };

    const confirmTransfer = async () => {
        if (!transferTarget || !tenantId) return;
        const confirmName = prompt(
            `To confirm transfer of ownership to ${transferTarget.name}, please type their name:`
        );
        if (confirmName !== transferTarget.name) {
            alert('Name mismatch. Transfer cancelled.');
            return;
        }

        try {
            const { transferOwnership } = await import('@/app/actions/ownership');
            const result = await transferOwnership(transferTarget.id, tenantId);
            if (result.success) {
                alert('Ownership Transferred! You are now an Admin.');
                setTransferTarget(null);
                window.location.reload(); // Refresh to reflect role change
            }
        } catch (err: unknown) {
            alert(getErrorMessage(err));
        }
    };

    const handleInvite = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        formData.append('tenantId', tenantId || '');

        try {
            const { createInvite } = await import('@/app/actions/invitations');
            const result = await createInvite(null, formData);

            if (result.success) {
                alert(`Invite Created! Share this token for now (Email is stubbed): \n\n ${result.debugToken}`);
                setIsInviteOpen(false);
                fetchMembers();
            } else {
                alert(result.message);
            }
        } catch (err) {
            console.error(err);
            alert('Failed to invite.');
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href={`${basePath}/settings`}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors"
                    >
                        <Users size={24} className="text-slate-900 dark:text-white" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                            Team Management
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Manage access to your dashboard.</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsInviteOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/30"
                >
                    <UserPlus size={16} /> Invite Member
                </button>
            </div>

            {/* List */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-slate-400">Loading team...</div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-white/5">
                                <th className="p-6 text-xs font-black uppercase tracking-wider text-slate-400">
                                    Member
                                </th>
                                <th className="p-6 text-xs font-black uppercase tracking-wider text-slate-400">Role</th>
                                <th className="p-6 text-xs font-black uppercase tracking-wider text-slate-400">
                                    Status
                                </th>
                                <th className="p-6 text-xs font-black uppercase tracking-wider text-slate-400 text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {members.map(member => (
                                <tr
                                    key={member.id}
                                    className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                                >
                                    <td className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center font-bold text-slate-500 dark:text-slate-300">
                                                {member.profiles?.full_name?.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white">
                                                    {member.profiles?.full_name || 'Unknown User'}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {member.profiles?.email ||
                                                        member.profiles?.phone ||
                                                        'No contact info'}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 dark:bg-white/5 text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                                            <Shield size={12} /> {member.role.replace('_', ' ')}
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <span
                                            className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${
                                                member.status === 'ACTIVE'
                                                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                                                    : member.status === 'SUSPENDED'
                                                      ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400'
                                                      : 'bg-orange-100 text-orange-600'
                                            }`}
                                        >
                                            {member.status}
                                        </span>
                                    </td>
                                    <td className="p-6 text-right space-x-2">
                                        {can(userRole, 'transfer_ownership') &&
                                            member.user_id !== currentUser?.id &&
                                            member.status === 'ACTIVE' && (
                                                <button
                                                    onClick={() =>
                                                        handleTransferOwnership(
                                                            member.user_id,
                                                            member.profiles.full_name
                                                        )
                                                    }
                                                    className="text-xs font-bold text-slate-400 hover:text-amber-600 transition-colors"
                                                >
                                                    Transfer Owner
                                                </button>
                                            )}
                                        <button
                                            onClick={() => toggleStatus(member.id, member.status)}
                                            className="text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors"
                                        >
                                            {member.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Invite Modal */}
            {isInviteOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-8 shadow-2xl space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">Invite Team Member</h3>
                            <button
                                onClick={() => setIsInviteOpen(false)}
                                className="p-2 hover:bg-slate-100 rounded-full"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleInvite} className="space-y-4">
                            <div>
                                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 block">
                                    Email / Phone
                                </label>
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="colleague@example.com"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 block">
                                    Role
                                </label>
                                <select
                                    name="role"
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="DEALER_STAFF">Staff (Sales/Ops)</option>
                                    <option value="DEALER_ADMIN">Admin (Full Access)</option>
                                    <option value="SALES_EXEC">Sales Executive</option>
                                </select>
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl text-xs font-black uppercase tracking-wider"
                            >
                                Send Invitation
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
