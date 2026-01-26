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
            color: 'from-orange-500',
        },
        {
            name: 'Meera Reddy',
            handle: 'Honda Activa',
            quote: '"The transparency is what I loved. No hidden costs, everything upfront. The delivery was right on time as promised. This is exactly what the two-wheeler market needed."',
            color: 'from-blue-500',
        },
        {
            name: 'Karan Malhotra',
            handle: 'Suzuki V-Strom',
            quote: '"Finally a platform that understands what riders need. The EMI comparison tool saved me so much time and money. Highly recommended for anyone looking to buy a bike."',
            color: 'from-amber-500',
        },
    ];

    return (
        // Note: The parent container (MasterLayout) controls the section background gradient.
        // We utilize transparent backgrounds here to let that flow through.
        <section className="h-full w-full flex flex-col justify-center relative overflow-hidden">
            <div className="max-w-[1440px] mx-auto px-6 h-full flex flex-col justify-center relative z-10 w-full">
                <div className="grid grid-cols-12 gap-8 lg:gap-16 items-center h-full">
                    {/* LEFT COLUMN: Static Context (5/12) - Matches 'Select Your Vibe' */}
                    <div className="col-span-12 lg:col-span-5 space-y-8 relative z-30 lg:pr-12">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center gap-4">
                                <p className="text-sm font-black text-brand-primary uppercase tracking-[0.3em]">
                                    The Community Pulse
                                </p>
                            </div>
                            <h2 className="text-7xl xl:text-9xl font-black uppercase tracking-tighter italic leading-[0.85] text-white drop-shadow-2xl">
                                Rider <br />{' '}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-amber-200">
                                    Pulse.
                                </span>
                            </h2>
                        </motion.div>

                        <motion.p
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="text-xl text-zinc-400 font-medium leading-relaxed max-w-sm border-l-2 border-white/10 pl-6"
                        >
                            Hear from the riders who defined their own path. <br />
                            <span className="text-white italic">Real stories. Real roads.</span>
                        </motion.p>

                        {/* Navigation Controls (Moved to Left Column) */}
                    </div>

                    {/* RIGHT COLUMN: Expanding Accordion (7/12) - Matches 'Select Your Vibe' */}
                    <div className="col-span-12 lg:col-span-7 h-[60vh] flex flex-col lg:flex-row gap-4">
                        {reviews.map((m, i) => {
                            const isActive = activeReview === i;
                            return (
                                <motion.div
                                    key={i}
                                    layout
                                    onMouseEnter={() => setActiveReview(i)}
                                    className={`relative rounded-[2.5rem] overflow-hidden cursor-pointer border transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col justify-between group/card ${
                                        isActive
                                            ? 'flex-[3] bg-white text-black border-white shadow-[0_20px_60px_rgba(0,0,0,0.5)]'
                                            : 'flex-[1] bg-black/40 border-white/10 text-zinc-500 hover:bg-black/60'
                                    }`}
                                >
                                    {/* Active Gradient Splash */}
                                    {isActive && (
                                        <div
                                            className={`absolute inset-0 bg-gradient-to-br ${m.color} to-transparent opacity-10 pointer-events-none`}
                                        />
                                    )}

                                    {/* Inner Content Layout */}
                                    <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-between z-20">
                                        {/* Top Row: Stars & Icon */}
                                        <div
                                            className={`flex items-start ${isActive ? 'justify-between' : 'justify-center'}`}
                                        >
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4, 5].map(s => (
                                                    <Star
                                                        key={s}
                                                        size={14}
                                                        className={`${isActive ? 'text-brand-primary' : 'text-brand-primary/60'} fill-brand-primary transition-colors duration-500`}
                                                    />
                                                ))}
                                            </div>
                                            {isActive && (
                                                <Quote
                                                    size={32}
                                                    className="text-brand-primary/20 rotate-180 transition-colors duration-500"
                                                />
                                            )}
                                        </div>

                                        {/* Middle Content: Quote area */}
                                        <div className="relative flex-1 flex items-center">
                                            {/* Active State Quote */}
                                            <div
                                                className={`transition-all duration-500 delay-100 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 absolute inset-0'}`}
                                            >
                                                <p className="text-xl lg:text-2xl font-bold leading-tight italic">
                                                    {m.quote}
                                                </p>
                                            </div>

                                            {/* Inactive State Vertical Name */}
                                            <div
                                                className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 pointer-events-none transition-all duration-500 ${!isActive ? 'opacity-100' : 'opacity-0'}`}
                                            >
                                                <span className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter text-white/30 whitespace-nowrap">
                                                    {m.name}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Bottom Row: User Profile */}
                                        <div
                                            className={`flex items-center gap-4 transition-all duration-500 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                                        >
                                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-brand-primary/20">
                                                <img
                                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}`}
                                                    alt={m.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-widest">{m.name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
                                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
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
            </div>
        </section>
    );
};
