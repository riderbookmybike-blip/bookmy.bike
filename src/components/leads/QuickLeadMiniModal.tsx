'use client';

import { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useDealerSession } from '@/hooks/useDealerSession';
import { toast } from 'sonner';

interface QuickLeadMiniModalProps {
    isOpen: boolean;
    onClose: () => void;
}

async function fetchJson(url: string, init?: RequestInit) {
    const response = await fetch(url, init);
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
}

function normalizePhone(input: string) {
    return input.replace(/\D/g, '').slice(-10);
}

function formatDateTime(value?: string | null) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

export function QuickLeadMiniModal({ isOpen, onClose }: QuickLeadMiniModalProps) {
    const { dealerId } = useDealerSession();
    const [phone, setPhone] = useState('');
    const [note, setNote] = useState('');
    const [name, setName] = useState('');
    const [memberName, setMemberName] = useState<string | null>(null);
    const [checkedPhone, setCheckedPhone] = useState(false);
    const [existingLead, setExistingLead] = useState<{
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
    const [isChecking, setIsChecking] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRequestingShare, setIsRequestingShare] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setPhone('');
            setNote('');
            setName('');
            setMemberName(null);
            setCheckedPhone(false);
            setExistingLead(null);
            setIsChecking(false);
            setIsSubmitting(false);
            setIsRequestingShare(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const checkPhone = async () => {
        const cleanPhone = normalizePhone(phone);
        if (cleanPhone.length !== 10) {
            toast.error('Enter valid 10-digit phone number');
            return;
        }

        const activeDealerId = dealerId || null;
        if (!activeDealerId) {
            toast.error('Activate dealership first, then check phone.');
            return;
        }

        setIsChecking(true);
        try {
            const result = await fetchJson('/api/leads/quick-check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: cleanPhone,
                    ownerTenantId: activeDealerId,
                    selectedDealerId: activeDealerId || undefined,
                }),
            });
            if (!result?.success) {
                toast.error(result?.message || 'Failed to check phone');
                return;
            }
            setCheckedPhone(true);
            setMemberName(result.member?.fullName || null);
            if (result.member?.fullName) setName(result.member.fullName);
            setExistingLead(
                result.existingLead
                    ? {
                          id: result.existingLead.id,
                          displayId: result.existingLead.displayId,
                          status: result.existingLead.status,
                          dealershipName: result.existingLead.dealershipName || null,
                          createdByName: result.existingLead.createdByName || null,
                          createdAt: result.existingLead.createdAt || null,
                          lastEditedByName: result.existingLead.lastEditedByName || null,
                          lastEditedAt: result.existingLead.lastEditedAt || null,
                          canWrite: result.existingLead.canWrite !== false,
                          canRequestShare: result.existingLead.canRequestShare === true,
                          pendingShareRequest: result.existingLead.pendingShareRequest === true,
                      }
                    : null
            );

            if (result.existingLead?.id) {
                if (result.existingLead.canWrite === false) {
                    toast.error('Lead owned by another user. Request share to proceed.');
                } else {
                    toast.message(`Existing lead mapped: ${result.existingLead.displayId}`);
                }
            } else if (result.member?.id) {
                toast.success('Member found. Add note and save.');
            } else {
                toast.message('New member. Add name and note, then save.');
            }
        } catch (err) {
            console.error('Quick lead phone check error:', err);
            const message = err instanceof Error ? err.message : 'Failed to check phone';
            toast.error(message);
        } finally {
            setIsChecking(false);
        }
    };

    const submit = async () => {
        const cleanPhone = normalizePhone(phone);
        if (!checkedPhone) {
            toast.error('Check phone first');
            return;
        }
        if (cleanPhone.length !== 10) {
            toast.error('Enter valid 10-digit phone number');
            return;
        }
        if (!note.trim()) {
            toast.error('Add notes before saving');
            return;
        }
        if (!memberName && !name.trim()) {
            toast.error('Name is required for new member');
            return;
        }

        setIsSubmitting(true);
        try {
            const activeDealerId = dealerId || null;
            const ownerTenantId = activeDealerId || undefined;
            if (!ownerTenantId) {
                toast.error('Activate dealership first, then save lead.');
                return;
            }
            const customerName = memberName || name.trim() || `Lead ${cleanPhone}`;
            const result = await fetchJson('/api/leads/quick-save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerName,
                    phone: cleanPhone,
                    note: note.trim(),
                    ownerTenantId,
                    selectedDealerId: activeDealerId || undefined,
                }),
            });
            if (!result?.success) {
                toast.error(result?.message || 'Failed to save lead');
                return;
            }

            if (result.noteSaved === false) {
                toast.warning(result.noteMessage || 'Lead saved, but note sync failed');
            } else {
                toast.success('Lead saved');
            }
            onClose();
        } catch (err) {
            console.error('Quick lead create error:', err);
            const message = err instanceof Error ? err.message : 'Failed to save lead';
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const requestShare = async () => {
        if (!existingLead?.id) return;
        const requesterTenantId = dealerId || null;
        if (!requesterTenantId) {
            toast.error('Activate dealership first, then request share.');
            return;
        }
        setIsRequestingShare(true);
        try {
            const result = await fetchJson('/api/leads/request-share', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    leadId: existingLead.id,
                    requesterTenantId,
                    note: note.trim() || undefined,
                }),
            });
            if (!result?.success) {
                toast.error(result?.message || 'Failed to request share');
                return;
            }
            setExistingLead(prev =>
                prev
                    ? {
                          ...prev,
                          pendingShareRequest: true,
                      }
                    : prev
            );
            toast.success(result.message || 'Share request sent to lead owner.');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to request share';
            toast.error(message);
        } finally {
            setIsRequestingShare(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
            <div
                className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">Quick Lead</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                        aria-label="Close quick lead form"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="space-y-3">
                    <input
                        value={phone}
                        onChange={e => {
                            setPhone(e.target.value);
                            setCheckedPhone(false);
                            setExistingLead(null);
                            setMemberName(null);
                        }}
                        placeholder="10-digit phone number"
                        inputMode="numeric"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 caret-slate-900 outline-none focus:border-slate-400"
                    />
                    <button
                        type="button"
                        onClick={checkPhone}
                        disabled={isChecking}
                        className="inline-flex w-full items-center justify-center rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-60"
                    >
                        {isChecking ? <Loader2 size={16} className="animate-spin" /> : 'Check Phone'}
                    </button>

                    {checkedPhone ? (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                            {existingLead ? (
                                <div className="space-y-1">
                                    <div>
                                        Lead already mapped:{' '}
                                        <span className="font-semibold">{existingLead.displayId}</span> (
                                        {existingLead.status})
                                    </div>
                                    <div>
                                        Dealership:{' '}
                                        <span className="font-semibold">
                                            {existingLead.dealershipName || 'Current dealership'}
                                        </span>
                                    </div>
                                    <div>
                                        Lead owner:{' '}
                                        <span className="font-semibold">{existingLead.createdByName || 'Team'}</span>
                                    </div>
                                    <div>
                                        Created by:{' '}
                                        <span className="font-semibold">{existingLead.createdByName || 'Team'}</span> at{' '}
                                        <span className="font-semibold">{formatDateTime(existingLead.createdAt)}</span>
                                    </div>
                                    <div>
                                        Last edited by:{' '}
                                        <span className="font-semibold">{existingLead.lastEditedByName || 'Team'}</span>{' '}
                                        at{' '}
                                        <span className="font-semibold">
                                            {formatDateTime(existingLead.lastEditedAt)}
                                        </span>
                                    </div>
                                    {existingLead.canWrite === false ? (
                                        <div className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-rose-700">
                                            Lead locked. Only owner can edit until share is approved.
                                        </div>
                                    ) : null}
                                </div>
                            ) : memberName ? (
                                `Member found: ${memberName}`
                            ) : (
                                'No global member found. New member lead will be created.'
                            )}
                        </div>
                    ) : null}

                    {!memberName ? (
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Customer name (for new member)"
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 caret-slate-900 outline-none focus:border-slate-400"
                        />
                    ) : null}

                    <textarea
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        placeholder="Lead note"
                        rows={3}
                        disabled={existingLead?.canWrite === false}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 caret-slate-900 outline-none focus:border-slate-400"
                    />
                </div>

                {existingLead?.canWrite === false && existingLead?.canRequestShare ? (
                    <button
                        type="button"
                        disabled={isRequestingShare || existingLead.pendingShareRequest}
                        onClick={requestShare}
                        className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-60"
                    >
                        {isRequestingShare
                            ? 'Sending Request...'
                            : existingLead.pendingShareRequest
                              ? 'Share Request Pending'
                              : 'Request Share from Lead Owner'}
                    </button>
                ) : null}

                <button
                    type="button"
                    disabled={isSubmitting || !checkedPhone || existingLead?.canWrite === false}
                    onClick={submit}
                    className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Save Lead'}
                </button>
            </div>
        </div>
    );
}
