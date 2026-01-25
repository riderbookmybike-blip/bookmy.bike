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
        <section className="min-h-screen snap-start flex flex-col justify-center py-12 md:py-16 bg-white dark:bg-[#0b0d10] text-slate-900 dark:text-white overflow-hidden relative border-t border-slate-100 dark:border-white/8">
            <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20 space-y-10 md:space-y-12 relative z-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8">
                    <div className="space-y-4 md:space-y-5">
                        <p className="text-[10px] md:text-[12px] font-black text-brand-primary uppercase tracking-[0.5em] italic leading-none">
                            The Community Pulse
                        </p>
                        <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter italic leading-none">
                            Rider <span className="text-brand-primary">Pulse.</span>
                        </h2>
                        <p className="text-base md:text-xl text-slate-500 dark:text-zinc-400 font-medium italic">
                            Hear from the riders who redefined their journey.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <button className="w-12 h-12 md:w-16 md:h-16 rounded-full border border-slate-200 dark:border-white/10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                            <ChevronRight size={24} className="rotate-180" />
                        </button>
                        <button className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-slate-900 dark:bg-white text-white dark:text-black flex items-center justify-center hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-xl shadow-black/5 dark:shadow-white/5">
                            <ChevronRight size={24} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                    {reviews.map((m, i) => (
                        <div
                            key={i}
                            className="group p-8 md:p-10 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/6 rounded-[3rem] space-y-8 hover:bg-white dark:hover:bg-white/[0.06] transition-all duration-500 relative hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-none"
                        >
                            <div className="absolute top-10 right-10 opacity-5 dark:opacity-10 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity">
                                <svg width="40" height="40" viewBox="0 0 40 40" fill="currentColor">
                                    <path d="M10 10v10h10V10H10zm0 20h10V20H10v10zm20-20v10h10V10H30zm0 20h10V20H30v10z" />
                                </svg>
                            </div>

                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map(s => (
                                    <Star key={s} size={14} className="text-brand-primary fill-brand-primary" />
                                ))}
                            </div>

                            <p className="text-lg font-medium text-slate-700 dark:text-zinc-300 leading-relaxed italic">
                                {m.quote}
                            </p>

                            <div className="pt-8 border-t border-slate-200 dark:border-white/8 flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-[#14161b] overflow-hidden border border-slate-200 dark:border-white/10">
                                    <div className="relative w-full h-full">
                                        <img
                                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}`}
                                            alt={m.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-black uppercase tracking-widest italic text-slate-900 dark:text-white">
                                        {m.name}
                                    </p>
                                    <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-widest mt-1">
                                        {m.handle}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-center gap-3">
                    {[1, 2, 3, 4, 5, 6].map(dot => (
                        <div
                            key={dot}
                            className={`w-2 h-2 rounded-full ${dot === 1 ? 'bg-brand-primary w-6' : 'bg-slate-200 dark:bg-white/10'} transition-all duration-500`}
                        />
                    ))}
                </div>
            </div>

            {/* Subdued Glow Background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-primary/5 blur-[120px] rounded-full pointer-events-none z-0" />
        </section>
    );
};
