'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    X,
    CheckCircle,
    Loader2,
    Briefcase,
    ChevronRight,
    Phone,
    User,
    MapPin,
    Coins,
    MessageCircle,
    Send,
    UserSearch,
    Sparkles,
    UserCircle2,
    ShieldCheck,
} from 'lucide-react';
import { useTenant } from '@/lib/tenant/tenantContext';
import { useDealerSession } from '@/hooks/useDealerSession';
import { createClient } from '@/lib/supabase/client';
import { normalizeIndianPhone } from '@/lib/utils/inputFormatters';
import { normalizePhone, formatPhone, isValidPhone } from '@/lib/utils/phoneUtils';
import {
    checkExistingCustomer,
    createQuoteAction,
    createLeadAction,
    shareQuoteViaSms,
    shareQuoteViaWhatsApp,
} from '@/actions/crm';
import { ensureMemberByPhone } from '@/actions/teamActions';
import { OCLUB_SIGNUP_BONUS, OCLUB_COIN_VALUE, discountForCoins, computeOClubPricing } from '@/lib/oclub/coin';
import { Logo } from '@/components/brand/Logo';
import { toast } from 'sonner';

interface LeadCaptureModalProps {
    isOpen: boolean;
    onClose: () => void;
    productName: string;
    model: string;
    variant?: string;
    variantId?: string;
    colorId?: string;
    commercials?: any;
    quoteTenantId?: string;
    source?: 'STORE_PDP' | 'LEADS';
    forceStaffMode?: boolean;
}

type LeadStep = 'PHONE' | 'PHONE_CONFIRM' | 'DETAILS';

