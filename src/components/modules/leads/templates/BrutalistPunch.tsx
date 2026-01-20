'use client';

import React from 'react';
import {
    Zap,
    Phone,
    MessageCircle,
    Mail,
    AtSign,
    Hash,
    ShieldAlert,
    BarChart3,
    Search,
    Plus,
    X
} from 'lucide-react';

const mockLeads = [
    { id: 'lead_1', name: 'Marcus Thorne', company: 'Aeon Industries', role: 'CTO', time: '12M' },
    { id: 'lead_2', name: 'Sophia Patel', company: 'Vertex Group', role: 'Director', time: '2H' },
    { id: 'lead_3', name: 'David Chen', company: 'Nexus Capital', role: 'Partner', time: '5H' },
];

export function BrutalistPunch({ lead }: { lead: any }) {
    return (
        <div className="h-full bg-white dark:bg-slate-950 text-black dark:text-white flex overflow-hidden selection:bg-yellow-300">

            {/* 1. Sidebar: Brutal Index */}
            <div className="w-[450px] flex flex-col shrink-0 border-r-[3px] border-black bg-white dark:bg-slate-900">
                <div className="p-10 space-y-10 border-b-[3px] border-black">
                    <div className="flex items-center justify-between">
                        <h2 className="text-4xl font-black italic tracking-tighter uppercase">LEADS</h2>
                        <button className="w-12 h-12 border-[3px] border-black bg-black text-white flex items-center justify-center hover:bg-zinc-800 transition-colors">
                            <Plus className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="SEARCH_DB..."
                            className="w-full bg-zinc-100 border-[3px] border-black p-5 text-xl font-black tracking-tighter uppercase focus:outline-none focus:bg-white transition-all placeholder:text-zinc-400"
                            defaultValue="MARCUS THORNE"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar-light p-6 space-y-6">
                    {mockLeads.map((item) => (
                        <div
                            key={item.id}
                            className={`p-8 border-[3px] border-black cursor-pointer transition-all ${item.id === 'lead_1'
                                    ? 'bg-yellow-300 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] -translate-x-1 -translate-y-1'
                                    : 'grayscale opacity-40 hover:opacity-100 hover:grayscale-0'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-[10px] font-black uppercase bg-black text-white px-3 py-1 italic tracking-widest">{item.time} AGO</span>
                                {item.id === 'lead_1' && <Zap className="w-5 h-5 fill-black" />}
                            </div>
                            <h3 className="text-3xl font-black tracking-tighter uppercase italic leading-[0.9] mb-2">{item.name}</h3>
                            <p className="text-xs font-black uppercase text-zinc-600">{item.company} // {item.role}</p>
                        </div>
                    ))}
                </div>

                <div className="p-8 border-t-[3px] border-black bg-zinc-100">
                    <div className="text-[12px] font-black uppercase tracking-widest italic flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 border-2 border-black" /> SYSTEM ONLINE
                    </div>
                </div>
            </div>

            {/* 2. Detail View: Brutalist Core */}
            <div className="flex-1 p-12 overflow-y-auto custom-scrollbar-light">
                <div className="max-w-6xl mx-auto space-y-12 pb-24">

                    {/* Impact Header */}
                    <div className="border-[3px] border-black p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-slate-900 relative overflow-hidden group/header">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-300 border-l-[3px] border-b-[3px] border-black flex items-center justify-center -rotate-12 translate-x-12 -translate-y-12 group-hover/header:rotate-0 group-hover/header:translate-x-0 group-hover/header:translate-y-0 transition-all duration-500">
                            <Zap className="w-12 h-12 fill-black" />
                        </div>

                        <div className="flex items-center gap-12">
                            <div className="w-48 h-48 border-[3px] border-black bg-zinc-100 flex items-center justify-center shrink-0 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                                <span className="text-8xl font-black italic">{lead.name[0]}</span>
                            </div>
                            <div className="space-y-4">
                                <div className="inline-block px-4 py-1 bg-black text-white text-[10px] font-black uppercase tracking-widest">
                                    {lead.status}
                                </div>
                                <h2 className="text-8xl font-black tracking-tighter uppercase italic leading-[0.8]">{lead.name}</h2>
                                <p className="text-2xl font-black tracking-tight">{lead.role} <span className="text-zinc-400">@</span> {lead.company}</p>
                            </div>
                        </div>
                    </div>

                    {/* Grid Content */}
                    <div className="grid grid-cols-2 gap-12">

                        {/* Action Matrix */}
                        <div className="space-y-12">
                            <section className="border-[3px] border-black p-10 bg-emerald-400 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer">
                                <h3 className="text-[12px] font-black uppercase tracking-widest mb-8 border-b-2 border-black pb-4 flex items-center gap-3">
                                    <Phone className="w-4 h-4" /> PRIORITY LINE
                                </h3>
                                <p className="text-5xl font-black tracking-tighter italic">{lead.phone}</p>
                            </section>

                            <section className="border-[3px] border-black p-10 bg-sky-400 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer">
                                <h3 className="text-[12px] font-black uppercase tracking-widest mb-8 border-b-2 border-black pb-4 flex items-center gap-3">
                                    <Mail className="w-4 h-4" /> DIGITAL INBOX
                                </h3>
                                <p className="text-4xl font-black tracking-tighter italic">{lead.email}</p>
                            </section>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="border-[3px] border-black p-8 bg-white dark:bg-slate-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] font-black text-center">
                                    <p className="text-[10px] uppercase mb-2">Intent</p>
                                    <p className="text-5xl italic">{lead.intent_score}</p>
                                </div>
                                <div className="border-[3px] border-black p-8 bg-white dark:bg-slate-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] font-black text-center">
                                    <p className="text-[10px] uppercase mb-2">Value</p>
                                    <p className="text-3xl italic tracking-tight">{lead.stats.deal_value}</p>
                                </div>
                            </div>
                        </div>

                        {/* Meta Feed */}
                        <div className="border-[3px] border-black bg-zinc-50 p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-10">
                            <h3 className="text-[14px] font-black uppercase tracking-widest flex items-center gap-3 italic">
                                <BarChart3 className="w-5 h-5" /> RECENT PULSE
                            </h3>

                            <div className="space-y-8">
                                {[
                                    { icon: AtSign, label: 'Email Outreach', val: 'PROPOSAL_GEN' },
                                    { icon: MessageCircle, label: 'WhatsApp', val: 'CLIENT_QUERY' },
                                    { icon: Hash, label: 'Internal UID', val: 'LEAD_998_AX' },
                                    { icon: ShieldAlert, label: 'Security Check', val: 'VERIFIED' },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between border-b-2 border-black pb-6 last:border-0">
                                        <div className="flex items-center gap-4">
                                            <item.icon className="w-5 h-5" />
                                            <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
                                        </div>
                                        <span className="text-xs font-bold leading-none bg-black text-white px-3 py-1 italic">{item.val}</span>
                                    </div>
                                ))}
                            </div>

                            <button className="w-full py-6 bg-black text-white font-black text-xl uppercase italic tracking-tighter hover:bg-zinc-800 transition-colors shadow-[0_4px_0_0_rgba(0,0,0,1)] hover:shadow-none active:translate-y-1">
                                PUSH TO PRODUCTION →
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
