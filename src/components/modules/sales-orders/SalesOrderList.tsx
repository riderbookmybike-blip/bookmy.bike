'use client';

import React from 'react';
import { MockOrder } from '@/lib/dataStore';
import { Search } from 'lucide-react';

interface SalesOrderListProps {
    orders: MockOrder[];
    selectedId: string | null;
    onSelect: (order: MockOrder) => void;
}

export default function SalesOrderList({ orders, selectedId, onSelect }: SalesOrderListProps) {
    return (
        <div className="h-full flex flex-col bg-white border-r border-gray-200">
            {/* Header / Search */}
            <div className="p-4 border-b border-gray-200 space-y-3">
                <h2 className="font-bold text-gray-700">Sales Orders</h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search Orders..."
                        className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                <div className="divide-y divide-gray-100">
                    {orders.map(order => {
                        const isSelected = order.id === selectedId;
                        return (
                            <div
                                key={order.id}
                                onClick={() => onSelect(order)}
                                className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : 'border-l-4 border-transparent'}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`font-mono font-bold text-xs ${isSelected ? 'text-blue-700' : 'text-gray-500'}`}>{order.displayId}</span>
                                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${order.status === 'CONVERTED' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                                        {order.status}
                                    </span>
                                </div>
                                <h4 className="font-medium text-gray-900 text-sm truncate">{order.customer}</h4>
                                <div className="text-xs text-gray-500 mt-1 truncate flex items-center gap-1">
                                    <span className="opacity-75">Ref:</span>
                                    <span className="font-mono text-[10px]">{order.quoteDisplayId}</span>
                                </div>
                                <p className="text-xs font-mono font-medium text-gray-700 mt-2">₹{order.price.toLocaleString()}</p>
                            </div>
                        );
                    })}
                    {orders.length === 0 && (
                        <div className="p-8 text-center text-gray-400 text-sm">
                            <p>No orders found.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
