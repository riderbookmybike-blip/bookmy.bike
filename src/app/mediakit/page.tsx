"use client";

import React from 'react';
import { Logo } from '@/components/brand/Logo';
import { MarketplaceHeader } from '@/components/layout/MarketplaceHeader';
import { MarketplaceFooter } from '@/components/layout/MarketplaceFooter';
import { Download, CheckCircle2, Info } from 'lucide-react';

export default function MediaKitPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col selection:bg-blue-500/30 transition-colors duration-300">
            <MarketplaceHeader onLoginClick={() => { }} />

            <main className="flex-1">
                {/* Hero section */}
                <div className="relative py-24 px-6 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-slate-950 overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

                    <div className="max-w-6xl mx-auto relative z-10 text-center space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold tracking-widest uppercase mb-4">
                            Brand Assets
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 dark:text-white">
                            Media Kit
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-xl max-w-2xl mx-auto leading-relaxed">
                            Official BookMyBike brand assets and identity standards for partners and press.
                        </p>
                    </div>
                </div>

                <div className="max-w-6xl mx-auto px-6 py-20 space-y-32 mb-20">

                    {/* Logo Section */}
                    <section className="space-y-12">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 dark:border-white/5 pb-8">
                            <div className="space-y-2">
                                <h2 className="text-4xl font-black tracking-tight">The Logo</h2>
                                <p className="text-slate-500 dark:text-slate-400">Our primary brand mark. Use the appropriate version for contrast.</p>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/5 text-xs font-mono text-slate-500">
                                <Info size={14} className="text-blue-500" />
                                <span>Always maintain 20% clear space</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Primary Logo - Light Theme */}
                            <AssetCard
                                title="Primary Branding"
                                description="Official Blue on White"
                                usage="Default use-case for all light backgrounds."
                            >
                                <div className="h-48 flex items-center justify-center bg-white rounded-2xl border border-slate-200 shadow-sm mb-6">
                                    <Logo mode="light" size={48} />
                                </div>
                            </AssetCard>

                            {/* Primary Logo - Dark Theme */}
                            <AssetCard
                                title="Night Branding"
                                description="Official Blue on Dark"
                                usage="Used specifically for digital dark mode interfaces."
                            >
                                <div className="h-48 flex items-center justify-center bg-slate-900 rounded-2xl border border-white/5 shadow-xl mb-6">
                                    <Logo mode="dark" size={48} />
                                </div>
                            </AssetCard>

                            {/* Monochrome White */}
                            <AssetCard
                                title="Monochrome White"
                                description="Pure Stencil"
                                usage="For vibrant image overlays or dark solid colors."
                            >
                                <div className="h-48 flex items-center justify-center bg-blue-600 rounded-2xl shadow-xl mb-6">
                                    <Logo monochrome="white" size={48} />
                                </div>
                            </AssetCard>

                            {/* Icon Only */}
                            <AssetCard
                                title="Brand Icon"
                                description="The 'B' Glyph"
                                usage="For social avatars, favicons, and app icons."
                            >
                                <div className="h-48 flex items-center justify-center bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5 mb-6">
                                    <Logo variant="icon" size={64} mode="auto" />
                                </div>
                            </AssetCard>
                        </div>
                    </section>

                    {/* Colors Section */}
                    <section className="space-y-12">
                        <div className="border-b border-slate-200 dark:border-white/5 pb-8">
                            <h2 className="text-4xl font-black tracking-tight">Brand Colors</h2>
                            <p className="text-slate-500 dark:text-slate-400 mt-2">The foundation of our visual language.</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <ColorSwatch name="BookMyBlue" hex="#2B7FFF" primary />
                            <ColorSwatch name="Purest White" hex="#FFFFFF" border />
                            <ColorSwatch name="Slate" hex="#64748B" />
                            <ColorSwatch name="Night Black" hex="#030712" />
                        </div>
                    </section>

                    {/* Typography Section */}
                    <section className="space-y-12 pb-20">
                        <div className="border-b border-slate-200 dark:border-white/5 pb-8">
                            <h2 className="text-4xl font-black tracking-tight">Typography</h2>
                            <p className="text-slate-500 dark:text-slate-400 mt-2">Modern, precise, and highly legible.</p>
                        </div>
                        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-3xl p-10 md:p-16 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                            <div className="space-y-8">
                                <div className="space-y-2">
                                    <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-500">Global Typeface</p>
                                    <h3 className="text-8xl font-black tracking-tighter text-slate-900 dark:text-white">Inter</h3>
                                </div>
                                <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed">
                                    Inter is our primary house font. It represents our commitment to clarity, precision, and efficiency across all digital platforms.
                                </p>
                                <ul className="space-y-4">
                                    <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-medium">
                                        <CheckCircle2 size={18} className="text-blue-500" />
                                        Semibold (600) for Branding
                                    </li>
                                    <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-medium">
                                        <CheckCircle2 size={18} className="text-blue-500" />
                                        Medium (500) for Headings
                                    </li>
                                    <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-medium">
                                        <CheckCircle2 size={18} className="text-blue-500" />
                                        Regular (400) for Interface Copy
                                    </li>
                                </ul>
                            </div>
                            <div className="bg-slate-50 dark:bg-black/50 p-10 rounded-2xl border border-slate-200 dark:border-white/5 space-y-10">
                                <div className="space-y-2">
                                    <p className="text-7xl font-semibold tracking-tighter text-slate-900 dark:text-white italic">AaBbCc</p>
                                    <div className="h-px bg-slate-200 dark:bg-white/10 w-full" />
                                </div>
                                <div className="text-slate-400 font-mono text-sm leading-8 tracking-widest uppercase">
                                    ABCDEFGHIJKLM<br />
                                    NOPQRSTUVWXYZ<br />
                                    0123456789 !@#$%
                                </div>
                            </div>
                        </div>
                    </section>

                </div>
            </main>

            <div className="bg-blue-600 py-16 px-6 text-center text-white">
                <div className="max-w-2xl mx-auto space-y-6">
                    <h2 className="text-3xl font-black tracking-tight">Need custom assets?</h2>
                    <p className="text-blue-100 text-lg">For special partnership branding or high-resolution vector files, please reach out to our design team.</p>
                    <button className="px-8 py-4 bg-white text-blue-600 rounded-full font-bold hover:bg-slate-50 transition-all shadow-xl shadow-black/10">
                        Contact Design Team
                    </button>
                </div>
            </div>

            <MarketplaceFooter />
        </div>
    );
}

