import React from 'react';

interface PriceItem {
    label: string;
    value: number;
    isTotal?: boolean;
    isDeduction?: boolean; // For discounts
    description?: string;
}

interface PriceBreakupTabProps {
    items: PriceItem[];
}

export default function PriceBreakupTab({ items }: PriceBreakupTabProps) {
    return (
        <div className="bg-slate-50 border border-slate-200 rounded-[2.5rem] overflow-hidden">
            <div className="p-6 md:p-8 space-y-6">
                <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-900 border-b border-slate-200 pb-4">
                    Price Breakdown
                </h3>

                <div className="space-y-4">
                    {items.map((item, index) => (
                        <div
                            key={index}
                            className={`flex items-start justify-between gap-4 ${item.isTotal ? 'pt-6 border-t border-slate-200 mt-6' : ''}`}
                        >
                            <div className="flex flex-col">
                                <span className={`text-sm tracking-wide ${item.isTotal ? 'font-black uppercase text-slate-900 text-lg' : 'font-bold text-slate-500'}`}>
                                    {item.label}
                                </span>
                                {item.description && (
                                    <span className="text-[10px] text-slate-400 mt-1 font-medium">
                                        {item.description}
                                    </span>
                                )}
                            </div>

                            <span className={`font-mono tracking-tight ${item.isTotal
                                ? 'text-xl font-black text-brand-primary'
                                : item.isDeduction
                                    ? 'text-emerald-600 font-bold'
                                    : 'text-slate-900 font-bold'
                                }`}>
                                {item.isDeduction ? '-' : ''}₹{item.value.toLocaleString('en-IN')}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer Disclaimer */}
            <div className="bg-slate-100 p-6 border-t border-slate-200">
                <p className="text-[10px] text-slate-400 leading-relaxed text-center font-bold uppercase tracking-widest">
                    *Prices are indicative and subject to change. Registration and Insurance charges may vary based on location and provider.
                </p>
            </div>
        </div>
    );
}
