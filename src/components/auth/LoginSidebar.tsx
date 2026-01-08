'use client';

import React, { useState, useEffect } from 'react';
import { Phone, ArrowRight, Lock, MapPin, Loader2, X, ShieldCheck, CheckCircle2, AlertCircle, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTenant } from '@/lib/tenant/tenantContext';

interface LoginSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    variant?: 'TERMINAL' | 'RETAIL';
}

export default function LoginSidebar({ isOpen, onClose, variant = 'TERMINAL' }: LoginSidebarProps) {
    const router = useRouter();
    const { setTenantType } = useTenant();
    const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [location, setLocation] = useState<{ pincode: string | null; loading: boolean; isServiceable: boolean | null }>({
        pincode: null,
        loading: false,
        isServiceable: null
    });
    const [isEditingPincode, setIsEditingPincode] = useState(false);
    const [tempPincode, setTempPincode] = useState('');

    useEffect(() => {
        if (isOpen && !location.pincode) {
            detectLocation();
        }
    }, [isOpen]);

    const detectLocation = () => {
        if ("geolocation" in navigator) {
            setLocation(prev => ({ ...prev, loading: true }));
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    // Simulate reverse geocoding
                    setTimeout(() => {
                        const mockPincode = '400001';
                        const isServiceable = mockPincode.startsWith('400');
                        setLocation({ pincode: mockPincode, loading: false, isServiceable });
                        setTempPincode(mockPincode);
                    }, 1500);
                },
                (error) => {
                    console.error("Geolocation error:", error);
                    setLocation({ pincode: null, loading: false, isServiceable: null });
                }
            );
        }
    };

    const handlePincodeSubmit = () => {
        if (tempPincode.length === 6) {
            const isServiceable = tempPincode.startsWith('400');
            setLocation({ pincode: tempPincode, loading: false, isServiceable });
            setIsEditingPincode(false);
        }
    };

    const handleSendOtp = async () => {
        if (phone.length < 10) return;
        setLoading(true);
        await new Promise(r => setTimeout(r, 1000));
        setStep('OTP');
        setLoading(false);
    };

    const handleLogin = async () => {
        if (otp.length < 4) return;
        setLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, otp }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                if (data.role) {
                    setTenantType(data.role as any);
                }
                // Save name for unified headers
                const displayName = data.name || (phone === '9820760596' ? 'Ajit Singh' : 'Valued User');
                localStorage.setItem('user_name', displayName);

                // Trigger storage event for same-tab listeners
                window.dispatchEvent(new Event('storage'));

                document.cookie = 'aums_session=true; path=/;';
                router.push('/dashboard');
                onClose();
            } else {
                alert(data.message || 'Authentication failed');
            }
        } catch (err) {
            alert('Network error. Please try again.');
        } finally {
            setLoading(false);
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
            <div className="relative w-full max-w-xl h-fit max-h-[calc(100vh-8rem)] bg-white/20 dark:bg-slate-950/20 backdrop-blur-3xl shadow-[0_0_100px_rgba(0,0,0,0.2)] flex flex-col animate-in slide-in-from-right duration-700 cubic-bezier(0.16, 1, 0.3, 1) border border-white/20 dark:border-white/5 rounded-[48px] overflow-hidden pointer-events-auto">

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

                {/* Pincode / Serviceability Section */}
                <div className="mx-10 mb-8 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <MapPin size={14} className="text-blue-600" />
                            {isEditingPincode ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        maxLength={6}
                                        value={tempPincode}
                                        onChange={(e) => setTempPincode(e.target.value.replace(/\D/g, ''))}
                                        onBlur={handlePincodeSubmit}
                                        onKeyDown={(e) => e.key === 'Enter' && handlePincodeSubmit()}
                                        autoFocus
                                        className="bg-transparent border-b border-blue-600/30 outline-none text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white w-20"
                                        placeholder="INPUT"
                                    />
                                </div>
                            ) : (
                                <button
                                    onClick={() => {
                                        setTempPincode(location.pincode || '');
                                        setIsEditingPincode(true);
                                    }}
                                    className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-2 group/pin"
                                >
                                    {location.loading ? "Locating..." : (location.pincode || "Zone Unknown")}
                                    {!location.loading && <span className="text-[8px] opacity-0 group-hover/pin:opacity-100 transition-opacity">(Edit)</span>}
                                </button>
                            )}
                        </div>
                        {location.isServiceable && !isEditingPincode && (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-full text-[8px] font-black uppercase tracking-widest border border-emerald-500/20 animate-in fade-in zoom-in duration-300">
                                <CheckCircle2 size={8} /> Serviceable
                            </div>
                        )}
                        {!location.isServiceable && location.pincode && !isEditingPincode && (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-500/10 text-rose-600 rounded-full text-[8px] font-black uppercase tracking-widest border border-rose-500/20 animate-in fade-in zoom-in duration-300">
                                <AlertCircle size={8} /> Out of Zone
                            </div>
                        )}
                    </div>
                </div>

                {/* Core Authentication Interface */}
                <div className="flex-1 overflow-y-auto px-10 space-y-8">
                    <div className="space-y-8">
                        <div className="relative group overflow-hidden">
                            <div className="absolute inset-0 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[32px] transition-all group-focus-within:border-blue-600 group-focus-within:ring-[16px] group-focus-within:ring-blue-600/5" />

                            <div className="relative p-2">
                                {step === 'PHONE' ? (
                                    <div className="flex items-center px-6 py-4">
                                        <div className="flex items-center gap-3 pr-6 border-r border-slate-200 dark:border-white/10">
                                            <Phone size={18} className="text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                            <span className="text-xs font-black text-slate-500">+91</span>
                                        </div>
                                        <input
                                            type="tel"
                                            placeholder="XXXXX XXXXX"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                            className="bg-transparent border-none outline-none text-xl font-black tracking-[0.3em] text-slate-900 dark:text-white w-full pl-6 placeholder:text-slate-200 placeholder:tracking-normal"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex items-center px-6 py-4">
                                        <Lock size={18} className="text-slate-400 group-focus-within:text-blue-600 transition-colors mr-6" />
                                        <input
                                            type="text"
                                            placeholder="XXXX"
                                            value={otp}
                                            maxLength={4}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                            className="bg-transparent border-none outline-none text-xl font-black tracking-[1em] text-slate-900 dark:text-white w-full text-center placeholder:text-slate-200 placeholder:tracking-normal"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <button
                                onClick={step === 'PHONE' ? handleSendOtp : handleLogin}
                                disabled={loading || (step === 'PHONE' ? phone.length < 10 : otp.length < 4)}
                                className={`w-full py-6 rounded-[32px] text-xs font-black uppercase tracking-[0.3em] italic flex items-center justify-center gap-4 transition-all shadow-2xl active:scale-[0.98] ${loading ? 'bg-blue-600/50 cursor-wait' : 'bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500'
                                    } text-white shadow-blue-600/20 disabled:opacity-50`}
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" />
                                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:0.2s]" />
                                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:0.4s]" />
                                    </div>
                                ) : (
                                    <>{step === 'PHONE' ? 'Initialize' : 'Authorize Protocol'} <ArrowRight size={16} /></>
                                )}
                            </button>

                            {step === 'OTP' && (
                                <button
                                    onClick={() => setStep('PHONE')}
                                    className="w-full text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors"
                                >
                                    Edit Endpoint
                                </button>
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
        </div>
    );
}
