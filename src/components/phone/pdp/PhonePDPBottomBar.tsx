'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

interface PhonePDPBottomBarProps {
    productImage: string;
    modelName: string;
    variantName: string;
    colorName: string;
    colorHex: string;
    totalPrice: number;
    emi?: number;
    emiTenure?: number;
    onGetQuote: () => void;
}

export function PhonePDPBottomBar({
    productImage,
    modelName,
    variantName,
    colorName,
    colorHex,
    totalPrice,
    emi,
    emiTenure,
    onGetQuote,
}: PhonePDPBottomBarProps) {
    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[100] bg-white dark:bg-[#0b0d10] border-t border-slate-200/60 dark:border-white/10 shadow-2xl shadow-black/20"
        >
            {/* Main Content */}
            <div className="flex items-center justify-between px-4 py-3 gap-3">
                {/* Left: Product Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Thumbnail */}
                    <div className="relative w-12 h-12 rounded-xl bg-slate-100 dark:bg-white/5 overflow-hidden shrink-0 border border-slate-200/50 dark:border-white/10">
                        <Image
                            src={productImage}
                            alt={modelName}
                            fill
                            className="object-contain p-1"
                        />
                    </div>

                    {/* Model + Color */}
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-black uppercase italic tracking-tight text-slate-900 dark:text-white truncate">
                                {modelName}
                            </p>
                            <span
                                className="w-3 h-3 rounded-full shrink-0 border border-white/20 shadow-sm"
                                style={{ backgroundColor: colorHex }}
                            />
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                            {variantName} • {colorName}
                        </p>
                    </div>
                </div>

                {/* Right: Price + CTA */}
                <div className="flex items-center gap-3 shrink-0">
                    {/* Price Column */}
                    <div className="text-right">
                        <p className="text-lg font-black italic text-slate-900 dark:text-white tracking-tight">
                            ₹{totalPrice.toLocaleString('en-IN')}
                        </p>
                        {emi && emiTenure && (
                            <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">
                                ₹{emi.toLocaleString('en-IN')}/mo × {emiTenure}
                            </p>
                        )}
                    </div>

                    {/* CTA Button */}
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={onGetQuote}
                        className="flex items-center gap-1 px-4 py-3 bg-brand-primary text-black font-black uppercase text-xs tracking-wider rounded-2xl shadow-lg shadow-brand-primary/30 hover:shadow-brand-primary/50 transition-all"
                    >
                        Quote
                        <ChevronRight className="w-4 h-4" strokeWidth={3} />
                    </motion.button>
                </div>
            </div>

            {/* Safe Area Padding for notched phones */}
            <div className="h-[env(safe-area-inset-bottom)]" />
        </motion.div>
    );
}
