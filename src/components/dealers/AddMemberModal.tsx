'use client';

import React, { useState, useEffect } from 'react';
import { X, Phone, User, Shield, CheckCircle2, AlertCircle, Loader2, UserPlus } from 'lucide-react';
import { lookupMemberByPhone } from '@/app/dashboard/dealers/actions';

interface AddMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    tenantId: string;
    onSuccess: () => void;
}

type Step = 'phone' | 'details' | 'success';

const ROLES = [
    { value: 'OWNER', label: 'Owner', description: 'Full access to all settings and data' },
    { value: 'MANAGER', label: 'Manager', description: 'Can manage inventory, leads, and team' },
    { value: 'SALES', label: 'Sales', description: 'Can view leads and create quotes' },
    { value: 'FINANCE', label: 'Finance', description: 'Access to financial reports and payouts' },
    { value: 'VIEWER', label: 'Viewer', description: 'Read-only access to dashboard' },
];

export default function AddMemberModal({ isOpen, onClose, tenantId, onSuccess }: AddMemberModalProps) {
    const [step, setStep] = useState<Step>('phone');
    const [phone, setPhone] = useState('');
    const [verifiedMember, setVerifiedMember] = useState<{ id: string; name: string; email?: string } | null>(null);
    const [selectedRole, setSelectedRole] = useState('SALES');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setStep('phone');
            setPhone('');
            setVerifiedMember(null);
            setSelectedRole('SALES');
            setError('');
        }
    }, [isOpen]);

    const handlePhoneVerify = async () => {
        if (phone.length < 10) {
            setError('Enter valid 10-digit phone number');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const result = await lookupMemberByPhone(phone);

            if (result.found && result.member) {
                setVerifiedMember({
                    id: result.member.id,
                    name: result.member.full_name || 'Unknown',
                    email: (result.member as any).email,
                });
                setStep('details');
            } else {
                setError('No member found with this phone number. Member must register first.');
            }
        } catch (err: unknown) {
            setError(err.message || 'Verification failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddMember = async () => {
        if (!verifiedMember) return;

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/dealers/add-member', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenantId,
                    memberId: verifiedMember.id,
                    role: selectedRole,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to add member');
            }

            setStep('success');
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1500);
        } catch (err: unknown) {
            setError(err.message || 'Failed to add member');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                            <UserPlus size={20} className="text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Add Team Member</h2>
                            <p className="text-xs text-slate-500">
                                {step === 'phone' && 'Verify member by phone'}
                                {step === 'details' && 'Assign role and permissions'}
                                {step === 'success' && 'Member added successfully'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                            <AlertCircle size={18} className="text-red-400 shrink-0" />
                            <p className="text-sm text-red-300">{error}</p>
                        </div>
                    )}

                    {/* Step 1: Phone Verification */}
                    {step === 'phone' && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Member's Phone Number
                                </label>
                                <div className="flex items-center gap-2 p-4 bg-slate-800 rounded-xl border border-slate-700 focus-within:border-indigo-500 transition-colors">
                                    <Phone size={18} className="text-slate-500" />
                                    <span className="text-slate-400 font-mono">+91</span>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        placeholder="9876543210"
                                        className="flex-1 bg-transparent text-white font-mono text-lg focus:outline-none placeholder:text-slate-600"
                                        autoFocus
                                    />
                                </div>
                                <p className="text-xs text-slate-500">
                                    Member must be registered on BookMyBike platform
                                </p>
                            </div>

                            <button
                                onClick={handlePhoneVerify}
                                disabled={phone.length < 10 || isLoading}
                                className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    'Verify Member'
                                )}
                            </button>
                        </div>
                    )}

                    {/* Step 2: Role Selection */}
                    {step === 'details' && verifiedMember && (
                        <div className="space-y-6">
                            {/* Verified Member Info */}
                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                        <User size={24} className="text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">{verifiedMember.name}</p>
                                        <p className="text-xs text-slate-400">{verifiedMember.email || phone}</p>
                                    </div>
                                    <CheckCircle2 size={20} className="text-emerald-400 ml-auto" />
                                </div>
                            </div>

                            {/* Role Selection */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Select Role
                                </label>
                                <div className="space-y-2">
                                    {ROLES.map(role => (
                                        <button
                                            key={role.value}
                                            onClick={() => setSelectedRole(role.value)}
                                            className={`w-full p-4 rounded-xl border text-left transition-all ${
                                                selectedRole === role.value
                                                    ? 'bg-indigo-500/10 border-indigo-500/50'
                                                    : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p
                                                        className={`text-sm font-bold ${
                                                            selectedRole === role.value
                                                                ? 'text-indigo-400'
                                                                : 'text-white'
                                                        }`}
                                                    >
                                                        {role.label}
                                                    </p>
                                                    <p className="text-xs text-slate-500 mt-0.5">{role.description}</p>
                                                </div>
                                                <div
                                                    className={`w-4 h-4 rounded-full border-2 ${
                                                        selectedRole === role.value
                                                            ? 'border-indigo-500 bg-indigo-500'
                                                            : 'border-slate-600'
                                                    }`}
                                                >
                                                    {selectedRole === role.value && (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleAddMember}
                                disabled={isLoading}
                                className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-bold text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Adding Member...
                                    </>
                                ) : (
                                    <>
                                        <Shield size={18} />
                                        Add to Team
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Step 3: Success */}
                    {step === 'success' && (
                        <div className="text-center py-8">
                            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                                <CheckCircle2 size={40} className="text-emerald-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Member Added!</h3>
                            <p className="text-sm text-slate-400">
                                {verifiedMember?.name} has been added to your team as {selectedRole}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
