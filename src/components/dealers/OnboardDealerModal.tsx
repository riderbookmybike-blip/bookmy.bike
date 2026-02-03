'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { X, Building2, MapPin, Phone, Loader2, Rocket, CheckCircle2, XCircle, User, Link2, AlertCircle } from 'lucide-react';
import { onboardDealer, lookupMemberByPhone, checkSlugAvailability } from '@/app/dashboard/dealers/actions';

const formatStudioId = (value: string) => {
    const upper = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const digits = upper.replace(/[^0-9]/g, '').slice(0, 2);
    const letter = upper.replace(/[^A-Z]/g, '').slice(0, 1);
    return `${digits}${letter}`;
};

const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
};

interface OnboardDealerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

type VerificationState = 'idle' | 'verifying' | 'verified' | 'not_found';
type SlugState = 'idle' | 'checking' | 'available' | 'taken';

export default function OnboardDealerModal({ isOpen, onClose, onSuccess }: OnboardDealerModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Step 1: Mobile verification state
    const [phoneInput, setPhoneInput] = useState('');
    const [verificationState, setVerificationState] = useState<VerificationState>('idle');
    const [verifiedMember, setVerifiedMember] = useState<{ id: string; full_name: string } | null>(null);

    // Step 2: Dealership details (shown after verification)
    const [formData, setFormData] = useState({
        dealerName: '',
        slug: '',
        studioId: '',
        pincode: '',
    });

    // Slug availability state
    const [slugState, setSlugState] = useState<SlugState>('idle');
    const [slugSuggestion, setSlugSuggestion] = useState<string | null>(null);

    // Auto-generate slug from dealer name
    useEffect(() => {
        if (formData.dealerName && !formData.slug) {
            const autoSlug = generateSlug(formData.dealerName);
            setFormData(prev => ({ ...prev, slug: autoSlug }));
        }
    }, [formData.dealerName]);

    // Check slug availability with debounce
    useEffect(() => {
        if (!formData.slug || formData.slug.length < 2) {
            setSlugState('idle');
            return;
        }

        const timer = setTimeout(async () => {
            setSlugState('checking');
            const result = await checkSlugAvailability(formData.slug);

            if (result.available) {
                setSlugState('available');
                setSlugSuggestion(null);
            } else {
                setSlugState('taken');
                setSlugSuggestion(result.suggestion || null);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [formData.slug]);

    const handlePhoneVerification = useCallback(async () => {
        if (phoneInput.length < 10) return;

        setVerificationState('verifying');
        setError(null);

        const result = await lookupMemberByPhone(phoneInput);

        if (result.found && result.member) {
            setVerifiedMember({ id: result.member.id, full_name: result.member.full_name });
            setVerificationState('verified');
        } else {
            setVerifiedMember(null);
            setVerificationState('not_found');
        }
    }, [phoneInput]);

    const handleReset = () => {
        setPhoneInput('');
        setVerificationState('idle');
        setVerifiedMember(null);
        setFormData({ dealerName: '', slug: '', studioId: '', pincode: '' });
        setSlugState('idle');
        setSlugSuggestion(null);
        setError(null);
    };

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!verifiedMember) {
            setError('Please verify admin mobile number first');
            return;
        }

        if (slugState !== 'available') {
            setError('Please use an available URL slug');
            return;
        }

        setIsLoading(true);
        setError(null);

        const result = await onboardDealer({
            dealerName: formData.dealerName,
            slug: formData.slug,
            studioId: formData.studioId,
            pincode: formData.pincode,
            memberId: verifiedMember.id
        });

        if (result.success) {
            handleReset();
            onSuccess();
            onClose();
        } else {
            setError(result.error || 'Failed to onboard dealer');
            setIsLoading(false);
        }
    };

    const canSubmit = verificationState === 'verified' && slugState === 'available' && formData.dealerName && formData.pincode;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-950 w-full max-w-lg rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="relative p-8 pb-4">
                    <button
                        onClick={() => { handleReset(); onClose(); }}
                        className="absolute top-6 right-6 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="space-y-1">
                        <div className="flex items-center gap-2 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-lg w-fit">
                            <Rocket size={12} className="text-indigo-600" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">Node Expansion</span>
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
                            Onboard <span className="text-indigo-600">New Dealer</span>
                        </h2>
                        <p className="text-xs text-slate-500 font-medium">
                            {verificationState === 'verified'
                                ? 'Admin verified! Now enter dealership details.'
                                : 'First, verify the admin by mobile number.'}
                        </p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-6">
                    {/* STEP 1: Mobile Verification */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1 flex items-center gap-2">
                            Step 1: Verify Admin
                            {verificationState === 'verified' && <CheckCircle2 size={14} className="text-emerald-500" />}
                        </label>

                        <div className="flex gap-3">
                            <div className="relative group flex-1">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                <input
                                    required
                                    type="tel"
                                    placeholder="Admin Mobile Number"
                                    maxLength={10}
                                    disabled={verificationState === 'verified'}
                                    className={`w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-white/5 border rounded-2xl text-sm font-bold placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all ${verificationState === 'verified'
                                        ? 'border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10'
                                        : verificationState === 'not_found'
                                            ? 'border-rose-300 dark:border-rose-500/30'
                                            : 'border-slate-100 dark:border-white/5'
                                        }`}
                                    value={phoneInput}
                                    onChange={(e) => {
                                        setPhoneInput(e.target.value.replace(/\D/g, ''));
                                        if (verificationState === 'not_found') setVerificationState('idle');
                                    }}
                                />
                            </div>

                            {verificationState !== 'verified' && (
                                <button
                                    type="button"
                                    onClick={handlePhoneVerification}
                                    disabled={phoneInput.length < 10 || verificationState === 'verifying'}
                                    className="px-5 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {verificationState === 'verifying' ? (
                                        <Loader2 className="animate-spin" size={16} />
                                    ) : (
                                        'Verify'
                                    )}
                                </button>
                            )}

                            {verificationState === 'verified' && (
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="px-4 py-3.5 bg-slate-100 dark:bg-white/5 text-slate-500 rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-slate-200 transition-all"
                                >
                                    Change
                                </button>
                            )}
                        </div>

                        {/* Verification Result */}
                        {verificationState === 'verified' && verifiedMember && (
                            <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl">
                                <User size={18} className="text-emerald-600" />
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">{verifiedMember.full_name}</p>
                                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Will be assigned as Dealership Admin</p>
                                </div>
                                <CheckCircle2 size={20} className="text-emerald-500" />
                            </div>
                        )}

                        {verificationState === 'not_found' && (
                            <div className="flex items-center gap-3 px-4 py-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl">
                                <XCircle size={18} className="text-rose-600" />
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-rose-800 dark:text-rose-300">Member Not Found</p>
                                    <p className="text-[10px] text-rose-600 dark:text-rose-400">This mobile is not registered. Ask user to sign up first.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* STEP 2: Dealer Details (shown only after verification) */}
                    {verificationState === 'verified' && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Step 2: Dealership Details</label>
                            <div className="grid grid-cols-1 gap-4">
                                {/* Dealer Name */}
                                <div className="relative group">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                    <input
                                        required
                                        type="text"
                                        placeholder="Dealership Name"
                                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl text-sm font-bold placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                                        value={formData.dealerName}
                                        onChange={(e) => {
                                            const name = e.target.value;
                                            setFormData(prev => ({
                                                ...prev,
                                                dealerName: name,
                                                slug: generateSlug(name)
                                            }));
                                        }}
                                    />
                                </div>

                                {/* URL Slug (Editable) */}
                                <div className="space-y-2">
                                    <div className="relative group">
                                        <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                        <input
                                            required
                                            type="text"
                                            placeholder="url-slug"
                                            className={`w-full pl-12 pr-20 py-3.5 bg-slate-50 dark:bg-white/5 border rounded-2xl text-sm font-mono font-bold placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all ${slugState === 'available'
                                                    ? 'border-emerald-300 dark:border-emerald-500/30'
                                                    : slugState === 'taken'
                                                        ? 'border-rose-300 dark:border-rose-500/30'
                                                        : 'border-slate-100 dark:border-white/5'
                                                }`}
                                            value={formData.slug}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                                            }))}
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                            {slugState === 'checking' && <Loader2 size={16} className="animate-spin text-slate-400" />}
                                            {slugState === 'available' && <CheckCircle2 size={16} className="text-emerald-500" />}
                                            {slugState === 'taken' && <XCircle size={16} className="text-rose-500" />}
                                        </div>
                                    </div>

                                    {/* Slug Preview & Status */}
                                    <div className={`px-3 py-2 rounded-xl text-xs font-medium ${slugState === 'available'
                                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                            : slugState === 'taken'
                                                ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300'
                                                : 'bg-slate-50 dark:bg-white/5 text-slate-500'
                                        }`}>
                                        {slugState === 'available' && (
                                            <span>✓ Will be available at: <span className="font-mono font-bold">/dealer/{formData.slug}</span></span>
                                        )}
                                        {slugState === 'taken' && (
                                            <div className="flex items-center justify-between">
                                                <span className="flex items-center gap-1">
                                                    <AlertCircle size={12} /> Slug already taken
                                                </span>
                                                {slugSuggestion && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData(prev => ({ ...prev, slug: slugSuggestion! }))}
                                                        className="text-indigo-600 hover:underline font-bold"
                                                    >
                                                        Use "{slugSuggestion}"
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                        {slugState === 'checking' && <span>Checking availability...</span>}
                                        {slugState === 'idle' && formData.slug && <span>Enter at least 2 characters</span>}
                                    </div>
                                </div>

                                {/* Studio ID */}
                                <div className="relative group">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Studio ID (e.g., 48C) — Optional"
                                        maxLength={5}
                                        className="w-full pl-12 pr-20 py-3.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl text-sm font-bold placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                                        value={formData.studioId}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            studioId: formatStudioId(e.target.value)
                                        }))}
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-300 uppercase">Optional</span>
                                </div>

                                {/* Pincode */}
                                <div className="relative group">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                    <input
                                        required
                                        type="text"
                                        placeholder="Regional Pincode"
                                        maxLength={6}
                                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl text-sm font-bold placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                                        value={formData.pincode}
                                        onChange={(e) => setFormData(prev => ({ ...prev, pincode: e.target.value.replace(/\D/g, '') }))}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider text-center bg-rose-50 dark:bg-rose-500/10 py-2 rounded-lg border border-rose-100 dark:border-rose-500/20">
                            Error: {error}
                        </p>
                    )}

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => { handleReset(); onClose(); }}
                            className="flex-1 px-8 py-4 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !canSubmit}
                            className="flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin" size={16} />
                            ) : (
                                <>
                                    <span>Deploy Node</span>
                                    <Rocket size={16} />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
