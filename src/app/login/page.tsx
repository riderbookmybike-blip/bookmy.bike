'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Lock, Phone, ShieldCheck, Zap, BarChart3, Globe, CheckCircle2, AlertTriangle, ChevronRight, Check } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { useTenant } from '@/lib/tenant/tenantContext';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
    const router = useRouter();
    const { setTenantType } = useTenant();
    const supabase = createClient();
    const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [status, setStatus] = useState<'IDLE' | 'VALIDATING' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [errorMsg, setErrorMsg] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

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
                    if (data.role) {
                        setTenantType(data.role as any);
                    }
                    setStatus('SUCCESS');
                    router.push('/dashboard');
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
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_0%_0%,rgba(79,70,229,0.2),transparent_70%)]" />
                    <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_100%,rgba(16,185,129,0.1),transparent_70%)]" />

                    {/* Perspective Grid */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] [transform:perspective(1000px)_rotateX(60deg)_translateY(-100px)] opacity-50" />

                    {/* Floating Orbs */}
                    <div className="absolute top-1/3 -left-20 w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full animate-float transition-transform duration-1000" />
                </div>

                <div className="relative z-10 flex flex-col gap-24">
                    <div className="group cursor-default">
                        <Logo variant="light" className="h-10 transition-all group-hover:scale-105 group-hover:brightness-125" />
                        <div className="mt-4 flex items-center gap-2">
                            <div className="h-px w-8 bg-indigo-500/50" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">Next Gen Auto OS</span>
                        </div>
                    </div>

                    <div className="space-y-12 max-w-lg">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-xl">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white italic">Enterprise Node [ACTIVE]</span>
                        </div>

                        <div className="space-y-6">
                            <h1 className="text-7xl lg:text-8xl font-black uppercase tracking-tighter italic leading-[0.8] text-white">
                                The OS for <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-emerald-400">Auto Retail</span>
                            </h1>

                            <p className="text-slate-400 text-sm md:text-base leading-relaxed font-medium max-w-sm border-l-2 border-indigo-500/30 pl-8">
                                Managing 500+ high-performance dealerships with real-time inventory synchronization, PDI pipelines, and secure financing.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Performance Stats Overlay */}
                <div className="relative z-10 p-10 rounded-[40px] bg-white/5 border border-white/10 backdrop-blur-3xl overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <div className="grid grid-cols-2 gap-12">
                        <div className="space-y-2">
                            <div className="text-4xl font-black text-white italic tracking-tighter">₹50Cr+</div>
                            <div className="text-[9px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                                <BarChart3 size={10} /> Volume Processed
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="text-4xl font-black text-white italic tracking-tighter">12k+</div>
                            <div className="text-[9px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-2">
                                <Zap size={10} /> Daily Handshakes
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Section: Form Interface */}
            <div className="flex-1 bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-8 md:p-12 relative overflow-y-auto">
                {/* Visual Flair */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/5 blur-[100px] rounded-full -translate-x-1/2 translate-y-1/2 pointer-events-none" />

                <div className="w-full max-w-sm space-y-8 relative z-10">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-0.5 w-12 bg-indigo-600 rounded-full" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-400 italic">BMB Terminal Uplink</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white leading-[0.9]">
                            Initialize <br /> Access
                        </h2>
                        <p className="text-xs text-slate-500 font-medium tracking-wide leading-relaxed">
                            {step === 'PHONE'
                                ? "Handshake required for BookMyBike administrative session. Restricted area."
                                : "Encryption sequence sent. Finalize the 4-digit protocol."}
                        </p>
                    </div>

                    <div className="space-y-6">
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
                                    className="text-xs font-bold text-slate-500 hover:text-indigo-600 cursor-pointer transition-colors"
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
