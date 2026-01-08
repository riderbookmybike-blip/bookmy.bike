import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface DynamicHeaderProps {
    title: string;
    variantName: string;
    colorName: string; // New
    mrp: number;
    offerPrice: number;
    actions?: React.ReactNode; // For Share, Fav, Info
    onBack?: () => void;
    breadcrumb?: React.ReactNode;
}

export default function DynamicHeader({
    title,
    variantName,
    colorName,
    mrp,
    offerPrice,
    actions,
    onBack,
    breadcrumb
}: DynamicHeaderProps) {
    const savings = mrp - offerPrice;
    const discountPercent = Math.round((savings / mrp) * 100);

    return (
        <div className="space-y-4">
            {/* Breadcrumb Row */}
            {breadcrumb && (
                <div className="flex items-center gap-4">
                    {onBack && (
                        <button onClick={onBack} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
                            <ArrowLeft size={16} />
                        </button>
                    )}
                    <div className="text-[10px] font-bold tracking-widest uppercase text-slate-500">
                        {breadcrumb}
                    </div>
                </div>
            )}

            {/* Main Header Row */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-12">

                {/* Title Section */}
                <div className="flex-1 space-y-1">
                    <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase text-slate-900 dark:text-white leading-none">
                        {title}
                        <span className="text-slate-400 dark:text-slate-500 ml-3 text-2xl md:text-3xl not-italic tracking-normal">
                            - {variantName}
                        </span>
                    </h1>
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded text-[10px] font-black uppercase tracking-widest">
                            In Stock
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            Ready for Delivery
                        </span>
                        {colorName && (
                            <>
                                <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                    {colorName}
                                </span>
                            </>
                        )}
                    </div>
                </div>

                {/* Right Side: Price + Actions */}
                <div className="flex items-center gap-8 self-start md:self-end">

                    {/* Social Actions */}
                    {actions && (
                        <div className="flex items-center gap-2 border-r border-slate-200 dark:border-white/10 pr-6 mr-2">
                            {actions}
                        </div>
                    )}

                    {/* Price Block */}
                    <div className="text-right space-y-1">
                        <div className="flex items-baseline justify-end gap-3">
                            <span className="text-4xl md:text-5xl font-black italic tracking-tighter text-blue-600 dark:text-blue-500">
                                ₹{offerPrice.toLocaleString('en-IN')}
                            </span>
                            <span className="text-lg font-bold text-slate-400 dark:text-slate-600 line-through decoration-slate-400 dark:decoration-slate-600 decoration-2">
                                ₹{mrp.toLocaleString('en-IN')}
                            </span>
                        </div>
                        <div className="flex items-center justify-end gap-3">
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-green-500 uppercase tracking-widest">
                                Save ₹{savings.toLocaleString('en-IN')}
                            </span>
                            <span className="px-2 py-0.5 bg-emerald-500/10 dark:bg-green-500/20 text-emerald-600 dark:text-green-400 rounded text-[10px] font-black">
                                {discountPercent}% OFF
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
