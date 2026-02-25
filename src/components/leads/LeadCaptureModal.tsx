'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle, Loader2, Briefcase, ChevronRight, Phone, User, MapPin, Coins } from 'lucide-react';
import { useTenant } from '@/lib/tenant/tenantContext';
import { useDealerSession } from '@/hooks/useDealerSession';
import { createClient } from '@/lib/supabase/client';
import { normalizeIndianPhone } from '@/lib/utils/inputFormatters';
import { normalizePhone, formatPhone, isValidPhone } from '@/lib/utils/phoneUtils';
import { checkExistingCustomer, createQuoteAction, createLeadAction } from '@/actions/crm';
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
                    await handleCreateQuote((leadResult as any).leadId, walletCoins || 0, false);
                } else {
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
            }
        } catch (err) {
            console.error('Phone lookup error:', err);
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
                const coinsToUse = isNewCustomer ? OCLUB_SIGNUP_BONUS : customerCoins || 0;
                await handleCreateQuote((leadResult as any).leadId, coinsToUse, isNewCustomer);
            } else {
                setError(leadResult.message || 'Failed to save details');
            }
        } catch (err) {
            console.error('Detail submission error:', err);
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

        try {
            const result = await createQuoteAction({
                tenant_id: effectiveTenantId,
                lead_id: lId,
                variant_id: variantId,
                color_id: colorId,
                commercials: enrichedCommercials,
                source,
            });

            if (result.success) {
                const displayId = result.data?.display_id || result.data?.displayId || result.data?.id || null;
                setQuoteId(displayId);
                setError(null);
                setSuccess(true);
            } else {
                console.error('Server reported failure creating quote in modal:', result);
                setError(result.message || 'Quote generation failed. Please try again.');
            }
        } catch (err) {
            console.error('Quote creation error:', err);
            setError('Quote generation failed due to a system error. Please try again.');
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-white/10 p-8 relative overflow-hidden">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-all active:scale-95"
                >
                    <X className="w-5 h-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-white" />
                </button>

                {success ? (
                    <div className="text-center py-10 space-y-8 animate-in zoom-in-95 duration-500">
                        <div className="relative w-32 h-32 mx-auto">
                            <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
                            <div className="relative w-32 h-32 bg-emerald-50 dark:bg-emerald-950/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 border-4 border-emerald-500/30">
                                <CheckCircle className="w-16 h-16" />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white leading-tight">
                                EXCLUSIVE DEAL
                                <br />
                                LOCKED!
                            </h3>
                            <p className="inline-block px-4 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-500 rounded-full">
                                Priority Callback Initiated
                            </p>
                            {quoteId && (
                                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300">
                                    Quote ID: <span className="text-slate-900 dark:text-white">{quoteId}</span>
                                </p>
                            )}
                        </div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                            Our dealer partner has received your configuration for the{' '}
                            <span className="text-slate-900 dark:text-white font-bold">{productName}</span>. You'll
                            receive a VIP call within 30 minutes.
                        </p>
                        <button
                            onClick={onClose}
                            className="w-full py-5 bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-black uppercase italic tracking-widest rounded-3xl hover:translate-y-[-2px] active:translate-y-[1px] transition-all shadow-xl shadow-slate-900/20 dark:shadow-white/10"
                        >
                            Back to Gallery
                        </button>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {isStaff && step === 'PHONE' && (
                            <div className="bg-blue-600/5 border border-blue-600/10 rounded-3xl p-5 flex items-center gap-5 animate-in slide-in-from-top-4 duration-500">
                                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-blue-600/20">
                                    <Briefcase size={24} />
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

                        <div className="text-center space-y-2">
                            <h3 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white leading-none">
                                {step === 'PHONE'
                                    ? isStaff
                                        ? 'Identify Customer'
                                        : 'Get Personal Quote'
                                    : step === 'PHONE_CONFIRM'
                                      ? 'Confirm Mobile'
                                      : 'Complete Profile'}
                            </h3>
                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-brand-primary">
                                {productName}
                            </p>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold rounded-2xl text-center animate-in shake duration-300">
                                {error}
                            </div>
                        )}

                        {step === 'PHONE' ? (
                            <form onSubmit={handlePhoneSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between px-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                            {isStaff ? "Customer's Mobile" : 'Confirm Mobile'}
                                        </label>
                                        <Phone className="w-3 h-3 text-slate-400" />
                                    </div>
                                    <div className="relative group">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 font-black tracking-tighter text-lg select-none">
                                            +91
                                        </span>
                                        <input
                                            type="tel"
                                            required
                                            value={phone}
                                            onChange={e => setPhone(normalizeIndianPhone(e.target.value))}
                                            placeholder="00000 00000"
                                            maxLength={10}
                                            className="w-full pl-16 pr-6 py-5 bg-slate-50 dark:bg-black/20 border-2 border-transparent focus:border-brand-primary/50 dark:focus:border-brand-primary/30 rounded-3xl outline-none font-black text-xl text-slate-900 dark:text-white tracking-[0.1em] transition-all placeholder:text-slate-200 dark:placeholder:text-slate-800"
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting || !isValidPhone(phone)}
                                    className="w-full group py-5 bg-brand-primary hover:bg-[#E0A200] disabled:bg-slate-100 dark:disabled:bg-slate-800 text-black disabled:text-slate-400 font-black uppercase italic tracking-widest rounded-3xl transition-all shadow-xl shadow-brand-primary/20 disabled:shadow-none flex items-center justify-center gap-4 active:scale-[0.98]"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="w-6 h-6 animate-spin text-black" />
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
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between px-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                            Re-enter Mobile
                                        </label>
                                        <Phone className="w-3 h-3 text-slate-400" />
                                    </div>
                                    <div className="relative group">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 font-black tracking-tighter text-lg select-none">
                                            +91
                                        </span>
                                        <input
                                            type="tel"
                                            required
                                            value={confirmPhone}
                                            onChange={e => setConfirmPhone(normalizeIndianPhone(e.target.value))}
                                            placeholder="Re-enter 10-digit mobile"
                                            maxLength={10}
                                            className="w-full pl-16 pr-6 py-5 bg-slate-50 dark:bg-black/20 border-2 border-transparent focus:border-brand-primary/50 dark:focus:border-brand-primary/30 rounded-3xl outline-none font-black text-xl text-slate-900 dark:text-white tracking-[0.1em] transition-all placeholder:text-slate-200 dark:placeholder:text-slate-800"
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setStep('PHONE')}
                                        className="px-6 py-5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-black uppercase italic tracking-widest rounded-3xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                                    >
                                        Back
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !isValidPhone(confirmPhone)}
                                        className="flex-1 py-5 bg-brand-primary hover:bg-[#E0A200] disabled:bg-slate-100 dark:disabled:bg-slate-800 text-black disabled:text-slate-400 font-black uppercase italic tracking-widest rounded-3xl transition-all shadow-xl shadow-brand-primary/20 disabled:shadow-none flex items-center justify-center gap-4 active:scale-[0.98]"
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
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between px-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                Full Name
                                            </label>
                                            <User className="w-3 h-3 text-slate-400" />
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            placeholder="Enter full name"
                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-black/20 border-2 border-transparent focus:border-brand-primary/50 rounded-3xl outline-none font-bold text-slate-900 dark:text-white transition-all"
                                            autoFocus
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between px-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                Pincode
                                            </label>
                                            <MapPin className="w-3 h-3 text-slate-400" />
                                        </div>
                                        <input
                                            type="tel"
                                            required
                                            value={pincode}
                                            onChange={e => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            placeholder="6-digit Pincode"
                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-black/20 border-2 border-transparent focus:border-brand-primary/50 rounded-3xl outline-none font-bold text-slate-900 dark:text-white transition-all tracking-[0.2em]"
                                        />
                                    </div>

                                    {isStaff && (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between px-1">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                    Referred By (Optional)
                                                </label>
                                                <Phone className="w-3 h-3 text-slate-400" />
                                            </div>
                                            <div className="relative">
                                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 font-bold text-sm select-none">
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
                                                    className="w-full pl-14 pr-6 py-3.5 bg-slate-50 dark:bg-black/20 border-2 border-transparent focus:border-indigo-500/50 rounded-2xl outline-none font-bold text-sm text-slate-900 dark:text-white tracking-wider transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700"
                                                />
                                            </div>
                                            {referralResolving && (
                                                <p className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 px-1">
                                                    <Loader2 className="w-3 h-3 animate-spin" /> Resolving referrer...
                                                </p>
                                            )}
                                            {referralResolved && (
                                                <p className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 px-1">
                                                    ✓ {referralResolved.name || 'Member'} linked as referrer
                                                </p>
                                            )}
                                            {referralError && (
                                                <p className="text-[10px] font-bold text-red-500 px-1">
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
                                        className="px-6 py-5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-black uppercase italic tracking-widest rounded-3xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                                    >
                                        Back
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 py-5 bg-brand-primary hover:bg-[#E0A200] text-black font-black uppercase italic tracking-widest rounded-3xl transition-all shadow-xl shadow-brand-primary/20 active:scale-[0.98] flex items-center justify-center gap-3"
                                    >
                                        {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Create Quote'}
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
