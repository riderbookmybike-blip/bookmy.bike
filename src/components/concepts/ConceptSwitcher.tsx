'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layers, X, ChevronRight, Smartphone, Home, Grid, Box } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ConceptSwitcher() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    const links = [
        { label: 'Luxury Landing', href: '/concepts/luxury', icon: Home },
        { label: 'Luxury Catalog', href: '/concepts/luxury/catalog', icon: Grid },
        { label: 'Luxury PDP', href: '/concepts/luxury/product-detail', icon: Box },
    ];

    return (
        <div className="fixed bottom-6 right-6 z-[10000] font-sans">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="absolute bottom-16 right-0 w-64 bg-black/90 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl p-2"
                    >
                        <div className="p-4 border-b border-white/5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Concept Navigator</p>
                        </div>
                        <div className="p-2 space-y-1">
                            {links.map((link) => {
                                const isActive = pathname === link.href;
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setIsOpen(false)}
                                        className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isActive ? 'bg-white text-black' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
                                    >
                                        <link.icon size={16} />
                                        <span className="text-xs font-bold uppercase tracking-wide">{link.label}</span>
                                        {isActive && <ChevronRight size={14} className="ml-auto" />}
                                    </Link>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center shadow-2xl hover:scale-105 transition-transform active:scale-95"
            >
                {isOpen ? <X size={24} /> : <Layers size={24} />}
            </button>
        </div>
    );
}