export function LeadCaptureModal({
    isOpen,
    onClose,
    productName,
    model,
    variant,
    variantId,
    colorId,
    commercials,
    quoteTenantId,
    source = 'LEADS',
    forceStaffMode = false,
}: LeadCaptureModalProps) {
    const { tenantId, userRole, memberships } = useTenant();
    const { dealerId: sessionDealerId, locked: sessionLocked } = useDealerSession();
    const [step, setStep] = useState<LeadStep>('PHONE');
    const [phone, setPhone] = useState('');
    const [confirmPhone, setConfirmPhone] = useState('');
    const [name, setName] = useState('');
    const [dob, setDob] = useState<string | null>(null);
    const [pincode, setPincode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [memberId, setMemberId] = useState<string | null>(null);
    const [quoteId, setQuoteId] = useState<string | null>(null);
    const [quoteUuid, setQuoteUuid] = useState<string | null>(null);
    const [submitStage, setSubmitStage] = useState<string | null>(null);
    const [smsFeedback, setSmsFeedback] = useState<string | null>(null);
    const [shareStatus, setShareStatus] = useState<'idle' | 'sending-wa' | 'sending-sms' | 'sent'>('idle');

    // B-coin state
    const [customerCoins, setCustomerCoins] = useState<number | null>(null);
    const [isNewCustomer, setIsNewCustomer] = useState(false);

    // Referral state
    const [referredByPhone, setReferredByPhone] = useState('');
    const [referralResolved, setReferralResolved] = useState<{ memberId: string; name: string | null } | null>(null);
    const [referralError, setReferralError] = useState<string | null>(null);
    const [referralResolving, setReferralResolving] = useState(false);

    // Detect if current user role has been resolved and whether it's a staff role.
    const hasResolvedRole = typeof userRole === 'string' && userRole.length > 0;
    const isStaff = forceStaffMode || (hasResolvedRole && userRole !== 'MEMBER' && userRole !== 'BMB_USER');
    const effectiveTenantId = sessionDealerId || quoteTenantId || tenantId || undefined;
    const bannerTenantId = sessionDealerId || quoteTenantId || tenantId;
    const primaryMembership = memberships?.find(m => m.tenant_id === bannerTenantId);
    const [autoPhoneLoaded, setAutoPhoneLoaded] = useState(false);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setStep('PHONE');
            setPhone('');
            setConfirmPhone('');
            setName('');
            setDob(null);
            setPincode('');
            setError(null);
            setMemberId(null);
            setSuccess(false);
            setQuoteId(null);
            setQuoteUuid(null);
            setSubmitStage(null);
            setShareStatus('idle');
            setSmsFeedback(null);
            setAutoPhoneLoaded(false);
            setCustomerCoins(null);
            setIsNewCustomer(false);
            setReferredByPhone('');
            setReferralResolved(null);
            setReferralError(null);
        }
    }, [isOpen]);

    useEffect(() => {
        // Important: wait for role hydration first, otherwise staff users can be treated
        // as end-customers briefly and their own phone gets auto-submitted.
        if (!isOpen || autoPhoneLoaded || !hasResolvedRole || isStaff) return;
        const supabase = createClient();
        const hydratePhone = async () => {
            const { data: auth } = await supabase.auth.getUser();
            const user = auth?.user;
            if (!user?.id) {
                setAutoPhoneLoaded(true);
                return;
            }
            const { data: member } = await supabase
                .from('id_members')
                .select('primary_phone, whatsapp, full_name, pincode, aadhaar_pincode, latitude, longitude')
                .eq('id', user.id)
                .maybeSingle();

            const candidate =
                member?.primary_phone ||
                member?.whatsapp ||
                user.phone ||
                (user.user_metadata as any)?.phone ||
                (user.user_metadata as any)?.mobile ||
                '';
            if (isValidPhone(candidate)) {
                setPhone(normalizePhone(candidate));
                await processPhoneNumber(normalizePhone(candidate));
            }

            // Auto-populate name and pincode if available
            if (member?.full_name) setName(member.full_name);
            // Priority: pincode > aadhaar_pincode (GPS-captured pincode should be in 'pincode' field)
            const availablePincode = member?.pincode || member?.aadhaar_pincode || '';
            if (availablePincode) {
                setPincode(availablePincode);
            } else if (member?.latitude && member?.longitude) {
                // If GPS coordinates exist but no pincode, try to reverse geocode
                toast.info('Fetching location details from GPS coordinates...');
            }

            setAutoPhoneLoaded(true);
        };
        hydratePhone();
    }, [isOpen, autoPhoneLoaded, hasResolvedRole, isStaff]);

    if (!isOpen) return null;

    const toUiError = (err: unknown, fallback: string) =>
        err instanceof Error ? err.message || fallback : typeof err === 'string' ? err : fallback;

    async function processPhoneNumber(rawPhone: string) {
        setError(null);

        if (!isValidPhone(rawPhone)) {
            setError('Please enter a valid 10-digit mobile number');
            return;
        }

        if (isStaff && !effectiveTenantId) {
            setError('Active dealership context missing. Select dealership and retry.');
            return;
        }

        setIsSubmitting(true);
        try {
            const cleanPhone = normalizePhone(rawPhone);
            const result = await checkExistingCustomer(cleanPhone);
            const { data: existingUser, memberId: existingMemberId, walletCoins } = result;

            if (existingUser && existingMemberId) {
                // Existing customer — show actual wallet coins
                setCustomerCoins(walletCoins || 0);
                setIsNewCustomer(false);
                setMemberId(existingMemberId);
                setDob(existingUser.dob || null);
                setName(existingUser.name || '');
                setPincode(existingUser.pincode || '');

                // Staff flow: always capture details/referrer in next step.
                if (isStaff) {
                    setStep('DETAILS');
                    return;
                }

                // Create lead and quote
                setSubmitStage('QUOTE GENERATING');
                const leadResult = await createLeadAction({
                    customer_name: existingUser.name || 'Unknown',
                    customer_phone: cleanPhone,
                    customer_pincode: existingUser.pincode || undefined,
                    customer_dob: existingUser.dob || undefined,
                    model: model,
                    owner_tenant_id: effectiveTenantId,
                    selected_dealer_id: effectiveTenantId,
                    source: isStaff ? 'DEALER_REFERRAL' : 'PDP_QUICK_QUOTE',
                    referred_by_phone: referralResolved ? undefined : referredByPhone || undefined,
                });

                if (leadResult.success && (leadResult as any).leadId) {
                    setSubmitStage('SHARING QUOTE');
                    await handleCreateQuote((leadResult as any).leadId, walletCoins || 0, false);
                } else {
                    setSubmitStage(null);
                    setError(leadResult.message || 'Failed to create lead. Please try again.');
                }
            } else {
                // New customer — welcome bonus applies
                setCustomerCoins(OCLUB_SIGNUP_BONUS);
                setIsNewCustomer(true);
                setMemberId(null);
                setDob(null);
                if (isStaff) {
                    setConfirmPhone('');
                    setStep('PHONE_CONFIRM');
                } else {
                    setStep('DETAILS');
                }
                setSubmitStage(null);
            }
        } catch (err) {
            console.error('Phone lookup error:', err);
            setSubmitStage(null);
            setError(toUiError(err, 'System error during lookup. Please try again.'));
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handlePhoneSubmit(e: React.FormEvent) {
        e.preventDefault();
        await processPhoneNumber(phone);
    }

    async function handlePhoneConfirmSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (!isValidPhone(confirmPhone)) {
            setError('Please re-enter a valid 10-digit mobile number');
            return;
        }

        if (normalizePhone(confirmPhone) !== normalizePhone(phone)) {
            setError('Mobile numbers do not match. Please re-check.');
            return;
        }

        setStep('DETAILS');
    }

    // Referral phone blur handler — resolve or auto-create member
    async function handleReferralBlur() {
        if (!referredByPhone || referredByPhone.length < 10) {
            setReferralResolved(null);
            setReferralError(null);
            return;
        }

        // Self-referral guard
        const normalizedRef = normalizePhone(referredByPhone);
        const normalizedCustomer = normalizePhone(phone);
        if (normalizedRef === normalizedCustomer) {
            setReferralError('Referral cannot be the same as customer phone');
            setReferralResolved(null);
            return;
        }

        setReferralResolving(true);
        setReferralError(null);
        try {
            const result = await ensureMemberByPhone(referredByPhone);
            if (result.success) {
                setReferralResolved({ memberId: result.memberId, name: result.name || null });
                setReferralError(null);
                if (result.created) {
                    toast.success('Referrer profile created automatically');
                }
            } else {
                setReferralError(result.message || 'Could not resolve referrer');
                setReferralResolved(null);
            }
        } catch {
            setReferralError('Failed to resolve referrer');
        } finally {
            setReferralResolving(false);
        }
    }

    async function handleDetailSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (isStaff && !effectiveTenantId) {
            setError('Active dealership context missing. Select dealership and retry.');
            return;
        }

        if (name.length < 2) {
            setError('Please enter a valid name');
            return;
        }
        if (pincode.length !== 6) {
            setError('Please enter a valid 6-digit pincode');
            return;
        }

        setIsSubmitting(true);
        try {
            setSubmitStage('QUOTE GENERATING');
            const leadResult = await createLeadAction({
                customer_name: name,
                customer_phone: phone,
                customer_pincode: pincode,
                customer_dob: dob || undefined,
                customer_id: memberId || undefined,
                model: model,
                owner_tenant_id: effectiveTenantId,
                selected_dealer_id: effectiveTenantId,
                source: isStaff ? 'DEALER_REFERRAL' : 'PDP_QUICK_QUOTE',
                referred_by_phone: referredByPhone || undefined,
            });

            if (leadResult.success && (leadResult as any).leadId) {
                setSubmitStage('SHARING QUOTE');
                const coinsToUse = isNewCustomer ? OCLUB_SIGNUP_BONUS : customerCoins || 0;
                await handleCreateQuote((leadResult as any).leadId, coinsToUse, isNewCustomer);
            } else {
                setSubmitStage(null);
                setError(leadResult.message || 'Failed to save details');
            }
        } catch (err) {
            console.error('Detail submission error:', err);
            setSubmitStage(null);
            setError(toUiError(err, 'Network error. Please try again.'));
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleCreateQuote(lId: string, coins: number, isWelcome: boolean) {
        if (!variantId || !commercials) {
            setError('Quote creation blocked: missing required product or pricing data.');
            return;
        }

        // Build deterministic B-coin snapshot
        const totalOnRoad = commercials?.pricing_snapshot?.final_on_road || commercials?.totalOnRoad || 0;
        const coinPricing = computeOClubPricing(totalOnRoad, coins);
        const bcoinApplied = {
            coins: coinPricing.coinsUsed,
            discount: coinPricing.discount,
            source: isWelcome ? 'WELCOME' : 'WALLET',
            coin_value: OCLUB_COIN_VALUE,
            calc_version: 'v1',
            resolved_at: new Date().toISOString(),
        };

        // Merge bcoin_applied into commercials
        const enrichedCommercials = {
            ...commercials,
            pricing_snapshot: {
                ...(commercials?.pricing_snapshot || {}),
                bcoin_applied: bcoinApplied,
            },
        };
        const storeUrl = typeof window !== 'undefined' ? window.location.href : undefined;

        try {
            setSubmitStage('SHARING QUOTE');
            const result = await createQuoteAction({
                tenant_id: effectiveTenantId,
                lead_id: lId,
                variant_id: variantId,
                color_id: colorId,
                commercials: enrichedCommercials,
                store_url: storeUrl,
                source,
            });

            if (result.success) {
                const displayId = result.data?.display_id || result.data?.displayId || result.data?.id || null;
                const uuid = result.data?.id || null;
                setSmsFeedback('Quote created — share it!');
                setSubmitStage('QUOTE SAVED');
                setQuoteId(displayId);
                setQuoteUuid(uuid);
                setError(null);
                setSuccess(true);
            } else {
                console.error('Server reported failure creating quote in modal:', result);
                setSubmitStage(null);
                setError(result.message || 'Quote generation failed. Please try again.');
            }
        } catch (err) {
            console.error('Quote creation error:', err);
            setSubmitStage(null);
            setError('Quote generation failed due to a system error. Please try again.');
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] shadow-[0_25px_60px_rgba(15,23,42,0.15),0_4px_20px_rgba(15,23,42,0.08)] border border-slate-200/80 dark:border-white/10 p-8 md:p-10 relative overflow-hidden">
                {/* Subtle gradient overlay — matches FloatingCommandBar */}
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.9),rgba(255,255,255,0.3)_50%,rgba(255,215,0,0.04))]" />

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 z-10 p-2.5 rounded-2xl bg-slate-100/80 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 transition-all active:scale-95 border border-slate-200/50"
                >
                    <X className="w-4 h-4 text-slate-500" />
                </button>

                {success ? (
                    <div className="text-center py-8 space-y-6 animate-in zoom-in-95 duration-500">
                        <div className="relative w-24 h-24 mx-auto">
                            <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
                            <div className="relative w-24 h-24 bg-emerald-50 dark:bg-emerald-950/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 border-4 border-emerald-500/30">
                                <CheckCircle className="w-12 h-12" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white leading-tight">
                                QUOTE SAVED!
                            </h3>
                            {quoteId && (
                                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300">
                                    ID: <span className="text-slate-900 dark:text-white">{quoteId}</span>
                                </p>
                            )}
                            {smsFeedback && (
                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">
                                    {smsFeedback}
                                </p>
                            )}
                        </div>

                        {/* Share Buttons */}
                        {quoteUuid && shareStatus !== 'sent' && (
                            <div className="space-y-3">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                    Share Quote with Customer
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={async () => {
                                            setShareStatus('sending-wa');
                                            const result = await shareQuoteViaWhatsApp(quoteUuid);
                                            if (result.success) {
                                                setShareStatus('sent');
                                                setSmsFeedback('Shared via WhatsApp ✅');
                                                toast.success('Quote sent via WhatsApp!');
                                            } else {
                                                setShareStatus('idle');
                                                toast.error(result.error || 'WhatsApp send failed');
                                            }
                                        }}
                                        disabled={shareStatus !== 'idle'}
                                        className="flex-1 py-4 bg-[#25D366] hover:bg-[#20BD5A] disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 font-black uppercase tracking-widest rounded-3xl transition-all shadow-lg shadow-[#25D366]/20 disabled:shadow-none flex items-center justify-center gap-3 active:scale-[0.97] text-sm"
                                    >
                                        {shareStatus === 'sending-wa' ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <MessageCircle className="w-5 h-5" />
                                                WhatsApp
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={async () => {
                                            setShareStatus('sending-sms');
                                            const result = await shareQuoteViaSms(quoteUuid);
                                            if (result.success) {
                                                setShareStatus('sent');
                                                setSmsFeedback('Shared via SMS ✅');
                                                toast.success('Quote sent via SMS!');
                                            } else {
                                                setShareStatus('idle');
                                                toast.error(result.error || 'SMS send failed');
                                            }
                                        }}
                                        disabled={shareStatus !== 'idle'}
                                        className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 font-black uppercase tracking-widest rounded-3xl transition-all shadow-lg shadow-blue-600/20 disabled:shadow-none flex items-center justify-center gap-3 active:scale-[0.97] text-sm"
                                    >
                                        {shareStatus === 'sending-sms' ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <Send className="w-5 h-5" />
                                                SMS
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Sent confirmation */}
                        {shareStatus === 'sent' && (
                            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
                                <p className="text-xs font-black uppercase tracking-[0.15em] text-emerald-600">
                                    ✅ Quote Shared Successfully
                                </p>
                            </div>
                        )}

                        <button
                            onClick={onClose}
                            className="w-full py-4 bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-black uppercase italic tracking-widest rounded-3xl hover:translate-y-[-2px] active:translate-y-[1px] transition-all shadow-xl shadow-slate-900/20 dark:shadow-white/10 text-sm"
                        >
                            {shareStatus === 'sent' ? 'Done' : 'Close'}
                        </button>
                    </div>
                ) : (
                    <div className="relative z-10 space-y-6">
                        {isStaff && step === 'PHONE' && (
                            <div className="bg-blue-600/5 border border-blue-600/15 rounded-2xl p-4 flex items-center gap-4 animate-in slide-in-from-top-4 duration-500">
                                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-blue-600/20">
                                    <Briefcase size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-1 leading-none">
                                        Staff Referral Mode
                                    </p>
                                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400 truncate">
                                        Booking for a customer from{' '}
                                        <span className="text-blue-600 dark:text-blue-400">
                                            {primaryMembership?.tenants?.name || 'your dealership'}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* TabHeader — matches PDP personalization tabs */}
                        <div className="flex items-center gap-6 px-1">
                            <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center border border-brand-primary/30 text-brand-primary shrink-0 shadow-[0_0_20px_rgba(255,215,0,0.15)]">
                                {step === 'PHONE' ? (
                                    isStaff ? (
                                        <UserSearch className="w-8 h-8" />
                                    ) : (
                                        <Sparkles className="w-8 h-8" />
                                    )
                                ) : step === 'PHONE_CONFIRM' ? (
                                    <ShieldCheck className="w-8 h-8" />
                                ) : (
                                    <UserCircle2 className="w-8 h-8" />
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white leading-none">
                                    {step === 'PHONE'
                                        ? isStaff
                                            ? 'Identify Customer'
                                            : 'Get Personal Quote'
                                        : step === 'PHONE_CONFIRM'
                                          ? 'Confirm Mobile'
                                          : 'Complete Profile'}
                                </h3>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1.5">
                                    {productName}
                                </p>
                            </div>
                        </div>

                        {/* Step Progress Indicator */}
                        <div className="flex items-center gap-2 px-1">
                            {(['PHONE', ...(isStaff ? ['PHONE_CONFIRM'] : []), 'DETAILS'] as LeadStep[]).map(
                                (s, idx) => {
                                    const stepIndex = [
                                        'PHONE',
                                        ...(isStaff ? ['PHONE_CONFIRM'] : []),
                                        'DETAILS',
                                    ].indexOf(step);
                                    const thisIndex = idx;
                                    const isComplete = thisIndex < stepIndex;
                                    const isCurrent = s === step;
                                    return (
                                        <div
                                            key={s}
                                            className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                                                isComplete
                                                    ? 'bg-brand-primary shadow-[0_0_8px_rgba(255,215,0,0.4)]'
                                                    : isCurrent
                                                      ? 'bg-brand-primary/40'
                                                      : 'bg-slate-200 dark:bg-slate-700'
                                            }`}
                                        />
                                    );
                                }
                            )}
                        </div>

                        {/* Separator */}
                        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />

                        {error && (
                            <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold rounded-2xl text-center animate-in shake duration-300">
                                {error}
                            </div>
                        )}
                        {isSubmitting && submitStage && (
                            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[11px] font-black uppercase tracking-[0.18em] rounded-2xl text-center animate-in fade-in duration-300">
                                {submitStage}
                            </div>
                        )}

                        {step === 'PHONE' ? (
                            <form onSubmit={handlePhoneSubmit} className="space-y-6">
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-2">
                                        {isStaff ? "Customer's Mobile" : 'Your Mobile'}
                                    </p>
                                    <div className="relative group">
                                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-black tracking-tighter text-lg select-none z-10">
                                            +91
                                        </span>
                                        <input
                                            type="tel"
                                            required
                                            value={phone}
                                            onChange={e => setPhone(normalizeIndianPhone(e.target.value))}
                                            placeholder="00000 00000"
                                            maxLength={10}
                                            className="w-full pl-16 pr-6 py-5 bg-white dark:bg-black/20 border border-slate-200 dark:border-slate-700 focus:border-brand-primary/60 dark:focus:border-brand-primary/40 focus:shadow-[0_0_0_4px_rgba(255,215,0,0.1)] rounded-2xl outline-none font-black text-xl text-slate-900 dark:text-white tracking-[0.1em] transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700"
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting || !isValidPhone(phone)}
                                    className="w-full group py-5 bg-[#FFD700] hover:bg-[#F4B000] disabled:bg-slate-100 dark:disabled:bg-slate-800 text-slate-900 disabled:text-slate-400 font-black text-xs uppercase tracking-[0.12em] rounded-2xl transition-all shadow-[0_4px_20px_rgba(255,215,0,0.3)] hover:shadow-[0_6px_28px_rgba(255,215,0,0.45)] disabled:shadow-none flex items-center justify-center gap-3 active:scale-[0.98] hover:-translate-y-0.5"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>{submitStage || 'Processing'}</span>
                                        </>
                                    ) : (
                                        <>
                                            Continue
                                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </form>
                        ) : step === 'PHONE_CONFIRM' ? (
                            <form
                                onSubmit={handlePhoneConfirmSubmit}
                                className="space-y-6 animate-in slide-in-from-right-4 duration-300"
                            >
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-2">
                                        Re-enter Mobile
                                    </p>
                                    <div className="relative group">
                                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-black tracking-tighter text-lg select-none z-10">
                                            +91
                                        </span>
                                        <input
                                            type="tel"
                                            required
                                            value={confirmPhone}
                                            onChange={e => setConfirmPhone(normalizeIndianPhone(e.target.value))}
                                            placeholder="Re-enter 10-digit mobile"
                                            maxLength={10}
                                            className="w-full pl-16 pr-6 py-5 bg-white dark:bg-black/20 border border-slate-200 dark:border-slate-700 focus:border-brand-primary/60 dark:focus:border-brand-primary/40 focus:shadow-[0_0_0_4px_rgba(255,215,0,0.1)] rounded-2xl outline-none font-black text-xl text-slate-900 dark:text-white tracking-[0.1em] transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700"
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setStep('PHONE')}
                                        className="px-6 py-5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-black uppercase text-xs tracking-[0.12em] rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 border border-slate-200/50"
                                    >
                                        Back
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !isValidPhone(confirmPhone)}
                                        className="flex-1 py-5 bg-[#FFD700] hover:bg-[#F4B000] disabled:bg-slate-100 dark:disabled:bg-slate-800 text-slate-900 disabled:text-slate-400 font-black uppercase text-xs tracking-[0.12em] rounded-2xl transition-all shadow-[0_4px_20px_rgba(255,215,0,0.3)] hover:shadow-[0_6px_28px_rgba(255,215,0,0.45)] disabled:shadow-none flex items-center justify-center gap-3 active:scale-[0.98] hover:-translate-y-0.5"
                                    >
                                        Continue
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form
                                onSubmit={handleDetailSubmit}
                                className="space-y-6 animate-in slide-in-from-right-4 duration-300"
                            >
                                <div className="space-y-5">
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-2">
                                            Full Name
                                        </p>
                                        <input
                                            type="text"
                                            required
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            placeholder="Enter full name"
                                            className="w-full px-6 py-4 bg-white dark:bg-black/20 border border-slate-200 dark:border-slate-700 focus:border-brand-primary/60 focus:shadow-[0_0_0_4px_rgba(255,215,0,0.1)] rounded-2xl outline-none font-bold text-slate-900 dark:text-white transition-all placeholder:text-slate-300"
                                            autoFocus
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-2">
                                            Pincode
                                        </p>
                                        <input
                                            type="tel"
                                            required
                                            value={pincode}
                                            onChange={e => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            placeholder="6-digit Pincode"
                                            className="w-full px-6 py-4 bg-white dark:bg-black/20 border border-slate-200 dark:border-slate-700 focus:border-brand-primary/60 focus:shadow-[0_0_0_4px_rgba(255,215,0,0.1)] rounded-2xl outline-none font-bold text-slate-900 dark:text-white transition-all tracking-[0.2em] placeholder:text-slate-300"
                                        />
                                    </div>

                                    {isStaff && (
                                        <div className="space-y-3">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-2">
                                                Referred By (Optional)
                                            </p>
                                            <div className="relative">
                                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold text-sm select-none z-10">
                                                    +91
                                                </span>
                                                <input
                                                    type="tel"
                                                    value={referredByPhone}
                                                    onChange={e => {
                                                        setReferredByPhone(normalizeIndianPhone(e.target.value));
                                                        setReferralResolved(null);
                                                        setReferralError(null);
                                                    }}
                                                    onBlur={handleReferralBlur}
                                                    placeholder="Referrer's mobile"
                                                    maxLength={10}
                                                    className="w-full pl-14 pr-6 py-4 bg-white dark:bg-black/20 border border-slate-200 dark:border-slate-700 focus:border-indigo-500/60 focus:shadow-[0_0_0_4px_rgba(99,102,241,0.1)] rounded-2xl outline-none font-bold text-sm text-slate-900 dark:text-white tracking-wider transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
                                                />
                                            </div>
                                            {referralResolving && (
                                                <p className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 px-2">
                                                    <Loader2 className="w-3 h-3 animate-spin" /> Resolving referrer...
                                                </p>
                                            )}
                                            {referralResolved && (
                                                <p className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 px-2">
                                                    ✓ {referralResolved.name || 'Member'} linked as referrer
                                                </p>
                                            )}
                                            {referralError && (
                                                <p className="text-[10px] font-bold text-red-500 px-2">
                                                    {referralError}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setStep(isStaff && !memberId ? 'PHONE_CONFIRM' : 'PHONE')}
                                        className="px-6 py-5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-black uppercase text-xs tracking-[0.12em] rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 border border-slate-200/50"
                                    >
                                        Back
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 py-5 bg-[#FFD700] hover:bg-[#F4B000] text-slate-900 font-black uppercase text-xs tracking-[0.12em] rounded-2xl transition-all shadow-[0_4px_20px_rgba(255,215,0,0.3)] hover:shadow-[0_6px_28px_rgba(255,215,0,0.45)] active:scale-[0.98] hover:-translate-y-0.5 flex items-center justify-center gap-3"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                <span>{submitStage || 'Processing'}</span>
                                            </>
                                        ) : (
                                            'Create Quote'
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* B-coin Savings Banner */}
                        {customerCoins !== null && customerCoins > 0 && (
                            <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-brand-primary/5 to-brand-primary/10 border border-brand-primary/20 animate-in slide-in-from-bottom-2 duration-500">
                                <div className="w-10 h-10 rounded-xl bg-brand-primary/20 flex items-center justify-center flex-shrink-0">
                                    <Logo variant="icon" size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-brand-primary leading-none">
                                        {isNewCustomer ? "O' Circle Welcome Bonus" : "O' Circle Balance"}
                                    </p>
                                    <p className="mt-1 text-xs font-bold text-slate-600 dark:text-slate-300">
                                        <span className="text-brand-primary font-black">{customerCoins}</span> coins ={' '}
                                        <span className="text-emerald-600 font-black">
                                            ₹{discountForCoins(customerCoins).toLocaleString()}
                                        </span>{' '}
                                        savings
                                    </p>
                                </div>
                            </div>
                        )}

                        <p className="text-[9px] text-center text-slate-400 dark:text-slate-600 leading-relaxed font-medium uppercase tracking-wider px-4">
                            By continuing, you agree to receive a callback/WhatsApp from our authorized dealer partners.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
