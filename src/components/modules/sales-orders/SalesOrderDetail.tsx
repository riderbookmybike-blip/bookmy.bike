'use client';

import React from 'react';
import DetailPanel from '@/components/templates/DetailPanel';
import { MockOrder } from '@/lib/dataStore';
import { User, ShoppingCart, ShoppingBag, ArrowRight } from 'lucide-react';

interface SalesOrderDetailProps {
    order: MockOrder | null;
    onClose: () => void;
    onCreateBooking: (orderId: string) => void;
}

export default function SalesOrderDetail({ order, onClose, onCreateBooking }: SalesOrderDetailProps) {
    if (!order) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-50 text-gray-500">
                <div className="text-center">
                    <p>Select an order to view details</p>
                </div>
            </div>
        );
    }

    const renderContent = (activeTab: string) => {
        switch (activeTab) {
            case 'Overview':
                return (
                    <div className="space-y-6">
                        {/* Card */}
                        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm relative overflow-hidden">
                            {/* Quote Reference Banner */}
                            <div className="absolute top-0 left-0 w-full bg-blue-50 border-b border-blue-100 px-6 py-2 flex justify-between items-center text-xs">
                                <span className="text-blue-600 font-medium flex items-center gap-2">
                                    Generated from Quote
                                </span>
                                <span className="font-mono font-bold text-blue-800">{order.quoteDisplayId}</span>
                            </div>

                            <div className="mt-8 grid grid-cols-2 gap-6">
                                <div>
                                    <span className="block text-sm text-gray-500 mb-1">Customer</span>
                                    <div className="flex items-center gap-2 font-medium text-gray-900">
                                        <User size={16} className="text-gray-400" />
                                        {order.customer}
                                    </div>
                                </div>
                                <div>
                                    <span className="block text-sm text-gray-500 mb-1">Date</span>
                                    <div className="flex items-center gap-2 font-medium text-gray-900">
                                        {order.date}
                                    </div>
                                </div>
                                <div className="col-span-2 pt-4 border-t border-gray-100">
                                    <span className="block text-sm text-gray-500 mb-1">Vehicle Specification</span>
                                    <div className="flex items-center gap-2 font-medium text-gray-900 text-lg">
                                        <ShoppingCart size={18} className="text-blue-500" />
                                        {order.brand} {order.model}
                                    </div>
                                    <div className="mt-1 ml-6 text-xs text-gray-500 w-full">
                                        {order.variant}
                                    </div>
                                </div>
                                <div className="col-span-2 pt-2">
                                    <span className="block text-sm text-gray-500 mb-1">Locked Price</span>
                                    <div className="text-3xl font-bold text-green-700 font-mono">
                                        ₹{order.price.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        {order.status === 'BOOKED' && (
                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 flex flex-col items-center text-center">
                                <ShoppingBag size={32} className="text-blue-600 mb-3" />
                                <h3 className="text-lg font-bold text-blue-900">Convert to Booking</h3>
                                <p className="text-sm text-blue-700 max-w-sm mt-1 mb-4">
                                    Proceed to create a formal booking. This will allow vehicle allotment and inventory reservation.
                                </p>
                                <button
                                    onClick={() => onCreateBooking(order.id)}
                                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm flex items-center gap-2"
                                >
                                    Create Booking <ArrowRight size={18} />
                                </button>
                            </div>
                        )}

                        {order.status === 'CONVERTED' && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-6 flex items-center gap-4">
                                <span className="p-3 bg-green-100 rounded-full text-green-600">
                                    <ShoppingBag size={24} />
                                </span>
                                <div>
                                    <h4 className="font-bold text-green-900">Converted</h4>
                                    <p className="text-sm text-green-700">Order has been converted to a Booking.</p>
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 'Activity':
                return (
                    <div className="text-sm text-gray-500 italic">
                        Activity log for Order {order.displayId} will appear here.
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <DetailPanel
            title={`Order ${order.displayId}`}
            status={order.status}
            onClose={onClose}
            tabs={['Overview', 'Activity']}
            renderContent={renderContent}
        />
    );
}
