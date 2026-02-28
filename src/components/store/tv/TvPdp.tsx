'use client';

import React, { useState } from 'react';
import { TvLayout } from './TvLayout';
import { motion } from 'framer-motion';
import {
    Zap,
    Star,
    Shield,
    MapPin,
    ArrowRight,
    CheckCircle2,
    Info,
    ChevronRight,
    Fuel,
    Gauge,
    Weight,
    Timer,
} from 'lucide-react';
import Link from 'next/link';

const PRODUCT = {
    id: 'activa-125',
    make: 'Honda',
    model: 'Activa 125',
    variant: 'Deluxe Smart Key',
    tagline: 'The King of Commute',
    description:
        'Experience the perfect blend of power, style, and advanced features. Now with Smart Key technology, LED headlamps, and silent start.',
    image: '/images/categories/scooter_nobg.png',
    price: '₹1,03,001',
    emi: '₹3,213/mo',
    rating: 4.9,
    reviews: '558K+',
    colors: [
        { name: 'Decent Blue Metallic', hex: '#1e3a8a' },
        { name: 'Rebel Red Metallic', hex: '#991b1b' },
        { name: 'Heavy Grey Metallic', hex: '#374151' },
        { name: 'Pearl Nightstar Black', hex: '#0f172a' },
    ],
    specs: [
        { label: 'Engine', value: '124 cc', icon: Gauge },
        { label: 'Power', value: '8.19 bhp', icon: Zap },
        { label: 'Mileage', value: '50 kmpl', icon: Fuel },
        { label: 'Weight', value: '110 kg', icon: Weight },
    ],
};

export default function TvPdp() {
    const [selectedColor, setSelectedColor] = useState(0);
    const [selectedTenure, setSelectedTenure] = useState(36);

    return (
        <TvLayout>
            <div className="relative min-h-[calc(100vh-80px)] overflow-hidden flex flex-col">
                {/* Background "Ghost" Model Title */}
                <div className="absolute top-10 right-0 left-24 pointer-events-none select-none overflow-hidden h-[40vh] flex items-center justify-center">
                    <h1 className="text-[25vw] font-black italic tracking-tighter uppercase text-white/[0.03] leading-none whitespace-nowrap">
                        {PRODUCT.model}
                    </h1>
                </div>

                <div className="relative z-20 flex-1 grid grid-cols-12 gap-10 p-10 h-full">
                    {/* Left Rail: High-Impact Visual */}
                    <div className="col-span-12 lg:col-span-7 flex flex-col justify-center relative">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className="relative w-full aspect-video group"
                        >
                            <div className="absolute inset-0 bg-brand-primary/5 blur-[120px] rounded-full scale-90" />
                            <img
                                src={PRODUCT.image}
                                alt={PRODUCT.model}
                                className="w-full h-full object-contain filter drop-shadow-[0_30px_60px_rgba(0,0,0,0.6)] group-hover:scale-110 transition-transform duration-1000"
                            />
                        </motion.div>

                        {/* Color Selection HUD Overlay */}
                        <div className="mt-8 flex items-center gap-6 justify-center">
                            <div className="tv-glass px-8 py-4 rounded-3xl flex items-center gap-6">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Available Colors
                                </span>
                                <div className="flex gap-4">
                                    {PRODUCT.colors.map((c, i) => (
                                        <button
                                            key={c.name}
                                            onClick={() => setSelectedColor(i)}
                                            className={`w-10 h-10 rounded-full border-4 transition-all duration-300 ${
                                                selectedColor === i
                                                    ? 'border-brand-primary scale-125 shadow-lg'
                                                    : 'border-white/10'
                                            }`}
                                            style={{ backgroundColor: c.hex }}
                                            title={c.name}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Rail: Cockpit HUD Dashboard */}
                    <div className="col-span-12 lg:col-span-5 flex flex-col justify-center space-y-8">
                        <header className="space-y-2">
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-2 text-brand-primary text-[10px] font-black uppercase tracking-[0.2em]"
                            >
                                <MapPin size={12} />
                                ON-ROAD PUNE, MH
                            </motion.div>
                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-6xl font-black italic uppercase tracking-tighter tv-text-shadow"
                            >
                                {PRODUCT.model}
                            </motion.h1>
                            <motion.h3
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="text-xl text-slate-400 font-black uppercase tracking-widest"
                            >
                                {PRODUCT.variant}
                            </motion.h3>
                        </header>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-lg text-slate-300 leading-relaxed max-w-xl"
                        >
                            {PRODUCT.description}
                        </motion.p>

                        {/* Specs HUD Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {PRODUCT.specs.map((spec, i) => (
                                <motion.div
                                    key={spec.label}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.5 + i * 0.1 }}
                                    className="tv-glass p-5 rounded-3xl flex items-center gap-4 group/spec hover:bg-white/5 transition-colors"
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 group-hover/spec:bg-brand-primary group-hover/spec:text-black transition-all">
                                        <spec.icon size={24} />
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                                            {spec.label}
                                        </div>
                                        <div className="text-xl font-black italic">{spec.value}</div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Finance QuickHUD */}
                        <div className="tv-glass p-8 rounded-[2.5rem] bg-gradient-to-br from-brand-primary/10 to-transparent border-brand-primary/20 space-y-6">
                            <div className="flex justify-between items-end">
                                <div>
                                    <div className="text-[10px] text-brand-primary font-black uppercase tracking-widest mb-1">
                                        Effective Price
                                    </div>
                                    <div className="text-4xl font-black italic tracking-tighter">{PRODUCT.price}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">
                                        Monthly EMI
                                    </div>
                                    <div className="text-3xl font-black italic tracking-tighter text-brand-primary">
                                        {PRODUCT.emi}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                {[24, 36, 48, 60].map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setSelectedTenure(t)}
                                        className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                            selectedTenure === t
                                                ? 'bg-white text-black scale-105 shadow-xl'
                                                : 'bg-white/5 text-slate-500 hover:text-white'
                                        }`}
                                    >
                                        {t} Months
                                    </button>
                                ))}
                            </div>

                            <Link
                                href="/tv"
                                className="w-full py-6 bg-brand-primary text-black rounded-3xl font-black uppercase tracking-widest text-lg shadow-2xl shadow-brand-primary/30 flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform active:scale-95"
                            >
                                <CheckCircle2 size={24} fill="currentColor" />
                                Initiate Booking
                                <ArrowRight size={24} className="ml-2" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Perspective Decorative HUD */}
                <div className="fixed bottom-0 left-24 right-0 h-1 tv-hud-bottom" />
            </div>
        </TvLayout>
    );
}
