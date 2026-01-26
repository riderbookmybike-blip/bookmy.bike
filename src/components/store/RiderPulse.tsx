import React, { useState } from 'react';
import { ChevronRight, Star, Quote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const RiderPulse = () => {
    const [activeReview, setActiveReview] = useState(0);

    const reviews = [
        {
            name: 'Arjun Kapoor',
            handle: 'TVS Jupiter',
            quote: '"Booking my bike online should be as easy as ordering food. I want to see my on-road price, compare EMIs, and confirm the delivery date—without visiting five different showrooms or decoding hidden charges."',
            color: 'from-orange-500'
        },
        {
            name: 'Meera Reddy',
            handle: 'Honda Activa',
            quote: '"The transparency is what I loved. No hidden costs, everything upfront. The delivery was right on time as promised. This is exactly what the two-wheeler market needed."',
            color: 'from-blue-500'
        },
        {
            name: 'Karan Malhotra',
            handle: 'Suzuki V-Strom',
            quote: '"Finally a platform that understands what riders need. The EMI comparison tool saved me so much time and money. Highly recommended for anyone looking to buy a bike."',
            color: 'from-amber-500'
        },
    ];

    return (
        // Note: The parent container (MasterLayout) controls the section background gradient.
        // We utilize transparent backgrounds here to let that flow through.
        <section className="h-full w-full flex flex-col justify-center relative overflow-hidden">

            {/* Content Container */}
            <div className="max-w-[1440px] mx-auto px-8 md:px-16 h-full flex flex-col justify-center gap-12 relative z-10 w-full">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8 shrink-0">
                    <div className="space-y-4 md:space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="h-px w-12 bg-white" />
                            <p className="text-sm font-black text-brand-primary uppercase tracking-[0.3em]">
                                The Community Pulse
                            </p>
                        </div>
                        <h2 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter italic leading-none text-white drop-shadow-2xl">
                            Rider <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-amber-200">Pulse.</span>
                        </h2>
                        <p className="text-lg md:text-xl text-zinc-400 font-medium italic max-w-lg border-l-2 border-white/10 pl-6">
                            Hear from the riders who defined their own path.
                        </p>
                    </div>

                    {/* Navigation Controls (Visual Only) */}
                    <div className="flex gap-4">
                        <button className="w-14 h-14 rounded-full border border-white/10 bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors backdrop-blur-md group cursor-not-allowed opacity-50">
                            <ChevronRight size={24} className="rotate-180 text-zinc-400" />
                        </button>
                        <button className="w-14 h-14 rounded-full bg-brand-primary text-black flex items-center justify-center transition-all shadow-[0_0_20px_rgba(244,176,0,0.3)] cursor-not-allowed opacity-50">
                            <ChevronRight size={24} />
                        </button>
                    </div>
                </div>

                {/* VIBE-STYLE LAYOUT: Expanding Accordion */}
                <div className="flex flex-col lg:flex-row gap-4 h-[50vh] w-full">
                    {reviews.map((m, i) => {
                        const isActive = activeReview === i;
                        return (
                            <motion.div
                                key={i}
                                layout
                                onMouseEnter={() => setActiveReview(i)}
                                className={`relative rounded-[2.5rem] overflow-hidden cursor-pointer border transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col justify-between group/card ${isActive
                                        ? 'flex-[3] bg-white text-black border-white shadow-[0_20px_60px_rgba(0,0,0,0.5)]'
                                        : 'flex-[1] bg-black/40 border-white/10 text-zinc-500 hover:bg-black/60'
                                    }`}
                            >
                                {/* Active Gradient Splash */}
                                {isActive && (
                                    <div className={`absolute inset-0 bg-gradient-to-br ${m.color} to-transparent opacity-10 pointer-events-none`} />
                                )}

                                {/* Inner Content Layout */}
                                <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-between z-20">

                                    {/* Top Row: Stars & Icon */}
                                    <div className="flex justify-between items-start">
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map(s => (
                                                <Star
                                                    key={s}
                                                    size={18}
                                                    className={`${isActive ? 'text-brand-primary fill-brand-primary' : 'text-zinc-600 fill-zinc-600'} transition-colors duration-500`}
                                                />
                                            ))}
                                        </div>
                                        <Quote
                                            size={40}
                                            className={`${isActive ? 'text-brand-primary/20 rotate-180' : 'text-white/5 rotate-180'} transition-colors duration-500`}
                                        />
                                    </div>

                                    {/* Middle Content: Quote area */}
                                    <div className="relative flex-1 flex items-center">
                                        {/* Active State Quote */}
                                        <div className={`transition-all duration-500 delay-100 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 absolute inset-0'}`}>
                                            <p className="text-xl md:text-3xl font-bold leading-tight italic">
                                                {m.quote}
                                            </p>
                                        </div>

                                        {/* Inactive State Vertical Name */}
                                        <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 pointer-events-none transition-all duration-500 ${!isActive ? 'opacity-100' : 'opacity-0'}`}>
                                            <span className="text-4xl font-black uppercase tracking-widest text-white/20 whitespace-nowrap">
                                                {m.name}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Bottom Row: User Profile */}
                                    <div className={`flex items-center gap-4 transition-all duration-500 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                                        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-brand-primary/20">
                                            <img
                                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}`}
                                                alt={m.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black uppercase tracking-widest">
                                                {m.name}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
                                                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                                                    {m.handle}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};
