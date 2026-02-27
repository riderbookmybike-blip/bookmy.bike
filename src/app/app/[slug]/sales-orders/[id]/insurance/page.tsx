'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getBookingById } from '@/actions/crm';
import { getInsuranceByBooking, upsertInsurance } from '@/actions/insurance';
import { advanceBookingStage } from '@/actions/bookingStage';

export default function BookingInsurancePage() {
    const params = useParams();
    const bookingId = typeof params?.id === 'string' ? params.id : '';

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [booking, setBooking] = useState<any | null>(null);
    const [draft, setDraft] = useState({
        providerName: '',
        policyNumber: '',
        premiumAmount: '',
        expiryDate: '',
        status: 'PENDING',
    });

    const loadData = useCallback(async () => {
        if (!bookingId) return;
        setLoading(true);
        try {
            const [bookingRes, insurance] = await Promise.all([
                getBookingById(bookingId),
                getInsuranceByBooking(bookingId),
            ]);
            if (!bookingRes.success || !bookingRes.booking) {
                toast.error('Booking not found');
                setBooking(null);
                return;
            }
            setBooking(bookingRes.booking as any);
            if (insurance) {
                setDraft({
                    providerName: insurance.provider_name || '',
                    policyNumber: insurance.policy_number || '',
                    premiumAmount:
                        insurance.premium_amount === null || insurance.premium_amount === undefined
                            ? ''
                            : String(insurance.premium_amount),
                    expiryDate: insurance.expiry_date ? String(insurance.expiry_date).slice(0, 10) : '',
                    status: insurance.status || 'PENDING',
                });
            }
        } catch (error) {
            console.error('[Insurance] load error:', error);
            toast.error('Failed to load insurance');
        } finally {
            setLoading(false);
        }
    }, [bookingId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const saveInsurance = async () => {
        if (!bookingId || !booking?.tenant_id) {
            toast.error('Booking tenant context missing');
            return false;
        }

        setSaving(true);
        try {
            await upsertInsurance({
                bookingId,
                tenantId: booking.tenant_id,
                providerName: draft.providerName || undefined,
                policyNumber: draft.policyNumber || undefined,
                status: draft.status || 'PENDING',
                premiumAmount: draft.premiumAmount ? Number(draft.premiumAmount) : undefined,
                expiryDate: draft.expiryDate || undefined,
            });
            toast.success('Insurance saved');
            await loadData();
            return true;
        } catch (error) {
            console.error('[Insurance] save error:', error);
            toast.error('Failed to save insurance');
            return false;
        } finally {
            setSaving(false);
        }
    };

    const moveToStage = async (stage: string) => {
        const ok = await saveInsurance();
        if (!ok) return;
        const result = await advanceBookingStage(bookingId, stage, `insurance_updated_to_${stage.toLowerCase()}`);
        if (result.success) {
            toast.success(`Moved to ${stage}`);
            await loadData();
        } else {
            toast.error(result.message || result.warning || `Failed to move to ${stage}`);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[40vh] text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading insurance...
            </div>
        );
    }

    if (!booking) {
        return <div className="min-h-[40vh] flex items-center justify-center text-rose-500">Booking not found</div>;
    }

    return (
        <div className="space-y-6">
            <div className="w-16 h-16 rounded-[1.5rem] bg-cyan-500/10 flex items-center justify-center text-cyan-600 border border-cyan-500/20">
                <ShieldCheck size={28} />
            </div>

            <div className="bg-white dark:bg-[#0b0d10] border border-slate-200 dark:border-white/5 rounded-[2rem] p-6 space-y-5">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                        Insurance
                    </h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                        Policy status and insurer details
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</span>
                        <select
                            value={draft.status}
                            onChange={e => setDraft(prev => ({ ...prev, status: e.target.value }))}
                            className="w-full h-11 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 text-sm font-bold"
                        >
                            <option value="PENDING">PENDING</option>
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="EXPIRED">EXPIRED</option>
                            <option value="CANCELLED">CANCELLED</option>
                        </select>
                    </label>

                    <label className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Provider Name
                        </span>
                        <input
                            value={draft.providerName}
                            onChange={e => setDraft(prev => ({ ...prev, providerName: e.target.value }))}
                            className="w-full h-11 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 text-sm font-medium"
                            placeholder="Insurance company"
                        />
                    </label>

                    <label className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Policy Number
                        </span>
                        <input
                            value={draft.policyNumber}
                            onChange={e => setDraft(prev => ({ ...prev, policyNumber: e.target.value }))}
                            className="w-full h-11 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 text-sm font-medium"
                            placeholder="Policy #"
                        />
                    </label>

                    <label className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Premium Amount
                        </span>
                        <input
                            type="number"
                            value={draft.premiumAmount}
                            onChange={e => setDraft(prev => ({ ...prev, premiumAmount: e.target.value }))}
                            className="w-full h-11 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 text-sm font-medium"
                            placeholder="0"
                        />
                    </label>

                    <label className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Expiry Date
                        </span>
                        <input
                            type="date"
                            value={draft.expiryDate}
                            onChange={e => setDraft(prev => ({ ...prev, expiryDate: e.target.value }))}
                            className="w-full h-11 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 text-sm font-medium"
                        />
                    </label>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button onClick={saveInsurance} disabled={saving} className="rounded-xl">
                        {saving ? (
                            <>
                                <Loader2 size={14} className="mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            'Save Insurance'
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => moveToStage('INSURANCE')}
                        disabled={saving}
                        className="rounded-xl"
                    >
                        Save + Move to INSURANCE
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => moveToStage('REGISTRATION')}
                        disabled={saving}
                        className="rounded-xl"
                    >
                        Save + Move to REGISTRATION
                    </Button>
                </div>
            </div>
        </div>
    );
}
