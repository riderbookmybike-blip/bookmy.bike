'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getPageDebugInfo, PageDebugInfo } from '@/actions/debug/pageDebug';
import { Bug, Copy, Check, Lock, Unlock, Database, Globe, Server, Monitor, X, Activity, FileCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(' ');
}

export function SystemDebugger({ trigger }: { trigger?: React.ReactNode }) {
    const pathname = usePathname();
    const [info, setInfo] = useState<PageDebugInfo | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setDimensions({ width: window.innerWidth, height: window.innerHeight });
            window.addEventListener('resize', () =>
                setDimensions({ width: window.innerWidth, height: window.innerHeight })
            );
        }

        let active = true;
        async function fetchInfo() {
            try {
                const data = await getPageDebugInfo(pathname);
                if (active) setInfo(data);
            } catch (err) {
                console.error('Debug fetch failed', err);
            }
        }
        fetchInfo();
        return () => {
            active = false;
        };
    }, [pathname]);

    // Runtime Diagnostics (Client Side)
    const runtime = typeof window !== 'undefined' ? (window as any).__BMB_DEBUG__ : null;

    const handleCopy = () => {
        const runtimeContext = runtime
            ? `
RUNTIME DIAGNOSTICS:
User: ${runtime.userId || 'GUEST'}
Tenant: ${runtime.tenantId || 'N/A'}
Location: ${runtime.district}, ${runtime.stateCode} (${runtime.pincode})
Pricing Source: ${runtime.pricingSource}
Page ID: ${runtime.pageId}
        `
            : '';

        const fullPrompt = `${info?.generatedPrompt || 'PAGE INFO MISSING'}\n${runtimeContext}`;

        navigator.clipboard.writeText(fullPrompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!info && !runtime && !trigger) return null;

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed bottom-4 left-4 z-[9999] font-sans antialiased">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="absolute bottom-14 left-0 w-[450px] bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-2 h-2 rounded-full ${info?.isLocked ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}
                                    />
                                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                                        BMB Diagnostics
                                    </span>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-zinc-500 hover:text-white transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            </div>

                            <div className="p-4 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-zinc-800">
                                {/* 1. Page Identity */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-start">
                                        <h2 className="text-lg font-bold text-white leading-tight">
                                            {info?.found ? info.pageName : 'Unregistered Route'}
                                        </h2>
                                        {info?.isLocked ? (
                                            <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded text-[10px] text-red-400 font-bold uppercase tracking-wider">
                                                <Lock size={10} /> Locked
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                                                <Unlock size={10} /> Open
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500 bg-black/40 px-2 py-1 rounded border border-white/5 break-all">
                                        <FileCode size={12} className="shrink-0" />
                                        {info?.filePath || pathname}
                                    </div>
                                    {info?.description && (
                                        <p className="text-xs text-zinc-400 leading-relaxed border-l-2 border-zinc-700 pl-3">
                                            {info.description}
                                        </p>
                                    )}
                                </div>

                                {/* 2. Database Dependency Topography */}
                                {info?.usedTables && info.usedTables.length > 0 && (
                                    <div className="space-y-2">
                                        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                            <Database size={12} /> Data Dependencies
                                        </h3>
                                        <div className="grid grid-cols-2 gap-2">
                                            {info.usedTables.map(t => (
                                                <div
                                                    key={t}
                                                    className="flex items-center gap-2 px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded bg-gradient-to-r from-zinc-900 to-zinc-900/50 hover:border-zinc-700 transition-colors"
                                                >
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                    <span className="text-[10px] font-mono text-blue-200/80">{t}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* 3. Runtime Telemetry (Client) */}
                                {runtime && (
                                    <div className="space-y-2">
                                        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                            <Activity size={12} /> Runtime Telemetry
                                        </h3>
                                        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-3 space-y-3">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[9px] text-zinc-600 uppercase font-bold">
                                                        Location
                                                    </p>
                                                    <p className="text-xs text-white font-medium">
                                                        {runtime.district || 'Global'}, {runtime.stateCode}
                                                    </p>
                                                    <p className="text-[9px] font-mono text-zinc-500">
                                                        {runtime.pincode}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] text-zinc-600 uppercase font-bold">
                                                        Pricing Engine
                                                    </p>
                                                    <p className="text-xs text-emerald-400 font-medium">
                                                        {runtime.pricingSource}
                                                    </p>
                                                    <p className="text-[9px] text-zinc-500">
                                                        {runtime.marketOffersCount} offers active
                                                    </p>
                                                </div>
                                            </div>
                                            {runtime.dealerId && (
                                                <div className="pt-2 border-t border-zinc-800/50">
                                                    <p className="text-[9px] text-zinc-600 uppercase font-bold">
                                                        Dealer Context
                                                    </p>
                                                    <p className="text-xs text-amber-400 font-medium truncate">
                                                        {runtime.studioName || 'Loading...'}
                                                    </p>
                                                    <p className="text-[9px] font-mono text-zinc-600 truncate">
                                                        {runtime.dealerId}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* 4. Infrastructure */}
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-900">
                                    <div>
                                        <p className="text-[9px] text-zinc-600 uppercase font-bold flex items-center gap-1.5 mb-1">
                                            <Monitor size={10} /> Viewport
                                        </p>
                                        <p className="text-[10px] font-mono text-zinc-400">
                                            {dimensions.width}x{dimensions.height}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-zinc-600 uppercase font-bold flex items-center gap-1.5 mb-1">
                                            <Server size={10} /> Node
                                        </p>
                                        <p className="text-[10px] font-mono text-zinc-400">Vercel Edge</p>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Action */}
                            <div className="p-3 bg-zinc-900 border-t border-zinc-800">
                                <button
                                    onClick={handleCopy}
                                    className={cn(
                                        'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all duration-200',
                                        copied
                                            ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                                            : 'bg-white text-black hover:bg-zinc-200'
                                    )}
                                >
                                    {copied ? <Check size={14} /> : <Copy size={14} />}
                                    {copied ? 'CONTEXT COPIED TO CLIPBOARD' : 'COPY CONTEXT FOR AI AGENT'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Trigger Button */}
            {trigger ? (
                <div onClick={() => setIsOpen(true)} className="cursor-pointer">
                    {trigger}
                </div>
            ) : (
                !isOpen && (
                    <div className="fixed bottom-4 left-4 z-[9999] font-sans antialiased">
                        <button
                            onClick={() => setIsOpen(true)}
                            className="w-3 h-3 rounded-full bg-zinc-500/40 hover:bg-emerald-500 transition-all duration-300 shadow-lg cursor-pointer backdrop-blur-md border border-white/20 group hover:scale-125 relative"
                            title="System Diagnostics"
                        >
                            <div className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping opacity-0 group-hover:opacity-100 duration-1000" />
                        </button>
                    </div>
                )
            )}
        </>
    );
}
