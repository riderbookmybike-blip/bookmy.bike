'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useTenant } from '@/lib/tenant/tenantContext';
import { getBookings } from '@/actions/crm';
import { createClient } from '@/lib/supabase/client';
import MasterListDetailLayout from '@/components/templates/MasterListDetailLayout';
import StatsHeader from '@/components/modules/shared/StatsHeader';
import ModuleLanding from '@/components/modules/shared/ModuleLanding';
import BookingEditorWrapper from '@/components/modules/bookings/BookingEditorWrapper';
import {
    ShoppingBag,
    CreditCard,
    Landmark,
    FileCheck,
    ShieldCheck,
    Truck,
    LayoutGrid,
    Search as SearchIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDisplayId } from '@/utils/displayId';
import { useBreakpoint } from '@/hooks/useBreakpoint';

export interface SalesOrder {
    id: string;
    displayId: string;
    customerName: string;
    productName: string;
    price: number;
    status: string;
    currentStage?: string | null;
    date: string;
    vehicleBrand: string;
    vehicleModel: string;
    vehicleVariant: string;
    vehicleColor: string;
}

export default function SalesOrdersPage({ initialOrderId }: { initialOrderId?: string }) {
    const { tenantId } = useTenant();
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const slug = typeof params?.slug === 'string' ? params.slug : Array.isArray(params?.slug) ? params.slug[0] : '';
    const stageParam = (searchParams?.get('stage') || '').toUpperCase();
    const { device } = useBreakpoint();

    const [orders, setOrders] = useState<SalesOrder[]>([]);
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(initialOrderId || null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [view, setView] = useState<'grid' | 'list'>('list');

    const fetchOrders = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getBookings(tenantId);
            const mapped = (data || []).map((b: any) => ({
                id: b.id,
                displayId: b.displayId || b.display_id || formatDisplayId(b.id),
                customerName: b.customer || b.customer_name || 'N/A',
                productName: [b.brand, b.model, b.variant].filter(Boolean).join(' '),
                price: Number(b.price || 0),
                status: b.status || 'BOOKED',
                currentStage: b.currentStage || b.current_stage || null,
                date: b.date || (b.created_at ? String(b.created_at).split('T')[0] : ''),
                vehicleBrand: b.brand || '',
                vehicleModel: b.model || '',
                vehicleVariant: b.variant || '',
                vehicleColor: b.color || '',
            }));
            setOrders(mapped);
        } catch (error) {
            console.error('Failed to fetch bookings:', error);
            toast.error('Failed to load sales orders');
        } finally {
            setIsLoading(false);
        }
    }, [tenantId]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // Realtime updates
    useEffect(() => {
        const supabase = createClient();
        const channel = supabase
            .channel('sales-orders-live')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'crm_bookings', filter: `tenant_id=eq.${tenantId}` },
                () => {
                    fetchOrders();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [tenantId, fetchOrders]);

    useEffect(() => {
        if (initialOrderId) {
            setSelectedOrderId(initialOrderId);
        }
    }, [initialOrderId]);

    const stageFilteredOrders = useMemo(() => {
        if (!stageParam || stageParam === 'ALL') return orders;
        return orders.filter(o => (o.currentStage || o.status || '').toUpperCase() === stageParam);
    }, [orders, stageParam]);

    const filteredOrders = useMemo(
        () =>
            stageFilteredOrders.filter(
                o =>
                    o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    formatDisplayId(o.displayId).toLowerCase().includes(searchQuery.toLowerCase())
            ),
        [stageFilteredOrders, searchQuery]
    );

    const stageTitleMap: Record<string, { title: string; subtitle: string }> = {
        BOOKING: { title: 'Sales Orders', subtitle: 'Booking Pipeline' },
        PAYMENT: { title: 'Payments', subtitle: 'Receipt Workflow' },
        FINANCE: { title: 'Finance', subtitle: 'Loan Processing' },
        ALLOTMENT: { title: 'Allotment', subtitle: 'Vehicle Assignment' },
        COMPLIANCE: { title: 'Compliance', subtitle: 'Regulatory Tasks' },
        DELIVERED: { title: 'Delivery', subtitle: 'Handovers & Completion' },
        PDI: { title: 'PDI', subtitle: 'Pre-Delivery Inspection' },
        INSURANCE: { title: 'Insurance', subtitle: 'Policy & Coverage' },
        REGISTRATION: { title: 'Registration', subtitle: 'RTO Workflow' },
        FEEDBACK: { title: 'Feedback', subtitle: 'Post-Delivery Review' },
    };

    const stageTitle = stageTitleMap[stageParam]?.title || 'Sales Orders';
    const stageSubtitle = stageTitleMap[stageParam]?.subtitle || 'Booking Pipeline';

    const statsBase = stageFilteredOrders;
    const stats = [
        { label: 'Total Orders', value: statsBase.length, icon: ShoppingBag, color: 'indigo' as const, trend: '+4.1%' },
        {
            label: 'Payments',
            value: statsBase.filter(o => (o.status || '').toUpperCase() === 'PAID').length,
            icon: CreditCard,
            color: 'emerald' as const,
            trend: 'On Track',
        },
        {
            label: 'Finance',
            value: statsBase.filter(o => (o.status || '').toUpperCase() === 'FINANCE').length,
            icon: Landmark,
            color: 'amber' as const,
        },
        {
            label: 'Compliance',
            value: statsBase.filter(o => (o.status || '').toUpperCase() === 'COMPLIANCE').length,
            icon: ShieldCheck,
            color: 'blue' as const,
        },
        {
            label: 'Delivery',
            value: statsBase.filter(o => (o.status || '').toUpperCase() === 'DELIVERED').length,
            icon: Truck,
            color: 'rose' as const,
        },
    ];

    const handleOpenOrder = (orderId: string) => {
        setSelectedOrderId(orderId);
        if (slug) {
            const stageQuery = stageParam ? `?stage=${stageParam}` : '';
            router.push(`/app/${slug}/sales-orders/${orderId}${stageQuery}`);
        }
    };

    const handleCloseDetail = () => {
        setSelectedOrderId(null);
        if (slug) {
            const stageQuery = stageParam ? `?stage=${stageParam}` : '';
            router.push(`/app/${slug}/sales-orders${stageQuery}`);
        }
    };

    const statusFilters = [
        { label: 'ALL', value: 'ALL' },
        { label: 'BOOKED', value: 'BOOKED' },
        { label: 'FINANCE', value: 'FINANCE' },
        { label: 'INSURANCE', value: 'INSURANCE' },
        { label: 'REGISTRATION', value: 'REGISTRATION' },
        { label: 'COMPLIANCE', value: 'COMPLIANCE' },
        { label: 'DELIVERED', value: 'DELIVERED' },
    ];

    if (!selectedOrderId) {
        return (
            <div className="h-full bg-slate-50 dark:bg-[#0b0d10] -m-6 md:-m-8">
                <ModuleLanding
                    title={stageTitle}
                    subtitle={stageSubtitle}
                    onNew={() => toast.info('Create Sales Order from Quote')}
                    searchPlaceholder={`Search ${stageTitle}...`}
                    onSearch={setSearchQuery}
                    statsContent={<StatsHeader stats={stats} device={device} />}
                    view={view}
                    onViewChange={setView}
                    device={device}
                >
                    {view === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                            {filteredOrders.map(order => (
                                <div
                                    key={order.id}
                                    onClick={() => handleOpenOrder(order.id)}
                                    className="group relative bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-500/30 overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                                                {formatDisplayId(order.displayId)}
                                            </div>
                                            <div className="text-indigo-600 font-black text-sm italic tracking-tighter">
                                                ₹{order.price.toLocaleString()}
                                            </div>
                                        </div>

                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase mb-2 truncate group-hover:text-indigo-600 transition-colors">
                                            {order.customerName}
                                        </h3>

                                        <div className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-tighter truncate mb-6">
                                            {[order.vehicleBrand, order.vehicleModel, order.vehicleVariant]
                                                .filter(Boolean)
                                                .join(' ')}
                                            {order.vehicleColor ? ` • ${order.vehicleColor}` : ''}
                                        </div>

                                        <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-white/5">
                                            <div className="px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest bg-slate-100 dark:bg-white/5 text-slate-400">
                                                {order.status}
                                            </div>
                                            <div className="text-[9px] font-bold text-slate-400">{order.date}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : device === 'phone' ? (
                        <div className="space-y-2 pb-4">
                            <div className="overflow-x-auto no-scrollbar -mx-4 px-4 mb-1.5">
                                <div className="flex items-center gap-2 min-w-fit">
                                    {statusFilters.map(filter => {
                                        const active = (stageParam || 'ALL') === filter.value;
                                        return (
                                            <button
                                                key={filter.value}
                                                onClick={() => {
                                                    const query =
                                                        filter.value === 'ALL' ? '' : `?stage=${filter.value}`;
                                                    if (slug) router.push(`/app/${slug}/sales-orders${query}`);
                                                }}
                                                className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors ${
                                                    active
                                                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm shadow-indigo-500/30'
                                                        : 'bg-white dark:bg-white/5 text-slate-500 border-slate-200 dark:border-white/10'
                                                }`}
                                            >
                                                {filter.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            {filteredOrders.map(order => {
                                const isActive = selectedOrderId === order.id;
                                const statusColor =
                                    order.status === 'BOOKED' || order.status === 'DELIVERED'
                                        ? 'emerald'
                                        : order.status === 'PENDING_CORPORATE'
                                          ? 'amber'
                                          : 'indigo';
                                return (
                                    <button
                                        key={order.id}
                                        onClick={() => handleOpenOrder(order.id)}
                                        className="w-full text-left bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm active:scale-[0.98] transition-all min-h-[56px]"
                                    >
                                        <div className="flex">
                                            <div
                                                className={`w-1 shrink-0 ${
                                                    statusColor === 'emerald'
                                                        ? 'bg-emerald-500'
                                                        : statusColor === 'amber'
                                                          ? 'bg-amber-500'
                                                          : 'bg-indigo-500'
                                                }`}
                                            />
                                            <div className="flex-1 px-3.5 py-3 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                                                        {formatDisplayId(order.displayId)}
                                                    </span>
                                                    <div className="flex items-center gap-1.5">
                                                        {isActive && (
                                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                                        )}
                                                        <span
                                                            className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                                                                statusColor === 'emerald'
                                                                    ? 'bg-emerald-500/10 text-emerald-600'
                                                                    : statusColor === 'amber'
                                                                      ? 'bg-amber-500/10 text-amber-600'
                                                                      : 'bg-indigo-500/10 text-indigo-600'
                                                            }`}
                                                        >
                                                            {order.status}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-[13px] font-black text-slate-900 dark:text-white uppercase tracking-tight truncate mb-1">
                                                    {order.customerName}
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-bold text-slate-400 truncate max-w-[60%]">
                                                        {[order.vehicleBrand, order.vehicleModel, order.vehicleVariant]
                                                            .filter(Boolean)
                                                            .join(' ')}
                                                    </span>
                                                    <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 tabular-nums">
                                                        ₹{order.price.toLocaleString('en-IN')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-white/5">
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Order ID
                                        </th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Customer
                                        </th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Product
                                        </th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Value (INR)
                                        </th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrders.map(order => (
                                        <tr
                                            key={order.id}
                                            onClick={() => handleOpenOrder(order.id)}
                                            className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer border-b border-slate-50 dark:border-white/5 last:border-0"
                                        >
                                            <td className="p-6">
                                                <div className="text-xs font-black text-indigo-500 uppercase tracking-widest">
                                                    {formatDisplayId(order.displayId)}
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="text-sm font-black italic uppercase tracking-tighter text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                                                    {order.customerName}
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase">
                                                    {[order.vehicleBrand, order.vehicleModel, order.vehicleVariant]
                                                        .filter(Boolean)
                                                        .join(' ')}
                                                    {order.vehicleColor ? (
                                                        <span className="text-slate-400"> • {order.vehicleColor}</span>
                                                    ) : (
                                                        ''
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="text-sm font-black text-indigo-600">
                                                    ₹{order.price.toLocaleString()}
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest inline-block bg-slate-100 dark:bg-white/5 text-slate-400">
                                                    {order.status}
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

    return (
        <div className="h-full bg-slate-50 dark:bg-slate-950 flex overflow-hidden font-sans -m-6 md:-m-8">
            <MasterListDetailLayout
                mode="list-detail"
                listPosition="left"
                device={device}
                hasActiveDetail={!!selectedOrderId}
                onBack={handleCloseDetail}
            >
                <div className="h-full flex flex-col bg-white dark:bg-[#0b0d10] border-r border-slate-200 dark:border-white/5 w-full">
                    <div className="p-6 border-b border-slate-100 dark:border-white/5 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white">
                                {stageTitle} <span className="text-indigo-600">Index</span>
                            </h2>
                            <button
                                onClick={handleCloseDetail}
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
                                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs font-bold focus:outline-none focus:border-indigo-500/50"
                                placeholder={`Search ${stageTitle.toLowerCase()}...`}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-1.5 no-scrollbar">
                        {isLoading && filteredOrders.length === 0 && (
                            <>
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div
                                        key={i}
                                        className="w-full rounded-xl border border-slate-100 dark:border-white/[0.06] bg-white dark:bg-white/[0.03] overflow-hidden"
                                        style={{ animationDelay: `${i * 80}ms` }}
                                    >
                                        <div className="flex">
                                            <div className="w-1 shrink-0 bg-slate-200 dark:bg-white/10 animate-pulse" />
                                            <div className="flex-1 px-3.5 py-3 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div
                                                        className="w-16 h-2.5 bg-slate-200 dark:bg-white/10 rounded animate-pulse"
                                                        style={{ animationDelay: `${i * 80}ms` }}
                                                    />
                                                    <div
                                                        className="w-12 h-2.5 bg-slate-100 dark:bg-white/5 rounded animate-pulse"
                                                        style={{ animationDelay: `${i * 80 + 40}ms` }}
                                                    />
                                                </div>
                                                <div
                                                    className={`h-3.5 bg-slate-200 dark:bg-white/10 rounded-lg animate-pulse`}
                                                    style={{
                                                        width: `${60 + (i % 3) * 20}%`,
                                                        animationDelay: `${i * 80 + 80}ms`,
                                                    }}
                                                />
                                                <div className="flex items-center justify-between">
                                                    <div
                                                        className="w-24 h-2.5 bg-slate-100 dark:bg-white/5 rounded animate-pulse"
                                                        style={{ animationDelay: `${i * 80 + 120}ms` }}
                                                    />
                                                    <div
                                                        className="w-14 h-3 bg-slate-200 dark:bg-white/10 rounded animate-pulse"
                                                        style={{ animationDelay: `${i * 80 + 160}ms` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                        {filteredOrders.map(order => {
                            const isActive = selectedOrderId === order.id;
                            const statusColor =
                                order.status === 'BOOKED' || order.status === 'DELIVERED'
                                    ? 'emerald'
                                    : order.status === 'PENDING_CORPORATE'
                                      ? 'amber'
                                      : 'indigo';
                            return (
                                <button
                                    key={order.id}
                                    onClick={() => handleOpenOrder(order.id)}
                                    className={`w-full text-left rounded-xl border transition-all duration-300 group overflow-hidden ${
                                        isActive
                                            ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-500/20 text-white'
                                            : 'bg-white dark:bg-white/[0.03] border-slate-100 dark:border-white/[0.06] hover:border-indigo-500/30 text-slate-900 dark:text-white hover:shadow-md'
                                    }`}
                                >
                                    <div className="flex">
                                        <div
                                            className={`w-1 shrink-0 ${
                                                isActive
                                                    ? 'bg-white/30'
                                                    : statusColor === 'emerald'
                                                      ? 'bg-emerald-500'
                                                      : statusColor === 'amber'
                                                        ? 'bg-amber-500'
                                                        : 'bg-indigo-500'
                                            }`}
                                        />
                                        <div className="flex-1 px-3.5 py-3 min-w-0">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span
                                                    className={`text-[9px] font-black uppercase tracking-wider ${isActive ? 'text-white/70' : 'text-slate-400'}`}
                                                >
                                                    {formatDisplayId(order.displayId)}
                                                </span>
                                                <span
                                                    className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                                                        isActive
                                                            ? 'bg-white/20 text-white'
                                                            : statusColor === 'emerald'
                                                              ? 'bg-emerald-500/10 text-emerald-600'
                                                              : statusColor === 'amber'
                                                                ? 'bg-amber-500/10 text-amber-600'
                                                                : 'bg-indigo-500/10 text-indigo-600'
                                                    }`}
                                                >
                                                    {order.status}
                                                </span>
                                            </div>
                                            <div
                                                className={`text-[12px] font-black tracking-tight uppercase truncate mb-0.5 ${isActive ? 'text-white' : 'text-slate-800 dark:text-white'}`}
                                            >
                                                {order.customerName}
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span
                                                    className={`text-[10px] font-bold truncate ${isActive ? 'text-white/70' : 'text-slate-400'}`}
                                                >
                                                    {order.vehicleBrand
                                                        ? [order.vehicleBrand, order.vehicleModel, order.vehicleVariant]
                                                              .filter(Boolean)
                                                              .join(' ')
                                                        : order.productName || '—'}
                                                </span>
                                                <span
                                                    className={`text-[10px] font-black tabular-nums shrink-0 ml-2 ${isActive ? 'text-white' : 'text-slate-700 dark:text-slate-300'}`}
                                                >
                                                    ₹{Number(order.price).toLocaleString('en-IN')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="h-full flex flex-col overflow-y-auto no-scrollbar bg-slate-50 dark:bg-[#08090b]">
                    <BookingEditorWrapper
                        bookingId={selectedOrderId}
                        onClose={handleCloseDetail}
                        onRefresh={fetchOrders}
                    />
                </div>
            </MasterListDetailLayout>
        </div>
    );
}
