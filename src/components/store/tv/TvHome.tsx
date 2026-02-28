'use client';

import React from 'react';
import { TvLayout } from './TvLayout';
import { motion } from 'framer-motion';
import { Play, Info, Star, ChevronRight, Zap, Shield, MapPin } from 'lucide-react';
import Link from 'next/link';

const HERO_BIKES = [
    {
        id: 'activa-125',
        make: 'Honda',
        model: 'Activa 125',
        variant: 'Deluxe',
        tagline: 'The King of Commute',
        description:
            'Experience the perfect blend of power, style, and advanced features. Now with Smart Key technology.',
        image: '/images/categories/scooter_nobg.png',
        price: '₹85,501',
        emi: '₹2,581/mo',
        rating: 4.8,
        color: '#f1f5f9',
    },
    {
        id: 'jupiter-125',
        make: 'TVS',
        model: 'Jupiter 125',
        variant: 'Disc',
        tagline: 'Zyada ka Fayda',
        description: "India's most loved scooter with largest-in-class under-seat storage and gas-charged suspension.",
        image: '/images/categories/scooter_nobg.png',
        price: '₹88,138',
        emi: '₹2,677/mo',
        rating: 4.7,
        color: '#e2e8f0',
    },
];

const BRANDS = [
    { name: 'Honda', logo: '/images/brands/honda.png', color: '#ff0000' },
    { name: 'TVS', logo: '/images/brands/tvs.png', color: '#2b2e83' },
    { name: 'Suzuki', logo: '/images/brands/suzuki.png', color: '#0054a6' },
    { name: 'Yamaha', logo: '/images/brands/yamaha.png', color: '#f00000' },
    { name: 'Bajaj', logo: '/images/brands/bajaj.png', color: '#005db3' },
    { name: 'Hero', logo: '/images/brands/hero.png', color: '#ed1c24' },
];

const CATEGORIES = [
    { name: 'Cruisers', count: 12, icon: Zap },
    { name: 'Sportbikes', count: 8, icon: Zap },
    { name: 'Scooters', count: 24, icon: Zap },
    { name: 'Electric', count: 18, icon: Zap },
    { name: 'Adventure', count: 6, icon: Zap },
];

export default function TvHome() {
    return (
        <TvLayout>
            <div className="p-10 space-y-16 pb-24">
                {/* Cinematic Hero */}
                <section className="relative h-[70vh] rounded-[3rem] overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent z-10" />

                    {/* Background Subtle Pattern/Motion */}
                    <div className="absolute inset-0 z-0 opacity-20">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-50" />
                        <motion.div
                            animate={{ opacity: [0.1, 0.3, 0.1] }}
                            transition={{ duration: 5, repeat: Infinity }}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-gradient-radial from-brand-primary/20 to-transparent"
                        />
                    </div>

                    <div className="relative z-20 h-full flex flex-col justify-center px-16 max-w-3xl space-y-6">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-primary/20 border border-brand-primary/30 text-brand-primary text-[10px] font-black uppercase tracking-widest"
                        >
                            <Zap size={12} fill="currentColor" />
                            Featured Launch
                        </motion.div>

                        <div className="space-y-2">
                            <motion.h2
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-slate-400 text-xl font-medium tracking-tight"
                            >
                                {HERO_BIKES[0].make}
                            </motion.h2>
                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-7xl font-black italic tracking-tighter uppercase tv-text-shadow leading-[0.9]"
                            >
                                {HERO_BIKES[0].model}
                            </motion.h1>
                        </div>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-lg text-slate-300 leading-relaxed font-medium"
                        >
                            {HERO_BIKES[0].description}
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="flex items-center gap-6 pt-4"
                        >
                            <Link
                                href="/tv/catalog"
                                className="px-10 py-5 bg-brand-primary text-black rounded-2xl font-black uppercase tracking-widest text-sm shadow-2xl shadow-brand-primary/20 hover:scale-105 transition-transform flex items-center gap-3"
                            >
                                <Play size={20} fill="currentColor" />
                                Explore Now
                            </Link>
                            <button className="px-10 py-5 bg-white/10 backdrop-blur-md border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-white/20 transition-all flex items-center gap-3">
                                <Info size={20} />
                                More Info
                            </button>
                        </motion.div>
                    </div>

                    {/* Hero Bike Image */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, x: 100 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="absolute right-[-5%] top-[10%] w-[60%] h-[80%] z-10 pointer-events-none"
                    >
                        <img
                            src={HERO_BIKES[0].image}
                            alt={HERO_BIKES[0].model}
                            className="w-full h-full object-contain filter drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                        />
                    </motion.div>

                    {/* HUD Stats Overlay */}
                    <div className="absolute bottom-12 right-12 z-20 flex gap-4">
                        {[
                            { label: 'Rating', value: HERO_BIKES[0].rating, icon: Star },
                            { label: 'Price', value: HERO_BIKES[0].price, icon: Zap },
                            { label: 'EMI', value: HERO_BIKES[0].emi, icon: Shield },
                        ].map(stat => (
                            <div
                                key={stat.label}
                                className="tv-glass px-6 py-4 rounded-3xl flex flex-col items-center min-w-[120px]"
                            >
                                <stat.icon size={16} className="text-brand-primary mb-1" />
                                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                    {stat.label}
                                </span>
                                <span className="text-lg font-black italic">{stat.value}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Brands Rail */}
                <section className="space-y-6">
                    <div className="flex justify-between items-end">
                        <h3 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                            <Star className="text-brand-primary" fill="currentColor" size={20} />
                            Top Brands
                        </h3>
                        <Link
                            href="/tv/catalog"
                            className="text-brand-primary text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-transform"
                        >
                            View All <ChevronRight size={14} />
                        </Link>
                    </div>

                    <div className="tv-rail-container">
                        {BRANDS.map(brand => (
                            <div
                                key={brand.name}
                                className="tv-card-cinematic min-w-[200px] aspect-[16/9] tv-glass rounded-3xl p-6 flex items-center justify-center group/brand overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover/brand:opacity-100 transition-opacity" />
                                <img
                                    src={brand.logo}
                                    alt={brand.name}
                                    className="w-24 h-24 object-contain filter grayscale invert brightness-200 group-hover/brand:grayscale-0 group-hover/brand:scale-110 transition-all duration-500"
                                />
                                <div className="absolute bottom-4 opacity-0 group-hover/brand:opacity-100 transition-opacity text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary">
                                    {brand.name}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Categories Rail */}
                <section className="space-y-6">
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                        <Zap className="text-brand-primary" fill="currentColor" size={20} />
                        Browse Segments
                    </h3>
                    <div className="tv-rail-container">
                        {CATEGORIES.map(cat => (
                            <div
                                key={cat.name}
                                className="tv-card-cinematic min-w-[240px] aspect-[4/3] bg-gradient-to-br from-slate-900 to-black border border-white/5 rounded-[2.5rem] p-8 flex flex-col justify-between group/cat"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary group-hover/cat:scale-110 group-hover/cat:bg-brand-primary group-hover/cat:text-black transition-all">
                                    <cat.icon size={24} />
                                </div>
                                <div>
                                    <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">
                                        {cat.count} Models
                                    </div>
                                    <div className="text-2xl font-black italic uppercase tracking-tight">
                                        {cat.name}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </TvLayout>
    );
}
