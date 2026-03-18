'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Sparkles, ChevronRight, Tag, Banknote, BarChart3 } from 'lucide-react';

interface CommercialGateProps {
    isLoggedIn: boolean;
    children: React.ReactNode;
    onLoginClick?: () => void;
}

/**
 * CommercialGate — wraps any commercial card content.
 * When user is not logged in, renders a premium soft-lock overlay
 * instead of children. When logged in, renders children as-is.
 */
export function CommercialGate({ isLoggedIn, children, onLoginClick }: CommercialGateProps) {
    if (isLoggedIn) return <>{children}</>;

    return (
        <div className="relative flex flex-col items-center justify-center h-full w-full min-h-[260px] select-none">
            {/* Blurred ghost behind — hints at content */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10" />
            </div>

            {/* Gate card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-20 flex flex-col items-center text-center px-6 py-8 max-w-xs mx-auto"
            >
                {/* Lock icon ring */}
                <div className="relative mb-5">
                    <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center shadow-[0_0_24px_rgba(244,176,0,0.2)]">
                        <Lock size={28} className="text-brand-primary" />
                    </div>
                    {/* Ping animation */}
                    <div className="absolute inset-0 rounded-2xl bg-brand-primary/20 animate-ping opacity-30" />
                </div>

                {/* Headline */}
                <h3 className="text-base font-black italic uppercase tracking-tight text-slate-900 leading-snug mb-1">
                    India&apos;s Best Bike Offer
                </h3>
                <p className="text-[11px] font-bold text-brand-primary uppercase tracking-[0.12em] mb-3">Awaits You</p>

                {/* Benefit pills */}
                <div className="flex flex-wrap justify-center gap-1.5 mb-5">
                    {[
                        { icon: Tag, label: 'Exact Price' },
                        { icon: Banknote, label: 'EMI Options' },
                        { icon: BarChart3, label: 'Full Breakdown' },
                        { icon: Sparkles, label: 'Exclusive Deals' },
                    ].map(({ icon: Icon, label }) => (
                        <span
                            key={label}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[9px] font-black uppercase tracking-[0.1em] text-slate-600"
                        >
                            <Icon size={9} className="text-brand-primary" />
                            {label}
                        </span>
                    ))}
                </div>

                {/* CTA Button */}
                <button
                    onClick={onLoginClick}
                    className="group w-full flex items-center justify-center gap-2.5 py-3.5 px-6 bg-brand-primary hover:bg-[#F4B000] text-slate-900 font-black text-xs uppercase tracking-[0.12em] rounded-2xl transition-all shadow-[0_4px_20px_rgba(255,215,0,0.35)] hover:shadow-[0_6px_28px_rgba(255,215,0,0.5)] hover:-translate-y-0.5 active:scale-[0.98]"
                >
                    <Sparkles size={14} />
                    <span>Login to Unlock Offer</span>
                    <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </button>

                <p className="mt-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    Free · No Spam · 30 Sec
                </p>
            </motion.div>
        </div>
    );
}
