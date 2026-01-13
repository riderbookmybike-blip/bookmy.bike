'use client';

import React, { useState, useEffect } from 'react';
import { Phone, ArrowRight, Lock, User, MapPin, Loader2, X, ShieldCheck, CheckCircle2, AlertCircle, Globe } from 'lucide-react';
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
    const [step, setStep] = useState<'PHONE' | 'NAME' | 'OTP'>('PHONE');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [showNameField, setShowNameField] = useState(false); // New state for progressive profiling
    const [location, setLocation] = useState<{
        pincode: string | null;
        city: string | null;
        state: string | null;
        country: string | null;
        latitude: number | null;
        longitude: number | null;
        loading: boolean;
        isServiceable: boolean | null
    }>({
        pincode: null,
        city: null,
        state: null,
        country: null,
        latitude: null,
        longitude: null,
        loading: false,
        isServiceable: null
    });
    const [resendTimer, setResendTimer] = useState(0);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [resendTimer]);

    useEffect(() => {
        if (variant !== 'TERMINAL' && isOpen && !location.pincode) {
            detectLocation();
        }
    }, [isOpen]);

    const detectLocation = () => {
        if ("geolocation" in navigator) {
            setLocation(prev => ({ ...prev, loading: true }));
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    // Smart Geocoding (Cache First -> Google API -> Mock)
                    const { latitude, longitude } = position.coords;
                    const result = await getSmartPincode(
                        latitude,
                        longitude,
                        process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY // Safe to pass undefined (will trigger Mock)
                    );

                    // Silently update state with whatever we got
                    setLocation(prev => ({
                        ...prev,
                        loading: false,
                        pincode: result.pincode,
                        city: result.city,
                        state: result.state || null,
                        country: result.country || null,
                        latitude: result.latitude || latitude,
                        longitude: result.longitude || longitude,
                        isServiceable: result.pincode ? result.pincode.startsWith('400') : null
                    }));
                },
                (error) => {
                    console.error("Geolocation error:", error);
                    // Silently fail, just stop loading
                    setLocation(prev => ({ ...prev, loading: false }));
                }
            );
        }
    };

    // Removed handlePincodeSubmit and related manual edit state for silent mode


    // MSG91 SDK Integration (Global Listener)
    const [msg91Loaded, setMsg91Loaded] = useState(false);

    useEffect(() => {
        // Check if already ready globally
        if ((window as any).isMsg91Ready) {
            setMsg91Loaded(true);
        } else {
            // Listen for global ready event
            const handleReady = () => setMsg91Loaded(true);
            window.addEventListener('msg91_app_ready', handleReady);
            return () => window.removeEventListener('msg91_app_ready', handleReady);
        }
    }, []);

    const handleSendOtp = async () => {
        if (!msg91Loaded) {
            alert('Security System Loading... Please wait.');
            return;
        }

        setLoading(true);

        try {
            setLoginError(null);
            // 1. Check Membership / Authorization for this specific Tenant
            const checkRes = await fetch('/api/auth/check-membership', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, tenantId })
            });
            const checkData = await checkRes.json();

            if (!checkData.success) {
                setLoginError(checkData.message || 'Access Denied.');
                setLoading(false);
                return;
            }

            // 2. Handle New User Flow (Progressive Profiling)
            // If user doesn't exist yet but is allowed to join (Marketplace only)
            if (checkData.isNew) {
                if (!showNameField) {
                    setShowNameField(true);
                    setLoading(false);
                    return;
                }
                if (fullName.length < 3) {
                    setLoading(false);
                    return;
                }
            }

            // 3. Send OTP via Server-Side API (bypasses widget CORS issues on subdomains)
            const otpRes = await fetch('/api/auth/otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, action: 'send' })
            });
            const otpData = await otpRes.json();

            if (otpData.success) {
                console.log('OTP Sent Success:', otpData);
                setStep('OTP');
                setResendTimer(30);
                setLoading(false);
            } else {
                console.error('OTP Send Error:', otpData);
                setLoginError(otpData.message || 'Failed to send OTP');
                setLoading(false);
            }
        } catch (err) {
            console.error('Check User/Send OTP Error:', err);
            setLoading(false);
            alert('Connection interrupted. Please try again.');
        }
    };

    const handleLogin = async () => {
        if (otp.length < 4) return;
        setLoading(true);

        try {
            // Verify OTP via Server-Side API (bypasses widget CORS issues)
            const verifyRes = await fetch('/api/auth/otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, action: 'verify', otp })
            });
            const verifyData = await verifyRes.json();

            if (verifyData.success) {
                console.log('OTP Verified:', verifyData);
                await completeLogin();
            } else {
                console.error('OTP Verify Error:', verifyData);
                setLoginError(verifyData.message || 'Invalid OTP. Please try again.');
                setLoading(false);
            }
        } catch (err) {
            setLoginError('Verification error.');
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            setStep('PHONE');
            setPhone('');
            setOtp('');
            setLoginError('');
            setShowNameField(false);
            console.log('LoginSidebar Version: v2.1.1 (Fix Build Error)'); // Cache Buster
        }
    }, [isOpen]);

    const completeLogin = async () => {
        // Finalize login session on our backend

        if (true) { // Successfully verified via Client SDK
            console.log('Completing login with fullName:', fullName);
            // Better fallback logic
            const isSignup = showNameField; // Determined earlier by check-membership API
            const displayName = fullName && fullName.trim().length > 0 ? fullName : `Rider ${phone.slice(-4)}`;

            try {
                let authRes;

                if (isSignup) {
                    // NEW USER: Explicit Signup Flow
                    authRes = await fetch('/api/auth/signup', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            phone,
                            displayName,
                            pincode: location.pincode
                        })
                    });
                } else {
                    // EXISTING USER: Login/Sync Flow (Read-Only)
                    authRes = await fetch('/api/auth/msg91/sync', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            phone,
                            // Location data purely for session logs, not profile update
                            pincode: location.pincode,
                            city: location.city,
                            state: location.state,
                            country: location.country,
                            latitude: location.latitude,
                            longitude: location.longitude
                        })
                    });
                }

                if (!authRes.ok) {
                    const errData = await authRes.json();
                    console.error('Auth System Error:', errData);

                    if (authRes.status === 404 && !isSignup) {
                        alert('Account not found. Please sign up on the main website.');
                    } else if (authRes.status === 409 && isSignup) {
                        alert('User already exists. Please login instead.');
                    } else {
                        alert(`Authentication Error: ${errData.message || 'System error'}.`);
                    }
                    setLoading(false);
                    return; // Stop execution
                }

            } catch (err) {
                console.error('Auth Network Error', err);
                alert('Connection Error with Auth Server. Please try again.');
                setLoading(false);
                return;
            }

            setTenantType('MARKETPLACE'); // Default role
            localStorage.setItem('user_name', displayName);
            localStorage.setItem('tenant_type', 'MARKETPLACE');
            localStorage.setItem('user_role', 'BMB_USER'); // Explicitly set role
            localStorage.setItem('active_role', 'BMB_USER'); // Explicitly set role
            window.dispatchEvent(new Event('storage'));
            document.cookie = 'aums_session=true; path=/;';

            // STRICT DOMAIN SEPARATION
            const isMarketplaceDomain = window.location.hostname === 'bookmy.bike' || window.location.hostname === 'www.bookmy.bike' || window.location.hostname === 'localhost';

            if (isMarketplaceDomain) {
                // CONSUMER SITE: Stay on page, just refresh auth
                window.location.reload();
            } else {
                // OPS SITE (we.bookmy.bike etc): Go to dashboard
                router.push('/dashboard');
            }

            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex justify-end items-start pt-28 pr-6 overflow-hidden pointer-events-none">
            {/* Backdrop with ultra-subtle blur and transparency */}
            <div
                className="absolute inset-0 bg-black/10 backdrop-blur-[2px] animate-in fade-in duration-500 pointer-events-auto"
                onClick={onClose}
            />

            {/* Sidebar Container - Glassmorphic Floating Island */}
            <div className="relative w-full max-w-xl h-fit max-h-[calc(100vh-8rem)] bg-white/90 dark:bg-slate-950/20 backdrop-blur-3xl shadow-[0_0_100px_rgba(0,0,0,0.2)] flex flex-col animate-in slide-in-from-right duration-700 cubic-bezier(0.16, 1, 0.3, 1) border border-slate-200 dark:border-white/5 rounded-[48px] overflow-hidden pointer-events-auto">

                {/* Grainy Texture Overlay */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] grayscale bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

                {/* Top Interactive Progress/Status */}
                <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-1000 ease-out"
                        style={{ width: step === 'PHONE' ? '40%' : '80%' }}
                    />
                </div>

                {/* Header Section */}
                <div className="p-10 pb-6 flex items-center justify-between">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className={`h-0.5 w-12 rounded-full ${variant === 'TERMINAL' ? 'bg-blue-600' : 'bg-slate-300'}`} />
                            <span className={`text-[10px] font-black uppercase tracking-[0.3em] italic ${variant === 'TERMINAL' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                                {variant === 'TERMINAL' ? 'Terminal Uplink' : 'Account Access'}
                            </span>
                        </div>
                        <h2 className={`font-black uppercase tracking-tighter italic leading-[0.9] text-slate-900 dark:text-white ${variant === 'TERMINAL' ? 'text-5xl' : 'text-4xl'}`}>
                            {step === 'PHONE'
                                ? (variant === 'TERMINAL' ? <>Initialize <br /> Access</> : <>Welcome <br /> Back</>)
                                : (variant === 'TERMINAL' ? <>Verify <br /> Protocol</> : <>Verify <br /> It's You</>)
                            }
                        </h2>
                        <p className="text-xs text-slate-500 font-medium tracking-wide leading-relaxed max-w-[280px]">
                            {step === 'PHONE'
                                ? (variant === 'TERMINAL'
                                    ? "Handshake required for AUMS administrative session. Restricted area."
                                    : "Enter your mobile number to sign in to your BookMyBike account.")
                                : `Verification code sent to +91 ${phone.slice(-4)}.`}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl transition-all group active:scale-90 self-start"
                    >
                        <X size={24} className="text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
                    </button>
                </div>

                {/* Pincode / Serviceability Section - SILENT MODE ACTIVATED (Hidden from UI) */}
                {/* We are still capturing location in background but not showing it here to reduce friction */}

                {/* Core Authentication Interface */}
                <div className="flex-1 overflow-y-auto px-10 space-y-8 pt-10">
                    <div className="space-y-8">

                        <div className="space-y-8">
                            <div className="relative group overflow-hidden">
                                <div className="absolute inset-0 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[32px] transition-all group-focus-within:border-blue-600 group-focus-within:ring-[16px] group-focus-within:ring-blue-600/5" />

                                <div className="relative p-2">
                                    {loginError && (
                                        <div className="mx-2 mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <AlertCircle size={18} className="text-red-500 shrink-0" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-red-500 italic">
                                                {loginError}
                                            </p>
                                        </div>
                                    )}

                                    {step === 'PHONE' ? (
                                        <div className="space-y-4">
                                            {/* Name Input - Conditionally Rendered */}
                                            {showNameField && (
                                                <div className="flex items-center px-6 py-4 border-b border-slate-100 dark:border-white/5 animate-in slide-in-from-top-4 duration-500 fade-in">
                                                    <div className="flex items-center gap-3 pr-6 border-r border-slate-200 dark:border-white/10">
                                                        <User size={18} className="text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        placeholder="Your Full Name"
                                                        value={fullName}
                                                        onChange={(e) => setFullName(e.target.value)}
                                                        className="bg-transparent border-none outline-none text-lg font-bold text-slate-900 dark:text-white w-full pl-6 placeholder:text-slate-300 dark:placeholder:text-slate-700"
                                                        autoFocus
                                                    />
                                                </div>
                                            )}

                                            {/* Phone Input */}
                                            <div className="flex items-center px-6 py-4">
                                                <div className="flex items-center gap-3 pr-6 border-r border-slate-200 dark:border-white/10">
                                                    <Phone size={18} className="text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                                    <span className="text-xs font-black text-slate-500">+91</span>
                                                </div>
                                                <input
                                                    type="tel"
                                                    placeholder="Mobile Number"
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                                    className="bg-transparent border-none outline-none text-xl font-black tracking-[0.3em] text-slate-900 dark:text-white w-full pl-6 placeholder:text-slate-300 dark:placeholder:text-slate-700 placeholder:tracking-normal"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center px-6 py-4">
                                            <Lock size={18} className="text-slate-400 group-focus-within:text-blue-600 transition-colors mr-6" />
                                            <input
                                                type="tel"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                placeholder="Enter OTP"
                                                value={otp}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/\D/g, '');
                                                    if (val.length <= 4) setOtp(val);
                                                }}
                                                className="w-full bg-transparent text-lg font-bold placeholder:text-slate-400 focus:outline-none tracking-widest"
                                                autoFocus
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <button
                                    onClick={step === 'PHONE' ? handleSendOtp : handleLogin}
                                    disabled={
                                        loading ||
                                        (step === 'PHONE'
                                            ? (phone.length < 10 || (showNameField && fullName.length < 3) || !msg91Loaded)
                                            : otp.length < 4
                                        )
                                    }
                                    className={`w-full py-6 rounded-[32px] text-xs font-black uppercase tracking-[0.3em] italic flex items-center justify-center gap-4 transition-all shadow-2xl active:scale-[0.98] ${loading || !msg91Loaded ? 'bg-blue-600/50 cursor-wait' : 'bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500'
                                        } text-white shadow-blue-600/20 disabled:opacity-50`}
                                >
                                    {loading ? (
                                        <div className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" />
                                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:0.2s]" />
                                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:0.4s]" />
                                        </div>
                                    ) : !msg91Loaded && step === 'PHONE' ? (
                                        <span>Connecting Secure Server...</span>
                                    ) : (
                                        <>{step === 'PHONE' ? 'Initialize' : 'Authorize Protocol'} <ArrowRight size={16} /></>
                                    )}
                                </button>

                                {step === 'OTP' && (
                                    <div className="flex flex-col gap-3 items-center">
                                        <button
                                            onClick={handleSendOtp}
                                            disabled={loading || resendTimer > 0}
                                            className="text-[10px] font-black text-blue-600 disabled:text-slate-400 uppercase tracking-widest transition-colors"
                                        >
                                            {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                                        </button>
                                        <button
                                            onClick={() => setStep('PHONE')}
                                            className="text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors"
                                        >
                                            Edit Endpoint
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Infrastructure Insights */}
                        <div className="pt-12 border-t border-slate-100 dark:border-white/5 grid grid-cols-2 gap-8 opacity-60">
                            <div className="space-y-3">
                                <CheckCircle2 size={20} className="text-emerald-500" />
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Store Clearance</p>
                            </div>
                            <div className="space-y-3">
                                <ShieldCheck size={20} className="text-indigo-500" />
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Secure Pipeline</p>
                            </div>
                        </div>
                    </div>

                    {/* Infrastructure Footer */}
                    <div className="p-10 border-t border-slate-100 dark:border-white/5 flex items-center justify-between opacity-50">
                        <div className="flex items-center gap-3">
                            {variant === 'TERMINAL' ? (
                                <>
                                    <ShieldCheck size={16} className="text-emerald-500" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">SOC2-v2 Secure</span>
                                </>
                            ) : (
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Secure Retail Gateway</span>
                            )}
                        </div>
                        <Globe size={16} className="text-slate-300" />
                    </div>
                </div>
                {/* Script removed from here to be handled programmatically in useEffect for better control */}
            </div>
        </div>
    );
}

