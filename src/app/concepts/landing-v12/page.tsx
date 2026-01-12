'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronRight,
    Search,
    ShieldCheck,
    MapPin,
    Zap,
    ArrowRight,
    MessageSquare,
    BadgePercent,
    TrendingDown,
    Users
} from 'lucide-react';
import { Logo } from '@/components/brand/Logo';

export default function LandingV12Page() {
    const [activeTab, setActiveTab] = useState('emi');

    return (
        <div className="bg-slate-50 text-slate-900 min-h-screen font-sans selection:bg-blue-600 selection:text-white overflow-x-hidden">

            {/* ════════════ TOP INFO BAR ════════════ */}
            <div className="bg-slate-900 text-white py-2.5 px-6 text-center text-[10px] font-bold uppercase tracking-[0.2em]">
                <span className="opacity-60">Limited Period:</span> Get an extra ₹2,000 off on exchange bookings this week!
            </div>

            {/* ════════════ NAVIGATION ════════════ */}
            <nav className="fixed top-11 w-full z-50 px-6 md:px-10 h-20 md:h-24 flex justify-between items-center bg-white/90 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
                <Logo mode="light" size={28} variant="full" />

                <div className="hidden lg:flex gap-10 items-center">
                    {['Buy Bike', 'EMI Options', 'Exchange', 'Nearest Dealer'].map((l) => (
                        <Link key={l} href="#" className="text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-colors">
                            {l}
                        </Link>
                    ))}
                </div>

                <div className="flex gap-4 items-center">
                    <button className="hidden sm:block text-[11px] font-black uppercase tracking-widest text-slate-900">Sign In</button>
                    <Link href="/store/catalog" className="px-6 py-3 bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest rounded-lg transition-all hover:bg-blue-700 shadow-lg shadow-blue-600/20 active:scale-95">
                        Start Search
                    </Link>
                </div>
            </nav>

            {/* ════════════ HERO: THE MARKETPLACE ════════════ */}
            <section className="relative min-h-screen pt-48 pb-20 flex items-center bg-white overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-50/50 -skew-x-12 translate-x-20 z-0" />

                <div className="max-w-7xl mx-auto px-6 md:px-10 relative z-10 w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">

                        <div className="lg:col-span-7 space-y-12">
                            <div className="space-y-6">
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-widest"
                                >
                                    <ShieldCheck size={14} className="fill-blue-700 text-white" />
                                    India's Largest Motorcycle Marketplace
                                </motion.div>

                                <motion.h1
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="text-6xl md:text-8xl font-black italic tracking-tighter leading-[0.9] text-slate-900"
                                >
                                    APNI BIKE. <br />
                                    <span className="text-blue-600">APNI EMI.</span>
                                </motion.h1>

                                <motion.p
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="max-w-xl text-lg md:text-xl text-slate-500 font-medium leading-relaxed italic"
                                >
                                    Buying a bike shouldn't be a struggle. We unify 5,000+ dealers to give you the <span className="text-slate-900 font-bold">Lowest EMI Guaranteed.</span>
                                </motion.p>
                            </div>

                            {/* Trust Badges */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="flex flex-wrap gap-10 opacity-70"
                            >
                                <div className="flex items-center gap-3">
                                    <Users size={20} className="text-blue-600" />
                                    <div className="space-y-0.5">
                                        <div className="text-sm font-black italic">5,00,000+</div>
                                        <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Happy Riders</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <MapPin size={20} className="text-blue-600" />
                                    <div className="space-y-0.5">
                                        <div className="text-sm font-black italic">28 States</div>
                                        <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Pan India Delivery</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <BadgePercent size={20} className="text-blue-600" />
                                    <div className="space-y-0.5">
                                        <div className="text-sm font-black italic">500+ Cities</div>
                                        <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Local Dealers</div>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="flex flex-col sm:flex-row gap-6 items-center"
                            >
                                <div className="w-full sm:w-auto relative group">
                                    <div className="absolute inset-x-0 bottom-0 h-1 bg-blue-600/20 group-hover:h-full transition-all rounded-xl z-0" />
                                    <Link href="/store/catalog" className="relative z-10 block px-12 py-6 bg-slate-900 text-white text-xs font-black uppercase tracking-[0.2em] rounded-xl hover:scale-105 transition-transform flex items-center justify-center gap-4 active:scale-95">
                                        Explore Marketplace
                                        <ArrowRight size={18} />
                                    </Link>
                                </div>
                                <div className="flex items-center gap-4 px-6 py-4 border border-slate-200 rounded-xl bg-slate-50">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Offers Ends In</div>
                                    <div className="text-xl font-black italic text-blue-600">48:20:15</div>
                                </div>
                            </motion.div>
                        </div>

                        <div className="lg:col-span-5 relative">
                            {/* The Marketplace Card Prototype */}
                            <motion.div
                                initial={{ x: 50, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ duration: 1, delay: 0.2 }}
                                className="relative bg-white border border-slate-200 rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.08)] overflow-hidden"
                            >
                                <div className="aspect-[4/5] relative">
                                    <img
                                        src="/images/hero/blurred_bike_hero.png"
                                        alt="Marketplace Selection"
                                        className="w-full h-full object-cover grayscale opacity-20"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent" />

                                    {/* Floating Stats UI */}
                                    <div className="absolute inset-6 flex flex-col justify-end space-y-6">
                                        <div className="p-6 bg-white/90 backdrop-blur-md rounded-2xl border border-white shadow-xl space-y-4">
                                            <div className="flex justify-between items-center">
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Market Average EMI</h4>
                                                <TrendingDown size={14} className="text-red-500" />
                                            </div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-3xl font-black italic line-through text-slate-300">₹2,499</span>
                                                <span className="text-5xl font-black italic text-blue-600">₹1,999</span>
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">/mo</span>
                                            </div>
                                            <div className="text-[10px] font-bold text-slate-500 leading-relaxed">
                                                Our unified dealer network guarantees the lowest ROI across 25+ banks.
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-5 bg-blue-600 text-white rounded-2xl shadow-xl space-y-1">
                                                <div className="text-[8px] font-black uppercase tracking-widest opacity-60">Success Rate</div>
                                                <div className="text-2xl font-black italic">99.8%</div>
                                            </div>
                                            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xl space-y-1">
                                                <div className="text-[8px] font-black uppercase tracking-widest text-slate-400">Approval Time</div>
                                                <div className="text-2xl font-black italic text-slate-900 text-center">10 MINS</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Localization Badge */}
                            <motion.div
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 20, opacity: 0 }} // Intentionally hidden/subtle on mobile
                                whileInView={{ x: 0, opacity: 1 }}
                                className="absolute -top-10 -right-10 w-40 h-40 bg-white border border-slate-100 rounded-full shadow-2xl flex flex-col items-center justify-center p-6 text-center space-y-1 z-20 hidden lg:flex"
                            >
                                <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">MADE FOR</div>
                                <div className="text-2xl font-black italic text-slate-900 leading-none">BHARAT</div>
                                <div className="w-8 h-[2px] bg-blue-600" />
                                <div className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">VOCAL FOR LOCAL</div>
                            </motion.div>
                        </div>

                    </div>
                </div>
            </section>

            {/* ════════════ THE PROMISE: LOWEST EMI ════════════ */}
            <section className="py-32 bg-slate-900 text-white relative">
                <div className="max-w-7xl mx-auto px-6 md:px-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                        <div className="space-y-10">
                            <h2 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none">
                                THE <span className="text-blue-500">EMI</span> <br />
                                REVOLUTION.
                            </h2>
                            <p className="text-slate-400 text-lg md:text-xl font-medium italic leading-relaxed max-w-lg">
                                We don't just sell motorcycles. We sell freedom.
                                Our proprietary algorithms scan 25+ lenders in real-time to find the best plan for your profile.
                            </p>

                            <div className="space-y-8">
                                {[
                                    { title: "ZERO Processing Fee", desc: "No hidden charges. What you see is exactly what you pay." },
                                    { title: "Personalized ROI", desc: "We reward your credit hygiene with sub-10% interest rates." },
                                    { title: "Digital Agreement", desc: "No heavy files. Sign with Aadhaar and get mobile confirmation." }
                                ].map((step, i) => (
                                    <div key={i} className="flex gap-6 items-start">
                                        <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-600/30 flex items-center justify-center flex-shrink-0 text-blue-500 text-xs font-black italic">
                                            0{i + 1}
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="text-xl font-black italic uppercase tracking-tight">{step.title}</h4>
                                            <p className="text-sm text-slate-400 font-medium leading-relaxed italic">{step.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/5 rounded-[3rem] p-10 md:p-16 space-y-12">
                            <div className="grid grid-cols-2 gap-px bg-white/10">
                                <div className="bg-slate-900 p-8 space-y-2">
                                    <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Fixed Lowest</div>
                                    <div className="text-4xl md:text-6xl font-black italic">9.5%</div>
                                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-2 italic">Standard ROI</div>
                                </div>
                                <div className="bg-slate-900 p-8 space-y-2">
                                    <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Maximum Reach</div>
                                    <div className="text-4xl md:text-6xl font-black italic">5K+</div>
                                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-2 italic">Dealer Network</div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex justify-between items-end">
                                    <div className="text-[11px] font-black uppercase tracking-widest text-slate-500 italic">User Trust Score</div>
                                    <div className="text-2xl font-black italic text-blue-500">EXCELLENT</div>
                                </div>
                                <div className="h-4 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        whileInView={{ width: '85%' }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        className="h-full bg-blue-600 rounded-full shadow-[0_0_20px_#2563eb]"
                                    />
                                </div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic text-center">
                                    Trusted by 5,00,000+ verified users across India
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ════════════ CALL TO ACTION: BHARAT ════════════ */}
            <section className="py-40 bg-white">
                <div className="max-w-4xl mx-auto px-6 text-center space-y-12">
                    <h2 className="text-5xl md:text-8xl font-black italic uppercase tracking-tighter leading-none">
                        START YOUR <br />
                        <span className="text-blue-600 italic">SUCCESS STORY.</span>
                    </h2>
                    <p className="text-lg md:text-xl text-slate-500 font-medium italic leading-relaxed">
                        Why wait? Join the smartest community of bike buyers in India.
                        Get pre-approved in under 10 minutes.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-6">
                        <Link href="/store/catalog" className="px-16 py-8 bg-blue-600 text-white text-xl font-black italic uppercase tracking-widest rounded-2xl hover:bg-blue-700 shadow-2xl shadow-blue-600/30 transition-all active:scale-95">
                            FIND MY BIKE
                        </Link>
                        <button className="px-16 py-8 border-2 border-slate-200 text-slate-900 text-xl font-black italic uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-4 active:scale-95">
                            EMI CALCULATOR
                        </button>
                    </div>
                </div>
            </section>

            {/* ════════════ FOOTER ════════════ */}
            <footer className="py-24 bg-slate-50 border-t border-slate-200">
                <div className="max-w-7xl mx-auto px-6 md:px-10 space-y-20">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 items-start">
                        <div className="space-y-8">
                            <Logo mode="light" size={24} variant="full" />
                            <p className="text-slate-500 text-sm font-medium italic leading-relaxed">
                                India's premier digital-first motorcycle marketplace. Unifying dealers, lenders, and riders on one high-frequency platform.
                            </p>
                        </div>
                        <div className="space-y-6">
                            <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Company</h5>
                            <ul className="space-y-4 text-[11px] font-black uppercase tracking-widest text-slate-900">
                                <li className="hover:text-blue-600 transition-colors cursor-pointer">About Us</li>
                                <li className="hover:text-blue-600 transition-colors cursor-pointer">Dealers Network</li>
                                <li className="hover:text-blue-600 transition-colors cursor-pointer">Partner With Us</li>
                            </ul>
                        </div>
                        <div className="space-y-6">
                            <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Legal</h5>
                            <ul className="space-y-4 text-[11px] font-black uppercase tracking-widest text-slate-900">
                                <li className="hover:text-blue-600 transition-colors cursor-pointer">Privacy Policy</li>
                                <li className="hover:text-blue-600 transition-colors cursor-pointer">Terms of Service</li>
                                <li className="hover:text-blue-600 transition-colors cursor-pointer">Credit Terms</li>
                            </ul>
                        </div>
                        <div className="p-8 bg-blue-50 border border-blue-100 rounded-3xl space-y-6">
                            <div className="flex items-center gap-4 text-blue-600">
                                <MessageSquare size={20} />
                                <span className="text-xs font-black uppercase tracking-widest italic">24/7 Concierge</span>
                            </div>
                            <p className="text-[10px] text-blue-700/60 font-medium italic">
                                Need help with your booking? Our experts are here to guide you through documentation and delivery.
                            </p>
                            <button className="w-full py-3 bg-white text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-100/50 transition-colors border border-blue-100">
                                Talk To Expert
                            </button>
                        </div>
                    </div>

                    <div className="pt-10 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
                            © 2026 BOOKMYBIKE BHARTIYA MOTORCORP v12.0
                        </div>
                        <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-slate-900 italic">
                            <span>Mumbai</span>
                            <span>Delhi</span>
                            <span>Bengaluru</span>
                        </div>
                    </div>
                </div>
            </footer>

        </div>
    );
}
