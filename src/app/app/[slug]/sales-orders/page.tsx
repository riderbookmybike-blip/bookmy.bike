'use client';

import React, { useState, useEffect } from 'react';
import SalesOrderList from '@/components/modules/sales-orders/SalesOrderList';
import SalesOrderDetail from '@/components/modules/sales-orders/SalesOrderDetail';
import { MockOrder } from '@/lib/aums/dataStore';
import { Button } from '@/components/ui/button';
import { getBookings, updateBookingStage } from '@/actions/crm';
import {
    ShoppingBag,
    Truck,
    CreditCard,
    FileCheck,
    ShieldCheck,
    ArrowRight,
    Loader2
} from 'lucide-react';

export default function SalesOrdersPage() {
    const [orders, setOrders] = useState<MockOrder[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<MockOrder | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const data = await getBookings();
            setOrders(data);
            if (data.length > 0 && !selectedOrder) {
                setSelectedOrder(data[0]);
            }
        } catch (error) {
            console.error('Failed to fetch bookings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleCreateBooking = async (orderId: string) => {
        try {
            // If it's already a booking, we might just be moving to next stage
            await updateBookingStage(orderId, 'FINANCE', { status: 'BOOKED' });
            fetchOrders();
        } catch (error) {
            console.error('Failed to update booking:', error);
        }
    };

    if (isLoading) {
        return (
        <div className="flex h-[calc(100vh-140px)] items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading Orders...</p>
                </div>
            </div>
        );
    }

    const stages = [
        { id: 'BOOKING', label: 'Booking', count: orders.filter(o => o.status === 'BOOKED' || o.status === 'DRAFT').length, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
        { id: 'FINANCE', label: 'Finance', count: orders.filter(o => o.currentStage === 'FINANCE').length, icon: CreditCard, color: 'text-amber-600', bg: 'bg-amber-50' },
        { id: 'ALLOTMENT', label: 'Allotment', count: orders.filter(o => o.currentStage === 'ALLOTMENT').length, icon: FileCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { id: 'PDI', label: 'PDI', count: orders.filter(o => o.currentStage === 'PDI').length, icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { id: 'DELIVERY', label: 'Delivery', count: orders.filter(o => o.currentStage === 'DELIVERY').length, icon: Truck, color: 'text-purple-600', bg: 'bg-purple-50' },
    ];

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] gap-6">
            {/* Top Pipeline Stats */}
            <div className="grid grid-cols-5 gap-4">
                {stages.map((stage, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${stage.bg} ${stage.color}`}>
                            <stage.icon size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stage.label}</p>
                            <p className="text-xl font-black text-slate-900 dark:text-white">{stage.count}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex-1 flex bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
                {/* Left Panel: List */}
                <div className="w-85 flex-shrink-0 border-r border-slate-200 dark:border-white/10">
                    <SalesOrderList
                        orders={orders}
                        selectedId={selectedOrder?.id || null}
                        onSelect={setSelectedOrder}
                    />
                </div>

                {/* Right Panel: Details */}
                <div className="flex-1 flex flex-col bg-slate-50/30 dark:bg-black/20">
                    {selectedOrder ? (
                        <>
                            {/* Header */}
                            <div className="bg-white dark:bg-slate-900 p-6 border-b border-slate-200 dark:border-white/10">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Order {selectedOrder.displayId}</h1>
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border uppercase tracking-widest ${selectedOrder.status === 'CONVERTED' || selectedOrder.status === 'BOOKED' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20' :
                                                'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20'
                                                }`}>
                                                {selectedOrder.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                                            Linked to Quote <span className="text-indigo-600 font-mono">{selectedOrder.quoteDisplayId}</span>
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" className="rounded-xl font-bold text-xs gap-2">
                                            Print Order
                                        </Button>
                                        <Button className="rounded-xl font-bold text-xs gap-2 bg-indigo-600 hover:bg-indigo-700">
                                            Manage Fulfillment <ArrowRight size={14} />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Multi-stage Progress Tracker */}
                            <div className="bg-white dark:bg-slate-900 px-8 py-6 border-b border-slate-100 dark:border-white/10">
                                <div className="flex items-center justify-between relative">
                                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 dark:bg-white/10 -translate-y-1/2 z-0" />
                                    {['Booking', 'Finance', 'Allotment', 'PDI', 'Delivery'].map((step, i) => {
                                        const stageList = ['BOOKING', 'FINANCE', 'ALLOTMENT', 'PDI', 'DELIVERY'];
                                        const currentStageIndex = stageList.indexOf(selectedOrder.currentStage || 'BOOKING');
                                        const isCompleted = i < currentStageIndex;
                                        const isCurrent = i === currentStageIndex;

                                        return (
                                            <div key={i} className="relative z-10 flex flex-col items-center gap-2">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 ${isCompleted ? 'bg-emerald-500 border-emerald-100 text-white' :
                                                    isCurrent ? 'bg-white dark:bg-slate-900 border-indigo-600 text-indigo-600' :
                                                        'bg-white dark:bg-slate-900 border-slate-100 dark:border-white/10 text-slate-300'
                                                    }`}>
                                                    {isCompleted ? <FileCheck size={14} /> : <span className="text-xs font-black">{i + 1}</span>}
                                                </div>
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${isCurrent ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>{step}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 overflow-y-auto p-8">
                                <div className="max-w-4xl">
                                    <SalesOrderDetail
                                        order={selectedOrder}
                                        onClose={() => setSelectedOrder(null)}
                                        onCreateBooking={handleCreateBooking}
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-3xl flex items-center justify-center shadow-xl border border-slate-100 dark:border-white/10 mb-6">
                                <ShoppingBag className="text-slate-300" size={32} />
                            </div>
                            <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Select an Order</h2>
                            <p className="text-slate-400 dark:text-slate-500 text-sm font-medium mt-1 max-w-xs">
                                Choose a sales order to track its fulfillment progress across payment, allotment, and delivery stages.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
