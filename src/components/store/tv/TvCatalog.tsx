'use client';

import React, { useState } from 'react';
import { TvLayout } from './TvLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, SlidersHorizontal, ArrowUpDown, ChevronRight, Zap, Star, MapPin } from 'lucide-react';
import Link from 'next/link';

const MOCK_PRODUCTS = [
    {
        id: '1',
        make: 'Honda',
        model: 'Activa 125',
        variant: 'Standard',
        price: '₹85,501',
        emi: '₹2,581',
        rating: 4.8,
        image: '/images/categories/scooter_nobg.png',
        tags: ['Bestseller', 'Family'],
    },
    {
        id: '2',
        make: 'TVS',
        model: 'Jupiter 125',
        variant: 'Disc',
        price: '₹88,138',
        emi: '₹2,677',
        rating: 4.7,
        image: '/images/categories/scooter_nobg.png',
        tags: ['Space', 'Comfort'],
    },
    {
        id: '3',
        make: 'Honda',
        model: 'Activa 125',
        variant: 'Deluxe',
        price: '₹1,03,001',
        emi: '₹3,213',
        rating: 4.9,
        image: '/images/categories/scooter_nobg.png',
        tags: ['Premium', 'SmartKey'],
    },
    {
        id: '4',
        make: 'Suzuki',
        model: 'Access 125',
        variant: 'Special Ed.',
        price: '₹92,143',
        emi: '₹2,912',
        rating: 4.6,
        image: '/images/categories/scooter_nobg.png',
        tags: ['Retro', 'Style'],
    },
    {
        id: '5',
        make: 'Yamaha',
        model: 'Fascino 125',
        variant: 'Hybrid',
        price: '₹95,000',
        emi: '₹3,050',
        rating: 4.5,
        image: '/images/categories/scooter_nobg.png',
        tags: ['Hybrid', 'Lightweight'],
    },
    {
        id: '6',
        make: 'Hero',
        model: 'Destini 125',
        variant: 'XTEC',
        price: '₹82,000',
        emi: '₹2,450',
        rating: 4.4,
        image: '/images/categories/scooter_nobg.png',
        tags: ['VFM', 'Tech'],
    },
];

export default function TvCatalog() {
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <TvLayout>
            <div className="p-10 space-y-10 pb-24">
                {/* Search & Filter HUD Header */}
                <header className="flex items-center justify-between gap-8">
                    <div className="flex-1 max-w-2xl relative group">
                        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-slate-500 group-focus-within:text-brand-primary transition-colors">
                            <Search size={24} />
                        </div>
                        <input
                            type="text"
                            placeholder="SEARCH BRANDS OR MODELS..."
                            className="w-full bg-white/5 border border-white/10 rounded-3xl py-6 pl-16 pr-8 text-xl font-black italic uppercase tracking-widest placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:bg-white/10 transition-all"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="tv-glass px-8 py-6 rounded-3xl flex items-center gap-3 text-sm font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                            <SlidersHorizontal size={20} className="text-brand-primary" />
                            Filters
                        </button>
                        <button className="tv-glass px-8 py-6 rounded-3xl flex items-center gap-3 text-sm font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                            <ArrowUpDown size={20} className="text-brand-primary" />
                            Sort
                        </button>
                    </div>
                </header>

                {/* Sub-header with context */}
                <div className="flex items-center justify-between pb-4 border-b border-white/5">
                    <div className="flex items-center gap-4 text-slate-400 text-xs font-black uppercase tracking-[0.2em]">
                        <span className="text-brand-primary">Maharastra</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                        <span>62 Models Found</span>
                    </div>
                    <div className="flex gap-2">
                        {['Scooter', 'Electric', 'Under 1 Lakh'].map(chip => (
                            <span
                                key={chip}
                                className="px-4 py-1.5 bg-white/5 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/5"
                            >
                                {chip}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Cinematic Grid */}
                <section className="grid grid-cols-3 gap-10">
                    <AnimatePresence>
                        {MOCK_PRODUCTS.map((p, idx) => (
                            <motion.div
                                key={p.id}
                                layout
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="tv-card-cinematic group/card"
                            >
                                <Link href="/tv/pdp" className="block outline-none">
                                    <div className="relative aspect-[4/5] bg-gradient-to-br from-slate-900 via-slate-900 to-black rounded-[3rem] p-8 overflow-hidden border border-white/5 shadow-2xl group-hover/card:border-brand-primary/30 group-focus/card:border-brand-primary transition-colors">
                                        {/* Card Header Info */}
                                        <div className="relative z-20 flex justify-between items-start">
                                            <div className="space-y-1">
                                                <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                                                    {p.make}
                                                </div>
                                                <div className="text-3xl font-black italic uppercase tracking-tighter leading-tight">
                                                    {p.model}
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                                                    {p.variant}
                                                </div>
                                            </div>
                                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-500 group-hover/card:text-brand-primary transition-colors">
                                                <Star size={16} fill={idx % 2 === 0 ? 'currentColor' : 'none'} />
                                            </div>
                                        </div>

                                        {/* Image Section */}
                                        <div className="relative h-56 flex items-center justify-center mt-4">
                                            <div className="absolute inset-0 bg-brand-primary/5 blur-[60px] rounded-full scale-75 opacity-0 group-hover/card:opacity-100 transition-opacity" />
                                            <img
                                                src={p.image}
                                                alt={p.model}
                                                className="h-full object-contain filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.4)] group-hover/card:scale-110 transition-transform duration-700"
                                            />
                                        </div>

                                        {/* HUD Pricing Info */}
                                        <div className="absolute bottom-6 left-6 right-6 z-20 space-y-4">
                                            <div className="flex flex-wrap gap-2">
                                                {p.tags.map(tag => (
                                                    <span
                                                        key={tag}
                                                        className="px-3 py-1 bg-white/5 rounded-full text-[8px] font-black uppercase tracking-widest border border-white/5 text-slate-400"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>

                                            <div className="tv-glass p-5 rounded-3xl flex justify-between items-center group-hover/card:bg-brand-primary group-hover/card:text-black transition-colors duration-500">
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-60">
                                                        Starting At
                                                    </span>
                                                    <span className="text-2xl font-black italic leading-none">
                                                        {p.price}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-60">
                                                        EMI From
                                                    </span>
                                                    <span className="text-2xl font-black italic leading-none">
                                                        {p.emi}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Interaction Overlay */}
                                        <div className="absolute inset-0 bg-brand-primary/10 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </section>
            </div>
        </TvLayout>
    );
}
