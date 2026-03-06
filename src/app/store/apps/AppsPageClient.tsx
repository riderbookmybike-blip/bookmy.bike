'use client';

import React from 'react';
import { Smartphone, CheckCircle2, Play, Download, ArrowDown } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { usefulApps } from './app_data';

export default function AppsPageClient() {
    const [imageErrors, setImageErrors] = React.useState<Record<string, boolean>>({});

    const scrollToApp = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    return (
        <main className="min-h-screen bg-white text-slate-900 selection:bg-brand-primary/20 font-sans overflow-hidden">
            {/* ── Background Accents ── */}
            <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] bg-brand-primary/5 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2" />

            {/* ── Hero Section ── */}
            <section className="relative pt-32 pb-40 px-6 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 lg:gap-32">
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="flex-1 space-y-8 relative z-10 text-center lg:text-left"
                >
                    <div className="flex items-center justify-center lg:justify-start gap-4">
                        <motion.div
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.5 }}
                            className="w-12 h-12 rounded-2xl bg-brand-primary flex items-center justify-center shadow-lg shadow-brand-primary/20"
                        >
                            <Smartphone size={24} className="text-black" />
                        </motion.div>
                        <span className="text-xs font-black tracking-widest text-slate-400 uppercase">
                            Member Resources
                        </span>
                    </div>

                    <h1 className="text-6xl lg:text-8xl font-black tracking-tighter text-slate-900 leading-[0.85]">
                        <motion.span
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                            className="text-brand-primary italic block"
                        >
                            Essential
                        </motion.span>
                        <motion.span
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.6 }}
                            className="block"
                        >
                            Digital Tools.
                        </motion.span>
                    </h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6, duration: 0.8 }}
                        className="text-slate-500 text-lg lg:text-xl font-medium leading-relaxed max-w-lg"
                    >
                        We&apos;ve curated the best tools to help you manage your ride, from financing portals to
                        vehicle safety and documentation.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="pt-4 flex justify-center lg:justify-start"
                    >
                        <div className="flex items-center gap-3 text-slate-400 font-bold text-sm tracking-widest uppercase">
                            <span>Scroll to explore</span>
                            <motion.div animate={{ y: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                                <ArrowDown size={14} />
                            </motion.div>
                        </div>
                    </motion.div>
                </motion.div>

                <div className="flex-1 relative">
                    <div className="absolute inset-0 bg-brand-primary/10 rounded-full blur-[100px] animate-pulse" />
                    <div className="relative z-10 grid grid-cols-2 gap-4 -rotate-6 lg:-rotate-12 scale-110">
                        {usefulApps.map((app, i) => (
                            <motion.button
                                key={app.id}
                                onClick={() => scrollToApp(app.id)}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{
                                    opacity: 1,
                                    y: i % 2 === 0 ? [0, -10, 0] : [0, 10, 0],
                                }}
                                transition={{
                                    delay: 0.2 * i,
                                    y: {
                                        repeat: Infinity,
                                        duration: 4 + i,
                                        ease: 'easeInOut',
                                    },
                                }}
                                whileHover={{ scale: 1.1, rotate: 12 }}
                                className={`w-40 h-40 lg:w-56 lg:h-56 bg-white rounded-[40px] shadow-2xl shadow-black/5 border border-slate-50 flex flex-col items-center justify-center p-6 text-center gap-3 transition-shadow duration-300 hover:shadow-brand-primary/20 ${
                                    i % 2 === 0 ? 'mt-8' : 'mb-8'
                                }`}
                            >
                                {app.logoUrl && !imageErrors[app.id] ? (
                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-brand-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <img
                                            src={app.logoUrl}
                                            alt={app.name}
                                            onError={() => setImageErrors(prev => ({ ...prev, [app.id]: true }))}
                                            className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl object-contain p-2 shadow-sm relative z-10 bg-white border border-slate-100"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-slate-50 flex items-center justify-center">
                                        <app.icon size={32} style={{ color: app.iconColor }} />
                                    </div>
                                )}
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mt-2">
                                    {app.name.split(' ')[0]}
                                </h3>
                            </motion.button>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── App Detail Sections ── */}
            <section className="pb-40 px-6 max-w-5xl mx-auto space-y-24 lg:space-y-40">
                {usefulApps.map((app, i) => (
                    <motion.div
                        id={app.id}
                        key={app.id}
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-100px' }}
                        transition={{ duration: 0.8 }}
                        className={`flex flex-col lg:flex-row items-center gap-10 lg:gap-24 ${
                            i % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
                        }`}
                    >
                        <div className="flex-1 space-y-6">
                            <div className="flex items-center gap-2">
                                <span className="text-5xl font-black text-slate-100 italic">0{i + 1}</span>
                                <div className="h-px flex-1 bg-slate-100" />
                            </div>
                            <div className="space-y-4 text-center lg:text-left">
                                <div className="flex items-center justify-center lg:justify-start gap-3">
                                    <h3 className="text-3xl lg:text-5xl font-black text-slate-900">{app.name}</h3>
                                    <CheckCircle2 size={24} className="text-brand-primary" />
                                </div>
                                <p className="text-sm font-bold text-brand-primary uppercase tracking-widest">
                                    {app.company}
                                </p>
                                <p className="text-lg text-slate-500 font-medium leading-relaxed">{app.description}</p>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col sm:flex-row items-center gap-4">
                            <Link
                                href={app.links.android}
                                target="_blank"
                                className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-5 rounded-3xl bg-slate-900 text-white font-bold text-sm lg:text-base hover:bg-brand-primary hover:text-black transition-all shadow-xl shadow-slate-900/10 active:scale-95"
                            >
                                <Play size={18} fill="currentColor" />
                                <span>Play Store</span>
                            </Link>

                            {app.links.ios !== '#' && (
                                <Link
                                    href={app.links.ios}
                                    target="_blank"
                                    className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-5 rounded-3xl border-2 border-slate-50 text-slate-900 font-bold text-sm lg:text-base hover:border-brand-primary hover:text-brand-primary transition-all active:scale-95 shadow-sm"
                                >
                                    <Download size={18} />
                                    <span>iOS App</span>
                                </Link>
                            )}
                        </div>
                    </motion.div>
                ))}
            </section>
        </main>
    );
}
