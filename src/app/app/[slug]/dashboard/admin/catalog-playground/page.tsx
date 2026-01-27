'use client';

import React, { useState } from 'react';
import {
    Package,
    Layers,
    Box,
    Plus,
    Search,
    Filter,
    ChevronRight,
    Zap,
    Shield,
    Cpu,
    Layout,
    Monitor,
    Grid,
    MousePointer2,
    Activity,
    Info,
    CheckCircle2,
    MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- MOCK DATA ---
const MOCK_PRODUCTS = [
    { id: '1', brand: 'ARIHANT', name: 'Safety Guard', family: 'STANDARD', variant: 'ACTIVA', color: 'SILVER', sku: '#956-789-B22', status: 'ACTIVE', category: 'Accessories', image: 'https://images.unsplash.com/photo-1558981403-c5f9199ad250?q=80&w=200&auto=format&fit=crop' },
    { id: '2', brand: 'ARIHANT', name: 'Premium Guard', family: 'PREMIUM', variant: 'JUPITER', color: 'BLACK', sku: '#375-A46-38E', status: 'ACTIVE', category: 'Accessories', image: 'https://images.unsplash.com/photo-1558981403-c5f9199ad250?q=80&w=200&auto=format&fit=crop' },
    { id: '3', brand: 'BOOKMYBIKE', name: 'Rider Helmet', family: 'PRO-RACE', variant: 'XL', color: 'MATTE BLACK', sku: '#F4A-188-4BA', status: 'ACTIVE', category: 'Gear', image: 'https://images.unsplash.com/photo-1558981403-c5f9199ad250?q=80&w=200&auto=format&fit=crop' },
    { id: '4', brand: 'HONDA', name: 'Activa 6G', family: 'SCOOTER', variant: 'DLX', color: 'BLUE', sku: '#HND-6G-882', status: 'ACTIVE', category: 'Vehicles', image: 'https://images.unsplash.com/photo-1558981403-c5f9199ad250?q=80&w=200&auto=format&fit=crop' },
];

const STATS = [
    { label: 'Total Products', value: '4,892', icon: Package, color: 'text-blue-500' },
    { label: 'Active Families', value: '32', icon: Layers, color: 'text-amber-500' },
    { label: 'Total SKUs', value: '1,244', icon: Box, color: 'text-indigo-500' },
    { label: 'Sync Status', value: 'Optimal', icon: Activity, color: 'text-emerald-500' }
];

// --- DESIGN COMPONENTS ---

// 1. RAW INDUSTRIAL (Dark/Tactical)
const IndustrialDesign = () => (
    <div className="space-y-8 bg-slate-950 p-8 rounded-[32px] border border-slate-800 shadow-2xl overflow-hidden relative group">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(244,176,0,0.05),transparent_50%)]" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
            <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[10px] font-black uppercase text-amber-500 tracking-widest mb-3">
                    <Cpu size={12} />
                    Unified System Interface
                </div>
                <h2 className="text-4xl font-black text-white flex items-baseline gap-2 italic uppercase">
                    Catalog <span className="text-amber-500">_Nexus</span>
                </h2>
                <p className="text-slate-500 text-sm font-medium mt-1">Strategic Asset Management & Logical Units</p>
            </div>
            <button className="px-6 py-3 bg-amber-500 text-black font-black uppercase text-sm rounded-xl hover:bg-amber-400 transition-all shadow-[0_4px_20px_rgba(244,176,0,0.3)] flex items-center gap-2 group/btn">
                <Plus size={18} strokeWidth={3} />
                Initiate Unit
                <ChevronRight size={16} strokeWidth={3} className="group-hover/btn:translate-x-1 transition-transform" />
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
            {STATS.map((stat, i) => (
                <div key={i} className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl group/stat hover:border-amber-500/50 transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-xl bg-slate-950 border border-slate-800 group-hover/stat:scale-110 transition-transform ${stat.color}`}>
                            <stat.icon size={20} />
                        </div>
                        <div className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">Live v2.4</div>
                    </div>
                    <div className="text-3xl font-black text-white tabular-nums tracking-tighter">{stat.value}</div>
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1">{stat.label}</div>
                </div>
            ))}
        </div>

        <div className="bg-slate-900/30 border border-slate-800 rounded-3xl overflow-hidden relative z-10 backdrop-blur-md">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-sm font-bold text-white placeholder:text-slate-700 focus:border-amber-500/50 outline-none transition-all" placeholder="SCAN_ARCHIVE_BY_SKU..." />
                </div>
                <div className="flex gap-2">
                    {['All', 'Vehicles', 'Gear'].map(t => (
                        <button key={t} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all">{t}</button>
                    ))}
                </div>
            </div>
            <div className="divide-y divide-slate-800">
                {MOCK_PRODUCTS.map((p, i) => (
                    <div key={i} className="p-6 hover:bg-amber-500/[0.02] transition-colors group/row flex items-center gap-6">
                        <div className="w-16 h-16 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden relative group-hover/row:border-amber-500/50 transition-all flex-shrink-0">
                            <img src={p.image} className="w-full h-full object-cover opacity-60 group-hover/row:opacity-100 group-hover/row:scale-110 transition-all" alt="" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent" />
                        </div>
                        <div className="flex-1 grid grid-cols-4 gap-4">
                            <div className="col-span-1">
                                <div className="text-[10px] font-black text-amber-500/50 uppercase tracking-widest mb-1">{p.brand}</div>
                                <div className="text-lg font-black text-white uppercase">{p.name}</div>
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Variant Family</div>
                                <div className="text-sm font-bold text-slate-300">{p.variant} / {p.family}</div>
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Registry SKU</div>
                                <div className="text-sm font-mono font-bold text-slate-400 group-hover/row:text-amber-500 transition-colors">{p.sku}</div>
                            </div>
                            <div className="flex flex-col items-end justify-center">
                                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{p.status}</span>
                                </div>
                            </div>
                        </div>
                        <button className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-500 hover:text-white hover:border-slate-700 transition-all">
                            <MoreVertical size={18} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

// 2. CLEAN MINIMALIST (Light/Glassmorphic)
const MinimalistDesign = () => (
    <div className="space-y-8 bg-[#F8F9FA] p-8 rounded-[48px] border border-white shadow-[0_24px_80px_rgba(0,0,0,0.04)] overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-sky-200/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />

        <div className="flex justify-between items-center relative z-10">
            <div>
                <h2 className="text-5xl font-medium text-slate-900 tracking-tight">Catalog</h2>
                <p className="text-slate-500 mt-2 text-lg">Curated products and collections</p>
            </div>
            <button className="h-14 px-8 bg-black text-white font-semibold rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10 flex items-center gap-2">
                <Plus size={20} />
                New Addition
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
            {STATS.map((stat, i) => (
                <div key={i} className="bg-white/60 border border-white p-8 rounded-[32px] backdrop-blur-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-6 text-slate-900">
                        <stat.icon size={24} />
                    </div>
                    <div className="text-4xl font-semibold text-slate-900 mb-1">{stat.value}</div>
                    <div className="text-sm font-medium text-slate-400">{stat.label}</div>
                </div>
            ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            {MOCK_PRODUCTS.map((p, i) => (
                <div key={i} className="group cursor-pointer">
                    <div className="relative mb-4 bg-white rounded-[40px] aspect-[4/5] overflow-hidden border border-white shadow-sm transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:shadow-2xl group-hover:-translate-y-2">
                        <img src={p.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
                        <div className="absolute top-6 right-6">
                            <span className="px-4 py-1.5 bg-white/90 backdrop-blur-md rounded-full text-[11px] font-bold text-slate-900 shadow-sm">{p.category}</span>
                        </div>
                        <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-white/90 to-transparent">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                <span className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">{p.status}</span>
                            </div>
                        </div>
                    </div>
                    <div className="px-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">{p.brand}</div>
                        <h3 className="text-xl font-semibold text-slate-900 group-hover:text-amber-600 transition-colors uppercase italic">{p.name}</h3>
                        <div className="flex justify-between items-center mt-3">
                            <span className="text-sm text-slate-400 font-medium">{p.variant} • {p.color}</span>
                            <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500">{p.sku}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// 3. IMMERSIVE 3D (Depth focus - using heavy shadows and scale)
const ImmersiveDesign = () => (
    <div className="space-y-12 bg-zinc-900 p-12 rounded-[60px] border border-zinc-800 shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="flex justify-between items-end">
            <div className="space-y-2">
                <div className="h-1 w-20 bg-amber-500 rounded-full" />
                <h2 className="text-6xl font-black text-white italic uppercase tracking-tighter">Product<br /><span className="text-amber-500">Universe</span></h2>
            </div>
            <div className="bg-zinc-800 px-8 py-6 rounded-[24px] border border-zinc-700 flex gap-8">
                {STATS.slice(0, 3).map((s, i) => (
                    <div key={i} className="text-center">
                        <div className="text-[10px] font-black text-zinc-500 uppercase mb-1">{s.label}</div>
                        <div className="text-2xl font-black text-white">{s.value}</div>
                    </div>
                ))}
            </div>
        </div>

        <div className="perspective-[2000px] grid grid-cols-1 md:grid-cols-3 gap-12 py-10">
            {MOCK_PRODUCTS.slice(0, 3).map((p, i) => (
                <div key={i} className="group relative rotate-y-[-10deg] hover:rotate-y-0 hover:scale-105 transition-all duration-700 ease-out">
                    <div className="bg-zinc-800 p-8 rounded-[40px] border border-zinc-700 shadow-[20px_40px_60px_rgba(0,0,0,0.5)] h-full relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <img src={p.image} className="w-full aspect-square object-cover rounded-[32px] mb-8 shadow-2xl transition-transform duration-700 group-hover:-translate-y-4" alt="" />
                        <div className="space-y-4">
                            <div className="text-4xl font-black text-white tracking-tighter uppercase">{p.name}</div>
                            <div className="flex items-center gap-4 text-zinc-500 font-bold uppercase text-xs">
                                <span>{p.brand}</span>
                                <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                                <span>{p.sku}</span>
                            </div>
                            <div className="pt-6">
                                <button className="w-full py-4 bg-zinc-700 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-amber-500 hover:text-black transition-all">Configure Unit</button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// 4. FUTURISTIC TERMINAL (Cyber/Data focus)
const TerminalDesign = () => (
    <div className="bg-[#050505] p-10 rounded-lg border-2 border-amber-900/30 font-mono overflow-hidden">
        <div className="flex justify-between items-start border-b border-amber-900/30 pb-6 mb-8 uppercase tracking-widest text-amber-500/50 text-[10px] font-bold">
            <div>Root_Directory / Catalog_v4.0.2</div>
            <div>[ STATUS: ONLINE ] [ SECURE_CORE: ACTIVE ]</div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {STATS.map((s, i) => (
                <div key={i} className="space-y-1">
                    <div className="text-amber-500/40 text-[9px] uppercase font-black">{s.label}</div>
                    <div className="text-3xl font-black text-amber-500 tabular-nums tracking-tighter hover:text-amber-400 transition-colors cursor-default leading-none">
                        {s.value}
                        <span className="text-[10px] ml-1 opacity-50 underline cursor-pointer">_SCAN</span>
                    </div>
                </div>
            ))}
        </div>

        <div className="w-full text-amber-500/80">
            <div className="grid grid-cols-5 py-3 border-y border-amber-900/20 text-[10px] uppercase font-black tracking-widest bg-amber-500/5">
                <div className="pl-4">UID_HEX</div>
                <div>BRAND/MODEL_NODE</div>
                <div>SKU_ARCHIVE</div>
                <div>STATUS</div>
                <div className="text-right pr-4">ACTION_CMD</div>
            </div>
            {MOCK_PRODUCTS.map((p, i) => (
                <div key={i} className="grid grid-cols-5 py-4 border-b border-amber-900/10 items-center hover:bg-amber-500/5 transition-all group cursor-pointer">
                    <div className="pl-4 text-amber-500/40 text-xs">00x{i + 1}f{p.id}</div>
                    <div>
                        <div className="font-black text-sm group-hover:text-white transition-colors uppercase">{p.name}</div>
                        <div className="text-[9px] opacity-50">{p.brand} // {p.family}</div>
                    </div>
                    <div className="text-xs font-bold text-amber-300/60 ">{p.sku}</div>
                    <div>
                        <span className="inline-flex items-center gap-2 text-[10px] font-black border border-amber-500/30 px-2 py-0.5 rounded">
                            <div className="w-1 h-1 bg-amber-500 animate-pulse" />
                            {p.status}
                        </span>
                    </div>
                    <div className="text-right pr-4">
                        <button className="text-[10px] font-black underline hover:text-white transition-colors">INIT_EDIT</button>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// 5. MODERN BENTO (Minimal/Playful)
const BentoDesign = () => (
    <div className="grid grid-cols-12 gap-6 p-8 bg-slate-50 min-h-[800px] rounded-[48px]">
        <div className="col-span-8 space-y-6">
            <div className="flex justify-between items-center bg-white p-8 rounded-[40px] shadow-sm border border-slate-200">
                <div>
                    <h1 className="text-4xl font-extra-bold text-slate-800 tracking-tight">Vault</h1>
                    <p className="text-slate-500 font-medium">Digital asset catalog</p>
                </div>
                <button className="p-4 bg-indigo-600 rounded-full text-white shadow-lg shadow-indigo-600/20 hover:scale-110 active:scale-95 transition-all">
                    <Plus size={24} />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
                {MOCK_PRODUCTS.slice(0, 2).map((p, i) => (
                    <div key={i} className="bg-white p-6 rounded-[40px] shadow-sm border border-slate-200 group">
                        <div className="aspect-video w-full rounded-[32px] overflow-hidden mb-6">
                            <img src={p.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" />
                        </div>
                        <div className="flex justify-between items-end">
                            <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{p.brand}</div>
                                <h3 className="text-2xl font-bold text-slate-800 uppercase italic">{p.name}</h3>
                            </div>
                            <div className="text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-2xl">{p.sku}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-800">Recent Inventory</h3>
                    <button className="text-sm font-bold text-indigo-600 hover:underline">View All</button>
                </div>
                <div className="space-y-4">
                    {MOCK_PRODUCTS.map((p, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-[24px] transition-colors border border-transparent hover:border-slate-100">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100" />
                            <div className="flex-1">
                                <div className="font-bold text-slate-800 uppercase italic">{p.name}</div>
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{p.sku}</div>
                            </div>
                            <div className="text-sm font-bold text-slate-400">{p.variant}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
        <div className="col-span-4 space-y-6">
            <div className="bg-amber-400 p-8 rounded-[40px] text-amber-950 relative overflow-hidden group">
                <Box className="absolute -right-4 -bottom-4 w-40 h-40 opacity-10 group-hover:rotate-12 transition-transform duration-700" size={40} />
                <div className="text-6xl font-black tracking-tighter mb-2 tabular-nums">1,244</div>
                <div className="text-lg font-bold opacity-80 uppercase tracking-widest">Global SKUs</div>
                <div className="mt-8 pt-8 border-t border-amber-950/10">
                    <button className="flex items-center gap-2 text-sm font-bold">
                        Detailed Ledger <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            <div className="bg-indigo-600 p-8 rounded-[40px] text-white relative overflow-hidden">
                <div className="text-4xl font-black mb-1">98%</div>
                <div className="text-sm font-bold opacity-80 uppercase tracking-widest">Sync Health</div>
                <div className="mt-12 flex -space-x-3">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="w-10 h-10 rounded-full bg-indigo-500 border-2 border-indigo-600 flex items-center justify-center font-bold text-xs">U{i}</div>
                    ))}
                </div>
            </div>

            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 uppercase mb-6 tracking-tight">Active Categories</h3>
                <div className="space-y-3">
                    {['Vehicles', 'Gear', 'Accessories', 'Services'].map(c => (
                        <div key={c} className="flex items-center justify-between p-4 bg-slate-50 rounded-[20px] font-bold text-slate-600">
                            <span>{c}</span>
                            <ChevronRight size={16} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

// --- MAIN PAGE ---

export default function CatalogPlayground() {
    const [activeDesign, setActiveDesign] = useState<'industrial' | 'minimalist' | 'immersive' | 'terminal' | 'bento'>('industrial');

    const designs = [
        { id: 'industrial', label: 'Industrial', icon: Cpu, color: 'hover:text-amber-500', bg: 'bg-slate-950' },
        { id: 'minimalist', label: 'Minimalist', icon: Layout, color: 'hover:text-blue-500', bg: 'bg-white' },
        { id: 'immersive', label: 'Immersive', icon: Grid, color: 'hover:text-emerald-500', bg: 'bg-zinc-900' },
        { id: 'terminal', label: 'Terminal', icon: Monitor, color: 'hover:text-amber-500', bg: 'bg-[#050505]' },
        { id: 'bento', label: 'Bento Grid', icon: Box, color: 'hover:text-indigo-500', bg: 'bg-slate-50' }
    ];

    return (
        <div className="min-h-screen bg-slate-100 p-6 font-sans">
            <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">

                {/* Sidebar Navigation */}
                <aside className="space-y-6">
                    <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-200">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-black shadow-lg shadow-amber-500/20">
                                <Zap size={20} className="fill-current" />
                            </div>
                            <span className="font-black text-xl uppercase tracking-tighter text-slate-800">Labs_v2</span>
                        </div>

                        <div className="space-y-2">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 pl-2">Select Design Archetype</div>
                            {designs.map((design) => (
                                <button
                                    key={design.id}
                                    onClick={() => setActiveDesign(design.id as any)}
                                    className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl transition-all duration-300 relative group
                                        ${activeDesign === design.id
                                            ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20 scale-105 z-10'
                                            : 'text-slate-500 hover:bg-slate-50 hover:translate-x-1'}`}
                                >
                                    <design.icon size={18} strokeWidth={activeDesign === design.id ? 3 : 2} />
                                    <span className="font-black text-xs uppercase tracking-widest">{design.label}</span>
                                    {activeDesign === design.id && (
                                        <motion.div layoutId="active-pill" className="absolute right-4 w-1.5 h-1.5 rounded-full bg-amber-500" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-900 p-8 rounded-[32px] text-white relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        <Shield className="text-amber-500 mb-4" size={32} />
                        <h3 className="text-lg font-black uppercase italic tracking-tight mb-2">Instructions</h3>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed mb-6">Explore these functional concepts. Each uses a distinct design language developed from scratch to maximize UX/UI depth.</p>
                        <button className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                            Request Implementation
                        </button>
                    </div>
                </aside>

                {/* Main Viewport */}
                <main>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeDesign}
                            initial={{ opacity: 0, y: 20, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.98 }}
                            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                            className="w-full"
                        >
                            {activeDesign === 'industrial' && <IndustrialDesign />}
                            {activeDesign === 'minimalist' && <MinimalistDesign />}
                            {activeDesign === 'immersive' && <ImmersiveDesign />}
                            {activeDesign === 'terminal' && <TerminalDesign />}
                            {activeDesign === 'bento' && <BentoDesign />}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}
