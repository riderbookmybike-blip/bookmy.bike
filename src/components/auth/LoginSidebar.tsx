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
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useTenant, TenantType } from '@/lib/tenant/tenantContext';
import { createClient } from '@/lib/supabase/client';
import { getSmartPincode } from '@/lib/location/geocode';
import { syncMemberLocation } from '@/actions/locationSync';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { getErrorMessage } from '@/lib/utils/errorMessage';
import { resolveLocation } from '@/utils/locationResolver';

const REFERRAL_CODE_PATTERN = /^[A-Z0-9-]{4,32}$/;
const REFERRAL_STORAGE_KEY = 'bkmb_referral_code';
const LOGIN_NEXT_STORAGE_KEY = 'bkmb_login_next';

const toSafeInternalPath = (value?: string | null): string | null => {
    const v = String(value || '').trim();
    if (!v.startsWith('/')) return null;
    if (v.startsWith('//')) return null;
    return v;
};

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
    const [step, setStep] = useState<'INITIAL' | 'SIGNUP' | 'GPS_UPDATE' | 'OTP' | 'PINCODE_FALLBACK'>('INITIAL');
    const [authMethod, setAuthMethod] = useState<'PHONE' | 'EMAIL'>('PHONE');
    const [isMarketplace, setIsMarketplace] = useState(true);
    const [isNewUser, setIsNewUser] = useState(false);

    const [identifier, setIdentifier] = useState('');
    const [otp, setOtp] = useState('');
    const [fullName, setFullName] = useState('');
    const [referralCode, setReferralCode] = useState('');
    const [referralCodeFromLink, setReferralCodeFromLink] = useState<string | null>(null);
    const [isOtpVerifiedForSignup, setIsOtpVerifiedForSignup] = useState(false);
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

    // Pincode fallback (when GPS fails)
    const [pincodeInput, setPincodeInput] = useState('');
    const [pincodeResolveState, setPincodeResolveState] = useState<
        'idle' | 'resolving' | 'ok' | 'non-serviceable' | 'error'
    >('idle');
    const [resolvedFallbackLocation, setResolvedFallbackLocation] = useState<{
        pincode: string;
        state: string;
        district: string;
        taluka: string;
    } | null>(null);

    const inputRef = useRef<HTMLInputElement>(null);
    const OTP_LENGTH = 4;

    const normalizeReferralCode = (value?: string | null) =>
        String(value || '')
            .trim()
            .toUpperCase();
    const getEffectiveReferralCode = () => normalizeReferralCode(referralCodeFromLink || referralCode);
    const hasReferralFromLink = !!normalizeReferralCode(referralCodeFromLink);
    const getResolvedSignupLocation = () => {
        if (resolvedFallbackLocation?.pincode) {
            return {
                pincode: resolvedFallbackLocation.pincode,
                state: resolvedFallbackLocation.state || null,
                district: resolvedFallbackLocation.district || null,
                taluka: resolvedFallbackLocation.taluka || null,
                area: null as string | null,
            };
        }

        if (locationData?.pincode) {
            return {
                pincode: locationData.pincode,
                state: locationData.state || null,
                district: locationData.district || null,
                taluka: locationData.taluka || null,
                area: locationData.area || null,
            };
        }

        if (location.pincode) {
            return {
                pincode: location.pincode,
                state: null,
                district: null,
                taluka: null,
                area: null,
            };
        }

        return {
            pincode: null,
            state: null,
            district: null,
            taluka: null,
            area: null,
        };
    };

    const capturePendingMembership = async (reason: string, referralCodeInputOverride?: string) => {
        const phone = identifier.replace(/\D/g, '');
        if (phone.length !== 10) return;

        const signupLocation = getResolvedSignupLocation();
        const payload = {
            phone,
            fullName: fullName.trim() || null,
            pincode: signupLocation.pincode,
            state: signupLocation.state,
            district: signupLocation.district,
            taluka: signupLocation.taluka,
            area: signupLocation.area,
            latitude: location.latitude,
            longitude: location.longitude,
            referralCodeInput: normalizeReferralCode(referralCodeInputOverride ?? referralCode) || null,
            referralCodeFromLink: normalizeReferralCode(referralCodeFromLink) || null,
            source: hasReferralFromLink ? 'REFERRAL_LINK' : 'DIRECT_LINK',
            reason,
        };

        try {
            await fetch('/api/auth/pending-membership', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
        } catch (error) {
            console.warn('[LoginSidebar] pending-membership capture failed', error);
        }
    };

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
            const nextFromQuery = toSafeInternalPath(searchParams.get('next'));
            const nextFromStorage = toSafeInternalPath(localStorage.getItem(LOGIN_NEXT_STORAGE_KEY));
            const nextFromProps = toSafeInternalPath(redirectTo);

            setIsMarketplace(!isInTenantPath);
            setTenantSlug(derivedSlug ?? null);
            setRedirectPath(nextFromProps || nextFromQuery || nextFromStorage || null);
            setFallbackPath(pathname === '/login' ? '/' : `${pathname}${window.location.search}`);

            if (!isInTenantPath) detectLocation();

            setIdentifier('');
            setOtp('');
            setFullName('');
            setReferralCode('');
            setReferralCodeFromLink(null);
            setIsOtpVerifiedForSignup(false);
            setLoginError(null);
            setShowSignupPrompt(false);
            setIsStaff(false);
            setShowEmailFallback(false);
            setSecurityTimer(0);

            const referralFromQuery = normalizeReferralCode(searchParams.get('ref'));
            const referralFromStorage = normalizeReferralCode(localStorage.getItem(REFERRAL_STORAGE_KEY));
            const resolvedReferral = referralFromQuery || referralFromStorage;
            if (REFERRAL_CODE_PATTERN.test(resolvedReferral)) {
                setReferralCodeFromLink(resolvedReferral);
                setReferralCode(resolvedReferral);
                localStorage.setItem(REFERRAL_STORAGE_KEY, resolvedReferral);
            } else {
                localStorage.removeItem(REFERRAL_STORAGE_KEY);
            }

            setTimeout(() => inputRef.current?.focus(), 300); // Slightly longer delay for slide-in
        }
    }, [isOpen, redirectTo, tenantSlugProp]);

    // Auto-trigger GPS detection for new users OR existing users without GPS
    useEffect(() => {
        if (step === 'GPS_UPDATE' && !location.latitude && !isDetectingLocation) {
            detectGPSLocation();
        }
    }, [step, location.latitude, isDetectingLocation]);

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
                        // console.log('First enrichment attempt failed or incomplete. Retrying...');
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
            const normalizedRole = String(checkData.role || '').toLowerCase();
            setIsStaff((normalizedRole && normalizedRole !== 'member' && normalizedRole !== 'customer') || !!tenantId);

            if (checkData.isNew) {
                if (hasReferralFromLink) {
                    // Referral link user: we already have the code, send OTP immediately.
                    // After verification, completeLogin → signup happens automatically.
                    setIsNewUser(true);
                    setLoginError(null);
                    if (!isEmail) await handleSendPhoneOtp(phoneVal);
                } else {
                    // No referral link: hold and show a signup prompt so user can enter code.
                    setShowSignupPrompt(true);
                    setLoginError('Account not found. Create a new account?');
                    void capturePendingMembership('LOGIN_ATTEMPT_NO_REFERRAL_LINK');
                }
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
        const effectiveReferralCode = getEffectiveReferralCode();
        const referralOk = !!effectiveReferralCode;

        // For new signup, only referral code is mandatory.
        if (step === 'SIGNUP' && !referralOk) {
            setLoginError('Referral code is required to continue.');
            void capturePendingMembership('SIGNUP_BLOCKED_MISSING_REFERRAL');
            return false;
        }

        if (step === 'SIGNUP' && !REFERRAL_CODE_PATTERN.test(effectiveReferralCode)) {
            setLoginError('Referral code format is invalid.');
            void capturePendingMembership('SIGNUP_BLOCKED_INVALID_REFERRAL_FORMAT', effectiveReferralCode);
            return false;
        }

        if (step === 'SIGNUP' && !fullName.trim()) {
            setLoginError('Full name is required.');
            void capturePendingMembership('SIGNUP_BLOCKED_MISSING_NAME');
            return false;
        }

        const signupLocation = getResolvedSignupLocation();
        if (step === 'SIGNUP' && !signupLocation.pincode) {
            setLoginError('Location pincode is required before signup.');
            setStep('PINCODE_FALLBACK');
            void capturePendingMembership('SIGNUP_BLOCKED_MISSING_LOCATION');
            return false;
        }

        // For explicit GPS update flow, coordinates are mandatory.
        if (step === 'GPS_UPDATE' && (!location.latitude || !location.longitude)) {
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
                const message = err instanceof Error ? getErrorMessage(err) : 'Failed to update location';
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
                    setIsOtpVerifiedForSignup(true);
                    setOtp('');
                    loginTriggeredRef.current = false;
                    if (hasReferralFromLink) {
                        await completeLogin(null, null);
                        return;
                    }
                    setStep('SIGNUP');
                    setLoginError('OTP verified. Enter referral code to continue signup.');
                    await capturePendingMembership('OTP_VERIFIED_WAITING_REFERRAL');
                    return;
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
            const message = err instanceof Error ? getErrorMessage(err) : 'Verification failed.';
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

        if (isNewUser) {
            const signupRes = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: phoneVal,
                    email: isEmail ? identifier : '',
                    displayName: fullName.trim() || 'Rider',
                    referralCode: getEffectiveReferralCode(),
                    pincode: getResolvedSignupLocation().pincode,
                    state: getResolvedSignupLocation().state,
                    district: getResolvedSignupLocation().district,
                    taluka: getResolvedSignupLocation().taluka,
                    area: getResolvedSignupLocation().area,
                    latitude: location.latitude,
                    longitude: location.longitude,
                    referralCodeFromLink: normalizeReferralCode(referralCodeFromLink) || null,
                    signupSource: hasReferralFromLink ? 'REFERRAL_LINK' : 'DIRECT_LINK',
                }),
            });
            const signupData = await signupRes.json();
            if (!signupData.success) {
                if (
                    signupData.code === 'INVALID_REFERRAL_CODE' ||
                    signupData.code === 'MISSING_REFERRAL_CODE' ||
                    signupData.code === 'INVALID_REFERRAL_FORMAT'
                ) {
                    await capturePendingMembership(`SIGNUP_BLOCKED_${signupData.code}`);
                }
                throw new Error(signupData.message || 'Signup failed');
            }

            // Capture session from signup response
            const signupSession = signupData.session as Session | null;
            if (signupSession) {
                await supabase.auth.setSession(signupSession);
                user = signupData.user; // Update user object for membership check below
            }
        }

        // Number.isFinite is NaN-safe (rejects null, undefined, NaN, Infinity)
        const coordsAvailable = Number.isFinite(location.latitude) && Number.isFinite(location.longitude);
        if (coordsAvailable) {
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
        const finalRole = detectedRole || primaryMembership?.role || 'member';
        const displayName =
            user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
        localStorage.setItem('user_role', finalRole);
        localStorage.setItem('active_role', finalRole);
        localStorage.setItem('base_role', 'member');
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
        const persistedNext = toSafeInternalPath(localStorage.getItem(LOGIN_NEXT_STORAGE_KEY));
        const target = toSafeInternalPath(redirectPath) || persistedNext || toSafeInternalPath(fallbackPath) || '/';
        localStorage.removeItem(LOGIN_NEXT_STORAGE_KEY);
        window.location.href = target;
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
                                                    : step === 'PINCODE_FALLBACK'
                                                      ? 'Confirm'
                                                      : 'Verify'}
                                            <span className="block text-[#F4B000]">
                                                {step === 'INITIAL'
                                                    ? 'Journey.'
                                                    : step === 'SIGNUP'
                                                      ? 'Profile.'
                                                      : step === 'GPS_UPDATE'
                                                        ? 'Location.'
                                                        : step === 'PINCODE_FALLBACK'
                                                          ? 'Location.'
                                                          : 'Identity.'}
                                            </span>
                                        </h2>
                                        <p className="text-sm font-bold text-black dark:text-white max-w-xs leading-relaxed text-center mx-auto">
                                            {step === 'INITIAL' &&
                                                'Enter your 10-digit mobile number to login or create a new account instantly.'}
                                            {step === 'SIGNUP' &&
                                                (authMethod === 'EMAIL'
                                                    ? 'Enter your details to complete signup.'
                                                    : hasReferralFromLink
                                                      ? 'Referral link detected. Complete your profile and continue.'
                                                      : 'OTP verify hone ke baad referral code daalna mandatory hai.')}
                                            {step === 'GPS_UPDATE' &&
                                                'We need your location to provide accurate pricing and verify your service area. This is mandatory for all accounts.'}
                                            {step === 'PINCODE_FALLBACK' &&
                                                'GPS was unavailable. Enter your 6-digit pincode to set your service area.'}
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

                                        {step === 'SIGNUP' && (
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-black dark:text-white block text-center w-full">
                                                    Referral Code
                                                </label>
                                                <input
                                                    type="text"
                                                    value={
                                                        hasReferralFromLink ? getEffectiveReferralCode() : referralCode
                                                    }
                                                    onChange={e => {
                                                        if (hasReferralFromLink) return;
                                                        setReferralCode(normalizeReferralCode(e.target.value));
                                                        setLoginError(null);
                                                    }}
                                                    placeholder="ENTER REFERRAL CODE"
                                                    readOnly={hasReferralFromLink}
                                                    className="w-[80%] max-w-sm mx-auto block bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl p-5 text-lg font-bold text-black dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/40 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all text-center uppercase tracking-wide"
                                                />
                                                {hasReferralFromLink && (
                                                    <p className="text-[10px] font-black text-green-600 dark:text-green-400 text-center">
                                                        Referral link auto-applied
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {step === 'GPS_UPDATE' && (
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
                                                        <div className="flex flex-col gap-2">
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
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    setGpsError(null);
                                                                    setPincodeInput('');
                                                                    setPincodeResolveState('idle');
                                                                    setResolvedFallbackLocation(null);
                                                                    setStep('PINCODE_FALLBACK');
                                                                }}
                                                                className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-brand-primary transition-colors text-center"
                                                            >
                                                                📍 Enter Pincode Instead
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

                                        {/* PINCODE FALLBACK — 6-digit input when GPS unavailable */}
                                        {step === 'PINCODE_FALLBACK' && (
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-black dark:text-white block text-center w-full">
                                                        📍 Your Pincode
                                                    </label>
                                                    <input
                                                        autoFocus
                                                        type="text"
                                                        inputMode="numeric"
                                                        maxLength={6}
                                                        value={pincodeInput}
                                                        onChange={async e => {
                                                            const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                                            setPincodeInput(val);
                                                            if (val.length === 6) {
                                                                setPincodeResolveState('resolving');
                                                                setResolvedFallbackLocation(null);
                                                                try {
                                                                    const result = await resolveLocation(val);
                                                                    if (result) {
                                                                        setResolvedFallbackLocation({
                                                                            pincode: result.pincode,
                                                                            state: result.state || '',
                                                                            district: result.district || '',
                                                                            taluka: result.taluka || '',
                                                                        });
                                                                        const stateCode = String(result.state || '')
                                                                            .trim()
                                                                            .toUpperCase()
                                                                            .slice(0, 2);
                                                                        setPincodeResolveState(
                                                                            stateCode === 'MH'
                                                                                ? 'ok'
                                                                                : 'non-serviceable'
                                                                        );
                                                                    } else {
                                                                        setPincodeResolveState('error');
                                                                    }
                                                                } catch {
                                                                    setPincodeResolveState('error');
                                                                }
                                                            } else {
                                                                if (pincodeResolveState !== 'idle') {
                                                                    setPincodeResolveState('idle');
                                                                    setResolvedFallbackLocation(null);
                                                                }
                                                            }
                                                        }}
                                                        placeholder="6-DIGIT PINCODE"
                                                        className="w-[80%] max-w-sm mx-auto block bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl p-5 text-lg font-bold text-black dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/40 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all text-center tracking-[0.3em]"
                                                    />
                                                </div>

                                                {/* Result banner */}
                                                {pincodeResolveState === 'resolving' && (
                                                    <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-slate-100 dark:bg-white/10">
                                                        <div className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                                            Verifying pincode…
                                                        </span>
                                                    </div>
                                                )}
                                                {pincodeResolveState === 'ok' && resolvedFallbackLocation && (
                                                    <div className="p-3 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-500/30 text-center">
                                                        <p className="text-sm font-black text-green-700 dark:text-green-400">
                                                            ✅ We serve your area.
                                                        </p>
                                                        <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">
                                                            {resolvedFallbackLocation.district},{' '}
                                                            {resolvedFallbackLocation.state}
                                                        </p>
                                                    </div>
                                                )}
                                                {pincodeResolveState === 'non-serviceable' &&
                                                    resolvedFallbackLocation && (
                                                        <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/30 text-center">
                                                            <p className="text-sm font-black text-amber-800 dark:text-amber-400">
                                                                ⚠️ Service not available in your area yet.
                                                            </p>
                                                            <p className="text-xs text-amber-700 dark:text-amber-500 mt-0.5">
                                                                Prices shown for Maharashtra.
                                                            </p>
                                                        </div>
                                                    )}
                                                {pincodeResolveState === 'error' && (
                                                    <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-center">
                                                        <p className="text-sm font-black text-red-700 dark:text-red-400">
                                                            ❌ Invalid pincode. Please try another.
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Continue button */}
                                                <button
                                                    disabled={
                                                        pincodeResolveState !== 'ok' &&
                                                        pincodeResolveState !== 'non-serviceable'
                                                    }
                                                    onClick={async () => {
                                                        if (!resolvedFallbackLocation) return;
                                                        setLoading(true);
                                                        try {
                                                            // Persist location
                                                            const { setLocationCookie } =
                                                                await import('@/actions/locationCookie');
                                                            await setLocationCookie({
                                                                pincode: resolvedFallbackLocation.pincode,
                                                                district: resolvedFallbackLocation.district,
                                                                taluka: resolvedFallbackLocation.taluka,
                                                                state: resolvedFallbackLocation.state,
                                                            });
                                                            localStorage.setItem(
                                                                'bkmb_user_pincode',
                                                                JSON.stringify(resolvedFallbackLocation)
                                                            );
                                                            window.dispatchEvent(new CustomEvent('locationChanged'));

                                                            // Update member record if logged in
                                                            const supabaseClient = createClient();
                                                            const {
                                                                data: { user: currentUser },
                                                            } = await supabaseClient.auth.getUser();
                                                            if (currentUser) {
                                                                const { updateSelfMemberLocation } =
                                                                    await import('@/actions/members');
                                                                await updateSelfMemberLocation({
                                                                    pincode: resolvedFallbackLocation.pincode,
                                                                    district: resolvedFallbackLocation.district,
                                                                    taluka: resolvedFallbackLocation.taluka,
                                                                    state: resolvedFallbackLocation.state,
                                                                });
                                                                await completeLogin(currentUser, null);
                                                            } else {
                                                                if (isOtpVerifiedForSignup) {
                                                                    // New user flow — proceed with pincode as location signal
                                                                    await completeLogin(null, null);
                                                                } else {
                                                                    setStep('SIGNUP');
                                                                    setLoginError(
                                                                        'OTP verification is required before signup.'
                                                                    );
                                                                }
                                                            }
                                                        } catch (err) {
                                                            setLoginError('Failed to save location. Please try again.');
                                                        } finally {
                                                            setLoading(false);
                                                        }
                                                    }}
                                                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-[0.15em] text-[11px] transition-all ${
                                                        pincodeResolveState === 'ok' ||
                                                        pincodeResolveState === 'non-serviceable'
                                                            ? 'bg-brand-primary text-black shadow-[0_10px_30px_rgba(244,176,0,0.2)] hover:-translate-y-0.5'
                                                            : 'bg-slate-100 dark:bg-white/10 text-slate-400 cursor-not-allowed'
                                                    }`}
                                                >
                                                    {loading ? 'Saving…' : 'Continue →'}
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        setPincodeInput('');
                                                        setPincodeResolveState('idle');
                                                        setResolvedFallbackLocation(null);
                                                        setGpsError(null);
                                                        setStep(isNewUser ? 'SIGNUP' : 'GPS_UPDATE');
                                                    }}
                                                    className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                                >
                                                    ← Try GPS Again
                                                </button>
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
                                                            if (step === 'SIGNUP') {
                                                                if (!validateSignupRequirements()) return;
                                                                if (isOtpVerifiedForSignup) {
                                                                    completeLogin(null, null);
                                                                } else {
                                                                    authMethod === 'EMAIL'
                                                                        ? handleSendEmailOtp(identifier)
                                                                        : handleSendPhoneOtp(identifier);
                                                                }
                                                            }
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
                                                        if (isOtpVerifiedForSignup) {
                                                            completeLogin(null, null);
                                                        } else {
                                                            authMethod === 'EMAIL'
                                                                ? handleSendEmailOtp(identifier)
                                                                : handleSendPhoneOtp(identifier);
                                                        }
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
                                                      ? isOtpVerifiedForSignup
                                                          ? 'Complete Signup'
                                                          : 'Send OTP'
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
                                                    setIsOtpVerifiedForSignup(false);
                                                    setStep('SIGNUP');
                                                    setShowSignupPrompt(false);
                                                    setLoginError(null);
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
