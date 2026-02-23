'use client';

import React, { useState, useEffect } from 'react';
import { useTenant } from '@/lib/tenant/tenantContext';
import { createClient } from '@/lib/supabase/client';
import { User, Phone, Mail, ArrowRight, Shield, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { normalizeIndianPhone } from '@/lib/utils/inputFormatters';
import Link from 'next/link';
import { User as SupabaseUser } from '@supabase/supabase-js';

export default function ProfileSettingsPage() {
    const { tenantName, tenantSlug } = useTenant();
    const basePath = tenantSlug ? `/app/${tenantSlug}/dashboard` : '/dashboard';
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [identities, setIdentities] = useState<any[]>([]);

    // Phone Linking State
    const [isLinkingPhone, setIsLinkingPhone] = useState(false);
    const [phoneValues, setPhoneValues] = useState({ phone: '', otp: '' });
    const [phoneStep, setPhoneStep] = useState<'INPUT' | 'OTP'>('INPUT');
    const [status, setStatus] = useState<'IDLE' | 'SENDING' | 'VERIFYING' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        fetchUser();
    }, []);

    const fetchUser = async () => {
        const supabase = createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (user) {
            setUser(user);
            setIdentities(user.identities || []);
        }
        setLoading(false);
    };

    const handleLinkGoogle = async () => {
        const supabase = createClient();
        const origin = window.location.origin;
        // Uses the same callback but for linking
        await supabase.auth.linkIdentity({
            provider: 'google',
            options: {
                redirectTo: `${origin}/auth/callback?next=${basePath}/settings/profile`,
            },
        });
    };

    const handleSendPhoneOtp = async () => {
        if (phoneValues.phone.length < 10) return;
        setStatus('SENDING');
        setErrorMsg('');

        const supabase = createClient();
        const { error } = await supabase.auth.updateUser({
            phone: `+91${normalizeIndianPhone(phoneValues.phone)}`,
        });

        if (error) {
            setStatus('ERROR');
            setErrorMsg(error.message);
        } else {
            setStatus('IDLE');
            setPhoneStep('OTP');
        }
    };

    const handleVerifyPhoneOtp = async () => {
        if (phoneValues.otp.length < 6) return;
        setStatus('VERIFYING');
        setErrorMsg('');

        const supabase = createClient();
        const { error } = await supabase.auth.verifyOtp({
            phone: `+91${normalizeIndianPhone(phoneValues.phone)}`,
            token: phoneValues.otp,
            type: 'phone_change',
        });

        if (error) {
            setStatus('ERROR');
            setErrorMsg(error.message);
        } else {
            setStatus('SUCCESS');
            // Refresh User
            await fetchUser();
            setTimeout(() => {
                setIsLinkingPhone(false);
                setPhoneValues({ phone: '', otp: '' });
                setPhoneStep('INPUT');
                setStatus('IDLE');
            }, 1500);
        }
    };

    // Helper to check if provider is linked
    const isProviderLinked = (provider: string) => {
        return identities.some(id => id.provider === provider);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href={`${basePath}/settings`}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors"
                >
                    <User size={24} className="text-slate-900 dark:text-white" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">My Profile</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        Manage your personal account and login methods.
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="p-12 text-center text-slate-400">Loading profile...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Identity Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-white/5 shadow-sm space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
                                <Shield className="text-indigo-600 dark:text-indigo-400" size={24} />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-900 dark:text-white">Login Methods</h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    Connect multiple ways to sign in to your account.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Google */}
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                <div className="flex items-center gap-3">
                                    <Mail size={18} className="text-slate-400" />
                                    <div>
                                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                                            Google Account
                                        </div>
                                        {isProviderLinked('google') && (
                                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                                <CheckCircle2 size={10} /> Connected
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {!isProviderLinked('google') ? (
                                    <button
                                        onClick={handleLinkGoogle}
                                        className="text-xs font-black uppercase text-indigo-600 hover:text-indigo-500 flex items-center gap-2"
                                    >
                                        Connect <ArrowRight size={12} />
                                    </button>
                                ) : (
                                    <div className="text-xs font-bold text-slate-400">Linked</div>
                                )}
                            </div>

                            {/* Phone */}
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                <div className="flex items-center gap-3">
                                    <Phone size={18} className="text-slate-400" />
                                    <div>
                                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                                            Phone Number
                                        </div>
                                        {user?.phone ? (
                                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                                <CheckCircle2 size={10} /> {user.phone}
                                            </div>
                                        ) : (
                                            <div className="text-[10px] text-slate-400 font-bold">Not connected</div>
                                        )}
                                    </div>
                                </div>
                                {!user?.phone ? (
                                    <button
                                        onClick={() => setIsLinkingPhone(true)}
                                        className="text-xs font-black uppercase text-indigo-600 hover:text-indigo-500 flex items-center gap-2"
                                    >
                                        Connect <ArrowRight size={12} />
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setIsLinkingPhone(true)}
                                        className="text-xs font-bold text-slate-400 hover:text-slate-600"
                                    >
                                        Update
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Phone Linking Panel */}
                    {isLinkingPhone && (
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-white/5 shadow-2xl shadow-indigo-500/10 space-y-6 animate-in slide-in-from-right-8 fade-in duration-500">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-black text-slate-900 dark:text-white">
                                    {phoneStep === 'INPUT' ? 'Add Phone Number' : 'Verify Code'}
                                </h3>
                                <button
                                    onClick={() => setIsLinkingPhone(false)}
                                    className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                                >
                                    Cancel
                                </button>
                            </div>

                            {phoneStep === 'INPUT' ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">
                                            Mobile Number
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <div className="px-3 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-500">
                                                +91
                                            </div>
                                            <input
                                                type="tel"
                                                value={phoneValues.phone}
                                                onChange={e =>
                                                    setPhoneValues({
                                                        ...phoneValues,
                                                        phone: normalizeIndianPhone(e.target.value),
                                                    })
                                                }
                                                placeholder="98765 43210"
                                                className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 transition-colors"
                                                autoFocus
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleSendPhoneOtp}
                                        disabled={status === 'SENDING' || phoneValues.phone.length < 10}
                                        className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl text-xs font-black uppercase tracking-wider disabled:opacity-50"
                                    >
                                        {status === 'SENDING' ? (
                                            <Loader2 className="animate-spin mx-auto" size={16} />
                                        ) : (
                                            'Send OTP'
                                        )}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-xs text-slate-500">
                                        Enter the code sent to <b>+91 {phoneValues.phone}</b>
                                    </p>
                                    <input
                                        type="text"
                                        value={phoneValues.otp}
                                        onChange={e =>
                                            setPhoneValues({
                                                ...phoneValues,
                                                otp: e.target.value.replace(/\D/g, '').slice(0, 6),
                                            })
                                        }
                                        placeholder="000000"
                                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-center text-2xl font-black tracking-[0.5em] outline-none focus:border-indigo-500 transition-colors"
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleVerifyPhoneOtp}
                                        disabled={status === 'VERIFYING' || phoneValues.otp.length < 6}
                                        className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider disabled:opacity-50 transition-colors ${
                                            status === 'SUCCESS'
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                                        }`}
                                    >
                                        {status === 'VERIFYING' ? (
                                            <Loader2 className="animate-spin mx-auto" size={16} />
                                        ) : status === 'SUCCESS' ? (
                                            'Verified!'
                                        ) : (
                                            'Verify & Link'
                                        )}
                                    </button>
                                </div>
                            )}

                            {errorMsg && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
                                    <AlertTriangle className="text-red-500" size={16} />
                                    <span className="text-xs font-bold text-red-500">{errorMsg}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
