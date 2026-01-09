'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, RotateCcw, ChevronRight, Check } from 'lucide-react';

interface FilterDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export const FilterDrawer = ({ isOpen, onClose }: FilterDrawerProps) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-slate-950 shadow-2xl z-[101] border-l border-slate-200 dark:border-white/10 flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter italic">ADVANCED FILTERS</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure your reporting view</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all"
                            >
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            {/* Saved Views */}
                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saved Views</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {['Q4 Operations', 'Finance Review'].map(v => (
                                        <button key={v} className="flex items-center justify-between p-3 rounded-xl border border-indigo-500/20 bg-indigo-50/30 dark:bg-indigo-500/5 text-xs font-bold text-indigo-600 dark:text-indigo-400 group">
                                            {v}
                                            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-all" />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Partner Type */}
                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Partner Type</p>
                                <div className="space-y-2">
                                    {['All Partners', 'Premium Dealers', 'Bank Partners', 'Service Hubs'].map((label, i) => (
                                        <label key={label} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-white/5 hover:border-indigo-500/30 transition-all cursor-pointer group">
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{label}</span>
                                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${i === 0 ? 'bg-indigo-600 border-indigo-600' : 'border-slate-200 dark:border-white/10 group-hover:border-indigo-500'}`}>
                                                {i === 0 && <Check size={12} className="text-white" />}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Regions */}
                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Regions</p>
                                <div className="flex flex-wrap gap-2">
                                    {['North', 'South', 'West', 'East', 'Central'].map(r => (
                                        <button key={r} className="px-4 py-2 rounded-full border border-slate-200 dark:border-white/10 text-[10px] font-black uppercase text-slate-500 hover:border-indigo-500 hover:text-indigo-500 transition-all">
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/2 space-y-4">
                            <div className="flex gap-3">
                                <button className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white text-xs font-black shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all">
                                    Apply Configuration
                                </button>
                                <button className="p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-400 hover:text-indigo-500 transition-all">
                                    <Save size={18} />
                                </button>
                            </div>
                            <button className="w-full flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-rose-500 transition-all">
                                <RotateCcw size={12} />
                                Reset to Default
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
