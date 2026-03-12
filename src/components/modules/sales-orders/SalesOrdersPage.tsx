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
    ChevronRight,
    User,
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

type BookingDetailTab = 'DYNAMIC' | 'FINANCE' | 'MEMBER' | 'TASKS' | 'DOCUMENTS' | 'TIMELINE' | 'NOTES' | 'HISTORY';

export default function SalesOrdersPage({
    initialOrderId,
    initialDetailTab = 'DYNAMIC',
}: {
    initialOrderId?: string;
    initialDetailTab?: BookingDetailTab;
}) {
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
            toast.error('Failed to load bookings');
        } finally {
            setIsLoading(false);
        }
    }, [tenantId]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

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
        if (initialOrderId) setSelectedOrderId(initialOrderId);
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
        BOOKING: { title: 'Bookings Index', subtitle: 'Pipeline' },
        PAYMENT: { title: 'Payments Registry', subtitle: 'Finance' },
        FINANCE: { title: 'Finance Center', subtitle: 'Underwriting' },
        ALLOTMENT: { title: 'Allotment Hub', subtitle: 'Inventory' },
        DELIVERED: { title: 'Delivery Log', subtitle: 'Handovers' },
    };

    const stageTitle = stageTitleMap[stageParam]?.title || 'Sales Orders';
    const stageSubtitle = stageTitleMap[stageParam]?.subtitle || 'ORDER_COLLECTION';

    const stats = [
        {
            label: 'Total Orders',
            value: stageFilteredOrders.length,
            icon: ShoppingBag,
            color: 'indigo' as const,
            trend: '+4.1%',
        },
        {
            label: 'Payments',
            value: stageFilteredOrders.filter(o => o.status === 'PAID').length,
            icon: CreditCard,
            color: 'emerald' as const,
        },
        {
            label: 'Finance',
            value: stageFilteredOrders.filter(o => o.status === 'FINANCE').length,
            icon: Landmark,
            color: 'amber' as const,
        },
        {
            label: 'Compliance',
            value: stageFilteredOrders.filter(o => o.status === 'COMPLIANCE').length,
            icon: ShieldCheck,
            color: 'blue' as const,
        },
        {
            label: 'Delivery',
            value: stageFilteredOrders.filter(o => o.status === 'DELIVERED').length,
            icon: Truck,
            color: 'rose' as const,
        },
    ];

    const handleOpenOrder = (orderId: string) => {
        setSelectedOrderId(orderId);
        if (slug) router.push(`/app/${slug}/sales-orders/${orderId}`);
    };

    const handleCloseDetail = () => {
        setSelectedOrderId(null);
        if (slug) {
            const stageQuery = stageParam ? `?stage=${stageParam}` : '';
            router.push(`/app/${slug}/sales-orders${stageQuery}`);
        }
    };

    const effectiveView = device === 'phone' ? 'list' : view;

    if (!selectedOrderId) {
        return (
            <div className="h-full bg-[#f8fafc]">
                <ModuleLanding
                    title={stageTitle}
                    subtitle={stageSubtitle}
                    onNew={() => toast.info('Initiate from Quotes module')}
                    searchPlaceholder={`Search ${stageTitle}...`}
                    onSearch={setSearchQuery}
                    statsContent={<StatsHeader stats={stats} device={device} />}
                    view={effectiveView}
                    onViewChange={setView}
                    device={device}
                >
                    {effectiveView === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
                            {filteredOrders.map(order => (
                                <div
                                    key={order.id}
                                    onClick={() => handleOpenOrder(order.id)}
                                    className="group bg-white border border-slate-200 rounded-xl p-5 cursor-pointer transition-all hover:shadow-lg hover:border-indigo-500/30 shadow-sm"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                                            {formatDisplayId(order.displayId)}
                                        </div>
                                        <div className="text-slate-900 font-black text-sm tabular-nums">
                                            ₹{order.price.toLocaleString()}
                                        </div>
                                    </div>
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-1 truncate">
                                        {order.customerName}
                                    </h3>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate mb-6">
                                        {[order.vehicleBrand, order.vehicleModel, order.vehicleVariant]
                                            .filter(Boolean)
                                            .join(' ')}
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                        <div className="px-2 py-0.5 rounded bg-slate-50 text-[9px] font-black uppercase text-slate-400 border border-slate-100">
                                            {order.status}
                                        </div>
                                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                            {order.date}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-200">
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                            Order ID
                                        </th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                            Entity Node
                                        </th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                            Inventory Specs
                                        </th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">
                                            Valuation
                                        </th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrders.map(order => (
                                        <tr
                                            key={order.id}
                                            onClick={() => handleOpenOrder(order.id)}
                                            className="group hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-100 last:border-0"
                                        >
                                            <td className="px-6 py-4 text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                                                {formatDisplayId(order.displayId)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                                                        <User size={14} />
                                                    </div>
                                                    <div className="text-xs font-black text-slate-900 uppercase tracking-tight">
                                                        {order.customerName}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                {[order.vehicleBrand, order.vehicleModel, order.vehicleVariant]
                                                    .filter(Boolean)
                                                    .join(' ')}
                                            </td>
                                            <td className="px-6 py-4 text-right text-xs font-black text-slate-900 tabular-nums">
                                                ₹{order.price.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="px-2.5 py-1 rounded inline-block text-[9px] font-black uppercase tracking-wider bg-slate-50 text-slate-400 border border-slate-100">
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
        <div className="h-full bg-white flex overflow-hidden font-sans">
            <MasterListDetailLayout
                mode="list-detail"
                listPosition="left"
                device={device}
                hasActiveDetail={!!selectedOrderId}
                onBack={handleCloseDetail}
            >
                <div className="h-full flex flex-col bg-[#fdfdfd] border-r border-slate-200 w-full">
                    <div className="p-4 border-b border-slate-200 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">
                                Orders <span className="text-indigo-600">Core</span>
                            </h2>
                            <button
                                onClick={handleCloseDetail}
                                className="p-1.5 hover:bg-slate-100 rounded-lg transition-all text-slate-400"
                            >
                                <LayoutGrid size={14} />
                            </button>
                        </div>
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-3 h-3" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-8 pr-4 text-[10px] font-bold text-slate-900 placeholder:text-slate-400 focus:border-indigo-500/50 shadow-sm"
                                placeholder="Search orders archive..."
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 no-scrollbar">
                        {filteredOrders.map(order => {
                            const isActive = selectedOrderId === order.id;
                            return (
                                <button
                                    key={order.id}
                                    onClick={() => handleOpenOrder(order.id)}
                                    className={`w-full text-left rounded-lg p-3 transition-all border ${isActive ? 'bg-indigo-50 border-indigo-200 text-indigo-900' : 'bg-white border-transparent hover:bg-slate-50'}`}
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span
                                            className={`text-[8px] font-black uppercase tracking-widest ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}
                                        >
                                            {formatDisplayId(order.displayId)}
                                        </span>
                                        <div
                                            className={`w-1.5 h-1.5 rounded-full ${order.status === 'DELIVERED' ? 'bg-emerald-400' : 'bg-indigo-400'}`}
                                        />
                                    </div>
                                    <div className="text-[11px] font-black text-slate-900 uppercase tracking-tight mb-1 truncate">
                                        {order.customerName}
                                    </div>
                                    <div className="flex items-center justify-between text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                        <span className="truncate max-w-[120px]">{order.vehicleModel}</span>
                                        <span className="text-slate-900 font-black tabular-nums">
                                            ₹{Math.round(order.price / 1000)}k
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
                <div className="h-full flex flex-col overflow-y-auto no-scrollbar bg-white">
                    <BookingEditorWrapper
                        bookingId={selectedOrderId}
                        onClose={handleCloseDetail}
                        onRefresh={fetchOrders}
                        defaultTab={initialDetailTab}
                    />
                </div>
            </MasterListDetailLayout>
        </div>
    );
}
