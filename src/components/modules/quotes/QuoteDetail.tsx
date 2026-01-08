'use client';

import React from 'react';
import DetailPanel from '@/components/templates/DetailPanel';
import { Quote } from '@/lib/dataStore';
import { User, ShoppingCart, Calendar } from 'lucide-react';

interface QuoteDetailProps {
    quote: Quote | null;
    onClose: () => void;
}

export default function QuoteDetail({ quote, onClose }: QuoteDetailProps) {
    if (!quote) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-50 text-gray-500">
                <div className="text-center">
                    <p>Select a quote to view details</p>
                </div>
            </div>
        );
    }

    const renderContent = (activeTab: string) => {
        switch (activeTab) {
            case 'Overview':
                return (
                    <div className="space-y-6">
                        {/* Summary Card */}
                        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Quote Summary</h3>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <span className="block text-sm text-gray-500 mb-1">Customer</span>
                                    <div className="flex items-center gap-2 font-medium text-gray-900">
                                        <User size={16} className="text-gray-400" />
                                        {quote.customerName}
                                    </div>
                                </div>
                                <div>
                                    <span className="block text-sm text-gray-500 mb-1">Date</span>
                                    <div className="flex items-center gap-2 font-medium text-gray-900">
                                        <Calendar size={16} className="text-gray-400" />
                                        {quote.date}
                                    </div>
                                </div>
                                <div className="col-span-2 pt-4 border-t border-gray-100">
                                    <span className="block text-sm text-gray-500 mb-1">Product</span>
                                    <div className="flex items-center gap-2 font-medium text-gray-900 text-lg">
                                        <ShoppingCart size={18} className="text-blue-500" />
                                        {quote.productName}
                                    </div>
                                    <div className="mt-1 ml-6 text-xs text-gray-500 font-mono">{quote.productSku}</div>
                                </div>
                                <div className="col-span-2 pt-2">
                                    <span className="block text-sm text-gray-500 mb-1">Total Amount</span>
                                    <div className="text-3xl font-bold text-green-700 font-mono">
                                        ₹{quote.price.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions Placeholder */}
                        <div className="grid grid-cols-2 gap-4">
                            <button className="p-4 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 text-left">
                                <span className="block font-bold text-blue-600">Convert to Order</span>
                                <span className="text-xs text-gray-500">Promote this quote</span>
                            </button>
                            <button className="p-4 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 text-left">
                                <span className="block font-bold text-gray-700">Email Quote</span>
                                <span className="text-xs text-gray-500">Send PDF to customer</span>
                            </button>
                        </div>
                    </div>
                );
            case 'Activity':
                return (
                    <div className="text-sm text-gray-500 italic">
                        Activity log for Quote {quote.displayId} will appear here.
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <DetailPanel
            title={`Quote ${quote.displayId}`}
            status={quote.status}
            onClose={onClose}
            tabs={['Overview', 'Activity']}
            renderContent={renderContent}
        />
    );
}
