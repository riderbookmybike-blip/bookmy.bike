'use client';

import React from 'react';
import {
    Layers,
    Sparkles,
    Zap,
    MessageSquare,
    Phone,
    Mail,
    Navigation,
    Clock,
    User,
    ShieldCheck,
    Search,
    Plus
} from 'lucide-react';

const mockLeads = [
    { id: 'lead_1', name: 'Marcus Thorne', company: 'Aeon Industries', role: 'CTO', status: 'Verified', time: '12m ago' },
    { id: 'lead_2', name: 'Sophia Patel', company: 'Vertex Group', role: 'Director', status: 'In-Review', time: '2h ago' },
    { id: 'lead_3', name: 'David Chen', company: 'Nexus Capital', role: 'Partner', status: 'New', time: '5h ago' },
];

export function GlassmorphicFlow({ lead }: { lead: any }) {
    return (
        <div className="h-full relative overflow-hidden bg-[#050505] flex">
            {/* Background Glows */}
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 flex h-full w-full">

                {/* 1. Sidebar: Translucent Flow */}
                <div className="w-96 flex flex-col shrink-0 border-r border-white/5 bg-white/[0.02] backdrop-blur-3xl">
                    <div className="p-8 space-y-8">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black italic tracking-tighter uppercase text-white/90">Identity</h2>
                            <button className="p-2.5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all">
                                <Plus className="w-4 h-4 text-indigo-400" />
                            </button>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Search the nebula..."
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all placeholder:text-zinc-600"
                                defaultValue="Marcus Thorne"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                        {mockLeads.map((item) => (
                            <div
                                key={item.id}
                                className={`p-6 rounded-[2rem] transition-all duration-500 group relative overflow-hidden cursor-pointer ${item.id === 'lead_1'
                                        ? 'bg-white/10 border border-white/20 shadow-2xl shadow-indigo-500/10 scale-[1.02]'
                                        : 'bg-transparent border border-transparent hover:bg-white/5'
                                    }`}
                            >
                                {item.id === 'lead_1' && (
                                    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl animate-pulse" />
                                )}
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center border border-white/10">
                                            <span className="text-xs font-black italic">{item.name[0]}</span>
                                        </div>
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${item.id === 'lead_1' ? 'bg-indigo-500 text-white' : 'bg-white/5 text-zinc-500'
                                            }`}>
                                            {item.status}
                                        </span>
                                    </div>
                                    <h3 className={`text-sm font-bold tracking-tight ${item.id === 'lead_1' ? 'text-white' : 'text-zinc-400'}`}>{item.name}</h3>
                                    <p className="text-[10px] text-zinc-600 font-medium tracking-wide mt-1 uppercase">{item.company}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. Detail View: Glassmorphic Core */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-12">
                    <div className="max-w-5xl mx-auto space-y-12">

                        {/* Identity Header */}
                        <div className="bg-white/5 border border-white/10 backdrop-blur-2xl rounded-[3rem] p-12 shadow-2xl flex items-center justify-between group">
                            <div className="flex items-center gap-10">
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 p-1 shadow-2xl shadow-indigo-500/20">
                                        <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center overflow-hidden">
                                            <span className="text-3xl font-black italic">{lead.name[0]}</span>
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 bg-indigo-500 p-2 rounded-full border-4 border-[#0c0c0c] shadow-lg">
                                        <Sparkles className="w-4 h-4 text-white" />
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-5xl font-black tracking-tighter italic uppercase mb-2 group-hover:translate-x-2 transition-transform duration-500">{lead.name}</h2>
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400">{lead.status}</span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{lead.role} @ {lead.company}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex p-2 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                                    <button className="p-4 hover:bg-white/10 rounded-xl transition-colors text-indigo-400"><Phone className="w-5 h-5" /></button>
                                    <button className="p-4 hover:bg-white/10 rounded-xl transition-colors text-violet-400"><MessageSquare className="w-5 h-5" /></button>
                                    <button className="p-4 hover:bg-white/10 rounded-xl transition-colors text-pink-400"><Mail className="w-5 h-5" /></button>
                                </div>
                            </div>
                        </div>

                        {/* Content Matrix */}
                        <div className="grid grid-cols-12 gap-12">

                            {/* Primary Engagement */}
                            <div className="col-span-8 space-y-12">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="bg-white/5 border border-white/5 backdrop-blur-xl rounded-[2.5rem] p-10 hover:bg-white/[0.07] transition-all group">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <Layers className="w-6 h-6 text-indigo-400" />
                                            </div>
                                            <span className="text-2xl font-black italic text-indigo-400">92%</span>
                                        </div>
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-2">Intent Matrix</h3>
                                        <p className="text-sm font-medium text-zinc-300 leading-relaxed">High engagement across professional networks and direct channels.</p>
                                    </div>

                                    <div className="bg-white/5 border border-white/5 backdrop-blur-xl rounded-[2.5rem] p-10 hover:bg-white/[0.07] transition-all group">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <Clock className="w-6 h-6 text-violet-400" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Active</span>
                                        </div>
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-2">Lead Velocity</h3>
                                        <p className="text-sm font-medium text-zinc-300 leading-relaxed">Identified as a rapid-mover. Expected conversion: 14 Days.</p>
                                    </div>
                                </div>

                                {/* Visual Timeline */}
                                <div className="bg-white/5 border border-white/5 backdrop-blur-xl rounded-[3rem] p-12">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 mb-12">Engagement Stream</h3>
                                    <div className="space-y-12 relative">
                                        <div className="absolute left-[19px] top-2 bottom-2 w-px bg-white/10" />
                                        {[
                                            { time: '12m ago', type: 'System Intelligence', msg: 'Lead profile enriched from LinkedIn data.', color: 'bg-indigo-500' },
                                            { time: '3h ago', type: 'Manual Action', msg: 'Architecture blueprint sent via email.', color: 'bg-violet-500' },
                                            { time: 'Yesterday', type: 'Incoming', msg: 'Requested a demo for Q4 implementation.', color: 'bg-emerald-500' },
                                        ].map((item, i) => (
                                            <div key={i} className="flex gap-8 relative">
                                                <div className={`w-10 h-10 rounded-full ${item.color} flex items-center justify-center border-4 border-[#0c0c0c] shrink-0`}>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-white animate-ping" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-4 mb-1">
                                                        <h4 className="text-[11px] font-black uppercase tracking-widest text-white">{item.type}</h4>
                                                        <span className="text-[10px] text-zinc-600 font-mono italic">{item.time}</span>
                                                    </div>
                                                    <p className="text-sm font-medium text-zinc-400">{item.msg}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Secondary Metrics */}
                            <div className="col-span-4 space-y-12">
                                <div className="bg-indigo-600/10 border border-indigo-500/20 backdrop-blur-xl rounded-[3rem] p-10 flex flex-col items-center text-center">
                                    <User className="w-12 h-12 text-indigo-400 mb-6" />
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300 mb-4">Identity verified</h3>
                                    <div className="text-3xl font-black italic tracking-tighter mb-2">TIER 1 CEO</div>
                                    <p className="text-[10px] font-bold text-indigo-400/60 uppercase tracking-widest leading-relaxed px-6">Confirmed via professional graph and email validation.</p>
                                </div>

                                <div className="bg-white/5 border border-white/5 backdrop-blur-xl rounded-[3rem] p-10 space-y-8">
                                    <div>
                                        <h4 className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-2">Location</h4>
                                        <div className="flex items-center gap-3">
                                            <Navigation className="w-4 h-4 text-zinc-400" />
                                            <span className="text-sm font-bold">{lead.location}</span>
                                        </div>
                                    </div>
                                    <div className="h-px bg-white/5" />
                                    <div>
                                        <h4 className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-2">Deal value potential</h4>
                                        <div className="flex items-center gap-3">
                                            <Sparkles className="w-4 h-4 text-emerald-400" />
                                            <span className="text-2xl font-black italic tracking-tighter text-emerald-400">{lead.stats.deal_value}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
