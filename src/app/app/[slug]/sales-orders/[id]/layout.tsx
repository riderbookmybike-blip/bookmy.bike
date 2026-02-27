'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import {
    getBookingById,
    getQuoteById,
    getTasksForEntity,
    getQuotesForLead,
    getQuotesForMember,
    getBookingsForLead,
    getBookingsForMember,
    getReceiptsForEntity,
} from '@/actions/crm';
import { getFinanceApplications } from '@/actions/finance';
import { QuoteData } from '@/components/modules/quotes/QuoteEditorTable';
import { toast } from 'sonner';
import { formatDisplayId } from '@/utils/displayId';
import { cn } from '@/lib/utils';
import {
    ShoppingBag,
    CreditCard,
    Landmark,
    Truck,
    FileCheck,
    ShieldCheck,
    ClipboardCheck,
    History,
    StickyNote,
    FileText,
    ListTodo,
} from 'lucide-react';

interface SalesOrderLayoutProps {
    children: React.ReactNode;
}

export default function SalesOrderLayout({ children }: SalesOrderLayoutProps) {
    const params = useParams();
    const router = useRouter();
    const pathname = usePathname();
    const id = typeof params?.id === 'string' ? params.id : '';
    const slug = typeof params?.slug === 'string' ? params.slug : '';

    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState<any>(null);
    const [quote, setQuote] = useState<QuoteData | null>(null);
    const [financeApps, setFinanceApps] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);
    const [relatedQuotes, setRelatedQuotes] = useState<any[]>([]);
    const [bookings, setBookings] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);

    useEffect(() => {
        if (id) {
            loadData();
        }
    }, [id]);

    async function loadData() {
        setLoading(true);
        try {
            const bookingRes = await getBookingById(id);
            if (!bookingRes.success || !bookingRes.booking) {
                toast.error('Booking not found');
                return;
            }
            const b = bookingRes.booking;
            setBooking(b);

            if (!b.quote_id) {
                toast.error('Booking missing quote reference');
                setLoading(false);
                return;
            }

            const quoteRes = await getQuoteById(b.quote_id);
            if (quoteRes.success && quoteRes.data) {
                setQuote(quoteRes.data as unknown as QuoteData);
                const q = quoteRes.data;
                const memberId = q.customerProfile?.memberId;
                const leadId = q.leadId;

                // Parallel fetching for sidebars
                const [tasksData, fApps, rQuotes, bks, pays] = await Promise.all([
                    getTasksForEntity('BOOKING', id),
                    getFinanceApplications(id),
                    memberId ? getQuotesForMember(memberId) : leadId ? getQuotesForLead(leadId) : Promise.resolve([]),
                    memberId
                        ? getBookingsForMember(memberId)
                        : leadId
                          ? getBookingsForLead(leadId)
                          : Promise.resolve([]),
                    getReceiptsForEntity(leadId || null, memberId || null),
                ]);

                setTasks(tasksData || []);
                setFinanceApps(fApps || []);
                setRelatedQuotes(rQuotes || []);
                setBookings(bks || []);
                setPayments(pays || []);
            }
        } catch (err) {
            console.error('Layout Data Fetch Error:', err);
        } finally {
            setLoading(false);
        }
    }

    if (loading)
        return (
            <div className="flex items-center justify-center min-h-[60vh] text-slate-400">
                Loading Booking Details...
            </div>
        );
    if (!booking || !quote)
        return <div className="flex items-center justify-center min-h-[60vh] text-rose-500">Booking not found</div>;

    const navItems = [
        { label: 'Overview', path: `/app/${slug}/sales-orders/${id}`, icon: ShoppingBag },
        { label: 'Finance', path: `/app/${slug}/sales-orders/${id}/finance`, icon: Landmark },
        { label: 'Receipts', path: `/app/${slug}/sales-orders/${id}/receipt`, icon: CreditCard },
        { label: 'Allotment', path: `/app/${slug}/sales-orders/${id}/allotment`, icon: Truck },
        { label: 'PDI', path: `/app/${slug}/sales-orders/${id}/pdi`, icon: ClipboardCheck },
        { label: 'Insurance', path: `/app/${slug}/sales-orders/${id}/insurance`, icon: ShieldCheck },
        { label: 'Registration', path: `/app/${slug}/sales-orders/${id}/registration`, icon: FileCheck },
    ];

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#0b0d10]">
            {/* 1. Header (Shared) */}
            <div className="sticky top-0 z-40 bg-white/80 dark:bg-[#0b0d10]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 px-6 py-4">
                <div className="max-w-[1600px] mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors"
                        >
                            <ShoppingBag className="w-5 h-5 text-slate-400" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                                    {booking.display_id || formatDisplayId(booking.id)}
                                </h1>
                                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-md border border-emerald-500/20">
                                    {booking.status}
                                </span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                {quote.customerProfile?.fullName} • {quote.vehicle?.brand} {quote.vehicle?.model}
                            </p>
                        </div>
                    </div>

                    {/* Stage Navigation Tabs */}
                    <div className="hidden lg:flex items-center bg-slate-100 dark:bg-white/5 p-1 rounded-2xl border border-slate-200 dark:border-white/10">
                        {navItems.map(item => {
                            const isActive = pathname === item.path;
                            return (
                                <button
                                    key={item.label}
                                    onClick={() => router.push(item.path)}
                                    className={cn(
                                        'flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
                                        isActive
                                            ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-white shadow-sm'
                                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-white/60'
                                    )}
                                >
                                    <item.icon size={14} />
                                    {item.label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Stage:{' '}
                        <span className="text-slate-900 dark:text-white pl-1">
                            {booking.current_stage || 'Booking'}
                        </span>
                    </div>
                </div>
            </div>

            {/* 2. Content & Sidebar Layout */}
            <div className="flex flex-1 overflow-hidden h-[calc(100vh-73px)]">
                {/* Main View Area */}
                <main className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar grayscale-[0.2]">
                    <div className="max-w-[1440px] mx-auto">{children}</div>
                </main>

                {/* Right Interactive Sidebar (Universal) */}
                <aside className="w-80 border-l border-slate-200 dark:border-white/5 bg-white dark:bg-[#0b0d10] hidden xl:flex flex-col shrink-0">
                    <div className="flex items-center gap-1 border-b border-slate-100 dark:border-white/5 p-1">
                        {[
                            { id: 'tasks', icon: ListTodo, label: 'Tasks' },
                            { id: 'notes', icon: StickyNote, label: 'Notes' },
                            { id: 'docs', icon: FileText, label: 'Docs' },
                            { id: 'timeline', icon: History, label: 'Logs' },
                        ].map(t => (
                            <button
                                key={t.id}
                                className="flex-1 py-3 flex flex-col items-center gap-1 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors rounded-xl group"
                            >
                                <t.icon
                                    size={16}
                                    className="text-slate-300 dark:text-white/20 group-hover:text-indigo-500 transition-colors"
                                />
                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                                    {t.label}
                                </span>
                            </button>
                        ))}
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center opacity-20 grayscale">
                        <ShoppingBag size={48} />
                        <p className="text-[10px] font-black uppercase tracking-widest mt-4">Sidebar Modules</p>
                    </div>
                </aside>
            </div>
        </div>
    );
}
