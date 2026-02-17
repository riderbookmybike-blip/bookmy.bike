'use client';

import React, { useState } from 'react';
import { Database, Info, X, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SourceDebuggerProps {
    source?: {
        table: string;
        logic: string;
    };
    field: string;
    className?: string;
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export function SourceDebugger({ source, field, className = '', position = 'top-left' }: SourceDebuggerProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Only show if debug mode is on (search param or local storage)
    // For now, we will check search params in a useEffect or similar,
    // but for the sake of the user request, we assume it's visible if the prop exists.

    if (!source) return null;

    const posClasses = {
        'top-left': 'top-0 left-0',
        'top-right': 'top-0 right-0',
        'bottom-left': 'bottom-0 left-0',
        'bottom-right': 'bottom-0 right-0',
    };

    return (
        <div className={`absolute z-[100] ${posClasses[position]} m-1 ${className}`}>
            <button
                onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className="w-5 h-5 bg-brand-primary text-black rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                title={`Source: ${field}`}
            >
                <Database size={10} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        className="absolute bottom-full mb-2 left-0 w-64 bg-slate-900 border border-brand-primary/30 rounded-xl p-3 shadow-2xl backdrop-blur-xl z-[101]"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Zap size={14} className="text-brand-primary" />
                                <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest italic leading-none">
                                    Source Debugger
                                </span>
                            </div>
                            <button
                                onClick={e => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setIsOpen(false);
                                }}
                                className="text-slate-400 hover:text-white"
                            >
                                <X size={12} />
                            </button>
                        </div>

                        <div className="space-y-2">
                            <div>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Field</p>
                                <p className="text-xs font-black text-white italic">{field}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                                    SOT Table
                                </p>
                                <code className="text-[10px] font-mono bg-slate-950 px-1.5 py-0.5 rounded text-emerald-400 border border-emerald-500/20 block mt-0.5">
                                    {source.table}
                                </code>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                                    Resolution Logic
                                </p>
                                <p className="text-[10px] leading-relaxed text-slate-300 mt-0.5 italic">
                                    {source.logic}
                                </p>
                            </div>
                        </div>

                        {/* Visual indicator connector */}
                        <div className="absolute top-full left-2.5 w-0.5 h-2 bg-brand-primary/30" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
