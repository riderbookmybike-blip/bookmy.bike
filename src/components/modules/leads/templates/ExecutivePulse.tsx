'use client';

import React from 'react';
import {
    Zap,
    Shield,
    TrendingUp,
    Target,
    Calendar,
    Phone,
    Mail,
    MapPin,
    MoreHorizontal,
    ArrowUpRight,
    MessageSquare,
    Video,
    Search,
    Plus,
    Filter
} from 'lucide-react';

const mockLeads = [
    { id: 'lead_1', name: 'Marcus Thorne', company: 'Aeon Industries', role: 'CTO', status: 'Priority', time: '12m ago' },
    { id: 'lead_2', name: 'Sophia Patel', company: 'Vertex Group', role: 'Director', status: 'In-Review', time: '2h ago' },
    { id: 'lead_3', name: 'David Chen', company: 'Nexus Capital', role: 'Partner', status: 'New', time: '5h ago' },
];

export function ExecutivePulse({ lead }: { lead: any }) {
    return (
        <div className="h-full flex divide-x divide-white/5 bg-[#0c0c0c] animate-in fade-in duration-700">

            {/* Sidebar Flow: Executive Efficiency */}
            <div className="w-96 flex flex-col shrink-0 bg-black/40">
                <div className="p-8 border-b border-white/5 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                            <h2 className="text-xl font-black italic tracking-tighter uppercase">Operations</h2>
                        </div>
                        <button className="p-2 border border-white/10 rounded-xl hover:bg-white/5 transition-colors">
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 group-focus-within:text-white transition-colors" />
                        <input
                            type="text"
                            placeholder="COMMAND SEARCH..."
                            className="w-full bg-white/5 border border-white/5 rounded-xl py-3 pl-11 pr-4 text-[10px] font-black tracking-widest uppercase focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-zinc-700"
                            defaultValue="MARCUS THORNE"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {mockLeads.map((item) => (
                        <div
                            key={item.id}
                            className={`p-6 border-b border-white/5 cursor-pointer transition-all ${item.id === 'lead_1'
                                    ? 'bg-indigo-500/5 border-l-2 border-l-indigo-500'
                                    : 'hover:bg-white/5 grayscale opacity-40'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <span className="text-[9px] font-black bg-zinc-800 px-2 py-0.5 rounded-full uppercase tracking-widest text-zinc-500">
                                    {item.status}
                                </span>
                                <span className="text-[9px] font-mono text-zinc-600">{item.time}</span>
                            </div>
                            <h3 className="text-sm font-bold tracking-tight mb-1">{item.name}</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">{item.company} / {item.role}</p>
                        </div>
                    ))}
                </div>

                <div className="p-6 bg-zinc-900/40 border-t border-white/5">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                        <span>Lead Velocity</span>
                        <span className="text-indigo-400">+12%</span>
                    </div>
                </div>
            </div>

            {/* Detail Flow: Executive Analysis */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* 1. Header: Quick Stats Identity */}
                <div className="px-12 py-10 border-b border-white/5 flex items-center justify-between bg-zinc-900/20 backdrop-blur-sm shrink-0">
                    <div className="flex items-center gap-8">
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 p-px">
                            <div className="w-full h-full rounded-[1.4rem] bg-black flex items-center justify-center">
                                <span className="text-2xl font-black italic">{lead.name.split(' ').map((n: string) => n[0]).join('')}</span>
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-3xl font-black tracking-tighter italic uppercase">{lead.name}</h2>
                                <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">VIP LEAD</span>
                                </div>
                            </div>
                            <p className="text-zinc-500 text-sm font-medium tracking-tight flex items-center gap-2">
                                {lead.role} <span className="w-1 h-1 bg-zinc-700 rounded-full" /> {lead.company}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform">
                            <Zap className="w-4 h-4 fill-current" /> Action Center
                        </button>
                        <button className="p-3 border border-white/10 rounded-2xl hover:bg-white/5 transition-colors">
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* 2. Three-Column Data Grid */}
                <div className="flex-1 grid grid-cols-3 divide-x divide-white/5 overflow-hidden">

                    {/* COL 1: IDENTITY CORE */}
                    <div className="p-10 space-y-10 overflow-y-auto custom-scrollbar">
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Contact Matrix</h3>
                            </div>
                            <div className="grid gap-3">
                                {[
                                    { icon: Phone, label: 'Voice', value: lead.phone },
                                    { icon: Mail, label: 'Digital', value: lead.email },
                                    { icon: MapPin, label: 'HQ', value: lead.location },
                                    { icon: Target, label: 'Source', value: lead.source },
                                ].map((item, i) => (
                                    <div key={i} className="group p-5 bg-white/5 border border-white/5 rounded-3xl hover:border-white/10 transition-all">
                                        <div className="flex items-center justify-between mb-2">
                                            <item.icon className="w-4 h-4 text-zinc-600" />
                                            <ArrowUpRight className="w-3 h-3 text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">{item.label}</p>
                                        <p className="text-sm font-bold tracking-tight">{item.value}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* COL 2: INTELLIGENCE ENGINE */}
                    <div className="p-10 space-y-10 bg-zinc-900/10">
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1.5 h-1.5 bg-violet-500 rounded-full shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Predictive Score</h3>
                            </div>
                            <div className="relative aspect-square rounded-[3rem] bg-gradient-to-br from-zinc-800/50 to-transparent p-px">
                                <div className="w-full h-full rounded-[3rem] bg-[#0c0c0c] flex flex-col items-center justify-center p-8 text-center">
                                    <div className="relative">
                                        <svg className="w-48 h-48 -rotate-90">
                                            <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-zinc-900" />
                                            <circle
                                                cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent"
                                                strokeDasharray={552} strokeDashoffset={552 * (1 - lead.intent_score / 100)}
                                                className="text-indigo-500"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-6xl font-black italic tracking-tighter">{lead.intent_score}</span>
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">QUALIFIED</span>
                                        </div>
                                    </div>
                                    <div className="mt-8 grid grid-cols-2 gap-4 w-full">
                                        <div className="text-center">
                                            <p className="text-2xl font-black italic tracking-tighter">₹12.5L</p>
                                            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-600">POTENTIAL</p>
                                        </div>
                                        <div className="text-center border-l border-white/5">
                                            <p className="text-2xl font-black italic tracking-tighter">82%</p>
                                            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-600">CONFIDENCE</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* COL 3: VELOCITY FEED */}
                    <div className="p-10 space-y-10 overflow-y-auto custom-scrollbar">
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Recent Velocity</h3>
                            </div>
                            <div className="space-y-6">
                                {[
                                    { icon: Mail, type: 'Email Sent', time: '12m ago', desc: 'Q3 Proposal followup' },
                                    { icon: Video, type: 'Meeting Held', time: '3h ago', desc: 'Architecture review call' },
                                    { icon: MessageSquare, type: 'WhatsApp', time: 'Yesterday', desc: 'Direct message from Lead' },
                                ].map((event, i) => (
                                    <div key={i} className="flex gap-6 group">
                                        <div className="relative flex flex-col items-center">
                                            <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-white/10 group-hover:bg-white/10 transition-all">
                                                <event.icon className="w-4 h-4 text-zinc-400" />
                                            </div>
                                            {i < 2 && <div className="w-px flex-1 bg-white/5 my-2" />}
                                        </div>
                                        <div className="pb-6">
                                            <div className="flex items-center gap-4 mb-1">
                                                <h4 className="text-[11px] font-black uppercase tracking-widest text-white">{event.type}</h4>
                                                <span className="text-[10px] text-zinc-600 font-mono italic">{event.time}</span>
                                            </div>
                                            <p className="text-xs text-zinc-500 font-medium">{event.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                </div>
            </div>
        </div>
    );
}
