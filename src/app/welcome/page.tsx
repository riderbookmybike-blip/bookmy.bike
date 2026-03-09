'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

type TenantOption = { id: string; name: string; slug?: string | null };

export default function WelcomePage() {
    const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [email, setEmail] = useState('');
    const [pincode, setPincode] = useState('');
    const [memberExists, setMemberExists] = useState(false);
    const [lookupDone, setLookupDone] = useState(false);
    const [financers, setFinancers] = useState<TenantOption[]>([]);
    const [dealerships, setDealerships] = useState<TenantOption[]>([]);
    const [selectedFinancers, setSelectedFinancers] = useState<string[]>([]);
    const [selectedDealerships, setSelectedDealerships] = useState<string[]>([]);
    const [financerSearch, setFinancerSearch] = useState('');
    const [dealershipSearch, setDealershipSearch] = useState('');
    const [selectedScopes, setSelectedScopes] = useState<Array<'FINANCER_TEAM' | 'DEALERSHIP_TEAM'>>([]);
    const [otpSent, setOtpSent] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);
    const [isLookingUp, setIsLookingUp] = useState(false);
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [submittedRequestId, setSubmittedRequestId] = useState<string | null>(null);
    const toUiError = (err: unknown, fallback: string) => {
        const raw = err instanceof Error ? err.message : '';
        const normalized = raw.toLowerCase();
        if (normalized.includes('fetch failed') || normalized.includes('failed to fetch')) {
            return 'Server is not reachable right now. Please retry in a few seconds.';
        }
        return raw || fallback;
    };

    const fetchJson = async (url: string, init?: RequestInit) => {
        const response = await fetch(url, init);
        const text = await response.text();
        let data: any = null;
        try {
            data = text ? JSON.parse(text) : null;
        } catch {
            data = null;
        }
        if (!response.ok) {
            const apiMessage = String(data?.message || '').trim();
            throw new Error(apiMessage || `Request failed (${response.status})`);
        }
        return data;
    };

    useEffect(() => {
        (async () => {
            try {
                const data = await fetchJson('/api/welcome/options');
                if (data?.success) {
                    setFinancers(data.financers || []);
                    setDealerships(data.dealerships || []);
                } else {
                    setError(data?.message || 'Failed to load onboarding options.');
                }
            } catch (err) {
                setError(toUiError(err, 'Unable to load onboarding options.'));
            }
        })();
    }, []);

    const cleanPhone = useMemo(() => phone.replace(/\D/g, '').slice(-10), [phone]);
    const scopeFinancer = selectedScopes.includes('FINANCER_TEAM');
    const scopeDealer = selectedScopes.includes('DEALERSHIP_TEAM');
    const requiresDealerSelection = scopeDealer || scopeFinancer;
    const normalizedFinancerSearch = financerSearch.trim().toLowerCase();
    const normalizedDealershipSearch = dealershipSearch.trim().toLowerCase();
    const filteredFinancers = useMemo(
        () =>
            financers.filter(item =>
                normalizedFinancerSearch ? item.name.toLowerCase().includes(normalizedFinancerSearch) : true
            ),
        [financers, normalizedFinancerSearch]
    );
    const filteredDealerships = useMemo(
        () =>
            dealerships.filter(item =>
                normalizedDealershipSearch ? item.name.toLowerCase().includes(normalizedDealershipSearch) : true
            ),
        [dealerships, normalizedDealershipSearch]
    );
    const isFormValid =
        fullName.trim().length > 1 &&
        cleanPhone.length === 10 &&
        email.trim().length > 3 &&
        pincode.replace(/\D/g, '').length === 6 &&
        (!scopeFinancer || selectedFinancers.length > 0) &&
        (!requiresDealerSelection || selectedDealerships.length > 0) &&
        selectedScopes.length > 0 &&
        otpVerified;

    const toggleSelection = (id: string, selected: string[], setSelected: (next: string[]) => void) => {
        if (selected.includes(id)) {
            setSelected(selected.filter(x => x !== id));
            return;
        }
        setSelected([...selected, id]);
    };

    const sendOtp = async () => {
        setError('');
        setMessage('');
        if (cleanPhone.length !== 10) {
            setError('Enter valid 10-digit phone number first.');
            return;
        }
        setIsSendingOtp(true);
        try {
            const data = await fetchJson('/api/auth/msg91/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: cleanPhone }),
            });
            if (!data?.success) {
                setError(data?.message || 'Failed to send OTP.');
                return;
            }
            setOtpSent(true);
            setOtpVerified(false);
            setMessage(data?.message || 'OTP sent successfully.');
        } catch (err) {
            setError(toUiError(err, 'Failed to send OTP.'));
        } finally {
            setIsSendingOtp(false);
        }
    };

    const lookupMember = async () => {
        setError('');
        setMessage('');
        if (cleanPhone.length !== 10) {
            setError('Enter valid 10-digit mobile number.');
            return;
        }
        setIsLookingUp(true);
        try {
            const data = await fetchJson('/api/welcome/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: cleanPhone }),
            });
            if (!data?.success) {
                setError(data?.message || 'Failed to fetch profile.');
                return;
            }

            setMemberExists(!!data.exists);
            setLookupDone(true);
            setFullName(data?.profile?.fullName || '');
            setEmail(data?.profile?.email || '');
            setPincode(data?.profile?.pincode || '');

            const prefFinance = Array.isArray(data?.linked?.financeTenantIds) ? data.linked.financeTenantIds : [];
            const prefDealer = Array.isArray(data?.linked?.dealershipTenantIds) ? data.linked.dealershipTenantIds : [];
            setSelectedFinancers(prefFinance.slice(0, 1));
            setSelectedDealerships(prefDealer);

            const nextScopes: Array<'FINANCER_TEAM' | 'DEALERSHIP_TEAM'> = [];
            if (prefFinance.length > 0) nextScopes.push('FINANCER_TEAM');
            if (prefDealer.length > 0) nextScopes.push('DEALERSHIP_TEAM');
            setSelectedScopes(nextScopes.length > 0 ? nextScopes : ['FINANCER_TEAM']);
            setStep(2);
        } catch (err) {
            setError(toUiError(err, 'Failed to fetch profile. Check network and try again.'));
        } finally {
            setIsLookingUp(false);
        }
    };

    const verifyOtp = async () => {
        setError('');
        setMessage('');
        if (!otpSent) {
            setError('Send OTP first.');
            return;
        }
        if (otp.trim().length < 4) {
            setError('Enter valid OTP.');
            return;
        }
        setIsVerifyingOtp(true);
        try {
            const data = await fetchJson('/api/auth/msg91/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: cleanPhone, otp: otp.trim() }),
            });
            if (!data?.success) {
                setError(data?.message || 'OTP verification failed.');
                setOtpVerified(false);
                return;
            }
            setOtpVerified(true);
            setMessage('OTP verified.');
        } catch (err) {
            setOtpVerified(false);
            setError(toUiError(err, 'OTP verification failed.'));
        } finally {
            setIsVerifyingOtp(false);
        }
    };

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        if (!isFormValid) {
            setError('Complete all fields, verify OTP, and select financer + dealership.');
            return;
        }

        setIsSubmitting(true);
        try {
            const data = await fetchJson('/api/welcome/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullName: fullName.trim(),
                    phone: cleanPhone,
                    otp: otp.trim(),
                    email: email.trim().toLowerCase(),
                    pincode: pincode.replace(/\D/g, '').slice(0, 6),
                    requestedScopes: selectedScopes,
                    financeTenantIds: selectedFinancers,
                    dealershipTenantIds: selectedDealerships,
                }),
            });
            if (!data?.success) {
                setError(data?.message || 'Failed to submit onboarding request.');
                return;
            }
            setSubmittedRequestId(data?.requestId || null);
            const warning = String(data?.warning || '').trim();
            setMessage(
                `${data?.message || 'Request submitted.'}${
                    warning
                        ? ` Notifications warning: ${warning}`
                        : ' Financer admin, dealership admin, and AUMS have been notified.'
                }`
            );
        } catch (err) {
            setError(toUiError(err, 'Failed to submit onboarding request.'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-10">
            <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
                <h1 className="text-2xl font-black text-slate-900">Welcome Onboarding</h1>
                <p className="mt-1 text-sm text-slate-500">
                    Multi-step onboarding: mobile check, profile confirm, role select, access request.
                </p>

                <form className="mt-6 space-y-5" onSubmit={submit}>
                    {step === 1 ? (
                        <div className="space-y-4 rounded-2xl border border-slate-200 p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                Step 1: Mobile Check
                            </p>
                            <div className="flex flex-col gap-3 md:flex-row">
                                <input
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    placeholder="Mobile number"
                                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                                />
                                <button
                                    type="button"
                                    onClick={lookupMember}
                                    disabled={isLookingUp}
                                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                                >
                                    {isLookingUp ? 'Checking...' : 'Check Member'}
                                </button>
                            </div>
                        </div>
                    ) : null}

                    {step === 2 ? (
                        <div className="space-y-4 rounded-2xl border border-slate-200 p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                Step 2: Profile Details {lookupDone ? `(Member ${memberExists ? 'Found' : 'New'})` : ''}
                            </p>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <input
                                    value={fullName}
                                    onChange={e => setFullName(e.target.value)}
                                    placeholder="Full name"
                                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                                />
                                <input
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="Email"
                                    type="email"
                                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                                />
                                <input
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    placeholder="Mobile number"
                                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                                />
                                <input
                                    value={pincode}
                                    onChange={e => setPincode(e.target.value)}
                                    placeholder="Pincode"
                                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                                />
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setStep(3)}
                                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    ) : null}

                    {step === 3 ? (
                        <div className="space-y-4 rounded-2xl border border-slate-200 p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                Step 3: Select Team Role
                            </p>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={scopeFinancer}
                                        onChange={() => {
                                            setSelectedScopes(prev => {
                                                if (prev.includes('FINANCER_TEAM')) {
                                                    return prev.filter(s => s !== 'FINANCER_TEAM');
                                                }
                                                const next = new Set([...prev, 'FINANCER_TEAM', 'DEALERSHIP_TEAM']);
                                                return Array.from(next) as Array<'FINANCER_TEAM' | 'DEALERSHIP_TEAM'>;
                                            });
                                        }}
                                    />
                                    Financer Team
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={scopeDealer}
                                        onChange={() => {
                                            if (scopeFinancer && scopeDealer) {
                                                setError('Financer team ke saath dealership team required hai.');
                                                return;
                                            }
                                            setSelectedScopes(prev =>
                                                prev.includes('DEALERSHIP_TEAM')
                                                    ? prev.filter(s => s !== 'DEALERSHIP_TEAM')
                                                    : [...prev, 'DEALERSHIP_TEAM']
                                            );
                                        }}
                                    />
                                    Dealership Team
                                </label>
                            </div>
                            <div className="flex justify-between">
                                <button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
                                >
                                    Back
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStep(scopeFinancer ? 4 : 5)}
                                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    ) : null}

                    {step === 4 ? (
                        <div className="space-y-4 rounded-2xl border border-slate-200 p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                Step 4: Select Financer
                            </p>
                            {scopeFinancer ? (
                                <div className="rounded-2xl border border-slate-200 p-4">
                                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                        Select Financer (Only One)
                                    </p>
                                    <input
                                        value={financerSearch}
                                        onChange={e => setFinancerSearch(e.target.value)}
                                        placeholder="Search financer..."
                                        className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                                    />
                                    <div className="mt-3 max-h-56 space-y-2 overflow-auto">
                                        {filteredFinancers.map(item => (
                                            <label
                                                key={item.id}
                                                className="flex items-center gap-2 text-sm text-slate-700"
                                            >
                                                <input
                                                    type="radio"
                                                    name="financer_tenant"
                                                    checked={selectedFinancers.includes(item.id)}
                                                    onChange={() => setSelectedFinancers([item.id])}
                                                />
                                                <span>{item.name}</span>
                                            </label>
                                        ))}
                                        {filteredFinancers.length === 0 ? (
                                            <p className="text-xs text-slate-400">No financer found.</p>
                                        ) : null}
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                                    Financer team scope not selected.
                                </div>
                            )}
                            <div className="flex justify-between">
                                <button
                                    type="button"
                                    onClick={() => setStep(3)}
                                    className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
                                >
                                    Back
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStep(5)}
                                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    ) : null}

                    {step === 5 ? (
                        <>
                            <div className="space-y-4 rounded-2xl border border-slate-200 p-4">
                                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Step 5: Select Dealership
                                </p>
                                {requiresDealerSelection ? (
                                    <div className="rounded-2xl border border-slate-200 p-4">
                                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                            Select Dealership(s)
                                        </p>
                                        <input
                                            value={dealershipSearch}
                                            onChange={e => setDealershipSearch(e.target.value)}
                                            placeholder="Search dealership..."
                                            className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                                        />
                                        <div className="mt-3 max-h-56 space-y-2 overflow-auto">
                                            {filteredDealerships.map(item => (
                                                <label
                                                    key={item.id}
                                                    className="flex items-center gap-2 text-sm text-slate-700"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedDealerships.includes(item.id)}
                                                        onChange={() =>
                                                            toggleSelection(
                                                                item.id,
                                                                selectedDealerships,
                                                                setSelectedDealerships
                                                            )
                                                        }
                                                    />
                                                    <span>{item.name}</span>
                                                </label>
                                            ))}
                                            {filteredDealerships.length === 0 ? (
                                                <p className="text-xs text-slate-400">No dealership found.</p>
                                            ) : null}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                                        Dealership team scope not selected.
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <button
                                        type="button"
                                        onClick={() => setStep(scopeFinancer ? 4 : 3)}
                                        className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
                                    >
                                        Back
                                    </button>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 p-4">
                                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                    OTP Verification
                                </p>
                                <div className="mt-3 flex flex-col gap-3 md:flex-row">
                                    <button
                                        type="button"
                                        onClick={sendOtp}
                                        disabled={isSendingOtp}
                                        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                                    >
                                        {isSendingOtp ? 'Sending...' : 'Send OTP'}
                                    </button>
                                    <input
                                        value={otp}
                                        onChange={e => setOtp(e.target.value)}
                                        placeholder="Enter OTP"
                                        className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                                    />
                                    <button
                                        type="button"
                                        onClick={verifyOtp}
                                        disabled={isVerifyingOtp}
                                        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                                    >
                                        {isVerifyingOtp ? 'Verifying...' : 'Verify OTP'}
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : null}

                    {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
                    {message ? <p className="text-sm font-medium text-emerald-600">{message}</p> : null}

                    {step === 5 ? (
                        <button
                            type="submit"
                            disabled={isSubmitting || !isFormValid || !!submittedRequestId}
                            className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                        >
                            {isSubmitting
                                ? 'Submitting...'
                                : submittedRequestId
                                  ? 'Request Submitted'
                                  : 'Submit Onboarding Request'}
                        </button>
                    ) : null}
                </form>
            </div>
        </main>
    );
}
