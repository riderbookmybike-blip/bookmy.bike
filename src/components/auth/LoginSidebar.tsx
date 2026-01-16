'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import {
    Phone,
    ArrowRight,
    Lock,
    User,
    X,
    AlertCircle,
    Globe,
    RefreshCcw,
    ChevronRight,
    CheckCircle2,
    Facebook,
    Twitter,
    Instagram,
    Linkedin,
} from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useRouter } from 'next/navigation';
import { useTenant, TenantType } from '@/lib/tenant/tenantContext';
import { createClient } from '@/lib/supabase/client';
import { getSmartPincode } from '@/lib/location/geocode';
import { motion, AnimatePresence, Variants } from 'framer-motion';

interface LoginSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    variant?: 'TERMINAL' | 'RETAIL';
    redirectTo?: string;
    tenantSlug?: string;
}

export default function LoginSidebar({
    isOpen,
    onClose,
    variant = 'RETAIL',
    redirectTo,
    tenantSlug: tenantSlugProp,
}: LoginSidebarProps) {
    const router = useRouter();
    const { setTenantType, tenantId, activeRole, userRole, setUserRole, setActiveRole, setUserName } = useTenant();
    const [loginError, setLoginError] = useState<string | null>(null);
    const [step, setStep] = useState<'INITIAL' | 'SIGNUP' | 'OTP'>('INITIAL');
    const [authMethod, setAuthMethod] = useState<'PHONE' | 'EMAIL'>('PHONE');
    const [isMarketplace, setIsMarketplace] = useState(true);
    const [isNewUser, setIsNewUser] = useState(false);

    const [identifier, setIdentifier] = useState('');
    const [otp, setOtp] = useState('');
    const [fullName, setFullName] = useState('');
    const [showSignupPrompt, setShowSignupPrompt] = useState(false);
    const [loading, setLoading] = useState(false);

    // Timer & Delayed Fallback
    const [resendTimer, setResendTimer] = useState(0);
    const [securityTimer, setSecurityTimer] = useState(0);
    const [showEmailFallback, setShowEmailFallback] = useState(false);

    const [redirectPath, setRedirectPath] = useState<string | null>(redirectTo ?? null);
    const [fallbackPath, setFallbackPath] = useState<string | null>(null);
    const [tenantSlug, setTenantSlug] = useState<string | null>(
        tenantSlugProp ?? (redirectTo ? (redirectTo.match(/^\/app\/([^/]+)/)?.[1] ?? null) : null)
    );

    // Existence Info
    const [detectedRole, setDetectedRole] = useState<string | null>(null);
    const [isStaff, setIsStaff] = useState(false);

    const [location, setLocation] = useState<{
        pincode: string | null;
        latitude: number | null;
        longitude: number | null;
    }>({
        pincode: null,
        latitude: null,
        longitude: null,
    });

    const inputRef = useRef<HTMLInputElement>(null);

    // AUTO-SUBMIT LOGIC: Trigger check when Phone is 10 digits
    useEffect(() => {
        if (step === 'INITIAL' && authMethod === 'PHONE') {
            const cleanPhone = identifier.replace(/\D/g, '');
            if (cleanPhone.length === 10 && !loading) {
                handleCheckUser(cleanPhone);
            }
        }
    }, [identifier, step, authMethod]);

    // OTP Timer
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (step === 'OTP') {
            interval = setInterval(() => {
                if (resendTimer > 0) setResendTimer(prev => prev - 1);
                setSecurityTimer(prev => {
                    const newVal = prev + 1;
                    if (newVal >= 30) setShowEmailFallback(true);
                    return newVal;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [resendTimer, step]);

    useEffect(() => {
        if (isOpen) {
            setStep('INITIAL');
            setAuthMethod('PHONE');
            // Determine Marketplace vs Tenant context
            const pathname = window.location.pathname;
            const searchParams = new URLSearchParams(window.location.search);
            const derivedSlug =
                tenantSlugProp || searchParams.get('tenant') || redirectTo?.match(/^\/app\/([^/]+)/)?.[1];
            const isInTenantPath = pathname.startsWith('/app/') || !!derivedSlug;

            setIsMarketplace(!isInTenantPath);
            setTenantSlug(derivedSlug ?? null);
            setRedirectPath(redirectTo ?? searchParams.get('next') ?? null);
            setFallbackPath(pathname === '/login' ? '/' : `${pathname}${window.location.search}`);

            if (!isInTenantPath) detectLocation();

            setIdentifier('');
            setOtp('');
            setFullName('');
            setLoginError(null);
            setShowSignupPrompt(false);
            setIsStaff(false);
            setShowEmailFallback(false);
            setSecurityTimer(0);

            setTimeout(() => inputRef.current?.focus(), 300); // Slightly longer delay for slide-in
        }
    }, [isOpen, redirectTo, tenantSlugProp]);

    const detectLocation = () => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(async position => {
                const { latitude, longitude } = position.coords;
                const result = await getSmartPincode(latitude, longitude, process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY);
                setLocation({
                    pincode: result.pincode,
                    latitude: result.latitude || latitude,
                    longitude: result.longitude || longitude,
                });
            });
        }
    };

    const handleCheckUser = async (overrideId?: string) => {
        const idToCheck = overrideId || identifier;
        const cleanId = idToCheck.trim();

        if (!cleanId || cleanId.length < 3) return;

        // Basic Length Check for Phone
        const isEmail = cleanId.includes('@');
        const phoneVal = !isEmail ? cleanId.replace(/\D/g, '') : '';

        if (!isEmail && phoneVal.length !== 10) return; // Strict 10 digit check for auto-submit

        setLoading(true);
        setLoginError(null);
        setAuthMethod(isEmail ? 'EMAIL' : 'PHONE');

        try {
            const checkRes = await fetch('/api/auth/check-membership', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: !isEmail ? phoneVal : undefined,
                    email: isEmail ? cleanId : undefined,
                    tenantId,
                    tenantSlug,
                }),
            });
            const checkData = await checkRes.json();

            if (!checkData.success && !checkData.isNew) {
                setLoginError(checkData.message || 'Access Denied.');
                setLoading(false);
                return;
            }

            if (checkData.isNew && isEmail && !tenantId) {
                setLoginError('Public email signup is not supported. Use mobile.');
                setLoading(false);
                return;
            }

            if (checkData.role) setDetectedRole(checkData.role);
            setIsStaff((checkData.role && checkData.role !== 'BMB_USER') || !!tenantId);

            if (checkData.isNew) {
                // setIsNewUser(true); // Don't set yet
                // setStep('SIGNUP'); // Don't auto-transition
                setShowSignupPrompt(true);
                setLoginError('Account not found. Create a new account?');
            } else {
                setIsNewUser(false);
                if (isEmail) await handleSendEmailOtp(cleanId);
                else await handleSendPhoneOtp(phoneVal);
            }
        } catch (err) {
            console.error(err);
            setLoginError('Network Error.');
        } finally {
            setLoading(false);
        }
    };

    const handleSendPhoneOtp = async (phoneVal: string) => {
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
            } else {
                setLoginError(data.message);
            }
        } catch {
            setLoginError('Failed to send OTP.');
        } finally {
            setLoading(false);
        }
    };

    const handleSendEmailOtp = async (email: string) => {
        setLoading(true);
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
        setLoading(false);
        if (error) setLoginError(error.message);
        else {
            setStep('OTP');
            setResendTimer(30);
        }
    };

    const validateSignupRequirements = () => {
        const nameOk = fullName.trim().length > 0;
        if (!nameOk) {
            setLoginError('Please enter your full name to continue.');
            return false;
        }
        if (!location.pincode) {
            setLoginError('Please allow location access to complete signup.');
            return false;
        }
        return true;
    };

    const handleLogin = async () => {
        if (otp.length < 4) return;
        setLoading(true);
        const supabase = createClient();
        const phoneVal = identifier.replace(/\D/g, '');

        try {
            let sessionData: Session | null = null;
            let userData: SupabaseUser | null = null;

            if (authMethod === 'PHONE') {
                const res = await fetch('/api/auth/msg91/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone: phoneVal, otp }),
                });
                const verifyData = await res.json();
                if (!verifyData.success) throw new Error(verifyData.message);

                // If isNew, session will be null. This is expected.
                // We proceed to completeLogin which will trigger signup -> auto-login.
                if (verifyData.isNew) {
                    setIsNewUser(true);
                }
                sessionData = verifyData.session ?? null;
                userData = verifyData.user ?? null;

                if (sessionData) {
                    await supabase.auth.setSession(sessionData);
                }
            } else {
                const { data, error } = await supabase.auth.verifyOtp({ email: identifier, token: otp, type: 'email' });
                if (error) throw error;
                sessionData = data.session;
                userData = data.user;
                if (sessionData) {
                    await supabase.auth.setSession(sessionData); // Ensure session is set
                }
            }

            // Sync & Complete
            await completeLogin(userData, sessionData);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Verification failed.';
            setLoginError(message);
            if (securityTimer > 15) setShowEmailFallback(true);
        } finally {
            setLoading(false);
        }
    };

    const completeLogin = async (user: SupabaseUser | null, _session: Session | null) => {
        const supabase = createClient();
        if (!user && !isNewUser) {
            throw new Error('User not found');
        }

        // Sync User Data
        const isEmail = authMethod === 'EMAIL';
        const phoneVal = !isEmail ? identifier.replace(/\D/g, '') : '';

        if (isNewUser) {
            const signupRes = await fetch('/api/auth/signup', {
                method: 'POST',
                body: JSON.stringify({
                    phone: phoneVal,
                    email: isEmail ? identifier : '',
                    displayName: fullName || 'Rider',
                    pincode: location.pincode,
                }),
            });
            const signupData = await signupRes.json();
            if (!signupData.success) throw new Error(signupData.message || 'Signup failed');

            // Capture session from signup response
            const signupSession = signupData.session as Session | null;
            if (signupSession) {
                await supabase.auth.setSession(signupSession);
                user = signupData.user; // Update user object for membership check below
            }
        } else if (authMethod === 'PHONE') {
            const syncRes = await fetch('/api/auth/msg91/sync', {
                method: 'POST',
                body: JSON.stringify({ phone: phoneVal, pincode: isStaff ? null : location.pincode }),
            });
            try {
                const syncData = await syncRes.json();
                if (syncData?.session) {
                    await supabase.auth.setSession(syncData.session);
                }
            } catch {
                // Ignore sync parse issues; login should still proceed if session is already set.
            }
        }

        // Fetch Memberships & Redirect
        const { data: memberships } = await supabase
            .from('memberships')
            .select('*, tenants!inner(*)')
            .eq('user_id', user?.id)
            .eq('status', 'ACTIVE');

        // Session Set
        const primaryMembership = (memberships && memberships.length > 0) ? memberships[0] : null;
        const finalRole = detectedRole || primaryMembership?.role || 'BMB_USER';
        const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User';
        localStorage.setItem('user_role', finalRole);
        localStorage.setItem('active_role', finalRole);
        localStorage.setItem('base_role', 'BMB_USER');
        localStorage.setItem('user_name', displayName);
        setUserRole(finalRole);
        setActiveRole(finalRole);
        setUserName(displayName);

        // Tenant Context
        if (memberships?.length && (tenantSlugProp || window.location.pathname.startsWith('/app/'))) {
            const t = memberships[0].tenants;
            localStorage.setItem('tenant_type', t.type === 'SUPER_ADMIN' ? 'AUMS' : t.type);
            setTenantType(t.type);
        } else {
            localStorage.setItem('tenant_type', 'MARKETPLACE');
            setTenantType('MARKETPLACE');
        }

        await new Promise(r => setTimeout(r, 800)); // Cookie Wait
        window.location.href = redirectPath || fallbackPath || '/';
        onClose();
    };

    /** Animation Variants for Sidebar */
    const overlayVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: { opacity: 0 },
    };

    // Sidebar Slide-In from Right
    const sidebarVariants: Variants = {
        hidden: { x: '100%', opacity: 0, scale: 0.95 },
        visible: {
            x: 0,
            opacity: 1,
            scale: 1,
            transition: {
                type: 'spring',
                damping: 25,
                stiffness: 300,
                mass: 0.8,
            },
        },
        exit: {
            x: '100%',
            opacity: 0,
            scale: 0.95,
            transition: { duration: 0.2, ease: 'easeIn' },
        },
    };

    const contentVariants = {
        hidden: { opacity: 0, x: 20 },
        visible: { opacity: 1, x: 0, transition: { delay: 0.2, duration: 0.4 } },
        exit: { opacity: 0, x: -20 },
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex justify-end items-center overflow-hidden sm:p-4">
                    {/* Backdrop */}
                    <motion.div
                        variants={overlayVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />

                    {/* Sidebar Drawer */}
                    <motion.div
                        variants={sidebarVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="relative w-full sm:w-[480px] h-full sm:h-[96vh] bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-3xl border border-white/20 shadow-2xl flex flex-col overflow-hidden sm:rounded-[2.5rem]"
                    >
                        {/* Decorative Glows - Gold Only */}
                        <div className="absolute top-[-20%] right-[-20%] w-[500px] h-[500px] bg-[#F4B000]/10 rounded-full blur-[100px] pointer-events-none" />

                        {/* Header */}
                        <div className="flex-none p-8 flex items-center justify-between z-10">
                            <div className="scale-90 origin-left">
                                <Logo mode="auto" size={32} variant="full" />
                            </div>
                            <div className="flex items-center gap-2">
                                <ThemeToggle className="w-10 h-10" />
                                <button
                                    onClick={onClose}
                                    className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors text-slate-500 dark:text-slate-400"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Main Content (Scrollable) */}
                        <div className="flex-1 overflow-y-auto px-8 z-10 flex flex-col justify-center min-h-[400px]">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={step}
                                    variants={contentVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="space-y-8"
                                >
                                    {/* HEADLINES */}
                                    <div className="space-y-3">
                                        <h2 className="text-4xl xs:text-5xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white leading-[0.9]">
                                            {step === 'INITIAL'
                                                ? 'Start Your'
                                                : step === 'SIGNUP'
                                                  ? 'Create'
                                                  : 'Verify'}
                                            <span className="block text-[#F4B000]">
                                                {step === 'INITIAL'
                                                    ? 'Journey.'
                                                    : step === 'SIGNUP'
                                                      ? 'Profile.'
                                                      : 'Identity.'}
                                            </span>
                                        </h2>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                                            {step === 'INITIAL' &&
                                                'Enter your 10-digit mobile number to login or create a new account instantly.'}
                                            {step === 'SIGNUP' &&
                                                (authMethod === 'EMAIL'
                                                    ? 'Enter your name to complete signup.'
                                                    : 'We just need your name to set up your rider profile.')}
                                            {step === 'OTP' && `Enter the verification code sent to ${identifier}.`}
                                        </p>
                                    </div>

                                    {/* ERROR */}
                                    {loginError && (
                                        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 flex items-start gap-3">
                                            <AlertCircle size={18} className="text-red-500 mt-0.5" />
                                            <div>
                                                <p className="text-xs font-black uppercase text-red-600 dark:text-red-400 tracking-wider">
                                                    Authentication Error
                                                </p>
                                                <p className="text-xs text-red-500 mt-1">{loginError}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* INPUTS */}
                                    <div className="space-y-6">
                                        {step === 'SIGNUP' && (
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                                                    Full Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={fullName}
                                                    onChange={e => setFullName(e.target.value)}
                                                    placeholder="Your Name"
                                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl p-5 text-lg font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                                                    autoFocus
                                                />
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                                                {step === 'OTP'
                                                    ? 'OTP Code'
                                                    : authMethod === 'EMAIL'
                                                      ? 'Email Address'
                                                      : 'Mobile Number'}
                                            </label>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-primary transition-colors">
                                                    {step === 'OTP' ? (
                                                        <Lock size={20} />
                                                    ) : authMethod === 'EMAIL' ? (
                                                        <Globe size={20} />
                                                    ) : (
                                                        <Phone size={20} />
                                                    )}
                                                </div>
                                                <input
                                                    ref={inputRef}
                                                    type={
                                                        step === 'OTP' ? 'tel' : authMethod === 'PHONE' ? 'tel' : 'text'
                                                    }
                                                    value={step === 'OTP' ? otp : identifier}
                                                    onChange={e => {
                                                        const val = e.target.value;
                                                        if (step === 'OTP') {
                                                            setOtp(val.replace(/\D/g, '').slice(0, 6)); // OTP usually 4-6
                                                        } else {
                                                            if (authMethod === 'PHONE') {
                                                                // Numeric Only
                                                                if (/^\d*$/.test(val) && val.length <= 10) {
                                                                    setIdentifier(val);
                                                                    setShowSignupPrompt(false);
                                                                    setLoginError(null);
                                                                }
                                                            } else {
                                                                setIdentifier(val);
                                                                setShowSignupPrompt(false);
                                                                setLoginError(null);
                                                            }
                                                        }
                                                    }}
                                                    placeholder={step === 'OTP' ? '• • • •' : '98765 43210'}
                                                    maxLength={
                                                        step === 'INITIAL' && authMethod === 'PHONE' ? 10 : undefined
                                                    }
                                                    disabled={step !== 'INITIAL' && step !== 'OTP'}
                                                    className={`w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl py-5 pl-14 pr-5 text-xl font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all ${step === 'OTP' ? 'tracking-[0.5em]' : 'tracking-wide'}`}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') {
                                                            if (step === 'INITIAL' && authMethod === 'EMAIL')
                                                                handleCheckUser();
                                                            if (step === 'SIGNUP')
                                                                authMethod === 'EMAIL'
                                                                    ? handleSendEmailOtp(identifier)
                                                                    : handleSendPhoneOtp(identifier);
                                                            if (step === 'OTP') handleLogin();
                                                        }
                                                    }}
                                                />
                                                {loading && (
                                                    <div className="absolute inset-y-0 right-5 flex items-center">
                                                        <div className="w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Continue Button (For Steps other than INITIAL PHONE which auto-submits) */}
                                        {(step !== 'INITIAL' || authMethod === 'EMAIL') && (
                                            <button
                                                onClick={() => {
                                                    if (step === 'INITIAL') handleCheckUser();
                                                    else if (step === 'SIGNUP') {
                                                        if (!validateSignupRequirements()) return;
                                                        authMethod === 'EMAIL'
                                                            ? handleSendEmailOtp(identifier)
                                                            : handleSendPhoneOtp(identifier);
                                                    }
                                                    else if (step === 'OTP') handleLogin();
                                                }}
                                                disabled={loading || (step === 'OTP' && otp.length < 4)}
                                                className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-xl disabled:opacity-50"
                                            >
                                                {step === 'SIGNUP' ? 'Complete Signup' : 'Proceed'}{' '}
                                                <ChevronRight size={16} />
                                            </button>
                                        )}

                                        {/* Create Account Button (Explicit Prompt) */}
                                        {step === 'INITIAL' && showSignupPrompt && (
                                            <button
                                                onClick={() => {
                                                    setIsNewUser(true);
                                                    setStep('SIGNUP');
                                                    setShowSignupPrompt(false);
                                                    setLoginError(null);
                                                    if (!location.pincode) {
                                                        detectLocation();
                                                    }
                                                }}
                                                className="w-full py-5 bg-[#F4B000] text-black rounded-2xl text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-xl animate-in fade-in slide-in-from-bottom-4"
                                            >
                                                Create Account <ArrowRight size={16} />
                                            </button>
                                        )}

                                        {/* OTP ACTIONS */}
                                        {step === 'OTP' && (
                                            <div className="flex justify-between items-center px-1">
                                                <button
                                                    onClick={() => setStep('INITIAL')}
                                                    className="text-[10px] font-bold text-slate-500 hover:text-brand-primary transition-colors uppercase tracking-wider"
                                                >
                                                    Change Number
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        authMethod === 'EMAIL'
                                                            ? handleSendEmailOtp(identifier)
                                                            : handleSendPhoneOtp(identifier)
                                                    }
                                                    disabled={resendTimer > 0}
                                                    className="text-[10px] font-bold text-slate-900 dark:text-white hover:text-brand-primary transition-colors uppercase tracking-wider disabled:opacity-50"
                                                >
                                                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                                                </button>
                                            </div>
                                        )}

                                        {/* Fallback to Email (Delayed) */}
                                        {showEmailFallback && step === 'OTP' && (
                                            <div className="pt-4 flex justify-center">
                                                <button
                                                    onClick={() => {
                                                        const n = authMethod === 'PHONE' ? 'EMAIL' : 'PHONE';
                                                        setAuthMethod(n);
                                                        setStep('INITIAL');
                                                        setIdentifier('');
                                                        setOtp('');
                                                        setTimeout(() => inputRef.current?.focus(), 100);
                                                    }}
                                                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                                                >
                                                    <RefreshCcw size={12} />
                                                    Try {authMethod === 'PHONE' ? 'Email' : 'Phone'} Login
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* New User Prompt */}
                                    {step === 'INITIAL' && (
                                        <div className="pt-2 text-center">
                                            <p className="text-xs text-slate-500 font-medium">
                                                New here?{' '}
                                                <span className="text-brand-primary font-bold cursor-default">
                                                    Sign up is free.
                                                </span>
                                            </p>
                                            <p className="text-[10px] text-slate-400 mt-1">
                                                Just enter your number above.
                                            </p>
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Footer */}
                        <div className="flex-none p-8 z-10 border-t border-slate-100 dark:border-white/5 space-y-6">
                            {/* Socials */}
                            <div className="flex justify-center gap-6">
                                {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                                    <a
                                        key={i}
                                        href="#"
                                        className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 hover:bg-brand-primary hover:text-black transition-all"
                                    >
                                        <Icon size={14} />
                                    </a>
                                ))}
                            </div>

                            {/* Links */}
                            <div className="flex justify-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                <a href="#" className="hover:text-brand-primary transition-colors">
                                    Terms
                                </a>
                                <span className="text-slate-200 dark:text-slate-800">•</span>
                                <a href="#" className="hover:text-brand-primary transition-colors">
                                    Privacy
                                </a>
                                <span className="text-slate-200 dark:text-slate-800">•</span>
                                <a href="#" className="hover:text-brand-primary transition-colors">
                                    Support
                                </a>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
