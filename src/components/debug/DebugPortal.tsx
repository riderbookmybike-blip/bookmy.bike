'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Terminal, X, Copy, ChevronDown, ChevronUp, Clock, AlertTriangle, CheckCircle2, Info, Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export interface DebugLog {
    id: string;
    created_at: string;
    component: string;
    action: string;
    status: 'START' | 'SUCCESS' | 'ERROR' | 'INFO';
    message: string;
    payload: any;
    error: any;
    duration_ms?: number;
}

export default function DebugPortal() {
    const [isOpen, setIsOpen] = useState(false);
    const [logs, setLogs] = useState<DebugLog[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isMinimized, setIsMinimized] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    useEffect(() => {
        // Initial Fetch
        const fetchInitialLogs = async () => {
            const { data } = await supabase
                .from('debug_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (data) setLogs(data);
        };

        fetchInitialLogs();

        // Realtime Subscription
        const channel = supabase
            .channel('debug_portal')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'debug_logs' },
                (payload) => {
                    const newLog = payload.new as DebugLog;
                    setLogs(prev => [newLog, ...prev.slice(0, 49)]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    useEffect(() => {
        if (!isMinimized && scrollRef.current && logs.length > 0) {
            // Usually we stay at top for newest
        }
    }, [logs, isMinimized]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Could add a mini-toast here
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'START': return <Clock size={14} className="text-blue-400" />;
            case 'SUCCESS': return <CheckCircle2 size={14} className="text-emerald-400" />;
            case 'ERROR': return <AlertTriangle size={14} className="text-rose-400" />;
            default: return <Info size={14} className="text-indigo-400" />;
        }
    };

    const filteredLogs = logs.filter(log =>
        log.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.component?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-[9999] bg-slate-900 text-white w-12 h-12 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all group flex items-center justify-center border border-white/10"
                title="Antigravity Debug"
            >
                <Terminal size={20} className="group-hover:rotate-12 transition-transform" />
                <div className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                <div className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full" />
            </button>
        );
    }

    return (
        <div className={`fixed bottom-0 right-0 z-[9999] w-[450px] transition-all duration-300 ${isMinimized ? 'h-14' : 'h-[600px]'} bg-slate-950/95 backdrop-blur-xl border-l border-t border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden rounded-tl-3xl`}>
            {/* Header */}
            <div className="p-4 flex items-center justify-between border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-3">
                    <Terminal size={16} className="text-indigo-400" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Live App Tracing</span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsMinimized(!isMinimized)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 transition-colors">
                        {isMinimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-rose-500/20 hover:text-rose-500 rounded-lg text-slate-400 transition-colors">
                        <X size={16} />
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <>
                    {/* Search Bar */}
                    <div className="p-3 border-b border-white/10 bg-black/20">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={12} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Filter trace logs..."
                                className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-2 pl-9 pr-4 text-[10px] font-bold text-white outline-none focus:border-indigo-500/50"
                            />
                        </div>
                    </div>

                    {/* Logs Area */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-2 no-scrollbar font-mono">
                        {filteredLogs.map((log) => (
                            <div
                                key={log.id}
                                className={`p-3 rounded-xl border bg-slate-900/40 transition-all hover:bg-slate-900/60 group animate-in slide-in-from-right-4 duration-300 ${log.status === 'ERROR' ? 'border-rose-500/20 bg-rose-500/5' : 'border-white/5'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        {getStatusIcon(log.status)}
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                                            {log.component} • {log.action}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => copyToClipboard(JSON.stringify(log, null, 2))}
                                            className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400"
                                            title="Copy Log"
                                        >
                                            <Copy size={12} />
                                        </button>
                                    </div>
                                </div>

                                <div className={`text-[11px] font-bold tracking-tight mb-2 ${log.status === 'ERROR' ? 'text-rose-400' : 'text-slate-200'
                                    }`}>
                                    {log.message}
                                </div>

                                {(log.payload && JSON.stringify(log.payload) !== '{}') && (
                                    <div className="mb-2">
                                        <div className="text-[8px] uppercase tracking-widest text-slate-600 mb-1">Payload</div>
                                        <pre className="text-[9px] text-indigo-300/70 bg-indigo-500/5 p-2 rounded-lg overflow-x-auto no-scrollbar border border-indigo-500/10 max-h-32">
                                            {JSON.stringify(log.payload, null, 2)}
                                        </pre>
                                    </div>
                                )}

                                {(log.error && JSON.stringify(log.error) !== '{}') && (
                                    <div className="mb-2">
                                        <div className="text-[8px] uppercase tracking-widest text-rose-600 mb-1">Error Trace</div>
                                        <pre className="text-[9px] text-rose-300/70 bg-rose-500/5 p-2 rounded-lg overflow-x-auto no-scrollbar border border-rose-500/10 max-h-48 whitespace-pre-wrap">
                                            {JSON.stringify(log.error, null, 2)}
                                        </pre>
                                    </div>
                                )}

                                <div className="text-[8px] text-slate-600 flex items-center justify-between">
                                    <span>{new Date(log.created_at).toLocaleTimeString()}</span>
                                    {log.duration_ms && <span>{log.duration_ms}ms</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
