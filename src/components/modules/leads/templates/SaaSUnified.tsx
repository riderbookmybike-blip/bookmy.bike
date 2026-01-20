'use client';

import React from 'react';
import {
    Activity,
    User,
    Briefcase,
    Calendar,
    Phone,
    Mail,
    MoreHorizontal,
    Plus,
    CheckCircle2,
    Clock,
    Zap,
    MessageSquare,
    ExternalLink,
    Search,
    Filter
} from 'lucide-react';

const mockLeads = [
    { id: 'lead_1', name: 'Marcus Thorne', company: 'Aeon Industries', role: 'CTO', status: 'Qualified', time: '12m' },
    { id: 'lead_2', name: 'Sophia Patel', company: 'Vertex Group', role: 'Director', status: 'In-Review', time: '2h' },
    { id: 'lead_3', name: 'David Chen', company: 'Nexus Capital', role: 'Partner', status: 'New', time: '5h' },
];

export function SaaSUnified({ lead }: { lead: any }) {
    return (
        <div className="h-full bg-[#0c0c0c] flex overflow-hidden font-sans animate-in fade-in zoom-in-95 duration-500">

            {/* 1. Sidebar: Streamlined List */}
            <div className="w-80 flex flex-col shrink-0 border-r border-white/5 bg-zinc-900/10">
                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold text-zinc-400">Leads</h2>
                        <button className="p-1.5 hover:bg-white/5 rounded-md border border-white/5 transition-colors">
                            <Plus className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Find leads..."
                            className="w-full bg-white/5 border border-white/5 rounded-lg py-2 pl-9 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-zinc-600"
                            defaultValue="Marcus Thorne"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar px-3 space-y-1">
                    {mockLeads.map((item) => (
                        <div
                            key={item.id}
                            className={`p-3 rounded-lg flex items-center gap-3 cursor-pointer transition-all ${item.id === 'lead_1'
                                    ? 'bg-zinc-800/50 border border-white/10 shadow-sm'
                                    : 'hover:bg-white/5 opacity-60'
                                }`}
                        >
                            <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center text-[10px] font-bold">
                                {item.name[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-0.5">
                                    <h3 className="text-xs font-semibold truncate">{item.name}</h3>
                                    <span className="text-[10px] text-zinc-600">{item.time}</span>
                                </div>
                                <p className="text-[10px] text-zinc-500 truncate">{item.role} @ {item.company}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-6 border-t border-white/5 bg-zinc-900/20">
                    <div className="flex items-center gap-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                        <Activity className="w-3 h-3" /> 24 New leads today
                    </div>
                </div>
            </div>

            {/* 2. Detail View: SaaS Standard */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header Area */}
                <div className="px-10 py-6 border-b border-white/5 bg-zinc-900/10 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center text-sm font-bold shadow-lg">
                            {lead.name[0]}
                        </div>
                        <div>
                            <h2 className="text-base font-bold tracking-tight">{lead.name}</h2>
                            <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-medium">
                                <span>{lead.company}</span>
                                <span className="w-1 h-1 bg-zinc-800 rounded-full" />
                                <span>{lead.role}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-white/5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2">
                            <MessageSquare className="w-3.5 h-3.5" /> Message
                        </button>
                        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/10">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Convert Lead
                        </button>
                        <button className="p-2 hover:bg-white/5 rounded-lg border border-transparent hover:border-white/5 text-zinc-500">
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Layout Split */}
                <div className="flex-1 flex overflow-hidden">

                    {/* Main Content Feed */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-8">

                        {/* Next Action Card */}
                        <div className="bg-indigo-600/5 border border-indigo-500/20 rounded-2xl p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-500/20 rounded-xl">
                                    <Clock className="w-5 h-5 text-indigo-400" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-indigo-100">Recommended Next Step</h4>
                                    <p className="text-xs text-indigo-400/80">Schedule architectural review call for Q4 implementation</p>
                                </div>
                            </div>
                            <button className="text-xs font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300">Schedule Now →</button>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Recent Activity</h3>
                                <button className="p-1 px-3 bg-white/5 rounded-md text-[10px] font-bold hover:bg-white/10 transition-colors flex items-center gap-2">
                                    <Plus className="w-3 h-3" /> Add Note
                                </button>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { icon: Mail, type: 'Email sent', desc: 'Proposal for Aeon Industries expansion', status: 'Delivered', time: '1h ago' },
                                    { icon: Phone, type: 'Outgoing call', desc: 'Brief discussion about timeline', status: 'Completed', time: '4h ago' },
                                    { icon: Zap, type: 'Lead Enriched', desc: 'Intelligence engine updated firmographic data', status: 'Success', time: '1d ago' },
                                ].map((activity, i) => (
                                    <div key={i} className="group p-4 bg-zinc-900/30 border border-white/5 rounded-xl hover:border-white/10 transition-all flex items-start justify-between">
                                        <div className="flex items-start gap-4">
                                            <div className="p-2 bg-zinc-800 rounded-lg group-hover:bg-zinc-700 transition-colors">
                                                <activity.icon className="w-4 h-4 text-zinc-300" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h5 className="text-xs font-bold leading-none">{activity.type}</h5>
                                                    <span className="text-[10px] text-zinc-600 font-mono italic">{activity.time}</span>
                                                </div>
                                                <p className="text-xs text-zinc-500">{activity.desc}</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{activity.status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Details (MetaData) */}
                    <div className="w-80 border-l border-white/5 bg-zinc-900/10 p-10 space-y-10 overflow-y-auto">
                        <section className="space-y-6">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-600 flex items-center gap-2">
                                <User className="w-3 h-3" /> About Lead
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[9px] font-black uppercase text-zinc-600 mb-1">Email</p>
                                    <p className="text-xs font-semibold truncate hover:text-indigo-400 cursor-pointer">{lead.email}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black uppercase text-zinc-600 mb-1">Phone</p>
                                    <p className="text-xs font-semibold">{lead.phone}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black uppercase text-zinc-600 mb-1">Source</p>
                                    <p className="text-xs font-semibold">{lead.source}</p>
                                </div>
                            </div>
                        </section>

                        <div className="h-px bg-white/5" />

                        <section className="space-y-6">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-600 flex items-center gap-2">
                                <Briefcase className="w-3 h-3" /> Firmographics
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[9px] font-black uppercase text-zinc-600 mb-1">Deal Value</p>
                                    <p className="text-sm font-bold text-emerald-400">{lead.stats.deal_value}</p>
                                </div>
                                <div className="flex items-center justify-between text-xs font-medium">
                                    <span className="text-zinc-500">Employee Count</span>
                                    <span>500+</span>
                                </div>
                                <div className="flex items-center justify-between text-xs font-medium">
                                    <span className="text-zinc-500">Revenue Tier</span>
                                    <span>$10M - $50M</span>
                                </div>
                            </div>
                        </section>

                        <button className="w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors pt-4">
                            View Full Details <ExternalLink className="w-3 h-3" />
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
