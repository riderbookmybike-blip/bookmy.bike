'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { FileCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getBookingById } from '@/actions/crm';
import { getRegistrationByBooking, upsertRegistration } from '@/actions/registration';
import { advanceBookingStage } from '@/actions/bookingStage';

export default function BookingRegistrationPage() {
    const params = useParams();
    const bookingId = typeof params?.id === 'string' ? params.id : '';

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [booking, setBooking] = useState<any | null>(null);
    const [draft, setDraft] = useState({
        status: 'PENDING',
        registrationNumber: '',
        rtoReceiptNumber: '',
        registeredAt: '',
    });

    const loadData = useCallback(async () => {
        if (!bookingId) return;
        setLoading(true);
        try {
            const [bookingRes, registration] = await Promise.all([
                getBookingById(bookingId),
                getRegistrationByBooking(bookingId),
            ]);
            if (!bookingRes.success || !bookingRes.booking) {
                toast.error('Booking not found');
                setBooking(null);
                return;
            }
            setBooking(bookingRes.booking as any);
            if (registration) {
                setDraft({
                    status: registration.status || 'PENDING',
                    registrationNumber: registration.registration_number || '',
                    rtoReceiptNumber: registration.rto_receipt_number || '',
                    registeredAt: registration.registered_at ? String(registration.registered_at).slice(0, 10) : '',
                });
            }
        } catch (error) {
            console.error('[Registration] load error:', error);
            toast.error('Failed to load registration');
        } finally {
            setLoading(false);
        }
    }, [bookingId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const saveRegistration = async () => {
        if (!bookingId || !booking?.tenant_id) {
            toast.error('Booking tenant context missing');
            return false;
        }

        setSaving(true);
        try {
            await upsertRegistration({
                bookingId,
                tenantId: booking.tenant_id,
                status: draft.status || 'PENDING',
                registrationNumber: draft.registrationNumber || undefined,
                rtoReceiptNumber: draft.rtoReceiptNumber || undefined,
                registeredAt: draft.registeredAt || undefined,
            });
            toast.success('Registration saved');
            await loadData();
            return true;
        } catch (error) {
            console.error('[Registration] save error:', error);
            toast.error('Failed to save registration');
            return false;
        } finally {
            setSaving(false);
        }
    };

    const moveToStage = async (stage: string) => {
        const ok = await saveRegistration();
        if (!ok) return;
        const result = await advanceBookingStage(bookingId, stage, `registration_updated_to_${stage.toLowerCase()}`);
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
                Loading registration...
            </div>
        );
    }

    if (!booking) {
        return <div className="min-h-[40vh] flex items-center justify-center text-rose-500">Booking not found</div>;
    }

    return (
        <div className="space-y-6">
            <div className="w-16 h-16 rounded-[1.5rem] bg-yellow-500/10 flex items-center justify-center text-yellow-600 border border-yellow-500/20">
                <FileCheck size={28} />
            </div>

            <div className="bg-white dark:bg-[#0b0d10] border border-slate-200 dark:border-white/5 rounded-[2rem] p-6 space-y-5">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                        Registration
                    </h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                        RTO status and registration proof
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
                            <option value="IN_PROGRESS">IN_PROGRESS</option>
                            <option value="COMPLETED">COMPLETED</option>
                            <option value="REJECTED">REJECTED</option>
                        </select>
                    </label>

                    <label className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Registration Number
                        </span>
                        <input
                            value={draft.registrationNumber}
                            onChange={e =>
                                setDraft(prev => ({ ...prev, registrationNumber: e.target.value.toUpperCase() }))
                            }
                            className="w-full h-11 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 text-sm font-medium"
                            placeholder="MH01AB1234"
                        />
                    </label>

                    <label className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            RTO Receipt Number
                        </span>
                        <input
                            value={draft.rtoReceiptNumber}
                            onChange={e => setDraft(prev => ({ ...prev, rtoReceiptNumber: e.target.value }))}
                            className="w-full h-11 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 text-sm font-medium"
                            placeholder="Receipt #"
                        />
                    </label>

                    <label className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Registered Date
                        </span>
                        <input
                            type="date"
                            value={draft.registeredAt}
                            onChange={e => setDraft(prev => ({ ...prev, registeredAt: e.target.value }))}
                            className="w-full h-11 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 text-sm font-medium"
                        />
                    </label>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button onClick={saveRegistration} disabled={saving} className="rounded-xl">
                        {saving ? (
                            <>
                                <Loader2 size={14} className="mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            'Save Registration'
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => moveToStage('REGISTRATION')}
                        disabled={saving}
                        className="rounded-xl"
                    >
                        Save + Move to REGISTRATION
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => moveToStage('COMPLIANCE')}
                        disabled={saving}
                        className="rounded-xl"
                    >
                        Save + Move to COMPLIANCE
                    </Button>
                </div>
            </div>
        </div>
    );
}
