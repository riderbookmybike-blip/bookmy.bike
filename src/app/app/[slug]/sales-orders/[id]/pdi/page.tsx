'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ClipboardCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getBookingById } from '@/actions/crm';
import { getPDIByBooking, upsertPDI } from '@/actions/pdi';
import { advanceBookingStage } from '@/actions/bookingStage';

type PdiStatus = 'PENDING' | 'PASSED' | 'FAILED';

export default function BookingPdiPage() {
    const params = useParams();
    const bookingId = typeof params?.id === 'string' ? params.id : '';

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [booking, setBooking] = useState<any | null>(null);
    const [draft, setDraft] = useState({
        status: 'PENDING' as PdiStatus,
        inspectorName: '',
        inspectionDate: '',
        notes: '',
        electricalOk: true,
        bodyOk: true,
        tyreOk: true,
        fuelOk: true,
        brakesOk: true,
    });

    const loadData = useCallback(async () => {
        if (!bookingId) return;
        setLoading(true);
        try {
            const [bookingRes, pdi] = await Promise.all([getBookingById(bookingId), getPDIByBooking(bookingId)]);
            if (!bookingRes.success || !bookingRes.booking) {
                toast.error('Booking not found');
                setBooking(null);
                return;
            }
            setBooking(bookingRes.booking as any);

            if (pdi) {
                setDraft({
                    status: (pdi.status || 'PENDING') as PdiStatus,
                    inspectorName: pdi.inspector_name || '',
                    inspectionDate: pdi.inspection_date ? String(pdi.inspection_date).slice(0, 10) : '',
                    notes: pdi.notes || '',
                    electricalOk: pdi.electrical_ok !== false,
                    bodyOk: pdi.body_ok !== false,
                    tyreOk: pdi.tyre_ok !== false,
                    fuelOk: pdi.fuel_ok !== false,
                    brakesOk: pdi.brakes_ok !== false,
                });
            }
        } catch (error) {
            console.error('[PDI] load error:', error);
            toast.error('Failed to load PDI details');
        } finally {
            setLoading(false);
        }
    }, [bookingId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const savePdi = async () => {
        if (!bookingId || !booking?.tenant_id) {
            toast.error('Booking tenant context missing');
            return false;
        }

        setSaving(true);
        try {
            await upsertPDI({
                bookingId,
                tenantId: booking.tenant_id,
                status: draft.status,
                inspectorName: draft.inspectorName || undefined,
                inspectionDate: draft.inspectionDate || undefined,
                notes: draft.notes || undefined,
                electricalOk: draft.electricalOk,
                bodyOk: draft.bodyOk,
                tyreOk: draft.tyreOk,
                fuelOk: draft.fuelOk,
                brakesOk: draft.brakesOk,
            });
            toast.success('PDI details saved');
            await loadData();
            return true;
        } catch (error) {
            console.error('[PDI] save error:', error);
            toast.error('Failed to save PDI');
            return false;
        } finally {
            setSaving(false);
        }
    };

    const moveToStage = async (stage: string) => {
        const ok = await savePdi();
        if (!ok) return;
        const result = await advanceBookingStage(bookingId, stage, `pdi_updated_to_${stage.toLowerCase()}`);
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
                Loading PDI...
            </div>
        );
    }

    if (!booking) {
        return <div className="min-h-[40vh] flex items-center justify-center text-rose-500">Booking not found</div>;
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-16 h-16 rounded-[1.5rem] bg-orange-500/10 flex items-center justify-center text-orange-600 border border-orange-500/20">
                <ClipboardCheck size={28} />
            </div>

            <div className="bg-white dark:bg-[#0b0d10] border border-slate-200 dark:border-white/5 rounded-[2rem] p-6 space-y-5">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                        PDI Checklist
                    </h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                        Pre-delivery inspection and pass/fail controls
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</span>
                        <select
                            value={draft.status}
                            onChange={e => setDraft(prev => ({ ...prev, status: e.target.value as PdiStatus }))}
                            className="w-full h-11 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 text-sm font-bold"
                        >
                            <option value="PENDING">PENDING</option>
                            <option value="PASSED">PASSED</option>
                            <option value="FAILED">FAILED</option>
                        </select>
                    </label>

                    <label className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Inspector Name
                        </span>
                        <input
                            value={draft.inspectorName}
                            onChange={e => setDraft(prev => ({ ...prev, inspectorName: e.target.value }))}
                            className="w-full h-11 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 text-sm font-medium"
                            placeholder="Inspector"
                        />
                    </label>

                    <label className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Inspection Date
                        </span>
                        <input
                            type="date"
                            value={draft.inspectionDate}
                            onChange={e => setDraft(prev => ({ ...prev, inspectionDate: e.target.value }))}
                            className="w-full h-11 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 text-sm font-medium"
                        />
                    </label>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {[
                        { key: 'electricalOk', label: 'Electrical' },
                        { key: 'bodyOk', label: 'Body' },
                        { key: 'tyreOk', label: 'Tyres' },
                        { key: 'fuelOk', label: 'Fuel' },
                        { key: 'brakesOk', label: 'Brakes' },
                    ].map(item => (
                        <label
                            key={item.key}
                            className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-200"
                        >
                            <input
                                type="checkbox"
                                checked={Boolean((draft as any)[item.key])}
                                onChange={e => setDraft(prev => ({ ...prev, [item.key]: e.target.checked }))}
                                className="rounded border-slate-300"
                            />
                            {item.label}
                        </label>
                    ))}
                </div>

                <label className="space-y-1 block">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notes</span>
                    <textarea
                        value={draft.notes}
                        onChange={e => setDraft(prev => ({ ...prev, notes: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm font-medium min-h-[96px]"
                        placeholder="Inspection observations..."
                    />
                </label>

                <div className="flex flex-wrap gap-2">
                    <Button onClick={savePdi} disabled={saving} className="rounded-xl">
                        {saving ? (
                            <>
                                <Loader2 size={14} className="mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            'Save PDI'
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => moveToStage('PDI')}
                        disabled={saving}
                        className="rounded-xl"
                    >
                        Save + Move to PDI
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
