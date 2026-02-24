'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface MobilePDPCommandBarProps {
    price: number;
    emiPerMonth: number;
    label?: string;
    onGetQuote: () => void;
    visible?: boolean;
}

export function MobilePDPCommandBar({
    price,
    emiPerMonth,
    label = 'On-Road',
    onGetQuote,
    visible = true,
}: MobilePDPCommandBarProps) {
    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ y: 80, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 80, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="fixed inset-x-0 z-[55] bg-white/95 backdrop-blur-xl border-t border-slate-200"
                    style={{ bottom: 'calc(60px + env(safe-area-inset-bottom, 0px))' }}
                >
                    <div className="flex items-center justify-between px-4 py-3">
                        {/* Price Stack */}
                        <div className="flex flex-col min-w-0">
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-[18px] font-black text-slate-900 leading-none">
                                    ₹ {price.toLocaleString('en-IN')}
                                </span>
                                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                                    {label}
                                </span>
                            </div>
                        </div>

                        {/* CTA */}
                        <button
                            onClick={onGetQuote}
                            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#FFD700] text-black text-[11px] font-black uppercase tracking-widest shadow-lg shadow-[#FFD700]/25 active:scale-[0.97] transition-all whitespace-nowrap"
                        >
                            Get Quote
                            <ArrowRight size={14} strokeWidth={2.5} />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
