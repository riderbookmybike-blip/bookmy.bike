'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlertCircle, ArrowRight, Bike, Calendar, IndianRupee, Loader2, User, Workflow } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getBookingById, getQuoteById } from '@/actions/crm';
import { advanceBookingStage, getAllowedTransitions, getBookingStageHistory } from '@/actions/bookingStage';
import { toast } from 'sonner';

export default function SalesOrderOverviewPage() {
    const params = useParams();
    const router = useRouter();
    const id = typeof params?.id === 'string' ? params.id : '';
    const slug = typeof params?.slug === 'string' ? params.slug : '';

    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState<any | null>(null);
    const [quote, setQuote] = useState<any | null>(null);
    const [allowedTransitions, setAllowedTransitions] = useState<string[]>([]);
    const [stageEvents, setStageEvents] = useState<any[]>([]);
    const [transitioningStage, setTransitioningStage] = useState<string | null>(null);

    const currentStage = (booking?.operational_stage || booking?.current_stage || 'BOOKING').toUpperCase();

    const loadData = useCallback(async () => {
        if (!id) return;

        setLoading(true);
        try {
            const bookingRes = await getBookingById(id);
            if (!bookingRes.success || !bookingRes.booking) {
                toast.error('Booking not found');
                setBooking(null);
                return;
            }

            const bookingRow = bookingRes.booking as any;
            setBooking(bookingRow);

            const [quoteRes, nextStages, events] = await Promise.all([
                bookingRow.quote_id ? getQuoteById(bookingRow.quote_id) : Promise.resolve({ success: false }),
                getAllowedTransitions(
                    (bookingRow.operational_stage || bookingRow.current_stage || 'BOOKING').toUpperCase()
                ),
                getBookingStageHistory(id),
            ]);

            if ((quoteRes as any)?.success && (quoteRes as any)?.data) {
                setQuote((quoteRes as any).data);
            } else {
                setQuote(null);
            }

            setAllowedTransitions(Array.isArray(nextStages) ? nextStages : []);
            setStageEvents(Array.isArray(events) ? events : []);
        } catch (error) {
            console.error('[BookingOverview] Load error:', error);
            toast.error('Failed to load booking overview');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const customerName = useMemo(() => {
        return (
            quote?.customerProfile?.fullName ||
            booking?.customer_details?.member?.full_name ||
            booking?.customer_details?.lead?.customer_name ||
            booking?.customer_details?.full_name ||
            'N/A'
        );
    }, [quote, booking]);

    const vehicleName = useMemo(() => {
        const fromQuote = [quote?.vehicle?.brand, quote?.vehicle?.model, quote?.vehicle?.variant]
            .filter(Boolean)
            .join(' ');
        if (fromQuote) return fromQuote;
        const fromBooking = [
            booking?.vehicle_details?.brand,
            booking?.vehicle_details?.model,
            booking?.vehicle_details?.variant,
        ]
            .filter(Boolean)
            .join(' ');
        return fromBooking || 'N/A';
    }, [quote, booking]);

    const moveToStage = async (toStage: string) => {
        if (!id) return;

        setTransitioningStage(toStage);
        try {
            const result = await advanceBookingStage(id, toStage, `manual_transition_to_${toStage.toLowerCase()}`);
            if (!result.success) {
                toast.error(result.message || result.warning || `Failed to move to ${toStage}`);
                return;
            }
            toast.success(`Moved to ${toStage}`);
            await loadData();
        } catch (error) {
            console.error('[BookingOverview] Stage transition error:', error);
            toast.error(`Failed to move to ${toStage}`);
        } finally {
            setTransitioningStage(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[40vh] flex items-center justify-center text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading booking overview...
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="min-h-[40vh] flex items-center justify-center gap-2 text-rose-500">
                <AlertCircle size={18} />
                Booking not found
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="lg:col-span-2 space-y-8">
                <div className="bg-white dark:bg-[#0b0d10] border border-slate-200 dark:border-white/5 rounded-[3rem] p-8">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mb-4">
                        Booking Summary
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <User size={14} className="text-slate-400" />
                            <span className="text-slate-500">Customer:</span>
                            <span className="font-bold text-slate-900 dark:text-white">{customerName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Bike size={14} className="text-slate-400" />
                            <span className="text-slate-500">Vehicle:</span>
                            <span className="font-bold text-slate-900 dark:text-white">{vehicleName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <IndianRupee size={14} className="text-slate-400" />
                            <span className="text-slate-500">Booking Value:</span>
                            <span className="font-bold text-slate-900 dark:text-white">
                                ₹{Number(booking.grand_total || 0).toLocaleString('en-IN')}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-slate-400" />
                            <span className="text-slate-500">Created:</span>
                            <span className="font-bold text-slate-900 dark:text-white">
                                {booking.created_at ? new Date(booking.created_at).toLocaleDateString('en-IN') : '—'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                        type="button"
                        onClick={() => slug && router.push(`/app/${slug}/sales-orders/${id}/finance`)}
                        className="text-left bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-[2rem] p-6 hover:border-indigo-500/30 transition-all group"
                    >
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                            Finance
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                Loan & Disbursement
                            </span>
                            <ArrowRight
                                size={14}
                                className="text-slate-300 group-hover:text-indigo-500 transition-all"
                            />
                        </div>
                    </button>
                    <button
                        type="button"
                        onClick={() => slug && router.push(`/app/${slug}/sales-orders/${id}/allotment`)}
                        className="text-left bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-[2rem] p-6 hover:border-indigo-500/30 transition-all group"
                    >
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                            Allotment
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                VIN / Stock Mapping
                            </span>
                            <ArrowRight
                                size={14}
                                className="text-slate-300 group-hover:text-indigo-500 transition-all"
                            />
                        </div>
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-600/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-[50px] group-hover:scale-150 transition-transform duration-700" />
                    <div className="relative z-10">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-70">
                            Current Stage
                        </div>
                        <h3 className="text-3xl font-black uppercase tracking-tighter italic leading-none mb-6">
                            {currentStage}
                        </h3>
                        <div className="space-y-2">
                            {allowedTransitions.length === 0 && (
                                <div className="text-xs font-bold opacity-80">No transitions available</div>
                            )}
                            {allowedTransitions.map(stage => (
                                <Button
                                    key={stage}
                                    onClick={() => moveToStage(stage)}
                                    disabled={transitioningStage !== null}
                                    className="w-full bg-white text-indigo-600 hover:bg-white/90 rounded-2xl h-11 font-black uppercase tracking-widest text-[10px] gap-2"
                                >
                                    {transitioningStage === stage ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" /> Moving...
                                        </>
                                    ) : (
                                        <>
                                            Move to {stage} <Workflow size={14} />
                                        </>
                                    )}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#0b0d10] border border-slate-200 dark:border-white/5 rounded-[2rem] p-6">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                        Quick Access
                    </div>
                    <div className="space-y-2">
                        <Button
                            variant="outline"
                            onClick={() => slug && router.push(`/app/${slug}/sales-orders/${id}/receipt`)}
                            className="w-full justify-between"
                        >
                            Receipts <ArrowRight size={14} />
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => slug && router.push(`/app/${slug}/sales-orders/${id}/insurance`)}
                            className="w-full justify-between"
                        >
                            Insurance <ArrowRight size={14} />
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => slug && router.push(`/app/${slug}/sales-orders/${id}/pdi`)}
                            className="w-full justify-between"
                        >
                            PDI <ArrowRight size={14} />
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => slug && router.push(`/app/${slug}/sales-orders/${id}/registration`)}
                            className="w-full justify-between"
                        >
                            Registration <ArrowRight size={14} />
                        </Button>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#0b0d10] border border-slate-200 dark:border-white/5 rounded-[2rem] p-6">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                        Stage History
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {stageEvents.length === 0 && (
                            <div className="text-xs text-slate-500 font-bold">No stage transitions recorded.</div>
                        )}
                        {stageEvents.slice(0, 8).map((event: any) => (
                            <div
                                key={event.id}
                                className="rounded-xl border border-slate-100 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02] px-3 py-2"
                            >
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">
                                    {(event.from_stage || '—') + ' -> ' + (event.to_stage || '—')}
                                </div>
                                <div className="text-[9px] text-slate-500">
                                    {event.changed_at ? new Date(event.changed_at).toLocaleString('en-IN') : '—'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
