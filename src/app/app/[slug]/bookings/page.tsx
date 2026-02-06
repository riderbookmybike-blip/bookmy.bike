'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTenant } from '@/lib/tenant/tenantContext';
import { getOngoingBookings } from '@/actions/firebase';
import MasterListDetailLayout from '@/components/templates/MasterListDetailLayout';
import StatsHeader from '@/components/modules/shared/StatsHeader';
import ModuleLanding from '@/components/modules/shared/ModuleLanding';
import {
    ShoppingBag,
    Zap,
    CreditCard,
    User,
    Calendar,
    LayoutGrid,
    Search as SearchIcon,
    ArrowRight,
    Package,
    CheckCircle2,
    Truck,
    Clock,
    Bike,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDisplayId } from '@/utils/displayId';

export default function BookingsPage() {
    const { tenantId } = useTenant();
    const [bookings, setBookings] = useState<any[]>([]);
    const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [view, setView] = useState<'grid' | 'list'>('list');

    const fetchBookings = async () => {
        setIsLoading(true);
        try {
            const data = await getOngoingBookings();
            setBookings(data || []);
        } catch (error) {
            console.error('Failed to fetch bookings:', error);
            toast.error('Firebase connection error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const filteredBookings = bookings.filter(
        b =>
            b.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            formatDisplayId(b.bookingId)?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const stats = [
        { label: 'Total Orders', value: bookings.length, icon: ShoppingBag, color: 'indigo' as const, trend: 'LIVE' },
        {
            label: 'In Delivery',
            value: bookings.filter(b => b.status === 'READY_FOR_DELIVERY').length,
            icon: Truck,
            color: 'blue' as const,
        },
        {
            label: 'Payments',
            value: bookings.filter(b => b.paymentStatus === 'PAID').length,
            icon: CreditCard,
            color: 'emerald' as const,
            trend: '80%',
        },
        { label: 'Avg Cycle', value: '1.8 Days', icon: Clock, color: 'amber' as const },
        { label: 'Completed', value: 0, icon: CheckCircle2, color: 'indigo' as const },
    ];

    // --- LANDING VIEW ---
    if (!selectedBooking) {
        return (
            <div className="h-full bg-slate-50 dark:bg-[#0b0d10]">
                <ModuleLanding
                    title="Bookings"
                    subtitle="Order Fulfillment & Delivery"
                    searchPlaceholder="Search Booking Index..."
                    onSearch={setSearchQuery}
                    statsContent={<StatsHeader stats={stats} />}
                    view={view}
                    onViewChange={setView}
                >
                    {view === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                            {filteredBookings.map(booking => (
                                <div
                                    key={booking.id}
                                    onClick={() => setSelectedBooking(booking)}
                                    className="group relative bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-500/10 hover:border-emerald-500/30 overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                                                {formatDisplayId(booking.bookingId)}
                                            </div>
                                            <div className="p-2 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                                <Package size={14} />
                                            </div>
                                        </div>

                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase mb-2 truncate group-hover:text-emerald-600 transition-colors">
                                            {booking.customerName}
                                        </h3>

                                        <div className="flex flex-col gap-1 mb-6">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                {booking.customerPhone}
                                            </div>
                                            <div className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-tighter truncate">
                                                {booking.vehicleDetails?.name}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-white/5">
                                            <div className="px-3 py-1 bg-emerald-500/10 rounded-xl text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                                                {booking.status?.replace('_', ' ')}
                                            </div>
                                            <div className="text-[10px] font-black text-slate-900 dark:text-white">
                                                ₹{booking.totalAmount?.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-white/5">
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Order Reference
                                        </th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Customer Persona
                                        </th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Vehicle Unit
                                        </th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Contract Value
                                        </th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Fulfillment Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBookings.map(booking => (
                                        <tr
                                            key={booking.id}
                                            onClick={() => setSelectedBooking(booking)}
                                            className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer border-b border-slate-50 dark:border-white/5 last:border-0"
                                        >
                                            <td className="p-6">
                                                <div className="text-xs font-black text-emerald-500 uppercase tracking-widest">
                                                    {formatDisplayId(booking.bookingId)}
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div>
                                                    <div className="text-sm font-black italic uppercase tracking-tighter text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                                                        {booking.customerName}
                                                    </div>
                                                    <div className="text-[10px] font-bold text-slate-400">
                                                        {booking.customerPhone}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase">
                                                    {booking.vehicleDetails?.name}
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="text-sm font-black text-slate-900 dark:text-white">
                                                    ₹{booking.totalAmount?.toLocaleString()}
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="px-3 py-1 bg-emerald-500/10 rounded-lg text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest inline-block">
                                                    {booking.status?.replace('_', ' ')}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </ModuleLanding>
            </div>
        );
    }

    // --- DETAIL VIEW ---
    return (
        <div className="h-full bg-slate-50 dark:bg-slate-950 flex overflow-hidden font-sans">
            <MasterListDetailLayout mode="list-detail" listPosition="left">
                {/* Sidebar List */}
                <div className="h-full flex flex-col bg-white dark:bg-[#0b0d10] border-r border-slate-200 dark:border-white/5 w-full">
                    <div className="p-6 border-b border-slate-100 dark:border-white/5 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white">
                                Orders <span className="text-emerald-600">Index</span>
                            </h2>
                            <button
                                onClick={() => setSelectedBooking(null)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all text-slate-400"
                            >
                                <LayoutGrid size={18} />
                            </button>
                        </div>
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs font-bold focus:outline-none focus:border-emerald-500/50"
                                placeholder="Search index..."
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                        {filteredBookings.map(booking => (
                            <button
                                key={booking.id}
                                onClick={() => setSelectedBooking(booking)}
                                className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 group ${
                                    selectedBooking?.id === booking.id
                                        ? 'bg-emerald-600 border-emerald-500 shadow-xl shadow-emerald-500/20 text-white translate-x-2'
                                        : 'bg-white dark:bg-white/5 border-slate-100 dark:border-white/10 hover:border-emerald-500/30 text-slate-900 dark:text-white shadow-sm'
                                }`}
                            >
                                <div className="text-[9px] font-black uppercase opacity-60 mb-1">
                                    {formatDisplayId(booking.bookingId)}
                                </div>
                                <div className="text-sm font-black italic tracking-tighter uppercase mb-1 truncate">
                                    {booking.customerName}
                                </div>
                                <div
                                    className={`text-[9px] font-bold ${selectedBooking?.id === booking.id ? 'text-white/80' : 'text-slate-500'} flex items-center gap-2`}
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    {booking.status?.replace('_', ' ')}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Detail Content */}
                <div className="h-full flex flex-col overflow-y-auto no-scrollbar bg-slate-50 dark:bg-[#08090b]">
                    <div className="p-10">
                        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between items-start gap-8">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-[2rem] bg-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-600/20">
                                    <ShoppingBag size={40} className="text-white" />
                                </div>
                                <div>
                                    <div className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.4em] mb-2 flex items-center gap-2">
                                        <span className="w-4 h-[2px] bg-emerald-500 rounded-full" />
                                        Fulfillment Profile
                                    </div>
                                    <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase leading-none">
                                        {selectedBooking.customerName}
                                    </h1>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="bg-emerald-500/10 px-4 py-2 rounded-2xl border border-emerald-500/20 text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                                    STATUS: {selectedBooking.status}
                                </div>
                            </div>
                        </div>

                        {/* Order Details Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Vehicle Card */}
                            <div className="bg-white dark:bg-white/5 rounded-[2.5rem] p-10 border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-5 transition-transform duration-700 group-hover:scale-110">
                                    <Bike size={120} />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="p-3 bg-indigo-500/10 rounded-2xl">
                                            <Zap size={24} className="text-indigo-500" />
                                        </div>
                                        <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white">
                                            Vehicle Specifications
                                        </h3>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-white/5">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                Model Name
                                            </span>
                                            <span className="text-sm font-black text-slate-900 dark:text-white uppercase italic">
                                                {selectedBooking.vehicleDetails?.name}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-white/5">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                Chassis Number
                                            </span>
                                            <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                                                {selectedBooking.vehicleDetails?.chassis || 'PENDING'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center py-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                Delivery Schedule
                                            </span>
                                            <span className="text-sm font-black text-emerald-500 uppercase flex items-center gap-2">
                                                <Calendar size={14} />
                                                ESTIMATED SOON
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Commercials Card */}
                            <div className="bg-white dark:bg-white/5 rounded-[2.5rem] p-10 border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-5">
                                    <CreditCard size={120} />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="p-3 bg-emerald-500/10 rounded-2xl">
                                            <CreditCard size={24} className="text-emerald-500" />
                                        </div>
                                        <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white">
                                            Commercial Settlement
                                        </h3>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-white/5">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                Total Contract Value
                                            </span>
                                            <span className="text-2xl font-black text-emerald-600">
                                                ₹{selectedBooking.totalAmount?.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-white/5">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                Payment Status
                                            </span>
                                            <span
                                                className={`text-[10px] font-black px-3 py-1 rounded-full border ${selectedBooking.paymentStatus === 'PAID' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'} uppercase tracking-widest`}
                                            >
                                                {selectedBooking.paymentStatus || 'UNPAID'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center py-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                Booking Source
                                            </span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                                APP_MOBILE_V1
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Accessories Card */}
                            <div className="lg:col-span-2 bg-white dark:bg-white/5 rounded-[2.5rem] p-10 border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden group">
                                <div className="flex items-center gap-4 mb-10">
                                    <div className="p-3 bg-purple-500/10 rounded-2xl">
                                        <Package size={24} className="text-purple-500" />
                                    </div>
                                    <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white">
                                        Included Accessories Inventory
                                    </h3>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    {selectedBooking.accessories?.map((acc: string, idx: number) => (
                                        <div
                                            key={idx}
                                            className="flex flex-col gap-3 p-6 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-3xl group/acc transition-all hover:border-purple-500/30"
                                        >
                                            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover/acc:text-purple-500 transition-colors">
                                                <Package size={18} />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 leading-tight">
                                                {acc}
                                            </span>
                                        </div>
                                    )) || (
                                        <div className="col-span-4 text-center py-12 text-slate-400 text-[10px] font-black uppercase tracking-widest bg-slate-50 dark:bg-white/[0.02] rounded-3xl border border-dashed border-slate-200 dark:border-white/10">
                                            NO_ADDITIONAL_ACCESSORIES_CONFIGURED
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </MasterListDetailLayout>
        </div>
    );
}
