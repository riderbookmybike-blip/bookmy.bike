'use client';

import { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useTenant } from '@/lib/tenant/tenantContext';
import { useDealerSession } from '@/hooks/useDealerSession';
import { toast } from 'sonner';

interface QuickLeadMiniModalProps {
    isOpen: boolean;
    onClose: () => void;
}

let crmActionsPromise: Promise<typeof import('@/actions/crm')> | null = null;
function getCrmActions() {
    if (!crmActionsPromise) {
        crmActionsPromise = import('@/actions/crm').catch(err => {
            crmActionsPromise = null;
            throw err;
        });
    }
    return crmActionsPromise;
}

function normalizePhone(input: string) {
    return input.replace(/\D/g, '').slice(-10);
}

export function QuickLeadMiniModal({ isOpen, onClose }: QuickLeadMiniModalProps) {
    const { tenantId } = useTenant();
    const { dealerId } = useDealerSession();
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [note, setNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setName('');
            setPhone('');
            setNote('');
            setIsSubmitting(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const submit = async () => {
        const cleanPhone = normalizePhone(phone);
        if (!name.trim()) {
            toast.error('Name is required');
            return;
        }
        if (cleanPhone.length !== 10) {
            toast.error('Enter valid 10-digit phone number');
            return;
        }

        setIsSubmitting(true);
        try {
            const { createLeadAction } = await getCrmActions();
            const activeDealerId = dealerId || null;
            const ownerTenantId = activeDealerId || tenantId || undefined;
            const result = await createLeadAction({
                customer_name: name.trim(),
                customer_phone: cleanPhone,
                owner_tenant_id: ownerTenantId,
                selected_dealer_id: activeDealerId || undefined,
                interest_model: 'MARKETPLACE_QUICK_LEAD',
                model: 'GENERAL_ENQUIRY',
                interest_text: note.trim() || undefined,
                source: 'CRM_MANUAL',
            });

            if (!result?.success) {
                toast.error(result?.message || 'Failed to create lead');
                return;
            }

            toast.success('Lead created');
            onClose();
        } catch (err) {
            console.error('Quick lead create error:', err);
            toast.error('Failed to create lead');
        } finally {
            setIsSubmitting(false);
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
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Customer name"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                    />
                    <input
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="10-digit phone number"
                        inputMode="numeric"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                    />
                    <textarea
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        placeholder="Short note (optional)"
                        rows={3}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                    />
                </div>

                <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={submit}
                    className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Create Lead'}
                </button>
            </div>
        </div>
    );
}
