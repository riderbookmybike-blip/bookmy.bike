'use client';

import React, { useState } from 'react';
import SlideOver from '@/components/ui/SlideOver';
import { Button } from '@/components/ui/button';
import { User, Phone, MapPin, Bike, Send, Cake, Paperclip, FileText, Building2 } from 'lucide-react';
import { normalizeIndianPhone, parseDateToISO } from '@/lib/utils/inputFormatters';

interface LeadFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: {
        customerName: string;
        phone: string;
        pincode: string;
        interestText: string;
        organisation?: string;

        dob?: string;
        selectedDealerId?: string;
        attachmentPurpose?: string;
        attachments?: File[];
        referredByCode?: string;
        referredByPhone?: string;
        referredByName?: string;
    }) => void | Promise<void>;
    showDealerSelect?: boolean;
    dealerOptions?: Array<{ id: string; name: string }>;
    initialSelectedDealerId?: string;
    ownerTenantId?: string;
    requesterTenantId?: string;
}

export default function LeadForm({
    isOpen,
    onClose,
    onSubmit,
    showDealerSelect = false,
    dealerOptions = [],
    initialSelectedDealerId = '',
    ownerTenantId,
    requesterTenantId,
}: LeadFormProps) {
    const documentPurposes = [
        'Aadhaar Card',
        'PAN Card',
        'Voting Card',
        'Passport',
        'Driving License',
        'Bank Statement',
        'Light Bill',
        'Other KYC',
    ];

    const [customerName, setCustomerName] = useState('');
    const [organisation, setOrganisation] = useState('');
    const [phone, setPhone] = useState('');
    const [pincode, setPincode] = useState('');

    const [interestText, setInterestText] = useState('');
    const [dob, setDob] = useState('');
    const [attachmentPurpose, setAttachmentPurpose] = useState('Aadhaar Card');
    const [attachments, setAttachments] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isCheckingPhone, setIsCheckingPhone] = useState(false);
    const [isCheckingLeadOwnership, setIsCheckingLeadOwnership] = useState(false);
    const [isExistingCustomer, setIsExistingCustomer] = useState(false);
    const [hasActiveDelivery, setHasActiveDelivery] = useState(false);
    const [existingLeadContext, setExistingLeadContext] = useState<{
        id: string;
        displayId: string;
        status: string;
        dealershipName?: string | null;
        createdByName?: string | null;
        createdAt?: string | null;
        lastEditedByName?: string | null;
        lastEditedAt?: string | null;
        canWrite?: boolean;
        canRequestShare?: boolean;
        pendingShareRequest?: boolean;
    } | null>(null);
    const [isRequestingShare, setIsRequestingShare] = useState(false);
    const [selectedDealerId, setSelectedDealerId] = useState(initialSelectedDealerId);
    const [isResolvingPincode, setIsResolvingPincode] = useState(false);
    const [pincodeLocation, setPincodeLocation] = useState<{
        area: string | null;
        taluka: string | null;
        district: string | null;
        state: string | null;
        is_serviceable: boolean;
    } | null>(null);
    const [referredByCode, setReferredByCode] = useState('');
    const [referredByPhone, setReferredByPhone] = useState('');
    const [referredByName, setReferredByName] = useState('');
    const [isResolvingReferrer, setIsResolvingReferrer] = useState(false);
    const [resolvedReferrer, setResolvedReferrer] = useState<{
        memberId: string;
        name: string | null;
        phone: string | null;
        membershipId: string | null;
    } | null>(null);

    React.useEffect(() => {
        setSelectedDealerId(initialSelectedDealerId || '');
    }, [initialSelectedDealerId, isOpen]);

    const [docCount, setDocCount] = useState(0);

    const activeDealershipContextId = selectedDealerId || (!showDealerSelect ? ownerTenantId || '' : '');

    const parseResponse = async (response: Response) => {
        const text = await response.text();
        let data: any = null;
        try {
            data = text ? JSON.parse(text) : null;
        } catch {
            data = null;
        }
        if (!response.ok) {
            const message = String(data?.message || '').trim() || `Request failed (${response.status})`;
            throw new Error(message);
        }
        return data;
    };

    // Phone Discovery Logic
    React.useEffect(() => {
        const checkPhone = async () => {
            if (phone.length === 10) {
                setIsCheckingPhone(true);
                try {
                    const response = await fetch('/api/leads/form-phone-check', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ phone }),
                    });
                    const result = await parseResponse(response);
                    const profile = result?.data || null;
                    const activeDeliveryFlag = Boolean(result?.hasActiveDelivery);
                    const docCountFromApi = Number(result?.docCount || 0);
                    if (profile) {
                        setCustomerName(profile.name || '');
                        setPincode(profile.pincode || '');
                        setDob(parseDateToISO(profile.dob || '') || '');
                        setIsExistingCustomer(true);
                        setHasActiveDelivery(!!activeDeliveryFlag);
                        setDocCount(docCountFromApi);
                    } else {
                        setIsExistingCustomer(false);
                        setDocCount(0);
                        setHasActiveDelivery(false);
                    }
                } catch (error) {
                    console.error('Phone check failed:', error);
                } finally {
                    setIsCheckingPhone(false);
                }
            } else {
                setIsExistingCustomer(false);
                setDocCount(0);
                setHasActiveDelivery(false);
            }
        };
        checkPhone();
    }, [phone]);

    React.useEffect(() => {
        const checkLeadOwnership = async () => {
            if (phone.length !== 10) {
                setExistingLeadContext(null);
                return;
            }
            if (!activeDealershipContextId) {
                setExistingLeadContext(null);
                return;
            }

            setIsCheckingLeadOwnership(true);
            try {
                const response = await fetch('/api/leads/quick-check', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        phone,
                        ownerTenantId: activeDealershipContextId,
                        selectedDealerId: activeDealershipContextId,
                    }),
                });
                const result = await parseResponse(response);
                if (!result?.success) {
                    setExistingLeadContext(null);
                    return;
                }
                const existing = result?.existingLead || null;
                setExistingLeadContext(
                    existing
                        ? {
                              id: existing.id,
                              displayId: existing.displayId,
                              status: existing.status,
                              dealershipName: existing.dealershipName || null,
                              createdByName: existing.createdByName || null,
                              createdAt: existing.createdAt || null,
                              lastEditedByName: existing.lastEditedByName || null,
                              lastEditedAt: existing.lastEditedAt || null,
                              canWrite: existing.canWrite !== false,
                              canRequestShare: existing.canRequestShare === true,
                              pendingShareRequest: existing.pendingShareRequest === true,
                          }
                        : null
                );
            } catch {
                setExistingLeadContext(null);
            } finally {
                setIsCheckingLeadOwnership(false);
            }
        };
        checkLeadOwnership();
    }, [phone, activeDealershipContextId]);

    React.useEffect(() => {
        let active = true;
        const resolvePincode = async () => {
            const normalized = pincode.replace(/\D/g, '');
            if (normalized.length !== 6) {
                setPincodeLocation(null);
                setIsResolvingPincode(false);
                return;
            }
            setIsResolvingPincode(true);
            try {
                const response = await fetch('/api/leads/resolve-pincode', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pincode: normalized }),
                });
                const result = await parseResponse(response);
                if (!active) return;
                if (result.success && result.location) {
                    setPincodeLocation({
                        area: result.location.area || null,
                        taluka: result.location.taluka || null,
                        district: result.location.district || null,
                        state: result.location.state || null,
                        is_serviceable: !!result.location.is_serviceable,
                    });
                } else {
                    setPincodeLocation(null);
                }
            } catch {
                if (active) setPincodeLocation(null);
            } finally {
                if (active) setIsResolvingPincode(false);
            }
        };
        resolvePincode();
        return () => {
            active = false;
        };
    }, [pincode]);

    React.useEffect(() => {
        let active = true;
        const code = referredByCode.trim().toUpperCase();
        const phone = normalizeIndianPhone(referredByPhone);

        if (!code && !phone) {
            setResolvedReferrer(null);
            setIsResolvingReferrer(false);
            return;
        }

        if (!code && phone.length > 0 && phone.length < 10) {
            setResolvedReferrer(null);
            setIsResolvingReferrer(false);
            return;
        }

        setIsResolvingReferrer(true);
        const timer = setTimeout(async () => {
            try {
                const response = await fetch('/api/leads/resolve-referrer', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        referralCode: code || undefined,
                        referralPhone: phone || undefined,
                    }),
                });
                const result = await parseResponse(response);
                if (!active) return;
                const matchedReferrer = result.match;
                if (result.success && matchedReferrer) {
                    setResolvedReferrer(matchedReferrer);
                    if (matchedReferrer.name) {
                        setReferredByName(prev => prev || matchedReferrer.name || '');
                    }
                } else {
                    setResolvedReferrer(null);
                }
            } catch {
                if (active) setResolvedReferrer(null);
            } finally {
                if (active) setIsResolvingReferrer(false);
            }
        }, 300);

        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [referredByCode, referredByPhone]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (pincode.length !== 6) {
            alert('Please enter a valid 6-digit Pincode');
            return;
        }
        if (!interestText.trim()) {
            alert('Please capture customer interest');
            return;
        }
        if (existingLeadContext?.canWrite === false) {
            alert('Existing lead is owned by another user. Request share first.');
            return;
        }
        const normalizedReferrerPhone = normalizeIndianPhone(referredByPhone);
        const normalizedReferrerCode = referredByCode.trim().toUpperCase();
        const hasReferralInput = !!(normalizedReferrerCode || normalizedReferrerPhone);
        if (!hasActiveDelivery && !hasReferralInput) {
            alert("Referral is mandatory. Enter O' Circle Membership ID or referrer contact.");
            return;
        }
        if (normalizedReferrerPhone && normalizedReferrerPhone.length !== 10) {
            alert('Referrer phone must be a valid 10-digit number');
            return;
        }
        if (
            !hasActiveDelivery &&
            normalizedReferrerCode &&
            !normalizedReferrerPhone &&
            !referredByName.trim() &&
            !resolvedReferrer
        ) {
            alert("O' Circle Membership ID not found. Add referrer phone or name.");
            return;
        }

        setIsSubmitting(true);
        try {
            if (showDealerSelect && !selectedDealerId) {
                alert('Please select dealership');
                setIsSubmitting(false);
                return;
            }
            await onSubmit({
                customerName,
                phone,
                pincode,
                interestText: interestText.trim(),
                organisation: organisation.trim() || undefined,

                dob: dob || undefined,
                selectedDealerId: selectedDealerId || undefined,
                attachmentPurpose,
                attachments,
                referredByCode: normalizedReferrerCode || undefined,
                referredByPhone: normalizedReferrerPhone || undefined,
                referredByName: referredByName.trim() || undefined,
            });
            // ONLY reset form if onSubmit succeeded
            setCustomerName('');
            setOrganisation('');
            setPhone('');
            setPincode('');

            setInterestText('');
            setDob('');
            setIsExistingCustomer(false);
            setSelectedDealerId('');
            setAttachments([]);
            setAttachmentPurpose('Aadhaar Card');
            setPincodeLocation(null);
            setHasActiveDelivery(false);
            setReferredByCode('');
            setReferredByPhone('');
            setReferredByName('');
            setResolvedReferrer(null);
        } catch (error) {
            // Error is already toasted by parent, we just stop here
            // This keeps the states (customerName, phone, etc.) intact
            // console.log('[DEBUG] LeadForm submission failed, state preserved.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const requestShareAccess = async () => {
        if (!existingLeadContext?.id) return;
        const requester = requesterTenantId || ownerTenantId || undefined;
        if (!requester) {
            alert('Tenant context missing. Please refresh and retry.');
            return;
        }
        setIsRequestingShare(true);
        try {
            const response = await fetch('/api/leads/request-share', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    leadId: existingLeadContext.id,
                    note: interestText.trim() || undefined,
                    requesterTenantId: requester,
                }),
            });
            const result = await parseResponse(response);
            if (result?.success) {
                setExistingLeadContext(prev =>
                    prev
                        ? {
                              ...prev,
                              pendingShareRequest: true,
                          }
                        : prev
                );
                alert(result.message || 'Share request sent.');
                return;
            }
            alert(result?.message || 'Failed to request share.');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to request share.';
            alert(message);
        } finally {
            setIsRequestingShare(false);
        }
    };

    const handleAttachmentSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(event.target.files || []);
        const validFiles = selectedFiles.filter(file => file.size <= 10 * 1024 * 1024);
        if (validFiles.length < selectedFiles.length) {
            alert('Some files were skipped. Max file size per file is 10MB.');
        }
        setAttachments(validFiles);
    };

    return (
        <SlideOver isOpen={isOpen} onClose={onClose} title="REGISTER NEW IDENTITY">
            <form onSubmit={handleSubmit} className="space-y-8 p-1">
                <div className="space-y-6">
                    {/* Phone Number */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 ml-1">
                            Mobile Connectivity
                        </label>
                        <div className="relative group">
                            <Phone
                                className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isCheckingPhone ? 'text-indigo-400 animate-pulse' : 'text-slate-400 group-focus-within:text-indigo-600'}`}
                                size={18}
                            />
                            <input
                                required
                                type="tel"
                                value={phone}
                                onChange={e => setPhone(normalizeIndianPhone(e.target.value))}
                                onPaste={e => {
                                    const text = e.clipboardData.getData('text');
                                    const normalized = normalizeIndianPhone(text);
                                    if (normalized) {
                                        e.preventDefault();
                                        setPhone(normalized);
                                    }
                                }}
                                placeholder="10-DIGIT SECURE NUMBER"
                                className={`w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-[1.25rem] text-sm font-black tracking-tight text-slate-900 dark:text-white focus:bg-white dark:focus:bg-white/5 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 dark:focus:border-indigo-500/60 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-500 ${isCheckingPhone ? 'opacity-50' : ''}`}
                            />
                            {isCheckingPhone && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                        </div>
                        {isCheckingLeadOwnership ? (
                            <p className="text-[9px] font-black uppercase tracking-widest text-indigo-500 ml-1">
                                Checking existing lead ownership...
                            </p>
                        ) : existingLeadContext ? (
                            <div
                                className={`rounded-xl border px-3 py-2 ml-1 ${
                                    existingLeadContext.canWrite === false
                                        ? 'border-amber-300 bg-amber-50/80'
                                        : 'border-emerald-300 bg-emerald-50/80'
                                }`}
                            >
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">
                                    Existing Lead: {existingLeadContext.displayId}
                                </p>
                                <p className="text-[10px] font-bold text-slate-600 mt-1">
                                    Owner: {existingLeadContext.createdByName || 'Team'} ·{' '}
                                    {existingLeadContext.dealershipName || 'Dealership'}
                                </p>
                                <p className="text-[10px] text-slate-500 mt-0.5">
                                    Last edit: {existingLeadContext.lastEditedByName || 'Team'}{' '}
                                    {existingLeadContext.lastEditedAt ? `(${existingLeadContext.lastEditedAt})` : ''}
                                </p>
                                {existingLeadContext.canWrite === false && existingLeadContext.canRequestShare && (
                                    <div className="mt-2">
                                        <button
                                            type="button"
                                            onClick={requestShareAccess}
                                            disabled={isRequestingShare || existingLeadContext.pendingShareRequest}
                                            className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-60"
                                        >
                                            {existingLeadContext.pendingShareRequest
                                                ? 'Share Request Pending'
                                                : isRequestingShare
                                                  ? 'Requesting...'
                                                  : 'Request Share'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>

                    {/* Customer Name */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                                Legal Name
                            </label>
                            {isExistingCustomer && (
                                <div className="flex items-center gap-2">
                                    <span className="text-[8px] font-black uppercase bg-emerald-100/50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 px-2 py-0.5 rounded-full tracking-widest animate-in fade-in slide-in-from-right-2">
                                        Discovered
                                    </span>
                                    {docCount > 0 && (
                                        <span className="text-[8px] font-black uppercase bg-indigo-100/50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 px-2 py-0.5 rounded-full tracking-widest animate-in fade-in slide-in-from-right-4">
                                            {docCount} Assets Vaulted
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="relative group">
                            <User
                                className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isExistingCustomer ? 'text-emerald-500' : 'text-slate-400 group-focus-within:text-indigo-600'}`}
                                size={18}
                            />
                            <input
                                required
                                type="text"
                                value={customerName}
                                onChange={e => setCustomerName(e.target.value)}
                                placeholder="e.g. ADITYA VERMA"
                                className={`w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-[1.25rem] text-sm font-black tracking-tight text-slate-900 dark:text-white focus:bg-white dark:focus:bg-white/5 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 dark:focus:border-indigo-500/60 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-500 uppercase italic ${isExistingCustomer ? 'bg-emerald-50/30 dark:bg-emerald-500/10' : ''}`}
                            />
                        </div>
                    </div>

                    {/* Organisation Name */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-1">
                            Organisation
                        </label>
                        <div className="relative group">
                            <Building2
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors"
                                size={18}
                            />
                            <input
                                type="text"
                                value={organisation}
                                onChange={e => setOrganisation(e.target.value)}
                                placeholder="e.g. SUVIDHA HOTEL, RATHI ENTERPRISES"
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-[1.25rem] text-sm font-black tracking-tight text-slate-900 dark:text-white focus:bg-white dark:focus:bg-white/5 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 dark:focus:border-indigo-500/60 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-500 uppercase"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Pincode */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-1">
                                PINCODE
                            </label>
                            <div className="relative group">
                                <MapPin
                                    className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isExistingCustomer && pincode ? 'text-emerald-500' : 'text-slate-400 group-focus-within:text-indigo-600'}`}
                                    size={18}
                                />
                                <input
                                    required
                                    type="text"
                                    maxLength={6}
                                    pattern="\d{6}"
                                    value={pincode}
                                    onChange={e => setPincode(e.target.value.replace(/\D/g, ''))}
                                    placeholder="000000"
                                    className={`w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-[1.25rem] text-sm font-black tracking-tight text-slate-900 dark:text-white focus:bg-white dark:focus:bg-white/5 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 dark:focus:border-indigo-500/60 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-500 ${isExistingCustomer && pincode ? 'bg-emerald-50/30 dark:bg-emerald-500/10' : ''}`}
                                />
                            </div>
                            {isResolvingPincode ? (
                                <p className="text-[9px] font-black uppercase tracking-widest text-indigo-500 ml-1">
                                    Resolving location...
                                </p>
                            ) : pincodeLocation ? (
                                <div className="space-y-1 ml-1">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600">
                                        {pincodeLocation.is_serviceable ? 'Deliverable Zone' : 'Non-deliverable Zone'}
                                    </p>
                                    <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                                        {[
                                            pincodeLocation.area,
                                            pincodeLocation.taluka,
                                            pincodeLocation.district,
                                            pincodeLocation.state,
                                        ]
                                            .filter(Boolean)
                                            .join(', ') || 'Location found'}
                                    </p>
                                </div>
                            ) : null}
                        </div>

                        {/* Date of Birth */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-1">
                                BIRTH RECORD
                            </label>
                            <div className="relative group">
                                <Cake
                                    className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isExistingCustomer && dob ? 'text-emerald-500' : 'text-slate-400 group-focus-within:text-indigo-600'}`}
                                    size={18}
                                />
                                <input
                                    type="date"
                                    value={dob}
                                    onChange={e => setDob(e.target.value)}
                                    onPaste={e => {
                                        const text = e.clipboardData.getData('text');
                                        const parsed = parseDateToISO(text);
                                        if (parsed) {
                                            e.preventDefault();
                                            setDob(parsed);
                                        }
                                    }}
                                    className={`w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-[1.25rem] text-xs font-black tracking-tight text-slate-900 dark:text-white focus:bg-white dark:focus:bg-white/5 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 dark:focus:border-indigo-500/60 outline-none transition-all uppercase ${isExistingCustomer && dob ? 'bg-emerald-50/30 dark:bg-emerald-500/10' : ''}`}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-1">
                            Customer Interest
                        </label>
                        <div className="relative group">
                            <FileText
                                className="absolute left-4 top-4 text-slate-400 group-focus-within:text-indigo-600"
                                size={18}
                            />
                            <textarea
                                required
                                value={interestText}
                                onChange={e => setInterestText(e.target.value)}
                                placeholder="e.g. Wants Jupiter ZX in 30 days, EMI around 4k, exchange available."
                                className="w-full min-h-[110px] pl-12 pr-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-[1.25rem] text-sm font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-white/5 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 dark:focus:border-indigo-500/60 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-500 resize-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-1">
                            Referred By {!hasActiveDelivery ? '(Mandatory)' : '(Optional)'}
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input
                                type="text"
                                value={referredByCode}
                                onChange={e =>
                                    setReferredByCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))
                                }
                                placeholder="O' Circle Membership ID"
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl text-xs font-black tracking-wider text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none uppercase"
                            />
                            <input
                                type="tel"
                                value={referredByPhone}
                                onChange={e => setReferredByPhone(normalizeIndianPhone(e.target.value))}
                                placeholder="Referrer Phone"
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl text-xs font-black tracking-wider text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none"
                            />
                        </div>
                        <input
                            type="text"
                            value={referredByName}
                            onChange={e => setReferredByName(e.target.value)}
                            placeholder="Referrer Name (optional, for non-member referral)"
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl text-xs font-semibold tracking-wide text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none"
                        />
                        {isResolvingReferrer ? (
                            <p className="text-[9px] font-black uppercase tracking-widest text-indigo-500 ml-1">
                                Validating referrer...
                            </p>
                        ) : resolvedReferrer ? (
                            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 ml-1">
                                Member matched: {resolvedReferrer.name || resolvedReferrer.phone || 'Referrer'}
                            </p>
                        ) : referredByCode || referredByPhone || referredByName ? (
                            <p className="text-[9px] font-black uppercase tracking-widest text-amber-600 ml-1">
                                {referredByPhone || referredByName
                                    ? 'No member match. External referral will be captured.'
                                    : "O' Circle Membership ID not found. Add referrer phone or name."}
                            </p>
                        ) : null}
                        {hasActiveDelivery && (
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">
                                Repeat delivery member detected: referral bonus will not apply.
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-1">
                            KYC Attachment
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <select
                                value={attachmentPurpose}
                                onChange={e => setAttachmentPurpose(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl text-xs font-black tracking-wider text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none"
                            >
                                {documentPurposes.map(purpose => (
                                    <option key={purpose} value={purpose}>
                                        {purpose}
                                    </option>
                                ))}
                            </select>
                            <label className="w-full h-full min-h-[46px] rounded-xl border border-dashed border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/[0.03] flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 cursor-pointer hover:border-indigo-500 hover:text-indigo-600 transition-colors">
                                <Paperclip size={14} />
                                Attach Files
                                <input
                                    type="file"
                                    multiple
                                    onChange={handleAttachmentSelection}
                                    className="hidden"
                                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                                />
                            </label>
                        </div>
                        {attachments.length > 0 && (
                            <div className="rounded-xl border border-slate-100 dark:border-white/10 bg-white dark:bg-white/[0.03] px-3 py-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">
                                    {attachments.length} file(s) ready
                                </p>
                                <div className="space-y-1 max-h-24 overflow-auto">
                                    {attachments.map(file => (
                                        <p
                                            key={`${file.name}-${file.size}`}
                                            className="text-[11px] text-slate-600 dark:text-slate-300 truncate"
                                        >
                                            {file.name}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {showDealerSelect && (
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-1">
                                Dealership
                            </label>
                            <div className="relative group">
                                <Bike
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600"
                                    size={18}
                                />
                                <select
                                    required
                                    value={selectedDealerId}
                                    onChange={e => setSelectedDealerId(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-[1.25rem] text-sm font-black tracking-tight text-slate-900 dark:text-white focus:bg-white dark:focus:bg-white/5 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 dark:focus:border-indigo-500/60 outline-none transition-all"
                                >
                                    <option value="">Select dealership</option>
                                    {dealerOptions.map(d => (
                                        <option key={d.id} value={d.id}>
                                            {d.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                <div className="pt-8 flex gap-4">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        className="flex-1 h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white dark:hover:bg-white/5"
                    >
                        Abort
                    </Button>
                    <Button
                        type="submit"
                        isLoading={isSubmitting}
                        className="flex-[2] h-14 bg-slate-900 hover:bg-black dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white rounded-2xl shadow-2xl shadow-slate-200 dark:shadow-none font-black text-[11px] uppercase tracking-[0.2em] transition-all"
                    >
                        Create Identity{' '}
                        <Send size={16} className="ml-3 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </div>
            </form>
        </SlideOver>
    );
}
