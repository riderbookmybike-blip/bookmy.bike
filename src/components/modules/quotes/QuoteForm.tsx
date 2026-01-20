'use client';

import React, { useState } from 'react';
import SlideOver from '@/components/ui/SlideOver';
import QuoteProductSelector from '@/components/sales/QuoteProductSelector';
import { ProductVariant } from '@/types/productMaster';

interface QuoteFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { customerName: string, product: ProductVariant, price: number }) => void;
    initialCustomerName?: string;
}

export default function QuoteForm({ isOpen, onClose, onSubmit, initialCustomerName }: QuoteFormProps) {
    const [selectedProduct, setSelectedProduct] = useState<ProductVariant | null>(null);
    const [quotePrice, setQuotePrice] = useState(0);
    const [customerName, setCustomerName] = useState(initialCustomerName || '');

    // Update customer name if prop changes
    React.useEffect(() => {
        if (initialCustomerName) {
            setCustomerName(initialCustomerName);
        }
    }, [initialCustomerName]);

    const handleSubmit = () => {
        if (!selectedProduct || !customerName) return;
        onSubmit({
            customerName,
            product: selectedProduct,
            price: quotePrice
        });
        // Reset
        setSelectedProduct(null);
        setCustomerName('');
        setQuotePrice(0);
        onClose();
    };

    return (
        <SlideOver
            isOpen={isOpen}
            onClose={onClose}
            title="Create New Quote"
            width="lg"
        >
            <div className="space-y-6">
                {/* Customer */}
                <div>
                    <label className="block text-sm font-bold text-gray-900 mb-1">Customer Name</label>
                    <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Enter customer name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                    />
                </div>

                {/* Product Selection */}
                <div>
                    <label className="block text-sm font-bold text-gray-900 mb-1">Select Product</label>
                    <p className="text-xs text-gray-500 mb-3">Only showing products enabled by Dealership</p>

                    {!selectedProduct ? (
                        <div className="border border-gray-200 rounded-lg overflow-hidden h-[400px]">
                            <QuoteProductSelector
                                onSelect={(p, price) => {
                                    setSelectedProduct(p);
                                    setQuotePrice(price);
                                }}
                            />
                        </div>
                    ) : (
                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-blue-900">{selectedProduct.label}</h4>
                                    <p className="text-xs text-blue-700 mt-1 font-mono">{selectedProduct.sku}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedProduct(null)}
                                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                                >
                                    Change
                                </button>
                            </div>
                            <div className="mt-4 pt-4 border-t border-blue-200 flex justify-between items-end">
                                <span className="text-sm text-blue-800">Unit Price</span>
                                <span className="text-2xl font-bold text-blue-900">₹{quotePrice.toLocaleString()}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="pt-6 border-t border-gray-200 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        disabled={!selectedProduct || !customerName}
                        onClick={handleSubmit}
                        className={`px-6 py-2 text-white font-bold rounded-lg shadow-md transition-all ${!selectedProduct || !customerName ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                    >
                        Generate Quote
                    </button>
                </div>
            </div>
        </SlideOver>
    );
}
