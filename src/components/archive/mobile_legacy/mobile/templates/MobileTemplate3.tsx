'use client';

import React, { useState } from 'react';
import { Search, Mic, ArrowRight, Clock, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MinimalHeader = () => {
    return (
        <div className="fixed top-0 right-0 p-6 z-50">
            <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-[10px] font-black tracking-tighter">
                AG
            </div>
        </div>
    );
};

export const MobileTemplate3 = () => {
    const [isThinking, setIsThinking] = useState(false);

    // Simulate thinking state
    const handleSearch = () => {
        setIsThinking(true);
        setTimeout(() => setIsThinking(false), 2000);
    };

    return (
        <div className="bg-white min-h-screen text-black font-sans selection:bg-black selection:text-white flex flex-col items-center justify-center p-6 relative">
            <MinimalHeader />

            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">
                        Find your ride.
                    </h1>
                    <p className="text-zinc-400 text-lg font-light">
                        What are you looking for today?
                    </p>
                </div>

                {/* Omni-bar */}
                <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative bg-white border border-zinc-200 shadow-xl shadow-zinc-200/50 rounded-2xl p-4 flex items-center gap-4 transition-all focus-within:ring-2 focus-within:ring-black/5">
                        <Search className="text-zinc-400" size={24} />
                        <input
                            type="text"
                            placeholder="e.g., Best mileage scooter under 1L"
                            className="flex-1 text-lg outline-none placeholder:text-zinc-300 font-medium"
                            onFocus={handleSearch}
                        />
                        <button className="p-2 hover:bg-zinc-50 rounded-full transition-colors">
                            <Mic className="text-zinc-400" size={20} />
                        </button>
                    </div>
                </div>

                {/* AI Suggestions / Chips */}
                <div className="flex flex-wrap gap-2 justify-center">
                    {['Electric Scooters', 'Sport Bikes', 'Under ₹1.5L', 'Family Friendly'].map((chip) => (
                        <button key={chip} className="px-4 py-2 bg-zinc-50 border border-zinc-100 rounded-full text-sm text-zinc-600 hover:bg-zinc-100 hover:border-zinc-200 transition-all">
                            {chip}
                        </button>
                    ))}
                </div>

                {/* Recent / Trending (Appears below) */}
                <div className="pt-12 border-t border-zinc-50 mt-12 w-full">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-6">Trending Near You</p>
                    <div className="space-y-4">
                        {[
                            { name: 'Honda Activa 6G', stat: '450 views/hr', icon: TrendingUp },
                            { name: 'TVS Jupiter 125', stat: 'Just launched', icon: Clock },
                            { name: 'Ola S1 Pro', stat: 'Price drop alert', icon: ArrowRight },
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="flex items-center justify-between p-4 bg-zinc-50/50 rounded-xl hover:bg-zinc-100 cursor-pointer transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-lg border border-zinc-100 flex items-center justify-center text-zinc-400">
                                        <item.icon size={18} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-zinc-900">{item.name}</h3>
                                        <p className="text-xs text-zinc-400">{item.stat}</p>
                                    </div>
                                </div>
                                <ArrowRight size={16} className="text-zinc-300" />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Disclaimer */}
            <div className="absolute bottom-8 left-0 right-0 text-center">
                <p className="text-[10px] text-zinc-300">Powered by BookMyBike Intelligence • v2.0</p>
            </div>
        </div>
    );
};
