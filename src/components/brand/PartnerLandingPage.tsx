'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import { TenantConfig } from '@/lib/tenant/tenantContext';

interface PartnerLandingProps {
    config: TenantConfig;
    name: string;
}

export default function PartnerLandingPage({ config, name }: PartnerLandingProps) {
    const brand = config.brand || {};
    const landing = (config as any).landing || {}; // Cast as any if 'landing' not yet in type definition

    // Defaults
    const primaryColor = brand.primaryColor || '#DC2626';
    const heroTitle = landing.title || `Welcome to ${brand.displayName || name}`;
    const heroSubtitle = landing.subtitle || "Your premium destination for two-wheeler financing and sales.";
    const ctaText = landing.ctaText || "Login to Portal";

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 font-sans selection:bg-red-500/30">
            {/* Navbar */}
            <nav className="border-b border-slate-100 dark:border-white/5 py-4 px-6 md:px-12 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-50">
                <div className="flex items-center gap-3">
                    {brand.logoUrl ? (
                        <img src={brand.logoUrl} alt={name} className="h-8 md:h-10 object-contain" />
                    ) : (
                        <div className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase">{brand.displayName || name}</div>
                    )}
                </div>
                <Link href="/login" className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-red-600 transition-colors">
                    Log In
                </Link>
            </nav>

            {/* Hero */}
            <main className="flex flex-col items-center justify-center text-center px-6 py-20 md:py-32 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold uppercase tracking-wider text-slate-500"
                >
                    <ShieldCheck size={14} className="text-emerald-500" />
                    Official Partner
                </div>

                <h1 className="text-4xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tight leading-1.1">
                    {heroTitle}
                </h1>

                <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                    {heroSubtitle}
                </p>

                <div className="flex flex-col md:flex-row gap-4 pt-8 w-full md:w-auto">
                    <Link
                        href="/login"
                        style={{ backgroundColor: primaryColor }}
                        className="px-8 py-4 rounded-2xl text-white font-bold text-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
                    >
                        {ctaText} <ArrowRight size={20} />
                    </Link>
                    {/* Optional Secondary CTA */}
                    {/* <button className="px-8 py-4 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white font-bold text-lg hover:bg-slate-200 dark:hover:bg-white/10 transition-all">
                        Contact Support
                    </button> */}
                </div>

                {/* Features / Benefits Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-20 w-full text-left">
                    {[
                        { icon: Zap, title: "Fast Processing", desc: "Instant approvals and seamless workflows." },
                        { icon: ShieldCheck, title: "Secure Platform", desc: "Enterprise-grade security for your data." },
                        { icon: CheckCircle2, title: "Verified Inventory", desc: "Access 100% verified stock directly." }
                    ].map((f, i) => (
                        <div key={i} className="p-6 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-red-500/30 transition-colors group">
                            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-white/10 flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                <f.icon size={24} style={{ color: primaryColor }} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{f.title}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </main>

            {/* Footer */}
            <footer className="py-12 text-center text-slate-400 text-sm border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-950">
                <p>© {new Date().getFullYear()} {brand.displayName || name}. Powered by BookMyBike.</p>
            </footer>
        </div>
    );
}
