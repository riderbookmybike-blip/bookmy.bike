'use client';

import React, { useState } from 'react';
import SlideOver from '@/components/ui/SlideOver';
import QuoteProductSelector from '@/components/sales/QuoteProductSelector';
import { ProductVariant } from '@/types/productMaster';

interface QuoteFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { customerName: string, product: ProductVariant, price: number, district?: string, color?: string, colorId?: string }) => void;
    initialCustomerName?: string;
    pincode?: string;
}

import { getDistrictFromPincode } from '@/actions/pricingActions';

export default function QuoteForm({ isOpen, onClose, onSubmit, initialCustomerName, pincode }: QuoteFormProps) {
    const [selectedProduct, setSelectedProduct] = useState<ProductVariant | null>(null);
    const [selectedColor, setSelectedColor] = useState<{ id: string, name: string, hexCode: string } | null>(null);
    const [quotePrice, setQuotePrice] = useState(0);
    const [customerName, setCustomerName] = useState(initialCustomerName || '');
    const [district, setDistrict] = useState<string | undefined>();

    // Update customer name and resolve district if pincode changes
    React.useEffect(() => {
        if (initialCustomerName) {
            setCustomerName(initialCustomerName);
        }
    }, [initialCustomerName]);

    React.useEffect(() => {
        if (pincode) {
            getDistrictFromPincode(pincode).then(d => {
                if (d) setDistrict(d);
            });
        }
    }, [pincode]);

    const handleSubmit = () => {
        if (!selectedProduct || !customerName) return;
        onSubmit({
            customerName,
            product: selectedProduct,
            price: quotePrice,
            district,
            color: selectedColor?.name,
            colorId: selectedColor?.id
        });
        // Reset
        setSelectedProduct(null);
        setSelectedColor(null);
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
                    <label className="block text-sm font-bold text-slate-900 dark:text-white mb-1">Customer Name</label>
                    <input
                        type="text"
                        className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        placeholder="Enter customer name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                    />
                </div>

                {/* Product Selection */}
                <div>
                    <label className="block text-sm font-bold text-slate-900 dark:text-white mb-1">Select Product</label>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Only showing products enabled by Dealership</p>

                    {!selectedProduct ? (
                        <div className="border border-slate-200 dark:border-white/10 rounded-lg overflow-hidden h-[400px]">
                            <QuoteProductSelector
                                district={district}
                                onSelect={(p, price) => {
                                    setSelectedProduct(p);
                                    setQuotePrice(price);
                                }}
                            />
                        </div>
                    ) : (
                        <div className="p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-lg">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-blue-900 dark:text-blue-200">{selectedProduct.label}</h4>
                                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1 font-mono">{selectedProduct.sku}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setSelectedProduct(null);
                                        setSelectedColor(null);
                                    }}
                                    className="text-xs text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 underline"
                                >
                                    Change Model
                                </button>
                            </div>

                            {/* Color Selection */}
                            <div className="mt-6">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-blue-800 dark:text-blue-300 mb-3">Choose Color</label>
                                <div className="flex flex-wrap gap-3">
                                    {selectedProduct.availableColors?.map(color => (
                                        <button
                                            key={color.id}
                                            onClick={() => setSelectedColor(color)}
                                            className={`group relative flex flex-col items-center gap-2 transition-all ${selectedColor?.id === color.id ? 'scale-110' : 'opacity-60 hover:opacity-100'}`}
                                        >
                                            <div
                                                className={`w-10 h-10 rounded-full border-2 transition-all ${selectedColor?.id === color.id ? 'border-blue-600 ring-4 ring-blue-600/10' : 'border-white/20'}`}
                                                style={{ backgroundColor: color.hexCode }}
                                            />
                                            <span className="text-[8px] font-bold text-blue-900 dark:text-blue-200 uppercase tracking-tighter text-center max-w-[50px] leading-tight">
                                                {color.name}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-blue-200 dark:border-blue-500/20 flex justify-between items-end">
                                <span className="text-sm text-blue-800 dark:text-blue-300">Unit Price</span>
                                <span className="text-2xl font-bold text-blue-900 dark:text-blue-200">₹{quotePrice.toLocaleString()}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="pt-6 border-t border-slate-200 dark:border-white/10 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        disabled={!selectedProduct || !customerName || !selectedColor}
                        onClick={handleSubmit}
                        className={`px-6 py-2 text-white font-bold rounded-lg shadow-md transition-all ${!selectedProduct || !customerName || !selectedColor ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                    >
                        Generate Quote
                    </button>
                </div>
            </div>
        </SlideOver>
    );
}
