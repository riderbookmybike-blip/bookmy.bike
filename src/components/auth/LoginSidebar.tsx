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
import Image from 'next/image';
import { useTenant, TenantType } from '@/lib/tenant/tenantContext';
import { createClient } from '@/lib/supabase/client';
import { getSmartPincode } from '@/lib/location/geocode';
import { syncMemberLocation } from '@/actions/locationSync';
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
    const [step, setStep] = useState<'INITIAL' | 'SIGNUP' | 'GPS_UPDATE' | 'OTP'>('INITIAL');
    const [authMethod, setAuthMethod] = useState<'PHONE' | 'EMAIL'>('PHONE');
    const [isMarketplace, setIsMarketplace] = useState(true);
    const [isNewUser, setIsNewUser] = useState(false);

    const [identifier, setIdentifier] = useState('');
    const [otp, setOtp] = useState('');
    const [fullName, setFullName] = useState('');
    const [manualPincode, setManualPincode] = useState('');
    const [showSignupPrompt, setShowSignupPrompt] = useState(false);
    const [loading, setLoading] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);

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

    // GPS-Only Location Capture (New User Signup)
    const [isDetectingLocation, setIsDetectingLocation] = useState(false);
    const [gpsError, setGpsError] = useState<string | null>(null);
    const [locationData, setLocationData] = useState<{
        pincode: string;
        state: string;
        district: string;
        taluka: string;
        area: string;
    } | null>(null);

    const inputRef = useRef<HTMLInputElement>(null);
    const OTP_LENGTH = 4;

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

    // Auto-trigger GPS detection for new users OR existing users without GPS
    useEffect(() => {
        if ((step === 'SIGNUP' || step === 'GPS_UPDATE') && !location.latitude && !isDetectingLocation) {
            detectGPSLocation();
        }
    }, [step]);

    // Auto-proceed after successful GPS capture + enrichment
    useEffect(() => {
        if (step === 'GPS_UPDATE' && location.latitude && location.longitude && !isDetectingLocation && !loading) {
            // GPS captured successfully, auto-proceed
            const timer = setTimeout(() => {
                handleContinueAfterGPS();
            }, 500); // Small delay to show success state
            return () => clearTimeout(timer);
        }
    }, [step, location.latitude, location.longitude, isDetectingLocation, loading]);

    const detectLocation = () => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                async position => {
                    const { latitude, longitude } = position.coords;
                    const result = await getSmartPincode(latitude, longitude, process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY);
                    setLocation({
                        pincode: result.pincode,
                        latitude: result.latitude || latitude,
                        longitude: result.longitude || longitude,
                    });
                },
                () => {
                    setLocation(prev => ({ ...prev, pincode: null }));
                }
            );
        }
    };

    // GPS-Only Detection for New Users (MANDATORY)
    const detectGPSLocation = async () => {
        if (!navigator.geolocation) {
            setGpsError(
                "Your browser doesn't support location services. Please use a modern browser or mobile device."
            );
            return;
        }

        setIsDetectingLocation(true);
        setGpsError(null);

        navigator.geolocation.getCurrentPosition(
            async position => {
                const { latitude, longitude } = position.coords;

                try {
                    // Step 1: Reverse geocode GPS → Pincode
                    const { reverseGeocode } = await import('@/lib/location/reverseGeocode');
                    const geocodeResult = await reverseGeocode(latitude, longitude);

                    if (!geocodeResult.success || !geocodeResult.pincode) {
                        // GPS succeeded but couldn't extract pincode - BLOCK signup
                        setLocation({ pincode: null, latitude, longitude });
                        setGpsError(
                            '❌ Could not determine your pincode from GPS. Please enable precise location or try again.'
                        );
                        setIsDetectingLocation(false);
                        return;
                    }

                    // Step 2: Enrich pincode with state/district/taluka/area (WITH RETRY)
                    const { getPincodeDetails } = await import('@/actions/pincode');
                    let enrichResult = await getPincodeDetails(geocodeResult.pincode);

                    if (!enrichResult.success || !enrichResult.data?.district) {
                        // Retry once after 2 seconds
                        console.log('First enrichment attempt failed or incomplete. Retrying...');
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        enrichResult = await getPincodeDetails(geocodeResult.pincode);
                    }

                    // Proceed even if district is missing; background sync will reconcile
                    setLocation({ pincode: geocodeResult.pincode, latitude, longitude });
                    setLocationData({
                        pincode: geocodeResult.pincode,
                        state: enrichResult.data?.state || '',
                        district: enrichResult.data?.district || '',
                        taluka: enrichResult.data?.taluka || '',
                        area: enrichResult.data?.area || '',
                    });
                    setGpsError(null);
                } catch (error) {
                    console.error('GPS enrichment error:', error);
                    setLocation({ pincode: null, latitude, longitude });
                    setGpsError('❌ Location enrichment failed. Please try again or contact support.');
                } finally {
                    setIsDetectingLocation(false);
                }
            },
            error => {
                setIsDetectingLocation(false);
                let errorMsg = 'Location access denied. ';

                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMsg =
                            '📍 Location Access Required\n\nWe need your GPS location to create your account. This helps us provide accurate pricing and service availability.\n\nPlease allow location access to continue.';
                        break;
                    case error.TIMEOUT:
                        errorMsg = 'Location request timed out. Please try again.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMsg = 'Location information unavailable. Please check your device settings.';
                        break;
                }

                setGpsError(errorMsg);
            },
            {
                timeout: 15000,
                enableHighAccuracy: true,
            }
        );
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

        // For new signup, name is required
        if (step === 'SIGNUP' && !nameOk) {
            setLoginError('Please enter your full name to continue.');
            return false;
        }

        // GPS is MANDATORY for both new and existing users
        if (!location.latitude || !location.longitude) {
            setLoginError('GPS location is required. Please allow location access.');
            return false;
        }

        return true;
    };

    const handleContinueAfterGPS = async () => {
        if (!validateSignupRequirements()) return;

        // For GPS_UPDATE step (existing user), update their profile
        if (step === 'GPS_UPDATE') {
            setLoading(true);
            try {
                const supabase = createClient();
                const {
                    data: { user },
                } = await supabase.auth.getUser();

                if (!user) throw new Error('User not found');

                void syncMemberLocation({
                    latitude: location.latitude!,
                    longitude: location.longitude!,
                    pincode: locationData?.pincode || location.pincode,
                    state: locationData?.state,
                    district: locationData?.district,
                    taluka: locationData?.taluka,
                    area: locationData?.area,
                });

                await completeLogin(user, null);
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to update location';
                setLoginError(message);
            } finally {
                setLoading(false);
            }
            return;
        }

        // For SIGNUP step, validation passed, handleLogin will proceed
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

    const loginTriggeredRef = useRef(false);

    // Reset the guard when user goes back to OTP entry (e.g. clears OTP)
    useEffect(() => {
        if (otp.length < OTP_LENGTH) {
            loginTriggeredRef.current = false;
        }
    }, [otp]);

    useEffect(() => {
        if (step === 'OTP' && otp.length === OTP_LENGTH && !loading && !loginTriggeredRef.current) {
            loginTriggeredRef.current = true;
            handleLogin();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step, otp, loading]);

    const completeLogin = async (user: SupabaseUser | null, _session: Session | null) => {
        const supabase = createClient();
        if (!user && !isNewUser) {
            throw new Error('User not found');
        }

        // Sync User Data
        const isEmail = authMethod === 'EMAIL';
        const phoneVal = !isEmail ? identifier.replace(/\D/g, '') : '';
        const resolvedPincode = location.pincode || manualPincode.trim() || null;

        if (isNewUser) {
            const signupRes = await fetch('/api/auth/signup', {
                method: 'POST',
                body: JSON.stringify({
                    phone: phoneVal,
                    email: isEmail ? identifier : '',
                    displayName: fullName || 'Rider',
                    pincode: locationData?.pincode || location.pincode || resolvedPincode,
                    state: locationData?.state || null,
                    district: locationData?.district || null,
                    taluka: locationData?.taluka || null,
                    area: locationData?.area || null,
                    latitude: location.latitude,
                    longitude: location.longitude,
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
        }

        const coordsAvailable = !!location.latitude && !!location.longitude;

        // For existing users: Check if GPS data exists
        if (!isNewUser && user) {
            const { data: memberProfile } = await supabase
                .from('id_members')
                .select('latitude, longitude')
                .eq('id', user.id)
                .maybeSingle();

            if (!memberProfile?.latitude || !memberProfile?.longitude) {
                if (!coordsAvailable) {
                    setStep('GPS_UPDATE');
                    setLoginError('GPS location is required. Please allow location access to continue.');
                    return;
                }

                // Background sync without blocking login
                void syncMemberLocation({
                    latitude: location.latitude!,
                    longitude: location.longitude!,
                    pincode: locationData?.pincode || location.pincode,
                    state: locationData?.state,
                    district: locationData?.district,
                    taluka: locationData?.taluka,
                    area: locationData?.area,
                });
            }
        } else if (isNewUser && coordsAvailable) {
            void syncMemberLocation({
                latitude: location.latitude!,
                longitude: location.longitude!,
                pincode: locationData?.pincode || location.pincode,
                state: locationData?.state,
                district: locationData?.district,
                taluka: locationData?.taluka,
                area: locationData?.area,
            });
        }

        // Fetch Memberships & Redirect
        let memberships: any[] = [];
        try {
            const { data: mData, error: mError } = await supabase
                .from('memberships')
                .select('*, tenants!inner(*)')
                .eq('user_id', user!.id)
                .eq('status', 'ACTIVE');

            if (mError) {
                console.warn('[LoginSidebar] Membership fetch error:', mError.message);
            } else {
                memberships = mData || [];
            }
        } catch (err) {
            console.error('[LoginSidebar] Failed to fetch memberships:', err);
        }

        // Session Set
        const primaryMembership = memberships && memberships.length > 0 ? memberships[0] : null;
        const finalRole = detectedRole || primaryMembership?.role || 'BMB_USER';
        const displayName =
            user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
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
                        className="relative w-full sm:w-[480px] h-full sm:h-[96vh] bg-white/85 dark:bg-[#0B0F1A]/85 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden sm:rounded-[2.5rem]"
                    >
                        {/* DECORATIVE PRISM GLOWS */}
                        <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-[#F4B000]/15 rounded-full blur-[100px] pointer-events-none z-0" />
                        <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-slate-500/10 rounded-full blur-[80px] pointer-events-none z-0" />

                        {/* Full-Height Background Image with Mask */}
                        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                            <Image
                                src="/images/biker_ladakh_vertical.webp"
                                alt="Rider background"
                                fill
                                priority
                                sizes="(max-width: 480px) 100vw, 480px"
                                className="object-cover object-center opacity-50 dark:opacity-35 mix-blend-multiply dark:mix-blend-overlay"
                            />
                            {/* Layered Masks for Legibility */}
                            <div className="absolute inset-x-0 top-0 h-[50%] bg-gradient-to-b from-white via-white/80 to-transparent dark:from-[#0B0F1A] dark:via-[#0B0F1A]/80 dark:to-transparent" />
                            <div className="absolute inset-x-0 bottom-0 h-[30%] bg-gradient-to-t from-white via-white/60 to-transparent dark:from-[#0B0F1A] dark:via-[#0B0F1A]/60 dark:to-transparent" />
                        </div>

                        {/* Grainy Texture Over Glass */}
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.08] mix-blend-overlay pointer-events-none z-0" />

                        {/* Header */}
                        {/* Header - Empty to keep close button but remove Logo from top */}
                        <div className="flex-none p-8 flex items-center justify-end relative z-10 h-24">
                            <button
                                onClick={onClose}
                                className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 flex items-center justify-center transition-colors text-black dark:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Main Content (Scrollable) */}
                        <div className="flex-1 overflow-y-auto px-8 z-10 flex flex-col justify-center min-h-[400px] pt-12">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={step}
                                    variants={contentVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="space-y-8"
                                >
                                    {/* LOGO - Moved here for better vertical positioning */}
                                    <div className="flex justify-center scale-125 pb-4">
                                        <Logo mode="auto" size={48} variant="icon" />
                                    </div>

                                    {/* HEADLINES */}
                                    <div className="space-y-3 flex flex-col items-center">
                                        <h2 className="text-4xl xs:text-5xl font-black italic uppercase tracking-tighter text-black dark:text-white leading-[0.9] text-center">
                                            {step === 'INITIAL'
                                                ? 'Start Your'
                                                : step === 'SIGNUP'
                                                  ? 'Create'
                                                  : step === 'GPS_UPDATE'
                                                    ? 'Update'
                                                    : 'Verify'}
                                            <span className="block text-[#F4B000]">
                                                {step === 'INITIAL'
                                                    ? 'Journey.'
                                                    : step === 'SIGNUP'
                                                      ? 'Profile.'
                                                      : step === 'GPS_UPDATE'
                                                        ? 'Location.'
                                                        : 'Identity.'}
                                            </span>
                                        </h2>
                                        <p className="text-sm font-bold text-black dark:text-white max-w-xs leading-relaxed text-center mx-auto">
                                            {step === 'INITIAL' &&
                                                'Enter your 10-digit mobile number to login or create a new account instantly.'}
                                            {step === 'SIGNUP' &&
                                                (authMethod === 'EMAIL'
                                                    ? 'Enter your name to complete signup.'
                                                    : 'We just need your name to set up your rider profile.')}
                                            {step === 'GPS_UPDATE' &&
                                                'We need your location to provide accurate pricing and verify your service area. This is mandatory for all accounts.'}
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
                                                <label className="text-[10px] font-black uppercase tracking-widest text-black dark:text-white block text-center w-full">
                                                    Full Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={fullName}
                                                    onChange={e => setFullName(e.target.value)}
                                                    placeholder="Your Name"
                                                    className="w-[80%] max-w-sm mx-auto block bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl p-5 text-lg font-bold text-black dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/40 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all text-center"
                                                    autoFocus
                                                />
                                            </div>
                                        )}

                                        {(step === 'SIGNUP' || step === 'GPS_UPDATE') && (
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-black dark:text-white block text-center w-full">
                                                    📍 Location (GPS Required)
                                                </label>

                                                {isDetectingLocation && (
                                                    <div className="text-center space-y-2">
                                                        <div className="inline-block animate-spin w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full" />
                                                        <p className="text-sm font-bold text-black dark:text-white">
                                                            Detecting your location...
                                                        </p>
                                                    </div>
                                                )}

                                                {gpsError && (
                                                    <div className="space-y-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-2xl">
                                                        <p className="text-sm font-bold text-red-600 dark:text-red-400 whitespace-pre-wrap text-center">
                                                            {gpsError}
                                                        </p>
                                                        <div className="flex gap-3 justify-center">
                                                            <button
                                                                onClick={detectGPSLocation}
                                                                className="px-6 py-2 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold rounded-xl transition-all"
                                                            >
                                                                Retry GPS
                                                            </button>
                                                            <button
                                                                onClick={onClose}
                                                                className="px-6 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-black dark:text-white font-bold rounded-xl transition-all"
                                                            >
                                                                Cancel Signup
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {locationData && location.latitude && (
                                                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-500/30 rounded-2xl">
                                                        <p className="text-sm font-bold text-green-600 dark:text-green-400 text-center">
                                                            ✅ Location Detected
                                                        </p>
                                                        <p className="text-xs font-medium text-black dark:text-white text-center mt-2">
                                                            {locationData.area && `${locationData.area}, `}
                                                            {locationData.district}, {locationData.state} -{' '}
                                                            {locationData.pincode}
                                                        </p>
                                                    </div>
                                                )}

                                                {!isDetectingLocation && !gpsError && !locationData && (
                                                    <div className="text-center">
                                                        <button
                                                            onClick={detectGPSLocation}
                                                            className="px-6 py-3 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold rounded-xl transition-all"
                                                        >
                                                            📍 Enable Location
                                                        </button>
                                                        <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 mt-2">
                                                            GPS access is required to create an account
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-black dark:text-white block text-center w-full">
                                                {step === 'OTP'
                                                    ? 'OTP Code'
                                                    : authMethod === 'EMAIL'
                                                      ? 'Email Address'
                                                      : 'Mobile Number'}
                                            </label>
                                            <div className="relative group w-[80%] max-w-sm mx-auto">
                                                <input
                                                    ref={inputRef}
                                                    type={
                                                        step === 'OTP' ? 'tel' : authMethod === 'PHONE' ? 'tel' : 'text'
                                                    }
                                                    value={step === 'OTP' ? otp : identifier}
                                                    onChange={e => {
                                                        const val = e.target.value;
                                                        if (step === 'OTP') {
                                                            setOtp(val.replace(/\D/g, '').slice(0, OTP_LENGTH));
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
                                                    className={`w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl py-5 px-5 text-xl font-bold text-black dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/40 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all text-center ${step === 'OTP' ? 'tracking-[0.5em]' : 'tracking-wide'}`}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') {
                                                            if (
                                                                step === 'INITIAL' &&
                                                                authMethod === 'EMAIL' &&
                                                                (authMethod === 'EMAIL' || termsAccepted)
                                                            )
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

                                        {/* TERMS DISCLAIMER (Replaced Checkbox) */}
                                        {step === 'INITIAL' && (
                                            <p className="w-[80%] max-w-sm mx-auto text-[9px] font-bold text-black dark:text-white uppercase tracking-widest text-center whitespace-nowrap opacity-50">
                                                By proceeding, you agree to our{' '}
                                                <span className="text-brand-primary">Terms</span> &{' '}
                                                <span className="text-brand-primary">Privacy</span>.
                                            </p>
                                        )}

                                        {/* Continue Button (For Steps other than INITIAL PHONE which auto-submits) */}
                                        {(step !== 'INITIAL' || authMethod === 'EMAIL') && (
                                            <button
                                                onClick={() => {
                                                    if (step === 'INITIAL') {
                                                        handleCheckUser();
                                                    } else if (step === 'SIGNUP') {
                                                        if (!validateSignupRequirements()) return;
                                                        authMethod === 'EMAIL'
                                                            ? handleSendEmailOtp(identifier)
                                                            : handleSendPhoneOtp(identifier);
                                                    } else if (step === 'GPS_UPDATE') {
                                                        handleContinueAfterGPS();
                                                    } else if (step === 'OTP') handleLogin();
                                                }}
                                                disabled={
                                                    loading ||
                                                    (step === 'OTP' && otp.length < 4) ||
                                                    Boolean(
                                                        step === 'GPS_UPDATE' && location.latitude && location.longitude
                                                    )
                                                }
                                                className="w-[80%] max-w-sm mx-auto py-5 bg-black dark:bg-white text-white dark:text-black rounded-2xl text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-xl disabled:opacity-50"
                                            >
                                                {step === 'INITIAL'
                                                    ? 'Agree & Proceed'
                                                    : step === 'SIGNUP'
                                                      ? 'Complete Signup'
                                                      : step === 'GPS_UPDATE'
                                                        ? location.latitude && location.longitude
                                                            ? 'Processing...'
                                                            : 'Waiting for GPS...'
                                                        : 'Verify & Proceed'}{' '}
                                                {!(
                                                    step === 'GPS_UPDATE' &&
                                                    location.latitude &&
                                                    location.longitude
                                                ) && <ChevronRight size={16} />}
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
                                                className="w-[80%] max-w-sm mx-auto py-5 bg-[#F4B000] text-black rounded-2xl text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-xl animate-in fade-in slide-in-from-bottom-4"
                                            >
                                                Create Account <ArrowRight size={16} />
                                            </button>
                                        )}

                                        {/* OTP ACTIONS */}
                                        {step === 'OTP' && (
                                            <div className="flex justify-between items-center px-1 w-[80%] max-w-sm mx-auto">
                                                <button
                                                    onClick={() => setStep('INITIAL')}
                                                    className="text-[10px] font-black text-black dark:text-white hover:text-brand-primary transition-colors uppercase tracking-wider"
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
                                                    className="text-[10px] font-black text-black dark:text-white hover:text-brand-primary transition-colors uppercase tracking-wider disabled:opacity-50"
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
                                            <p className="text-xs text-black dark:text-white font-bold">
                                                New here?{' '}
                                                <span className="text-brand-primary font-black cursor-default">
                                                    Sign up is free.
                                                </span>
                                            </p>
                                            <p className="text-[10px] font-bold text-black dark:text-white mt-1 opacity-60">
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
                                        className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-black dark:text-white hover:bg-brand-primary hover:text-black hover:shadow-[0_0_15px_rgba(244,176,0,0.6)] transition-all"
                                    >
                                        <Icon size={14} />
                                    </a>
                                ))}
                            </div>

                            {/* Links */}
                            <div className="flex justify-center gap-4 text-[10px] font-black uppercase tracking-widest text-black dark:text-white">
                                <a href="#" className="hover:text-brand-primary transition-colors">
                                    Terms
                                </a>
                                <span className="opacity-20">•</span>
                                <a href="#" className="hover:text-brand-primary transition-colors">
                                    Privacy
                                </a>
                                <span className="opacity-20">•</span>
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
