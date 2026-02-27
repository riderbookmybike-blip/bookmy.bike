'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle2, CreditCard, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getBookingById, getReceiptsForBooking, reconcileReceipt } from '@/actions/crm';
import { formatDisplayId } from '@/utils/displayId';
import { advanceBookingStage } from '@/actions/bookingStage';

export default function SalesOrderReceiptPage() {
    const params = useParams();
    const bookingId = typeof params?.id === 'string' ? params.id : '';

    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState<any | null>(null);
    const [receipts, setReceipts] = useState<any[]>([]);
    const [reconciling, setReconciling] = useState<string | null>(null);
    const [movingStage, setMovingStage] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        if (!bookingId) return;
        setLoading(true);
        try {
            const [bookingRes, receiptRows] = await Promise.all([
                getBookingById(bookingId),
                getReceiptsForBooking(bookingId),
            ]);
            if (!bookingRes.success || !bookingRes.booking) {
                toast.error('Booking not found');
                setBooking(null);
                return;
            }
            setBooking(bookingRes.booking as any);
            setReceipts(receiptRows || []);
        } catch (error) {
            console.error('[Receipt] load error:', error);
            toast.error('Failed to load receipts');
        } finally {
            setLoading(false);
        }
    }, [bookingId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleReconcile = async (receiptId: string) => {
        setReconciling(receiptId);
        try {
            const result = await reconcileReceipt(receiptId);
            if (result.success) {
                toast.success('Receipt reconciled');
                await loadData();
            } else {
                toast.error(result.error || 'Failed to reconcile receipt');
            }
        } catch (error) {
            console.error('[Receipt] reconcile error:', error);
            toast.error('Failed to reconcile receipt');
        } finally {
            setReconciling(null);
        }
    };

    const handleMoveToStage = async (stage: string) => {
        if (!bookingId) return;
        setMovingStage(stage);
        try {
            const result = await advanceBookingStage(bookingId, stage, `receipt_page_move_to_${stage.toLowerCase()}`);
            if (result.success) {
                toast.success(`Moved to ${stage}`);
                await loadData();
            } else {
                toast.error(result.message || result.warning || `Failed to move to ${stage}`);
            }
        } catch (error) {
            console.error('[Receipt] stage transition error:', error);
            toast.error(`Failed to move to ${stage}`);
        } finally {
            setMovingStage(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[40vh] text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading receipts...
            </div>
        );
    }

    if (!booking) {
        return <div className="min-h-[40vh] flex items-center justify-center text-rose-500">Booking not found</div>;
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-500/10 flex items-center justify-center text-emerald-600 border border-emerald-500/20">
                <CreditCard size={28} />
            </div>

            <div className="bg-white dark:bg-[#0b0d10] border border-slate-200 dark:border-white/5 rounded-[2rem] p-6 space-y-5">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                        Receipts & Payments
                    </h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                        Booking: {formatDisplayId(booking.display_id || booking.id)}
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="outline"
                        onClick={() => handleMoveToStage('PAYMENT')}
                        disabled={movingStage !== null}
                        className="rounded-xl"
                    >
                        {movingStage === 'PAYMENT' ? 'Moving...' : 'Move to PAYMENT'}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => handleMoveToStage('FINANCE')}
                        disabled={movingStage !== null}
                        className="rounded-xl"
                    >
                        {movingStage === 'FINANCE' ? 'Moving...' : 'Move to FINANCE'}
                    </Button>
                </div>

                {receipts.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 dark:border-white/10 p-6 text-sm text-slate-500 font-bold">
                        No receipts found for this booking.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {receipts.map((receipt: any) => (
                            <div
                                key={receipt.id}
                                className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] p-4"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="space-y-1">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            {formatDisplayId(receipt.display_id || receipt.id)}
                                        </div>
                                        <div className="text-lg font-black text-slate-900 dark:text-white">
                                            ₹{Number(receipt.amount || 0).toLocaleString('en-IN')}
                                        </div>
                                        <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                                            {receipt.method || 'UNKNOWN'} • {receipt.status || 'PENDING'}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {receipt.is_reconciled ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                                                <CheckCircle2 size={12} />
                                                Reconciled
                                            </span>
                                        ) : (
                                            <Button
                                                size="sm"
                                                onClick={() => handleReconcile(receipt.id)}
                                                disabled={reconciling === receipt.id}
                                                className="rounded-lg"
                                            >
                                                {reconciling === receipt.id ? (
                                                    <>
                                                        <Loader2 size={12} className="mr-1 animate-spin" />
                                                        Reconciling...
                                                    </>
                                                ) : (
                                                    'Mark Reconciled'
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
