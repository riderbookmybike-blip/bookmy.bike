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
        <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden">
            <div className="p-6 md:p-8 space-y-6">
                <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white border-b border-slate-200 dark:border-white/5 pb-4">
                    Price Breakdown
                </h3>

                <div className="space-y-4">
                    {items.map((item, index) => (
                        <div
                            key={index}
                            className={`flex items-start justify-between gap-4 ${item.isTotal ? 'pt-6 border-t border-slate-200 dark:border-white/10 mt-6' : ''}`}
                        >
                            <div className="flex flex-col">
                                <span className={`text-sm tracking-wide ${item.isTotal ? 'font-black uppercase text-slate-900 dark:text-white text-lg' : 'font-bold text-slate-500 dark:text-slate-400'}`}>
                                    {item.label}
                                </span>
                                {item.description && (
                                    <span className="text-[10px] text-slate-400 dark:text-slate-600 mt-1 font-medium">
                                        {item.description}
                                    </span>
                                )}
                            </div>

                            <span className={`font-mono tracking-tight ${item.isTotal
                                ? 'text-xl font-black text-blue-600 dark:text-blue-400'
                                : item.isDeduction
                                    ? 'text-emerald-600 dark:text-emerald-500 font-bold'
                                    : 'text-slate-900 dark:text-white font-bold'
                                }`}>
                                {item.isDeduction ? '-' : ''}₹{item.value.toLocaleString('en-IN')}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer Disclaimer */}
            <div className="bg-slate-100 dark:bg-slate-950/50 p-6 border-t border-slate-200 dark:border-white/5">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed text-center font-bold uppercase tracking-widest">
                    *Prices are indicative and subject to change. Registration and Insurance charges may vary based on location and provider.
                </p>
            </div>
        </div>
    );
}
