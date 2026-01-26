import React from 'react';
import { ChevronRight, Star } from 'lucide-react';

export const RiderPulse = () => {
    const reviews = [
        {
            name: 'Arjun Kapoor',
            handle: 'TVS Jupiter',
            quote: '"Booking my bike online should be as easy as ordering food. I want to see my on-road price, compare EMIs, and confirm the delivery date—without visiting five different showrooms or decoding hidden charges."',
        },
        {
            name: 'Meera Reddy',
            handle: 'Honda Activa',
            quote: '"The transparency is what I loved. No hidden costs, everything upfront. The delivery was right on time as promised. This is exactly what the two-wheeler market needed."',
        },
        {
            name: 'Karan Malhotra',
            handle: 'Suzuki V-Strom',
            quote: '"Finally a platform that understands what riders need. The EMI comparison tool saved me so much time and money. Highly recommended for anyone looking to buy a bike."',
        },
    ];

    return (
        <section className="min-h-screen snap-start flex flex-col justify-center py-12 md:py-16 bg-[#0b0d10] text-white overflow-hidden relative border-t border-white/5">
            {/* Background Texture similar to Vibe Deck for consistency */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 right-0 w-2/3 h-2/3 bg-brand-primary/5 blur-[100px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-blue-900/10 blur-[100px] rounded-full pointer-events-none" />
            </div>

            <div className="max-w-[1440px] mx-auto px-8 md:px-16 space-y-12 md:space-y-16 relative z-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8">
                    <div className="space-y-4 md:space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="h-px w-12 bg-brand-primary" />
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
                    <div className="flex gap-4">
                        <button className="w-14 h-14 rounded-full border border-white/10 bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors backdrop-blur-md group">
                            <ChevronRight size={24} className="rotate-180 text-zinc-400 group-hover:text-white transition-colors" />
                        </button>
                        <button className="w-14 h-14 rounded-full bg-brand-primary text-black flex items-center justify-center hover:bg-brand-primary/90 transition-all shadow-[0_0_20px_rgba(244,176,0,0.3)] hover:scale-105">
                            <ChevronRight size={24} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {reviews.map((m, i) => (
                        <div
                            key={i}
                            className="group p-10 bg-white/5 border border-white/5 rounded-[2.5rem] space-y-8 hover:bg-white/10 hover:border-brand-primary/30 transition-all duration-500 relative hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)] backdrop-blur-sm"
                        >
                            <div className="absolute top-10 right-10 opacity-10 group-hover:opacity-20 transition-opacity">
                                <svg width="48" height="48" viewBox="0 0 40 40" fill="currentColor">
                                    <path d="M10 10v10h10V10H10zm0 20h10V20H10v10zm20-20v10h10V10H30zm0 20h10V20H30v10z" />
                                </svg>
                            </div>

                            <div className="flex gap-1.5">
                                {[1, 2, 3, 4, 5].map(s => (
                                    <Star key={s} size={16} className="text-brand-primary fill-brand-primary drop-shadow-[0_0_8px_rgba(244,176,0,0.5)]" />
                                ))}
                            </div>

                            <p className="text-lg md:text-xl font-medium text-zinc-300 leading-relaxed italic">
                                {m.quote}
                            </p>

                            <div className="pt-8 border-t border-white/5 flex items-center gap-5">
                                <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 overflow-hidden relative group-hover:border-brand-primary/50 transition-colors">
                                    <img
                                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}`}
                                        alt={m.name}
                                        className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-500"
                                    />
                                </div>
                                <div>
                                    <p className="text-base font-black uppercase tracking-widest italic text-white group-hover:text-brand-primary transition-colors">
                                        {m.name}
                                    </p>
                                    <div className="inline-flex items-center gap-2 mt-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                            {m.handle}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-center gap-3 pt-8">
                    {[1, 2, 3, 4, 5, 6].map(dot => (
                        <div
                            key={dot}
                            className={`h-1.5 rounded-full ${dot === 1 ? 'bg-brand-primary w-8' : 'bg-white/10 w-8 hover:bg-white/20'} transition-all duration-300 cursor-pointer`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};
