'use client';

import React from 'react';
import {
    Navigation,
    Link,
    Fingerprint,
    Globe,
    Mail,
    Phone,
    ArrowRight,
    Search,
    Plus,
    Minus
} from 'lucide-react';

const mockLeads = [
    { id: 'lead_1', name: 'Marcus Thorne', company: 'Aeon Industries', role: 'CTO', time: '12m' },
    { id: 'lead_2', name: 'Sophia Patel', company: 'Vertex Group', role: 'Director', time: '2h' },
    { id: 'lead_3', name: 'David Chen', company: 'Nexus Capital', role: 'Partner', time: '5h' },
];

export function MinimalistSlate({ lead }: { lead: any }) {
    return (
        <div className="h-full bg-zinc-50 dark:bg-slate-950 text-black dark:text-slate-100 flex font-serif animate-in fade-in slide-in-from-right-12 duration-1000">

            {/* 1. Sidebar: Editorial Index */}
            <div className="w-96 flex flex-col shrink-0 border-r border-zinc-200 dark:border-white/10 bg-white dark:bg-slate-900">
                <div className="p-10 pb-6 space-y-12">
                    <div className="flex items-center justify-between">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400">Archival Index</h2>
                        <Plus className="w-3 h-3 text-zinc-300" />
                    </div>
                    <div className="relative group">
                        <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-300 group-focus-within:text-black transition-colors" />
                        <input
                            type="text"
                            placeholder="FIND RECORD..."
                            className="w-full bg-transparent border-b border-zinc-100 py-2 pl-8 pr-4 text-[11px] font-black tracking-widest uppercase focus:outline-none focus:border-black transition-all placeholder:text-zinc-200"
                            defaultValue="MARCUS THORNE"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar-light px-4">
                    <div className="py-4 space-y-2">
                        {mockLeads.map((item) => (
                            <div
                                key={item.id}
                                className={`p-8 group cursor-pointer transition-all ${item.id === 'lead_1'
                                        ? 'bg-zinc-50 border-y border-zinc-100'
                                        : 'opacity-40 grayscale hover:opacity-100 hover:grayscale-0'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-400">/{item.id.toUpperCase()}</span>
                                    <span className="text-[8px] font-sans font-bold text-zinc-300">{item.time}</span>
                                </div>
                                <h3 className="text-xl font-medium tracking-tight mb-1">{item.name}</h3>
                                <p className="text-[10px] font-sans font-bold uppercase tracking-widest text-zinc-400">{item.company}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-10 border-t border-zinc-100">
                    <div className="text-[10px] font-black uppercase tracking-widest text-zinc-300 italic">Volume 04 / Issue 2026</div>
                </div>
            </div>

            {/* 2. Detail View: Editorial Focus */}
            <div className="flex-1 overflow-y-auto custom-scrollbar-light">
                {/* 1. Massive Editorial Header */}
                <div className="px-24 pt-32 pb-24 max-w-7xl">
                    <div className="flex items-center gap-6 mb-12">
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400">Identity Record</span>
                        <div className="h-px flex-1 bg-zinc-200" />
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400">001-ALPHA</span>
                    </div>

                    <h1 className="text-[10rem] font-medium leading-[0.8] tracking-tighter mb-12 -ml-2">
                        {lead.name.split(' ')[0]}<br />
                        <span className="text-zinc-300 italic">{lead.name.split(' ')[1]}</span>
                    </h1>

                    <div className="flex items-end justify-between">
                        <div className="space-y-4">
                            <p className="text-3xl font-light tracking-tight text-zinc-600 max-w-xl">
                                Acting as <span className="text-black font-medium">{lead.role}</span> at {lead.company}.
                                Currently based in {lead.location}.
                            </p>
                            <div className="flex gap-12 pt-8">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Current Status</p>
                                    <p className="text-base font-medium">{lead.status}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Intent Score</p>
                                    <p className="text-base font-medium italic">{lead.intent_score} / 100</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button className="flex items-center gap-4 px-10 py-5 bg-black text-white rounded-full font-bold text-sm tracking-tight hover:scale-105 transition-transform">
                                Full Analysis <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2. Structured Content - The "Slate" */}
                <div className="bg-white dark:bg-slate-900 border-t border-zinc-200 dark:border-white/10 px-24 py-24">
                    <div className="max-w-7xl grid grid-cols-12 gap-24">

                        {/* Left: Biography & Context */}
                        <div className="col-span-7 space-y-16">
                            <section>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-300 mb-10">Contextual Narrative</h3>
                                <p className="text-2xl leading-relaxed font-light text-zinc-500">
                                    This lead was acquired via <span className="text-black font-medium">{lead.source}</span>.
                                    Over the last 14 days, they have demonstrated a high propensity for conversion,
                                    particularly focusing on high-value architecture solutions. Verification systems
                                    mark this identity as TIER 1.
                                </p>
                            </section>

                            <div className="grid grid-cols-2 gap-16 pt-8">
                                <div className="space-y-6">
                                    <h4 className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Direct Channels</h4>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4 text-zinc-500 group cursor-pointer hover:text-black transition-colors font-sans font-medium">
                                            <Mail className="w-4 h-4" />
                                            <span className="text-sm border-b border-transparent group-hover:border-black">{lead.email}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-zinc-500 group cursor-pointer hover:text-black transition-colors font-sans font-medium">
                                            <Phone className="w-4 h-4" />
                                            <span className="text-sm border-b border-transparent group-hover:border-black">{lead.phone}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <h4 className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Digital Presence</h4>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4 text-zinc-500 group cursor-pointer hover:text-black transition-colors font-sans font-medium">
                                            <Globe className="w-4 h-4" />
                                            <span className="text-sm border-b border-transparent group-hover:border-black">aeon-industries.com/team</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-zinc-500 group cursor-pointer hover:text-black transition-colors font-sans font-medium">
                                            <Link className="w-4 h-4" />
                                            <span className="text-sm border-b border-transparent group-hover:border-black">linkedin.com/in/m-thorne</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right: Metrics & Identification */}
                        <div className="col-span-5 border-l border-zinc-100 pl-24 space-y-16">
                            <section>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-300 mb-10">Verification</h3>
                                <div className="p-10 bg-zinc-50 rounded-[2rem] border border-zinc-100 space-y-8">
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center">
                                            <Fingerprint className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-sans font-bold leading-none mb-1">Identity Confirmed</p>
                                            <p className="text-[10px] text-zinc-400 font-mono">HASH_029384_X</p>
                                        </div>
                                    </div>
                                    <div className="h-px bg-zinc-200" />
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end font-sans">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Digital Trust</span>
                                            <span className="text-sm font-bold italic">Perfect</span>
                                        </div>
                                        <div className="w-full h-1 bg-zinc-200 rounded-full overflow-hidden">
                                            <div className="w-[98%] h-full bg-black" />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-300 mb-10">Activity Logs</h3>
                                <div className="space-y-8">
                                    {[
                                        { date: 'JAN 19', event: 'Profile deep enrichment completed' },
                                        { date: 'JAN 18', event: 'Architecture deck viewed (4 times)' },
                                        { date: 'JAN 17', event: 'Initial outreach accepted' },
                                    ].map((log, i) => (
                                        <div key={i} className="flex gap-8">
                                            <span className="text-[9px] font-sans font-black text-zinc-400 shrink-0 pt-1 tracking-widest">{log.date}</span>
                                            <p className="text-xs font-sans font-medium leading-tight text-zinc-600">{log.event}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
