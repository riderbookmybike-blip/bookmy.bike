'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Lock, Phone, ShieldCheck, Zap, BarChart3, Globe, CheckCircle2, AlertTriangle, ChevronRight, Check } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { useTenant } from '@/lib/tenant/tenantContext';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
    const router = useRouter();
    const { setTenantType, tenantConfig, tenantName } = useTenant();
    const supabase = createClient();
    const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [status, setStatus] = useState<'IDLE' | 'VALIDATING' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [errorMsg, setErrorMsg] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

    // Branding Defaults
    const brandName = tenantConfig?.brand?.displayName || tenantName || 'BookMyBike';
    const primaryColor = tenantConfig?.brand?.primaryColor || '#4F46E5';
    const logoUrl = tenantConfig?.brand?.logoUrl;

    // Load saved phone on mount
    useEffect(() => {
        const savedPhone = localStorage.getItem('remembered_phone');
        if (savedPhone) {
            setPhone(savedPhone);
            setRememberMe(true);
        }
    }, []);

    const handleSendOtp = async (inputPhone?: string) => {
        const targetPhone = inputPhone || phone;
        if (targetPhone.length < 10) return;

        setStatus('VALIDATING');
        setErrorMsg('');

        // Save or Clear Phone based on preference
        if (rememberMe) {
            localStorage.setItem('remembered_phone', targetPhone);
        } else {
            localStorage.removeItem('remembered_phone');
        }

        // Mock API Call
        await new Promise(r => setTimeout(r, 800)); // Slightly faster for better DX

        setStatus('IDLE');
        setStep('OTP');
    };

    const handleVerifyOtp = async (inputOtp?: string) => {
        const targetOtp = inputOtp || otp;
        if (targetOtp.length < 4) return;

        setStatus('VALIDATING');
        setErrorMsg('');

        // Mock Verification Delay
        await new Promise(r => setTimeout(r, 800));

        if (targetOtp === '6424' || targetOtp === '1234') {
            try {
                // Use state 'phone' here as it should be set
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone, otp: targetOtp }),
                });

                const data = await res.json();

                if (res.ok && data.success) {
                    // STRICT VALIDATION: Ensure User has a valid Organization/Role
                    if (!data.role || !data.name) {
                        setStatus('ERROR');
                        setErrorMsg('Account configuration incomplete. Please contact support.');
                        return; // ABORT LOGIN
                    }

                    // CRITICAL: Manually hydrate client session if provided
                    if (data.session) {
                        // 1. Await Supabase Internal Persistence
                        const { error } = await supabase.auth.setSession(data.session);
                        if (error) console.error('Manual Session Set Error:', error);

                        // 2. BACKUP: Explicitly save to localStorage for disaster recovery
                        localStorage.setItem('sb-access-token', data.session.access_token);
                        localStorage.setItem('sb-refresh-token', data.session.refresh_token);

                        // 3. UI PRE-HYDRATION: seamless transition
                        localStorage.setItem('user_name', data.name);
                        localStorage.setItem('user_role', data.role);
                        localStorage.setItem('active_role', data.role);
                        localStorage.setItem('tenant_name', data.tenant_name || '');
                        if (data.tenant_id) localStorage.setItem('tenant_id', data.tenant_id);
                    }

                    if (data.role) {
                        setTenantType(data.role as any);
                    }

                    setStatus('SUCCESS');

                    // 3. VERIFY: Ensure persistence is confirmed before redirect
                    let saved = false;
                    for (let i = 0; i < 10; i++) {
                        if (localStorage.getItem('sb-access-token')) {
                            saved = true;
                            break;
                        }
                        await new Promise(r => setTimeout(r, 50));
                    }

                    if (!saved) {
                        console.error('LocalStorage Write Failed');
                        // Proceed anyway, hoping memory persistence works
                    }

                    // FORCE RELOAD: Ensure cookies are sent to server and state is fresh
                    window.location.href = '/dashboard';
                } else {
                    setStatus('ERROR');
                    setErrorMsg(data.message || 'Authentication failed.');
                }
            } catch (err) {
                setStatus('ERROR');
                setErrorMsg('Network error. Please try again.');
            }
        } else {
            setStatus('ERROR');
            setErrorMsg('Invalid PIN. Please enter 6424.');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            if (step === 'PHONE' && phone.length >= 10) handleSendOtp();
            if (step === 'OTP' && otp.length >= 4) handleVerifyOtp();
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col md:flex-row font-sans selection:bg-indigo-500/30">
            {/* Left Section: B2B Branding & Content */}
            <div className="hidden md:flex md:w-[45%] lg:w-[40%] bg-slate-950 relative overflow-hidden flex-col p-20 justify-between">
                {/* Background Magic - High-end Deep Indigo/Slate Gradient */}
                <div className="absolute inset-0">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_0%_0%,var(--primary-color-alpha,rgba(79,70,229,0.2)),transparent_70%)]"
                        style={{ '--primary-color-alpha': `${primaryColor}33` } as any}
                    />
                    <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_100%,rgba(16,185,129,0.1),transparent_70%)]" />

                    {/* Perspective Grid */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] [transform:perspective(1000px)_rotateX(60deg)_translateY(-100px)] opacity-50" />

                    {/* Floating Orbs */}
                    <div className="absolute top-1/3 -left-20 w-[500px] h-[500px] blur-[120px] rounded-full animate-float transition-transform duration-1000"
                        style={{ backgroundColor: `${primaryColor}1A` }} // 10% opacity
                    />
                </div>

                <div className="relative z-10 flex flex-col gap-24">
                    <div className="group cursor-default">
                        {logoUrl ? (
                            <img src={logoUrl} alt={brandName} className="h-12 object-contain" />
                        ) : (
                            <Logo variant="light" className="h-10 transition-all group-hover:scale-105 group-hover:brightness-125" />
                        )}
                        <div className="mt-4 flex items-center gap-2">
                            <div className="h-px w-8 bg-indigo-500/50" style={{ backgroundColor: primaryColor }} />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: primaryColor }}>
                                {tenantName === 'Loading...' ? 'Next Gen Auto OS' : 'Partner Portal'}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-12 max-w-lg">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-xl">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white italic">Node [ACTIVE]</span>
                        </div>

                        <div className="space-y-6">
                            <h1 className="text-6xl lg:text-7xl font-black uppercase tracking-tighter italic leading-[0.8] text-white">
                                {brandName} <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white/50 to-white/90">Portal</span>
                            </h1>

                            <p className="text-slate-400 text-sm md:text-base leading-relaxed font-medium max-w-sm border-l-2 pl-8" style={{ borderColor: `${primaryColor}4d` }}>
                                Secure access for authorized personnel only. Manage inventory, leads, and financing in real-time.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Performance Stats Overlay */}
                <div className="relative z-10 p-10 rounded-[40px] bg-white/5 border border-white/10 backdrop-blur-3xl overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                        style={{ '--tw-gradient-from': `${primaryColor}1A` } as any}
                    />
                    <div className="grid grid-cols-2 gap-12">
                        <div className="space-y-2">
                            <div className="text-4xl font-black text-white italic tracking-tighter">100%</div>
                            <div className="text-[9px] font-black uppercase tracking-widest flex items-center gap-2" style={{ color: primaryColor }}>
                                <BarChart3 size={10} /> Secure Uptime
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="text-4xl font-black text-white italic tracking-tighter">24/7</div>
                            <div className="text-[9px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-2">
                                <Zap size={10} /> Support Access
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Section: Form Interface */}
            <div className="flex-1 bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-8 md:p-12 relative overflow-y-auto">
                {/* Visual Flair */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] blur-[120px] rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none"
                    style={{ backgroundColor: `${primaryColor}0D` }}
                />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/5 blur-[100px] rounded-full -translate-x-1/2 translate-y-1/2 pointer-events-none" />

                <div className="w-full max-w-sm space-y-8 relative z-10">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-0.5 w-12 rounded-full" style={{ backgroundColor: primaryColor }} />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] italic" style={{ color: primaryColor }}>{brandName} Terminal</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white leading-[0.9]">
                            Initialize <br /> Access
                        </h2>
                        <p className="text-xs text-slate-500 font-medium tracking-wide leading-relaxed">
                            {step === 'PHONE'
                                ? `Authentication required for ${brandName} session. Restricted area.`
                                : "Encryption sequence sent. Finalize the 4-digit protocol."}
                        </p>
                    </div>

                    <div className="space-y-6">
                        {/* Google OAuth Button */}
                        <div className="relative group/google">
                            <button
                                onClick={async () => {
                                    const supabase = createClient();
                                    const returnUrl = '/dashboard';
                                    const origin = window.location.origin;
                                    const callbackUrl = `${origin}/auth/callback`; // Strict match (no params)

                                    await supabase.auth.signInWithOAuth({
                                        provider: 'google',
                                        options: {
                                            redirectTo: callbackUrl,
                                            queryParams: {
                                                access_type: 'offline',
                                                prompt: 'consent'
                                            },
                                        },
                                    });
                                }}
                                className="w-full py-4 mb-6 rounded-[24px] bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center gap-3 transition-all group-hover/google:shadow-lg group-hover/google:shadow-indigo-500/10"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.21.81-.63z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Continue with Google</span>
                            </button>

                            <div className="relative flex py-2 items-center mb-6">
                                <div className="flex-grow border-t border-slate-200 dark:border-white/10"></div>
                                <span className="flex-shrink-0 mx-4 text-[10px] font-black uppercase tracking-widest text-slate-400">OR Use Terminal ID</span>
                                <div className="flex-grow border-t border-slate-200 dark:border-white/10"></div>
                            </div>
                        </div>

                        <div className="relative group overflow-hidden">
                            <div className="absolute inset-0 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[32px] transition-all group-focus-within:border-indigo-600 group-focus-within:ring-[16px] group-focus-within:ring-indigo-600/5" />

                            <div className="relative p-2">
                                {step === 'PHONE' ? (
                                    <div className="flex items-center px-6 py-4">
                                        <div className="flex items-center gap-3 pr-6 border-r border-slate-200 dark:border-white/10">
                                            <Phone size={18} className="text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                            <span className="text-xs font-black text-slate-500">+91</span>
                                        </div>
                                        <input
                                            type="tel"
                                            placeholder="XXXXX XXXXX"
                                            value={phone}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                                setPhone(val);
                                                if (status === 'ERROR') setStatus('IDLE');
                                                // AUTO-ADVANCE
                                                if (val.length === 10) {
                                                    handleSendOtp(val);
                                                }
                                            }}
                                            onKeyDown={handleKeyDown}
                                            className="bg-transparent border-none outline-none text-xl font-black tracking-[0.3em] text-slate-900 dark:text-white w-full pl-6 placeholder:text-slate-200 placeholder:tracking-normal"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex items-center px-6 py-4">
                                        <Lock size={18} className="text-slate-400 group-focus-within:text-indigo-600 transition-colors mr-6" />
                                        <input
                                            type="text"
                                            placeholder="VERIFICATION PIN"
                                            value={otp}
                                            maxLength={4}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                                                setOtp(val);
                                                if (status === 'ERROR') setStatus('IDLE');
                                                // AUTO-LOGIN
                                                if (val.length === 4) {
                                                    handleVerifyOtp(val);
                                                }
                                            }}
                                            onKeyDown={handleKeyDown}
                                            className="bg-transparent border-none outline-none text-xl font-black tracking-[1em] text-slate-900 dark:text-white w-full text-center placeholder:text-slate-200 placeholder:tracking-normal"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Remember Me Checkbox (Phone Step Only) */}
                        {step === 'PHONE' && (
                            <div className="flex items-center gap-3 px-2">
                                <button
                                    onClick={() => setRememberMe(!rememberMe)}
                                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${rememberMe ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 dark:border-white/20 hover:border-indigo-500'}`}
                                >
                                    {rememberMe && <Check size={12} className="text-white" strokeWidth={4} />}
                                </button>
                                <span
                                    onClick={() => setRememberMe(!rememberMe)}
                                    className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors"
                                >
                                    Remember terminal ID
                                </span>
                            </div>
                        )}

                        {status === 'ERROR' && (
                            <div className="flex items-center gap-4 p-5 bg-red-500/5 border border-red-500/10 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-500">
                                <AlertTriangle className="text-red-500 shrink-0" size={20} />
                                <p className="text-[11px] font-black uppercase tracking-widest text-red-500 italic leading-snug">{errorMsg || 'Handshake failed.'}</p>
                            </div>
                        )}

                        <div className="space-y-6">
                            <button
                                onClick={() => step === 'PHONE' ? handleSendOtp() : handleVerifyOtp()}
                                disabled={status === 'VALIDATING' || (step === 'PHONE' ? phone.length < 10 : otp.length < 4)}
                                className={`w-full py-6 rounded-[32px] text-xs font-black uppercase tracking-[0.3em] italic flex items-center justify-center gap-4 transition-all shadow-2xl active:scale-[0.98] ${status === 'SUCCESS' ? 'bg-emerald-600 text-white' :
                                    status === 'VALIDATING' ? 'bg-indigo-600/50 text-white cursor-wait' :
                                        'bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white shadow-indigo-600/20 disabled:opacity-50'
                                    }`}
                            >
                                {status === 'VALIDATING' ? (
                                    <div className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" />
                                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:0.2s]" />
                                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:0.4s]" />
                                    </div>
                                ) : status === 'SUCCESS' ? (
                                    <>Session Established</>
                                ) : (
                                    <>{step === 'PHONE' ? 'Initialize' : 'Launch Terminal'} <ArrowRight size={16} /></>
                                )}
                            </button>

                            {step === 'OTP' && (
                                <div className="flex justify-between items-center px-4">
                                    <button
                                        onClick={() => { setStep('PHONE'); setOtp(''); setStatus('IDLE'); }}
                                        className="text-[10px] font-black text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition-colors flex items-center gap-2"
                                    >
                                        <ChevronRight size={10} className="rotate-180" /> Edit Endpoint
                                    </button>
                                    <div className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/50 animate-pulse" />
                                        <span className="text-[10px] text-slate-400 font-mono font-black italic">BYPASS: 6424</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Infrastructure Footer */}
                    <div className="pt-12 border-t border-slate-100 flex items-center justify-between opacity-50">
                        <div className="flex items-center gap-3">
                            <ShieldCheck size={16} className="text-emerald-500" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">SOC2-v2 Secure</span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 flex items-center justify-center grayscale hover:grayscale-0 transition-all cursor-pointer">
                            <Globe size={16} className="text-slate-400" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
