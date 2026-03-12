'use client';

import React, { useState, useEffect } from 'react';
import {
    X,
    Phone,
    User,
    Shield,
    CheckCircle2,
    AlertCircle,
    Loader2,
    UserPlus,
    Fingerprint,
    Activity,
} from 'lucide-react';
import { lookupMemberByPhone } from '@/app/dashboard/dealers/actions';
import { getErrorMessage } from '@/lib/utils/errorMessage';
import { toast } from 'sonner';

interface AddMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    tenantId: string;
    onSuccess: () => void;
}

type Step = 'phone' | 'details' | 'success';

const ROLES = [
    {
        value: 'OWNER',
        label: 'OPERATIONAL_OWNER',
        description: 'Full architectural clearance and system white-labeling.',
    },
    { value: 'MANAGER', label: 'REGIONAL_MANAGER', description: 'Nodal inventory management and team orchestration.' },
    { value: 'SALES', label: 'COMMERCE_OPERATOR', description: 'Lead resolution and transaction orchestration.' },
    { value: 'FINANCE', label: 'FINANCIAL_AUDITOR', description: 'Settlement matrix analytics and payout management.' },
    { value: 'VIEWER', label: 'SYSTEM_OBSERVER', description: 'Read-only telemetry and registry access.' },
];

export default function AddMemberModal({ isOpen, onClose, tenantId, onSuccess }: AddMemberModalProps) {
    const [step, setStep] = useState<Step>('phone');
    const [phone, setPhone] = useState('');
    const [verifiedMember, setVerifiedMember] = useState<{ id: string; name: string; email?: string } | null>(null);
    const [selectedRole, setSelectedRole] = useState('SALES');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

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
            setError('VALID_INPUT_REQUIRED: Enter 10-digit sequence');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const result = await lookupMemberByPhone(phone);

            if (result.found && result.member) {
                setVerifiedMember({
                    id: result.member.id,
                    name: result.member.full_name || 'Unknown Subject',
                    email: (result.member as any).email,
                });
                setStep('details');
                toast.success('Subject identity verified');
            } else {
                setError('NULL_RESPONSE: Identity not found in global registry.');
            }
        } catch (err: unknown) {
            setError(getErrorMessage(err) || 'VERIFICATION_SEQUENCE_FAILURE');
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
                throw new Error(data.error || 'INTEGRATION_FAILURE');
            }

            setStep('success');
            toast.success('Personnel successfully integrated');
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1500);
        } catch (err: unknown) {
            setError(getErrorMessage(err) || 'INTEGRATION_FAIlURE');
            toast.error('Failed to link member');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-10 pb-6 border-b border-slate-50">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
                            <UserPlus size={28} />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">
                                Add Team Operator
                            </h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5 opacity-70">
                                {step === 'phone' && 'Verify Subject Identity'}
                                {step === 'details' && 'Assing Clearance Tier'}
                                {step === 'success' && 'Integration Successful'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2.5 rounded-xl hover:bg-slate-50 transition-all text-slate-300 hover:text-slate-600 border border-transparent hover:border-slate-100"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-10 space-y-8">
                    {error && (
                        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-center gap-4 animate-in slide-in-from-top-2">
                            <AlertCircle size={20} className="text-rose-500 shrink-0" />
                            <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest leading-relaxed">
                                {error}
                            </p>
                        </div>
                    )}

                    {/* Step 1: Phone Verification */}
                    {step === 'phone' && (
                        <div className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">
                                    Operator Identification (Phone)
                                </label>
                                <div className="flex items-center gap-4 p-5 bg-[#fcfdfe] border border-slate-200 rounded-2xl focus-within:border-indigo-500/50 focus-within:ring-4 focus-within:ring-indigo-500/5 transition-all shadow-sm">
                                    <Phone size={20} className="text-slate-300" />
                                    <span className="text-slate-400 font-black text-lg tracking-widest">+91</span>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        placeholder="000 000 0000"
                                        className="flex-1 bg-transparent text-slate-900 font-black text-lg tracking-[0.2em] focus:outline-none placeholder:text-slate-200"
                                        autoFocus
                                    />
                                </div>
                                <div className="flex items-center gap-2 px-1 text-[9px] text-slate-400 font-bold uppercase tracking-widest opacity-60">
                                    <Activity size={10} className="text-emerald-400" /> Subject must exist in public
                                    registry.
                                </div>
                            </div>

                            <button
                                onClick={handlePhoneVerify}
                                disabled={phone.length < 10 || isLoading}
                                className="w-full py-5 rounded-2xl bg-slate-900 hover:bg-indigo-600 disabled:bg-slate-100 disabled:text-slate-300 text-white font-black text-[11px] uppercase tracking-[0.3em] transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        SYNCHRONIZING...
                                    </>
                                ) : (
                                    <>VERIFY IDENTITY</>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Step 2: Role Selection */}
                    {step === 'details' && verifiedMember && (
                        <div className="space-y-8">
                            {/* Verified Member Info */}
                            <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-white border border-emerald-100 flex items-center justify-center text-emerald-500 shadow-sm">
                                    <User size={28} />
                                </div>
                                <div>
                                    <p className="text-[13px] font-black text-slate-900 uppercase tracking-tight">
                                        {verifiedMember.name}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 opacity-70">
                                        UID: {verifiedMember.id.slice(0, 12).toUpperCase()}...
                                    </p>
                                </div>
                                <div className="ml-auto w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                                    <CheckCircle2 size={24} />
                                </div>
                            </div>

                            {/* Role Selection */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">
                                    Assign Clearance Level
                                </label>
                                <div className="space-y-3 max-h-[280px] overflow-y-auto no-scrollbar pr-1">
                                    {ROLES.map(role => (
                                        <button
                                            key={role.value}
                                            onClick={() => setSelectedRole(role.value)}
                                            className={`w-full p-5 rounded-2xl border text-left transition-all duration-300 relative group ${
                                                selectedRole === role.value
                                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-600/20'
                                                    : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p
                                                        className={`text-[11px] font-black uppercase tracking-[0.15em] ${selectedRole === role.value ? 'text-white' : 'text-slate-900 group-hover:text-indigo-600'}`}
                                                    >
                                                        {role.label}
                                                    </p>
                                                    <p
                                                        className={`text-[9px] mt-1.5 font-bold uppercase tracking-widest leading-relaxed ${selectedRole === role.value ? 'text-indigo-100/70' : 'text-slate-400 group-hover:text-slate-500'}`}
                                                    >
                                                        {role.description}
                                                    </p>
                                                </div>
                                                <div
                                                    className={`w-5 h-5 rounded-full border-2 transition-all ${selectedRole === role.value ? 'border-indigo-400 bg-white scale-110' : 'border-slate-200'}`}
                                                >
                                                    {selectedRole === role.value && (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
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
                                className="w-full py-5 rounded-2xl bg-slate-900 hover:bg-indigo-600 disabled:bg-slate-100 text-white font-black text-[11px] uppercase tracking-[0.3em] transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        INTEGRATING...
                                    </>
                                ) : (
                                    <>
                                        <Shield size={18} />
                                        DEPLOY OPERATOR
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Step 3: Success */}
                    {step === 'success' && (
                        <div className="text-center py-12 animate-in fade-in zoom-in-95 duration-500">
                            <div className="w-24 h-24 mx-auto rounded-[2rem] bg-emerald-500 flex items-center justify-center mb-8 shadow-2xl shadow-emerald-500/30">
                                <CheckCircle2 size={48} className="text-white" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-3">
                                Integration Complete
                            </h3>
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.2em] leading-relaxed max-w-[240px] mx-auto">
                                Subject {verifiedMember?.name} successfully deployed to nodal squad.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