// Sub-components
const AssetCard = ({ title, description, usage, children }: { title: string, description: string, usage: string, children: React.ReactNode }) => (
    <div className="group flex flex-col p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 transition-all hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/5">
        {children}
        <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="text-xl font-bold group-hover:text-blue-500 transition-colors">{title}</h4>
                    <p className="text-sm text-slate-500 font-medium">{description}</p>
                </div>
                <button className="p-3 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 rounded-xl hover:bg-blue-500 hover:text-white transition-all">
                    <Download size={20} />
                </button>
            </div>
            <div className="h-px bg-slate-100 dark:bg-white/5 w-full" />
            <p className="text-xs text-slate-400 leading-relaxed italic">
                {usage}
            </p>
        </div>
    </div>
);

const ColorSwatch = ({ name, hex, primary, border }: { name: string, hex: string, primary?: boolean, border?: boolean }) => (
    <div className="space-y-4 group">
        <div
            className={`h-32 rounded-2xl transition-transform group-hover:-translate-y-2 duration-300 ${primary ? 'shadow-2xl shadow-blue-500/30' : ''} ${border ? 'border border-slate-200 dark:border-white/10' : ''}`}
            style={{ backgroundColor: hex }}
        />
        <div>
            <p className="font-black text-slate-900 dark:text-white tracking-tight">{name}</p>
            <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded font-mono text-slate-500 dark:text-slate-400">HEX</span>
                <p className="text-xs font-mono text-slate-400 dark:text-slate-500 uppercase">{hex}</p>
            </div>
        </div>
    </div>
);
