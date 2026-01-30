'use client';

import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Heart, Share2, Bookmark, ChevronRight, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { MobileFooter } from '../layout/MobileFooter';
import { MobileHeader } from '../layout/MobileHeader';

export const MobileHomeOptionG = () => {
    const [activeCard, setActiveCard] = useState(0);
    const [likedBrands, setLikedBrands] = useState<Set<string>>(new Set());

    const cards = [
        { title: 'SCOOTERS', img: '/images/templates/t3_night.png', color: 'from-blue-500', count: '120+' },
        { title: 'MOTORCYCLES', img: '/images/templates/t3_night.png', color: 'from-orange-500', count: '200+' },
        { title: 'MOPEDS', img: '/images/templates/t3_night.png', color: 'from-green-500', count: '60+' }
    ];

    const handleSwipe = (direction: number) => {
        if (direction > 0 && activeCard < cards.length - 1) {
            setActiveCard(activeCard + 1);
        } else if (direction < 0 && activeCard > 0) {
            setActiveCard(activeCard - 1);
        }
    };

    return (
        <div className="bg-gradient-to-br from-purple-950 via-black to-black text-white min-h-screen pb-20 overflow-x-hidden">
            <MobileHeader />
            {/* 1. HERO DECK */}
            <section className="min-h-screen flex flex-col justify-end px-6 py-12 relative pt-24">
                {/* Ambient Glow */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-500/20 blur-[120px] rounded-full" />

                {/* Top Status Bar */}
                <div className="absolute top-8 left-6 right-6 flex items-center justify-between z-50">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-xl rounded-full border border-white/20"
                    >
                        <Sparkles size={14} className="text-purple-400" />
                        <span className="text-xs font-bold">Premium</span>
                    </motion.div>
                    <motion.button
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-10 h-10 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 flex items-center justify-center"
                    >
                        <Share2 size={16} />
                    </motion.button>
                </div>

                {/* Card Stack */}
                <div className="relative h-[60vh] mb-12">
                    {cards.map((card, i) => {
                        const offset = i - activeCard;
                        const isActive = i === activeCard;

                        return (
                            <motion.div
                                key={i}
                                drag={isActive ? "x" : false}
                                dragConstraints={{ left: 0, right: 0 }}
                                onDragEnd={(e, info) => {
                                    if (Math.abs(info.offset.x) > 100) {
                                        handleSwipe(info.offset.x > 0 ? -1 : 1);
                                    }
                                }}
                                animate={{
                                    scale: isActive ? 1 : 0.9 - Math.abs(offset) * 0.05,
                                    y: offset * 20,
                                    opacity: Math.abs(offset) > 1 ? 0 : 1,
                                    rotateZ: isActive ? 0 : offset * 2,
                                    zIndex: cards.length - Math.abs(offset)
                                }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="absolute inset-0 cursor-grab active:cursor-grabbing"
                            >
                                <div className={`w-full h-full bg-gradient-to-br ${card.color} to-black rounded-[3rem] overflow-hidden shadow-2xl border border-white/10`}>
                                    <div className="relative w-full h-full p-8 flex flex-col justify-between">
                                        {/* Card Header */}
                                        <div>
                                            <p className="text-xs text-white/60 uppercase tracking-[0.3em] mb-2">{card.count} Models</p>
                                            <h2 className="text-5xl font-black uppercase tracking-tighter">{card.title}</h2>
                                        </div>

                                        {/* Card Image */}
                                        <div className="absolute inset-0 flex items-center justify-center opacity-20">
                                            <Image
                                                src={card.img}
                                                alt={card.title}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>

                                        {/* Card Actions */}
                                        <div className="flex gap-3 relative z-10">
                                            <motion.button
                                                whileTap={{ scale: 0.9 }}
                                                className="flex-1 py-4 bg-white text-black rounded-full font-black text-sm uppercase tracking-wider shadow-lg"
                                            >
                                                Explore
                                            </motion.button>
                                            <motion.button
                                                whileTap={{ scale: 0.9 }}
                                                className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/30"
                                            >
                                                <Bookmark size={20} />
                                            </motion.button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Card Indicators */}
                <div className="flex justify-center gap-2 mb-8">
                    {cards.map((_, i) => (
                        <motion.div
                            key={i}
                            animate={{
                                width: i === activeCard ? 24 : 8,
                                opacity: i === activeCard ? 1 : 0.3
                            }}
                            className="h-2 bg-white rounded-full"
                        />
                    ))}
                </div>

                {/* Stats Pills */}
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {[
                        { label: '380+ Bikes', icon: '🏍️' },
                        { label: '4H Delivery', icon: '⚡' },
                        { label: '₹12K Savings', icon: '💰' },
                        { label: 'Lowest EMI', icon: '🎯' }
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex-shrink-0 px-6 py-3 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 flex items-center gap-2"
                        >
                            <span className="text-lg">{stat.icon}</span>
                            <span className="text-xs font-bold whitespace-nowrap">{stat.label}</span>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* 2. BRAND BUBBLES */}
            <section className="px-6 py-16">
                <motion.h2
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    className="text-4xl font-black mb-8"
                >
                    Top Brands
                </motion.h2>

                <div className="grid grid-cols-3 gap-4">
                    {['HONDA', 'YAMAHA', 'KTM', 'TVS', 'BAJAJ', 'SUZUKI'].map((brand, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="relative"
                        >
                            <div className="aspect-square bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl border border-white/10 flex flex-col items-center justify-center p-4 active:bg-white/20 transition-all">
                                <span className="text-sm font-black text-center">{brand}</span>
                                <motion.button
                                    whileTap={{ scale: 1.2 }}
                                    onClick={() => {
                                        const newLiked = new Set(likedBrands);
                                        if (newLiked.has(brand)) {
                                            newLiked.delete(brand);
                                        } else {
                                            newLiked.add(brand);
                                        }
                                        setLikedBrands(newLiked);
                                    }}
                                    className="absolute top-2 right-2 w-8 h-8 bg-black/40 backdrop-blur-xl rounded-full flex items-center justify-center"
                                >
                                    <Heart
                                        size={14}
                                        className={likedBrands.has(brand) ? 'fill-red-500 text-red-500' : 'text-white'}
                                    />
                                </motion.button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* 3. PROCESS TIMELINE */}
            <section className="px-6 py-16">
                <motion.h2
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    className="text-4xl font-black mb-12"
                >
                    How it Works
                </motion.h2>

                <div className="space-y-6">
                    {[
                        { step: '1', title: 'Browse', desc: 'Swipe through 380+ bikes', color: 'from-blue-500' },
                        { step: '2', title: 'Quote', desc: 'Get instant pricing', color: 'from-purple-500' },
                        { step: '3', title: 'Ride', desc: 'Delivery in 4 hours', color: 'from-pink-500' }
                    ].map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex gap-6"
                        >
                            <div className={`w-16 h-16 flex-shrink-0 bg-gradient-to-br ${item.color} to-black rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg`}>
                                {item.step}
                            </div>
                            <div className="flex-1 pt-2">
                                <h3 className="text-2xl font-black mb-2">{item.title}</h3>
                                <p className="text-sm text-white/60">{item.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* 4. QUICK ACTIONS */}
            <section className="px-6 py-16">
                <div className="grid grid-cols-2 gap-4">
                    {[
                        { title: 'Best Deals', emoji: '🔥', link: '/m/store/catalog?sort=price' },
                        { title: 'New Arrivals', emoji: '✨', link: '/m/store/catalog?sort=new' },
                        { title: 'Top Rated', emoji: '⭐', link: '/m/store/catalog?sort=rating' },
                        { title: 'Low EMI', emoji: '💳', link: '/m/store/catalog?sort=emi' }
                    ].map((action, i) => (
                        <Link
                            key={i}
                            href={action.link}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="aspect-square bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl border border-white/10 flex flex-col items-center justify-center p-6 active:bg-white/20 transition-all"
                            >
                                <span className="text-4xl mb-3">{action.emoji}</span>
                                <span className="text-sm font-black text-center">{action.title}</span>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* 5. FLOATING CTA */}
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="fixed bottom-6 left-6 right-6 z-50"
            >
                <Link href="/m/store/catalog">
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        className="w-full py-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full font-black text-lg uppercase tracking-wider shadow-2xl flex items-center justify-center gap-3"
                    >
                        Explore All Bikes
                        <ChevronRight size={24} />
                    </motion.button>
                </Link>
            </motion.div>

            {/* 6. FOOTER */}
            <div className="mt-20">
                <MobileFooter />
            </div>
        </div>
    );
};
