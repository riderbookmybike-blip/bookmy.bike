'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    ShoppingBag,
    Plus,
    Search,
    Truck,
    ChevronRight,
    Clock,
    CheckCircle2,
    XCircle,
    Package,
    Calendar,
    Loader2,
    Building2,
    MapPin,
    Hash
} from 'lucide-react';
import { useTenant } from '@/lib/tenant/tenantContext';
import { format } from 'date-fns';
import CreatePOModal from './components/CreatePOModal';

interface POItem {
    id: string;
    sku_id: string;
    ordered_qty: number;
    received_qty: number;
    vehicle_colors: {
        name: string;
        vehicle_variants: {
            name: string;
            vehicle_models: {
                name: string;
                brands: {
                    name: string;
                }
            }
        }
    }
}

interface PurchaseOrder {
    id: string;
    order_number: string;
    vendor_name: string;
    status: string;
    transporter_name: string;
    docket_number: string;
    expected_date: string;
    created_at: string;
    items: POItem[];
}

export default function OrdersPage() {
    const supabase = createClient();
    const { tenantId } = useTenant();
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (tenantId) {
            fetchOrders();
        }
    }, [tenantId, statusFilter]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('purchase_orders')
                .select(`
                    *,
                    items:purchase_order_items (
                        *,
                        vehicle_colors (
                            name,
                            vehicle_variants (
                                name,
                                vehicle_models (
                                    name,
                                    brands (name)
                                )
                            )
                        )
                    )
                `)
                .order('created_at', { ascending: false });

            if (statusFilter !== 'ALL') {
                query = query.eq('status', statusFilter);
            }

            const { data, error } = await query;
            if (error) throw error;
            setOrders(data || []);
        } catch (err) {
            console.error('Error fetching orders:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toUpperCase()) {
            case 'DRAFT': return 'bg-slate-100 text-slate-700 dark:bg-white/5 border-slate-200';
            case 'ORDERED': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200';
            case 'COMPLETED': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200';
            default: return 'bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-slate-400 border-slate-200';
        }
    };

    const filteredOrders = orders.filter(po => {
        const query = searchQuery.toLowerCase();
        return (
            po.order_number.toLowerCase().includes(query) ||
            po.vendor_name?.toLowerCase().includes(query) ||
            po.docket_number?.toLowerCase().includes(query)
        );
    });

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <ShoppingBag className="text-indigo-500" size={32} />
                        PURCHASE ORDERS
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mt-1 uppercase tracking-wider">
                        Manage vendor supply and track inbound shipments
                    </p>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-lg shadow-indigo-500/25 active:scale-95 uppercase tracking-wide shrink-0 transition-transform"
                >
                    <Plus size={18} strokeWidth={3} />
                    Create New PO
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                            <Truck size={24} />
                        </div>
                        <span className="text-[10px] font-black text-blue-500 uppercase">In Transit</span>
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">
                        {orders.filter(o => o.status === 'ORDERED').length}
                    </div>
                    <p className="text-xs font-bold text-slate-500 uppercase mt-1">Active Shipments</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white/50 dark:bg-slate-900/30 backdrop-blur-xl border border-slate-200 dark:border-white/10 p-4 rounded-3xl flex flex-col md:flex-row items-center gap-4">
                <div className="relative flex-1 group w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500" size={18} />
                    <input
                        type="text"
                        placeholder="SEARCH BY PO NUMBER, VENDOR, OR DOCKET..."
                        className="w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-2xl py-3 pl-12 pr-4 text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest placeholder:text-slate-400/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none w-full md:w-auto">
                    {['ALL', 'DRAFT', 'ORDERED', 'COMPLETED'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border
                                ${statusFilter === status
                                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent'
                                    : 'bg-white dark:bg-slate-800/50 text-slate-500 border-slate-200 dark:border-white/5'}`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="animate-spin text-indigo-500" size={40} />
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Scanning Purchase Ledger...</span>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-6 text-center px-6">
                        <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-300">
                            <ShoppingBag size={40} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">No Purchase Orders</h3>
                            <p className="text-xs font-bold text-slate-500 uppercase mt-2">Generate a PO to restock your inventory or fulfill requisitions.</p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/2">
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Info</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendor & Logistics</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Items</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map((po) => (
                                    <tr key={po.id} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/2 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tighter">{po.order_number}</span>
                                                <div className="flex items-center gap-1.5 text-slate-400">
                                                    <Calendar size={12} />
                                                    <span className="text-[10px] font-bold">{format(new Date(po.created_at), 'dd MMM yyyy')}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-2">
                                                    <Building2 size={12} className="text-indigo-500" />
                                                    <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase">{po.vendor_name || 'N/A'}</span>
                                                </div>
                                                {po.docket_number && (
                                                    <div className="flex items-center gap-2">
                                                        <Truck size={12} className="text-emerald-500" />
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">#{po.docket_number} • {po.transporter_name}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase uppercase tracking-tight">
                                                    {po.items.length} Product Models
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-500 uppercase">
                                                    Total Qty: {po.items.reduce((sum, i) => sum + i.ordered_qty, 0)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1.5 rounded-full text-[10px] font-black border uppercase tracking-widest ${getStatusColor(po.status)}`}>
                                                {po.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 text-slate-400 hover:text-indigo-600 rounded-xl transition-all">
                                                <ChevronRight size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <CreatePOModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchOrders}
                tenantId={tenantId || ''}
            />
        </div>
    );
}
