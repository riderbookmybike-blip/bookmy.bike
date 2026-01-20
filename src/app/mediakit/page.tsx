"use client";

import React from 'react';
import { Logo } from '@/components/brand/Logo';
import { MarketplaceHeader } from '@/components/layout/MarketplaceHeader';
import { MarketplaceFooter } from '@/components/layout/MarketplaceFooter';
import { ICON_PATHS, TEXT_PATHS, BRAND_GOLD } from '@/components/brand/paths';
import { Download, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

/**
 * Utility to generate and download SVG file
 * Supports Gradients for Gold/Silver
 */
const downloadSVG = (variant: 'full' | 'icon' | 'wordmark', mode: 'light' | 'dark' | 'white' | 'black' | 'gold' | 'silver') => {
    const gradients = `
        <defs>
            <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#BF953F" />
                <stop offset="25%" stop-color="#FCF6BA" />
                <stop offset="50%" stop-color="#B38728" />
                <stop offset="75%" stop-color="#FBF5B7" />
                <stop offset="100%" stop-color="#AA771C" />
            </linearGradient>
            <linearGradient id="silver-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#C0C0C0" />
                <stop offset="25%" stop-color="#FFFFFF" />
                <stop offset="50%" stop-color="#808080" />
                <stop offset="75%" stop-color="#D3D3D3" />
                <stop offset="100%" stop-color="#A9A9A9" />
            </linearGradient>
        </defs>
    `;

    const colors = {
        icon: BRAND_GOLD,
        bookmy: mode === 'dark' ? "#FFFFFF" : "#000000",
        bike: BRAND_GOLD
    };

    if (mode === 'white') {
        colors.icon = colors.bookmy = colors.bike = "#FFFFFF";
    } else if (mode === 'black') {
        colors.icon = colors.bookmy = colors.bike = "#000000";
    } else if (mode === 'gold') {
        colors.icon = colors.bookmy = colors.bike = "url(#gold-gradient)";
    } else if (mode === 'silver') {
        colors.icon = colors.bookmy = colors.bike = "url(#silver-gradient)";
    }

    let svgContent = '';
    const iconG = ICON_PATHS.PRIMARY.map(d => `<path d="${d}" fill="${colors.icon}"/>`).join('');
    const bookmyG = TEXT_PATHS.BOOKMY.map(d => `<path d="${d}" fill="${colors.bookmy}"/>`).join('');
    const bikeG = TEXT_PATHS.BIKE.map(d => `<path d="${d}" fill="${colors.bike}"/>`).join('');

    if (variant === 'icon') {
        svgContent = `<svg width="80" height="109" viewBox="0 0 80 109" xmlns="http://www.w3.org/2000/svg">
            ${(mode === 'gold' || mode === 'silver') ? gradients : ''}
            ${iconG}
        </svg>`;
    } else if (variant === 'wordmark') {
        svgContent = `<svg width="220" height="40" viewBox="0 0 220 40" xmlns="http://www.w3.org/2000/svg">
            ${(mode === 'gold' || mode === 'silver') ? gradients : ''}
            <g transform="translate(0, 5)">
                ${bookmyG}
                ${bikeG}
            </g>
        </svg>`;
    } else {
        // Full Logo - Use a larger canvas and careful scaling to fit icon + text
        svgContent = `<svg width="600" height="160" viewBox="0 0 600 160" xmlns="http://www.w3.org/2000/svg">
            ${(mode === 'gold' || mode === 'silver') ? gradients : ''}
            <g transform="translate(40, 25)">
                <g transform="scale(1.2)">${iconG}</g>
                <g transform="translate(110, 48) scale(1.6)">
                    ${bookmyG}
                    ${bikeG}
                </g>
            </g>
        </svg>`;
    }

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bookmybike-${variant}-${mode}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export default function MediaKitPage() {
    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#030712] text-slate-900 dark:text-white flex flex-col selection:bg-blue-500/30 transition-colors duration-500 overflow-x-hidden">
            <MarketplaceHeader onLoginClick={() => { }} />

            <main className="flex-1 relative">
                {/* Background Large Ghost Text */}
                <div className="absolute top-80 -right-20 text-[30vw] font-black italic uppercase text-slate-300/10 dark:text-white/[0.015] pointer-events-none select-none leading-none z-0">
                    KIT
                </div>

                {/* Hero section */}
                <div className="relative py-32 px-6 overflow-hidden">
                    {/* Radial Gradients */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[800px] bg-blue-600/5 dark:bg-blue-600/10 blur-[150px] rounded-full pointer-events-none z-0" />
                    <div className="absolute top-40 left-[20%] w-[300px] h-[300px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none z-0" />

                    <div className="max-w-6xl mx-auto relative z-10 space-y-8">
                        <Link
                            href="/store"
                            className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-500 hover:text-blue-400 transition-colors group mb-4"
                        >
                            <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" />
                            Back to Store
                        </Link>

                        <div className="space-y-4">
                            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-blue-600 dark:text-blue-500 opacity-80">
                                Official Identity
                            </p>
                            <h1 className="text-7xl md:text-9xl font-black italic uppercase tracking-tighter leading-[0.9] text-slate-900 dark:text-white">
                                Media <br />
                                <span className="text-slate-300/40 dark:text-white/20 transition-colors">Guidelines.</span>
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 text-xl max-w-2xl leading-relaxed mt-8 font-medium italic">
                                Leading the way in mobility. Official assets for BookMyBike brand and partners.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-4 pt-8">
                            <button
                                onClick={() => downloadSVG('full', 'gold')}
                                className="px-10 py-4 bg-slate-900 dark:bg-white text-white dark:text-black rounded-full font-black uppercase text-xs tracking-[0.15em] hover:bg-black dark:hover:bg-slate-200 transition-all shadow-xl shadow-blue-500/10 dark:shadow-white/5"
                            >
                                Get Brand Kit
                            </button>
                            <button className="px-10 py-4 bg-white/50 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-full font-black uppercase text-xs tracking-[0.15em] hover:bg-white/80 dark:hover:bg-white/5 transition-all backdrop-blur-sm">
                                Brand Story
                            </button>
                        </div>
                    </div>
                </div>

                <div className="max-w-6xl mx-auto px-6 py-32 space-y-48 relative z-10">

                    {/* Logo Section */}
                    <section className="space-y-16">
                        <div className="space-y-4 border-l-4 border-blue-600 pl-8">
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">The Mark</p>
                            <h2 className="text-5xl md:text-6xl font-black italic uppercase tracking-tighter leading-none">The Logo</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {/* Metallic Gold */}
                            <AssetCard
                                title="PREMIUM GOLD"
                                description="Chrome Finish"
                                usage="Reserved for luxury communications and premium endorsements."
                                onDownload={() => downloadSVG('full', 'gold')}
                            >
                                <div className="h-64 flex items-center justify-center bg-black rounded-3xl mb-8 group-hover:scale-[1.05] transition-transform duration-700 shadow-2xl shadow-yellow-500/10">
                                    <Logo monochrome="gold" size={48} />
                                </div>
                            </AssetCard>

                            {/* Metallic Silver */}
                            <AssetCard
                                title="CHROME SILVER"
                                description="Liquid Metal"
                                usage="Used for industrial-grade branding and high-performance kits."
                                onDownload={() => downloadSVG('full', 'silver')}
                            >
                                <div className="h-64 flex items-center justify-center bg-black rounded-3xl mb-8 group-hover:scale-[1.05] transition-transform duration-700 shadow-2xl shadow-white/5 border border-white/5">
                                    <Logo monochrome="silver" size={48} />
                                </div>
                            </AssetCard>

                            {/* Full Black */}
                            <AssetCard
                                title="ONYX BLACK"
                                description="Solid Identity"
                                usage="High-contrast mark for neutral white or bright surfaces."
                                onDownload={() => downloadSVG('full', 'black')}
                            >
                                <div className="h-64 flex items-center justify-center bg-white dark:bg-white rounded-3xl mb-8 group-hover:scale-[1.05] transition-transform duration-700 shadow-xl shadow-black/5">
                                    <Logo monochrome="black" size={48} />
                                </div>
                            </AssetCard>

                            {/* Primary Blue */}
                            <AssetCard
                                title="BRAND BLUE"
                                description="Standard Branding"
                                usage="Our official trademark for digital and print media."
                                onDownload={() => downloadSVG('full', 'light')}
                            >
                                <div className="h-64 flex items-center justify-center bg-slate-50 dark:bg-white/5 rounded-3xl mb-8 group-hover:scale-[1.02] transition-transform duration-500">
                                    <Logo mode="auto" size={48} />
                                </div>
                            </AssetCard>

                            {/* Stencil White */}
                            <AssetCard
                                title="PURE STENCIL"
                                description="Mono Inverse"
                                usage="For vibrant image backgrounds or deep solid colors."
                                onDownload={() => downloadSVG('full', 'white')}
                            >
                                <div className="h-64 flex items-center justify-center bg-blue-600 rounded-3xl mb-8 group-hover:scale-[1.02] transition-transform duration-500">
                                    <Logo monochrome="white" size={48} />
                                </div>
                            </AssetCard>

                            {/* Icon Only */}
                            <AssetCard
                                title="BRAND GLYPH"
                                description="Icon Identity"
                                usage="Compact mark for social avatars and small app icons."
                                onDownload={() => downloadSVG('icon', 'light')}
                            >
                                <div className="h-64 flex items-center justify-center bg-slate-100 dark:bg-[#0a0f1d] rounded-3xl border border-slate-200 dark:border-white/5 mb-8 group-hover:scale-[1.05] transition-transform duration-700">
                                    <Logo variant="icon" size={64} mode="auto" />
                                </div>
                            </AssetCard>

                            {/* Wordmark Only */}
                            <AssetCard
                                title="WORDMARK ONLY"
                                description="Text Identity"
                                usage="When the icon is not required for compact spaces."
                                onDownload={() => downloadSVG('wordmark', 'light')}
                            >
                                <div className="h-64 flex items-center justify-center bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/5 mb-8 group-hover:scale-[1.02] transition-transform duration-500">
                                    <Logo variant="wordmark" size={48} mode="auto" />
                                </div>
                            </AssetCard>
                        </div>
                    </section>

                    {/* Colors Section */}
                    <section className="space-y-16">
                        <div className="space-y-4 border-l-4 border-blue-600 pl-8">
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">Color Palette</p>
                            <h2 className="text-5xl md:text-6xl font-black italic uppercase tracking-tighter leading-none">The Colors</h2>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                            <ColorSwatch name="BOOKMY BLUE" hex="#2B7FFF" primary />
                            <ColorSwatch name="PURE WHITE" hex="#FFFFFF" />
                            <ColorSwatch name="SLATE GRAY" hex="#64748B" />
                            <ColorSwatch name="DEEP ONYX" hex="#030712" border />
                        </div>
                    </section>

                    {/* Typography Section */}
                    <section className="space-y-16">
                        <div className="space-y-4 border-l-4 border-blue-600 pl-8">
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">Type System</p>
                            <h2 className="text-5xl md:text-6xl font-black italic uppercase tracking-tighter leading-none">Typography</h2>
                        </div>
                        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[4rem] p-12 md:p-20 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center overflow-hidden relative">
                            {/* Large Ghost Text inside card */}
                            <div className="absolute top-0 right-0 text-[15vw] font-black italic uppercase text-slate-200/50 dark:text-white/[0.01] pointer-events-none select-none">
                                ABC
                            </div>

                            <div className="space-y-10 relative z-10">
                                <div className="space-y-4">
                                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-600 dark:text-blue-500">Primary Face</p>
                                    <h3 className="text-9xl font-black italic tracking-tighter text-slate-900 dark:text-white uppercase italic">Inter</h3>
                                </div>
                                <p className="text-slate-500 dark:text-slate-400 text-xl leading-relaxed font-medium italic">
                                    Modern, precise, and engineered for high-performance mobility interfaces.
                                </p>
                                <div className="space-y-6">
                                    <TypeRow label="Branding" weight="Semibold 600" />
                                    <TypeRow label="UI Headings" weight="Medium 500" />
                                    <TypeRow label="App Body" weight="Regular 400" />
                                </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-black/60 p-12 rounded-[2.5rem] border border-slate-200 dark:border-white/10 space-y-12 backdrop-blur-xl relative z-10">
                                <div className="space-y-4">
                                    <p className="text-8xl font-black tracking-tighter text-slate-900 dark:text-white italic leading-none">Aa.Zz</p>
                                    <div className="h-px bg-slate-200 dark:bg-white/10 w-full" />
                                </div>
                                <div className="text-slate-500 font-mono text-sm leading-8 tracking-[0.2em] uppercase">
                                    ABCDEFGHIJKLMNOPQRSTUVWXYZ<br />
                                    abcdefghijklmnopqrstuvwxyz<br />
                                    0123456789 !@#$%^&*
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            <div className="bg-slate-50 dark:bg-[#050b18] py-32 px-6 text-center border-t border-slate-200 dark:border-white/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-600/5 blur-[100px] rounded-full translate-y-1/2 pointer-events-none" />
                <div className="max-w-3xl mx-auto space-y-10 relative z-10">
                    <h2 className="text-5xl md:text-6xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white">Need specific <span className="text-blue-600 dark:text-blue-500">Assets?</span></h2>
                    <p className="text-slate-500 dark:text-slate-400 text-lg font-medium italic">For custom partnership branding or high-resolution signage files.</p>
                    <button className="px-12 py-5 bg-blue-600 text-white rounded-full font-black uppercase text-xs tracking-[0.2em] hover:bg-blue-500 transition-all shadow-2xl shadow-blue-500/20">
                        Contact Brand Team
                    </button>
                </div>
            </div>

            <MarketplaceFooter />
        </div>
    );
}

const AssetCard = ({ title, description, usage, children, onDownload }: { title: string, description: string, usage: string, children: React.ReactNode, onDownload?: () => void }) => (
    <div className="group flex flex-col p-8 rounded-[2.5rem] bg-white dark:bg-[#0a0f1d] border border-slate-200 dark:border-white/5 transition-all duration-500 hover:border-blue-500/40 hover:bg-[#F1F5F9] dark:hover:bg-[#0d1428] relative overflow-hidden shadow-sm dark:shadow-none">
        {children}
        <div className="space-y-5 relative z-10">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="text-sm font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-500 mb-1">{title}</h4>
                    <p className="text-lg font-black italic text-slate-900 dark:text-white uppercase tracking-tight">{description}</p>
                </div>
                <button
                    onClick={onDownload}
                    className="p-4 bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white rounded-2xl hover:bg-blue-600 hover:text-white transition-all group-hover:scale-110 duration-500"
                >
                    <Download size={20} />
                </button>
            </div>
            <div className="h-px bg-slate-100 dark:bg-white/5 w-full" />
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest italic opacity-60">
                {usage}
            </p>
        </div>
    </div>
);

const ColorSwatch = ({ name, hex, primary, border }: { name: string, hex: string, primary?: boolean, border?: boolean }) => (
    <div className="space-y-6 group">
        <div
            className={`h-40 rounded-[2rem] transition-all duration-500 group-hover:scale-[1.02] group-hover:-translate-y-2 ${primary ? 'shadow-2xl shadow-blue-600/30' : ''} ${border ? 'border border-white/10' : ''}`}
            style={{ backgroundColor: hex }}
        />
        <div className="pl-2">
            <p className="font-black italic text-slate-900 dark:text-white text-lg uppercase tracking-tight">{name}</p>
            <div className="flex items-center gap-3 mt-2">
                <span className="text-[9px] font-black bg-blue-600/20 text-blue-600 dark:text-blue-500 px-2 py-1 rounded-md uppercase tracking-widest leading-none">HEX</span>
                <p className="text-xs font-mono text-slate-400 dark:text-slate-500 font-bold tracking-widest uppercase">{hex}</p>
            </div>
        </div>
    </div>
);

const TypeRow = ({ label, weight }: { label: string, weight: string }) => (
    <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 italic">{label}</span>
        <span className="text-sm font-black text-slate-900 dark:text-white italic tracking-widest uppercase">{weight}</span>
    </div>
);
