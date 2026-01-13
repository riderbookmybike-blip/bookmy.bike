'use client';
import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { Phone, ArrowRight, Lock, User, X, AlertCircle, Globe, RefreshCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTenant } from '@/lib/tenant/tenantContext';
import { createClient } from '@/lib/supabase/client';
import { getSmartPincode } from '@/lib/location/geocode';

interface LoginSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    variant?: 'TERMINAL' | 'RETAIL';
}

export default function LoginSidebar({ isOpen, onClose, variant = 'TERMINAL' }: LoginSidebarProps) {
    const router = useRouter();
    const { setTenantType, tenantId } = useTenant();
    const [loginError, setLoginError] = useState<string | null>(null);
    const [step, setStep] = useState<'INITIAL' | 'SIGNUP' | 'OTP'>('INITIAL');
    const [authMethod, setAuthMethod] = useState<'PHONE' | 'EMAIL'>('PHONE');
    const [isMarketplace, setIsMarketplace] = useState(true);

    const [identifier, setIdentifier] = useState('');
    const [otp, setOtp] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const [showEmailPath, setShowEmailPath] = useState(false); // Enable email for Staff on Root or explicit selection
    const [otpFallbackVisible, setOtpFallbackVisible] = useState(false);

    // Existence Info
    const [detectedRole, setDetectedRole] = useState<string | null>(null);
    const [isStaff, setIsStaff] = useState(false);

    const [location, setLocation] = useState<{
        pincode: string | null;
        city: string | null;
        state: string | null;
        country: string | null;
        latitude: number | null;
        longitude: number | null;
        loading: boolean;
        isServiceable: boolean | null;
    }>({
        pincode: null,
        city: null,
        state: null,
        country: null,
        latitude: null,
        longitude: null,
        loading: false,
        isServiceable: null,
    });

    const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'bookmy.bike';

    // Utility: Clear all Supabase auth cookies (zombie killer)
    const clearAuthCookies = () => {
        const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.split('.')[0].split('//')[1];
        if (!projectRef) return;

        const baseName = `sb-${projectRef}-auth-token`;
        const cookieOptions = 'path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';

        // Clear all potential cookie variants
        ['', '.0', '.1', '.2'].forEach(suffix => {
            document.cookie = `${baseName}${suffix}=; ${cookieOptions}`;
        });
    };

    const detectLocation = () => {
        if ('geolocation' in navigator) {
            setLocation(prev => ({ ...prev, loading: true }));
            navigator.geolocation.getCurrentPosition(
                async position => {
                    const { latitude, longitude } = position.coords;
                    const result = await getSmartPincode(latitude, longitude, process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY);

                    setLocation(prev => ({
                        ...prev,
                        loading: false,
                        pincode: result.pincode,
                        city: result.city,
                        state: result.state || null,
                        country: result.country || null,
                        latitude: result.latitude || latitude,
                        longitude: result.longitude || longitude,
                        isServiceable: result.pincode ? result.pincode.startsWith('400') : null,
                    }));
                },
                error => {
                    console.error('Geolocation error:', error);
                    setLocation(prev => ({ ...prev, loading: false }));
                }
            );
        }
    };

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer(prev => prev - 1);
            }, 1000);
        } else if (step === 'OTP' && resendTimer === 0) {
            setOtpFallbackVisible(true);
        }
        return () => clearInterval(interval);
    }, [resendTimer, step]);

    useEffect(() => {
        if (isOpen) {
            // Clear any existing auth cookies when opening login sidebar
            clearAuthCookies();

            setStep('INITIAL');
            const hostname = window.location.hostname;
            const isMarketplaceDomain =
                hostname === ROOT_DOMAIN || hostname === `www.${ROOT_DOMAIN}` || hostname === 'localhost';

            setIsMarketplace(isMarketplaceDomain);
            setShowEmailPath(!isMarketplaceDomain); // Default to Email UI for CRM/AUMS

            // Background location capture for marketplace only
            if (isMarketplaceDomain) {
                detectLocation();
            }

            setIdentifier('');
            setOtp('');
            setFullName('');
            setLoginError(null);
            setIsStaff(false);
            setOtpFallbackVisible(false);
        }
    }, [isOpen, ROOT_DOMAIN]);

    const handleCheckUser = async () => {
        if (!identifier || identifier.length < 3) return;

        setLoading(true);
        setLoginError(null);

        // Automatic Detection
        const isEmail = identifier.includes('@');
        const phoneVal = !isEmail ? identifier.replace(/\D/g, '') : '';

        if (!isEmail && phoneVal.length < 10) {
            setLoginError('Please enter a valid 10-digit mobile number.');
            setLoading(false);
            return;
        }

        const method = isEmail ? 'EMAIL' : 'PHONE';
        setAuthMethod(method);

        try {
            const checkRes = await fetch('/api/auth/check-membership', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: method === 'PHONE' ? phoneVal : undefined,
                    email: method === 'EMAIL' ? identifier : undefined,
                    tenantId,
                }),
            });
            const checkData = await checkRes.json();

            if (!checkData.success && !checkData.isNew) {
                setLoginError(checkData.message || 'Access Denied.');
                setLoading(false);
                return;
            }

            // GUARD: Prevent email signup on Marketplace (Root Domain)
            if (checkData.isNew && method === 'EMAIL' && !tenantId) {
                setLoginError('Email signup is restricted to authorized staff. Please use a mobile number.');
                setLoading(false);
                return;
            }

            if (checkData.role) setDetectedRole(checkData.role);

            const staffDetected = (checkData.role && checkData.role !== 'BMB_USER') || !!tenantId;
            setIsStaff(staffDetected);

            if (checkData.isNew) {
                if (tenantId) {
                    setLoginError('Account not found. Staff access requires manual pre-registration.');
                    setLoading(false);
                    return;
                }
                setStep('SIGNUP');
            } else {
                // Route everyone to OTP
                if (method === 'EMAIL') {
                    await handleSendEmailOtp(identifier);
                } else {
                    await handleSendPhoneOtp(phoneVal);
                }
            }
        } catch (err) {
            console.error('Check User Error:', err);
            setLoginError('Network Error.');
            setLoading(false);
        }
    };

    const handleSendPhoneOtp = async (phoneOverride?: string) => {
        const phoneVal = phoneOverride || identifier.replace(/\D/g, '');
        if (!phoneVal || phoneVal.length < 10) return;

        setLoading(true);
        try {
            const res = await fetch('/api/auth/msg91/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: phoneVal }),
            });
            const data = await res.json();
            if (data.success) {
                setStep('OTP');
                setResendTimer(30);
                setOtpFallbackVisible(false);
            } else {
                setLoginError(data.message || 'Failed to send OTP.');
            }
        } catch (err) {
            console.error('OTP Send Error:', err);
            setLoginError('Connection failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleSendEmailOtp = async (email: string) => {
        setLoading(true);
        try {
            const supabase = createClient();
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    shouldCreateUser: false, // Ensure we don't implicitly create users here if not desired
                },
            });

            if (error) {
                setLoginError(error.message);
                setLoading(false);
                return;
            }

            setStep('OTP');
            setResendTimer(30);
            setOtpFallbackVisible(false);
        } catch (err) {
            console.error('Email OTP Send Error:', err);
            setLoginError('Connection failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async () => {
        if (otp.length < 4) return;
        setLoading(true);
        setLoginError(null);

        const phoneVal = identifier.replace(/\D/g, '');

        try {
            const supabase = createClient();

            if (authMethod === 'PHONE') {
                const res = await fetch('/api/auth/msg91/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ phone: phoneVal, otp }),
                });

                const verifyData = await res.json();
                if (verifyData.success && verifyData.session) {
                    await supabase.auth.setSession(verifyData.session);
                    // Small delay to ensure cookies are fully written to browser storage
                    await new Promise(resolve => setTimeout(resolve, 500));
                    await completeLogin(verifyData.user, verifyData.session);
                } else {
                    setLoginError(verifyData.message || 'Verification failed.');
                    setOtpFallbackVisible(true);
                }
            } else {
                // Email Verification
                const { data, error } = await supabase.auth.verifyOtp({
                    email: identifier,
                    token: otp,
                    type: 'email',
                });

                if (error) {
                    setLoginError(error.message);
                    setOtpFallbackVisible(true);
                } else if (data.session) {
                    await supabase.auth.setSession(data.session);
                    await completeLogin(data.user, data.session);
                }
            }
        } catch (err) {
            console.error('OTP Verify Error:', err);
            setLoginError('Service unavailable.');
        } finally {
            setLoading(false);
        }
    };

    interface AuthUser {
        id: string;
        phone?: string;
        email?: string;
        user_metadata?: {
            full_name?: string;
        };
    }

    const completeLogin = async (user: AuthUser, session?: Session) => {
        const isEmail = identifier.includes('@');
        const phoneVal = !isEmail ? identifier.replace(/\D/g, '') : user?.phone || '';
        const emailVal = isEmail ? identifier : user?.email || '';

        try {
            let syncData: { role?: string; displayName?: string } = {};

            if (step === 'SIGNUP') {
                const syncRes = await fetch('/api/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        phone: phoneVal,
                        email: emailVal,
                        displayName: fullName || `Rider ${phoneVal?.slice(-4) || 'User'}`,
                        pincode: location.pincode,
                    }),
                });
                syncData = await syncRes.json();
            } else if (authMethod === 'PHONE') {
                const syncRes = await fetch('/api/auth/msg91/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        phone: phoneVal,
                        pincode: isStaff ? null : location.pincode,
                    }),
                });
                syncData = await syncRes.json();
            }

            // Finalize State
            const isMarketplaceDomain =
                window.location.hostname === ROOT_DOMAIN ||
                window.location.hostname === `www.${ROOT_DOMAIN}` ||
                window.location.hostname === 'localhost';

            const finalRole = detectedRole || syncData.role || 'BMB_USER';
            const finalTenantType = isMarketplaceDomain ? 'MARKETPLACE' : 'DEALER';

            setTenantType(finalTenantType);
            localStorage.setItem(
                'user_name',
                syncData.displayName || fullName || user?.user_metadata?.full_name || 'User'
            );
            localStorage.setItem('tenant_type', finalTenantType);
            localStorage.setItem('user_role', finalRole);
            localStorage.setItem('active_role', finalRole);

            if (isMarketplaceDomain) {
                window.location.reload();
            } else {
                // Server has already set cookies via setSession in verify API
                // Just force navigation to ensure they're sent to middleware
                window.location.href = '/dashboard';
            }
            onClose();
        } catch (err) {
            console.error('Final Sync Error:', err);
            setLoginError('Session established, but profile sync failed.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex justify-end items-start pt-28 pr-6 overflow-hidden pointer-events-none">
            <div
                className="absolute inset-0 bg-black/10 backdrop-blur-[2px] animate-in fade-in duration-500 pointer-events-auto"
                onClick={onClose}
            />

            <div className="relative w-full max-w-xl h-fit max-h-[calc(100vh-8rem)] bg-white/90 dark:bg-slate-950/20 backdrop-blur-3xl shadow-[0_0_100px_rgba(0,0,0,0.2)] flex flex-col animate-in slide-in-from-right duration-700 border border-slate-200 dark:border-white/5 rounded-[48px] overflow-hidden pointer-events-auto">
                <div className="absolute inset-0 pointer-events-none opacity-[0.03] grayscale bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

                <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-1000 ease-out"
                        style={{ width: step === 'INITIAL' ? '40%' : '80%' }}
                    />
                </div>

                <div className="p-10 pb-6 flex items-center justify-between">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className={`h-0.5 w-12 rounded-full ${isStaff ? 'bg-blue-600' : 'bg-slate-300'}`} />
                            <span
                                className={`text-[10px] font-black uppercase tracking-[0.3em] italic ${isStaff ? 'text-blue-600' : 'text-slate-400'}`}
                            >
                                {isStaff ? 'System Uplink' : 'Account Access'}
                            </span>
                        </div>
                        <h2
                            className={`font-black uppercase tracking-tighter italic leading-[0.9] text-slate-900 dark:text-white ${variant === 'TERMINAL' ? 'text-5xl' : 'text-4xl'}`}
                        >
                            {step === 'INITIAL' || step === 'SIGNUP'
                                ? isStaff
                                    ? 'Initialize Access'
                                    : step === 'SIGNUP'
                                      ? 'Create Account'
                                      : 'Welcome Back'
                                : 'Verify Protocol'}
                        </h2>
                        <p className="text-xs text-slate-500 font-medium tracking-wide leading-relaxed max-w-[280px]">
                            {step === 'INITIAL'
                                ? isStaff
                                    ? 'Staff authentication required for administrative access.'
                                    : 'Enter your mobile number or corporate email to continue.'
                                : step === 'SIGNUP'
                                  ? 'Join the community of riders. Start your journey.'
                                  : `Code sent to your ${authMethod === 'PHONE' ? 'mobile' : 'email'}.`}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 hover:bg-slate-100 rounded-2xl transition-all group active:scale-90 self-start"
                    >
                        <X size={24} className="text-slate-300 group-hover:text-slate-900 transition-colors" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-10 space-y-8 pt-10">
                    <div className="relative group overflow-hidden">
                        <div className="absolute inset-0 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[32px] transition-all group-focus-within:border-blue-600 group-focus-within:ring-[16px] group-focus-within:ring-blue-600/5" />

                        <div className="relative p-2">
                            {loginError && (
                                <div className="mx-2 mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                    <AlertCircle size={18} className="text-red-500 shrink-0" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-red-500 italic">
                                        {loginError}
                                    </p>
                                </div>
                            )}

                            {step === 'INITIAL' || step === 'SIGNUP' ? (
                                <div className="space-y-4">
                                    {step === 'SIGNUP' && (
                                        <div className="flex items-center px-6 py-4 border-b border-slate-100">
                                            <User size={18} className="text-slate-400 mr-6" />
                                            <input
                                                type="text"
                                                placeholder="Your Full Name"
                                                value={fullName}
                                                onChange={e => setFullName(e.target.value)}
                                                className="bg-transparent border-none outline-none text-lg font-bold text-slate-900 w-full"
                                                autoFocus
                                            />
                                        </div>
                                    )}
                                    <div className="flex items-center px-6 py-4">
                                        {authMethod === 'EMAIL' ||
                                        (!isMarketplace && showEmailPath) ||
                                        identifier.includes('@') ? (
                                            <Globe size={18} className="text-slate-400 mr-6" />
                                        ) : (
                                            <Phone size={18} className="text-slate-400 mr-6" />
                                        )}
                                        <input
                                            type="text"
                                            placeholder={
                                                showEmailPath || !isMarketplace
                                                    ? 'Mobile or Corporate Email'
                                                    : 'Enter Mobile Number'
                                            }
                                            value={identifier}
                                            onChange={e => setIdentifier(e.target.value)}
                                            className={`bg-transparent border-none outline-none text-lg font-bold w-full ${isStaff || !isMarketplace ? 'text-white placeholder:text-slate-500' : 'text-slate-900 placeholder:text-slate-300'}`}
                                            autoFocus={step === 'INITIAL'}
                                            disabled={step === 'SIGNUP'}
                                        />
                                    </div>

                                    {/* Fallback Switcher for Initial Step if needed? No, logic handles types. 
                                        But we can add a helper for Marketplace users. */}
                                    {isMarketplace && step === 'INITIAL' && !showEmailPath && (
                                        <div className="px-6 pb-4">
                                            <button
                                                onClick={() => setShowEmailPath(true)}
                                                className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors"
                                            >
                                                Use Email ID
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    {step === 'OTP' && (
                                        <>
                                            <div className="flex items-center px-6 py-4">
                                                <Lock size={18} className="text-slate-400 mr-6" />
                                                <input
                                                    type="tel"
                                                    placeholder={
                                                        authMethod === 'PHONE'
                                                            ? 'Enter 4-digit code'
                                                            : 'Enter 6-digit code'
                                                    }
                                                    value={otp}
                                                    onChange={e =>
                                                        setOtp(
                                                            e.target.value
                                                                .replace(/\D/g, '')
                                                                .slice(0, authMethod === 'PHONE' ? 4 : 6)
                                                        )
                                                    }
                                                    className={`w-full bg-transparent text-lg font-bold tracking-widest focus:outline-none ${isStaff || !isMarketplace ? 'text-white placeholder:text-slate-500' : 'text-slate-900 placeholder:text-slate-300'}`}
                                                    autoFocus
                                                />
                                            </div>
                                            <div className="px-6 pb-4 text-center">
                                                <span className="text-[10px] font-bold text-slate-400">
                                                    Sent to {identifier}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <button
                            onClick={() => {
                                if (step === 'INITIAL') handleCheckUser();
                                else if (step === 'SIGNUP')
                                    authMethod === 'EMAIL' ? handleSendEmailOtp(identifier) : handleSendPhoneOtp();
                                else if (step === 'OTP') handleLogin();
                            }}
                            disabled={loading || identifier.length < 3}
                            className={`w-full py-6 rounded-[32px] text-xs font-black uppercase tracking-[0.3em] italic flex items-center justify-center gap-4 transition-all shadow-2xl active:scale-[0.98] ${
                                loading ? 'bg-blue-600/50 cursor-wait' : 'bg-slate-900 dark:bg-blue-600'
                            } text-white disabled:opacity-50`}
                        >
                            {loading ? 'Processing...' : step === 'INITIAL' ? 'Continue' : 'Verify'}
                            <ArrowRight size={16} />
                        </button>

                        {step === 'OTP' && (
                            <div className="flex flex-col gap-3 items-center">
                                <button
                                    onClick={() =>
                                        authMethod === 'EMAIL' ? handleSendEmailOtp(identifier) : handleSendPhoneOtp()
                                    }
                                    disabled={loading || resendTimer > 0}
                                    className="text-[10px] font-black text-blue-600 disabled:text-slate-400 uppercase tracking-widest"
                                >
                                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                                </button>
                                <button
                                    onClick={() => setStep('INITIAL')}
                                    className="text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest"
                                >
                                    Use Different Account
                                </button>

                                {otpFallbackVisible && (
                                    <div className="pt-2 animate-in fade-in slide-in-from-bottom-2">
                                        <button
                                            onClick={() => {
                                                const newMethod = authMethod === 'PHONE' ? 'EMAIL' : 'PHONE';
                                                setAuthMethod(newMethod);
                                                setShowEmailPath(newMethod === 'EMAIL');
                                                setStep('INITIAL');
                                                setIdentifier('');
                                                setOtp('');
                                            }}
                                            className="flex items-center gap-2 text-[10px] font-black text-amber-500 hover:text-amber-600 uppercase tracking-widest p-2 bg-amber-500/10 rounded-lg"
                                        >
                                            <RefreshCcw size={12} />
                                            {authMethod === 'PHONE'
                                                ? 'Try Email Verification'
                                                : 'Try Phone Verification'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-10 border-t border-slate-100 flex items-center justify-between opacity-50 mt-auto">
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">
                            Secure Endpoint
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
