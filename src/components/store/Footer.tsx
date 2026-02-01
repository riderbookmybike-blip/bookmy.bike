'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Facebook, Twitter, Linkedin, Instagram, Heart, Newspaper, ArrowRight } from 'lucide-react';
import { useSystemBrandsLogic } from '@/hooks/SystemBrandsLogic';
import { slugify } from '@/utils/slugs';
import { motion } from 'framer-motion';
import { useI18n } from '@/components/providers/I18nProvider';

export const Footer = () => {
    const { brands } = useSystemBrandsLogic();
    const [activeSection, setActiveSection] = useState(0);
    const { t } = useI18n();

    interface FooterLink {
        label: string;
        href: string;
        highlight?: boolean;
    }

    interface FooterSection {
        title: string;
        gradient: string;
        links: FooterLink[];
    }

    // Footer Data Structure for Accordion
    const footerSections: FooterSection[] = [
        {
            title: t('Collection'),
            gradient: 'from-zinc-900 to-black',
            links: [
                { label: t('All Inventory'), href: '/store/catalog' },
                { label: t('Scooters'), href: '/store/catalog?category=SCOOTER' },
                { label: t('Motorcycles'), href: '/store/catalog?category=MOTORCYCLE' },
                { label: t('Price: Low to High'), href: '/store/catalog?sort=price_asc' },
                { label: t('Best Mileage'), href: '/store/catalog?sort=mileage' },
            ],
        },
        {
            title: t('Brands'),
            gradient: 'from-zinc-800 to-zinc-950',
            links: [
                ...brands.slice(0, 4).map(b => ({ label: b.name, href: `/store/${b.slug || slugify(b.name)}` })),
                { label: t('View All Brands'), href: '/store/catalog', highlight: true },
            ],
        },
        {
            title: t('Ecosystem'),
            gradient: 'from-zinc-900 to-black',
            links: [
                { label: t('About Us'), href: '#' },
                { label: t('Our Blog'), href: '/blog' },
                { label: t('Partner Login'), href: '/login' },
                { label: t('Media Kit'), href: '/mediakit' },
                { label: t('Contact'), href: '#' },
            ],
        },
        {
            title: t('Services'),
            gradient: 'from-zinc-800 to-black',
            links: [
                { label: t('Help Center'), href: '#' },
                { label: t('Finance Options'), href: '#' },
                { label: t('Insurance Hub'), href: '#' },
                { label: t('RTO Rules'), href: '#' },
                { label: t('Privacy Policy'), href: '#' },
            ],
        },
    ];

    return (
        <footer className="snap-start min-h-screen flex flex-col bg-white dark:bg-[#0b0d10] border-t border-slate-200 dark:border-white/5 pt-[var(--header-h)] pb-12 overflow-hidden relative text-slate-900 dark:text-white transition-colors duration-500">
            {/* Ambient Background Glows - SIGNATURE CARBON GOLD THEME */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-zinc-200/50 dark:bg-zinc-800/20 blur-[150px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#F4B000]/10 dark:bg-[#F4B000]/5 blur-[150px] rounded-full" />
            </div>

            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />

            <div className="max-w-[1440px] mx-auto w-full px-6 relative z-10 flex-1 flex flex-col justify-center">
                {/* SPLIT LAYOUT: Left Content (5) | Right Accordion (7) */}
                {/* SPLIT LAYOUT: Left Content (5) | Right Accordion (7) */}
                {/* SPLIT LAYOUT: Re-architected for Responsive Ordering */}
                {/* Mobile: Brand -> Accordion -> Socials */}
                {/* Desktop: Brand (Left Top) + Socials (Left Bottom) | Accordion (Right Full Height) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-12 lg:gap-16 items-start relative min-h-[60vh] lg:h-[60vh]">

                    {/* 1. BRAND HEADER (Mobile: Top, Desktop: Top-Left) */}
                    <div className="lg:col-span-5 relative z-20">
                        <div className="space-y-8">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="h-px w-12 bg-[#F4B000]" />
                                <p className="text-sm font-black text-[#F4B000] uppercase tracking-[0.3em]">
                                    {t('The Final Chapter')}
                                </p>
                            </div>
                            <h3 className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-slate-900 dark:text-white leading-[0.85] italic transition-colors">
                                {t('Redefining')} <br />{' '}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-zinc-500">
                                    {t('How India Rides.')}
                                </span>
                            </h3>
                            <p className="text-lg text-zinc-400 leading-relaxed max-w-lg font-medium mt-[60px] border-l-2 border-white/5 pl-6">
                                {t("India's premier marketplace for the next generation of riders. Engineering excellence into every booking.")}
                            </p>
                        </div>
                    </div>

                    {/* 2. ACCORDION (Mobile: Middle, Desktop: Right Column Spanning 2 Rows) */}
                    <div className="lg:col-span-7 lg:row-span-2 flex flex-row lg:flex-row gap-4 h-[500px] lg:h-full overflow-x-auto lg:overflow-visible snap-x snap-mandatory lg:snap-none -mx-6 px-6 lg:mx-0 lg:px-0 pb-4 lg:pb-0 hide-scrollbar order-2 lg:order-none">
                        {footerSections.map((section, idx) => {
                            const isActive = activeSection === idx;
                            return (
                                <motion.div
                                    key={idx}
                                    layout
                                    onMouseEnter={() => setActiveSection(idx)}
                                    onClick={() => setActiveSection(idx)}
                                    className={`relative rounded-[2rem] overflow-hidden cursor-pointer border transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col justify-between flex-shrink-0 lg:flex-shrink snap-center ${isActive
                                        ? `w-[300px] lg:w-auto lg:flex-[3] bg-white dark:bg-zinc-900 text-slate-900 dark:text-white border-slate-200 dark:border-white/10 shadow-2xl dark:shadow-[0_0_80px_rgba(0,0,0,0.5)]`
                                        : 'w-[80px] lg:w-auto lg:flex-[1] bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/5 text-zinc-400 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-white/10'
                                        }`}
                                >
                                    <div className="absolute inset-0 p-8 flex flex-col justify-between">
                                        {/* Header / Vertical Title */}
                                        <div className="flex justify-between items-start">
                                            <span
                                                className={`text-xs font-black uppercase tracking-[0.2em] transition-colors ${isActive ? 'text-slate-900/60 dark:text-white/80' : 'text-slate-400 dark:text-zinc-500'}`}
                                            >
                                                {`0${idx + 1}`}
                                            </span>
                                            {isActive && <ArrowRight className="text-slate-900 dark:text-white -rotate-45" />}
                                        </div>

                                        {/* Content Area */}
                                        <div className="relative flex-1 flex items-center">
                                            {/* Inactive Vertical Text */}
                                            <div
                                                className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 pointer-events-none transition-all duration-500 ${!isActive ? 'opacity-100' : 'opacity-0'}`}
                                            >
                                                <span className="text-4xl font-black uppercase tracking-widest text-slate-200 dark:text-white/20 whitespace-nowrap">
                                                    {section.title}
                                                </span>
                                            </div>

                                            {/* Active List Content */}
                                            <div
                                                className={`w-full transition-all duration-500 delay-100 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 absolute inset-0 pointer-events-none'}`}
                                            >
                                                <h4 className="text-4xl font-black uppercase italic tracking-tighter mb-8 leading-none drop-shadow-sm text-transparent bg-clip-text bg-gradient-to-r from-[#F4B000] to-amber-200">
                                                    {section.title}
                                                </h4>
                                                <ul className="space-y-3">
                                                    {section.links.map((link, i) => (
                                                        <li key={i}>
                                                            <Link
                                                                href={link.href}
                                                                className={`text-lg font-medium transition-colors flex items-center gap-2 group/link ${link.highlight
                                                                    ? 'text-slate-900 dark:text-white hover:text-slate-700 dark:hover:text-white/80 underline decoration-slate-300 dark:decoration-white/30'
                                                                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                                                                    }`}
                                                            >
                                                                {link.label}
                                                                <ArrowRight
                                                                    size={14}
                                                                    className="opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all text-[#F4B000]"
                                                                />
                                                            </Link>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* 3. SOCIALS (Mobile: Bottom, Desktop: Bottom-Left) */}
                    <div className="lg:col-span-5 flex flex-col justify-end h-full relative z-20 order-3 lg:order-none">
                        <div className="flex flex-col gap-6">
                            <div className="flex gap-4">
                                <SocialIcon icon={<Newspaper size={20} />} href="/blog" brandColor="#F4B000" />
                                <SocialIcon
                                    icon={<Instagram size={20} />}
                                    href="https://instagram.com"
                                    brandColor="#E4405F"
                                />
                                <SocialIcon
                                    icon={<Twitter size={20} />}
                                    href="https://twitter.com"
                                    brandColor="#1DA1F2"
                                />
                                <SocialIcon
                                    icon={<Linkedin size={20} />}
                                    href="https://linkedin.com"
                                    brandColor="#0077B5"
                                />
                                <SocialIcon
                                    icon={<Facebook size={20} />}
                                    href="https://facebook.com"
                                    brandColor="#1877F2"
                                />
                            </div>

                            {/* Minimized Metadata Block */}
                            <div className="space-y-2">
                                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em]">
                                    © 2011-2026
                                </p>
                                <ViewportDebug />
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </footer>
    );
};

// Internal Debug Component for Production Verification
const ViewportDebug = () => {
    const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });
    const [mounted, setMounted] = React.useState(false);
    const [time] = React.useState(new Date().toLocaleTimeString());
    const [forceShow, setForceShow] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
        const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (!mounted) return null;

    const { width, height } = dimensions;
    const screenWidth = typeof window !== 'undefined' ? window.screen.width : 0;
    const screenHeight = typeof window !== 'undefined' ? window.screen.height : 0;
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1;

    // Aspect Ratio Calculation
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const common = gcd(width, height);
    const aspect = `${width / common}:${height / common}`;

    // Improved Mode Logic (Must match DeviceLayout.tsx)
    let mode = 'MOBILE';
    const isTvActual =
        width >= 2000 ||
        (width === 960 && height === 540 && dpr >= 2) ||
        (width === 1280 && height === 720 && dpr >= 2) ||
        (width === 1129 && height === 635);

    if (isTvActual) mode = 'ULTRA-WIDE / TV';
    else if (width >= 1024) mode = 'DESKTOP';
    else if (width >= 768) mode = 'TABLET';

    // Simple Device Info
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const device = ua.includes('Macintosh')
        ? 'MacBook'
        : ua.includes('iPhone')
            ? 'iPhone'
            : ua.includes('Android')
                ? 'Android'
                : 'Device';

    const commitSha = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'DEV';

    return (
        <div className="group relative">
            <button
                onClick={() => setForceShow(!forceShow)}
                className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-600 font-medium uppercase tracking-widest hover:text-brand-primary transition-all select-none cursor-pointer outline-none focus:ring-1 focus:ring-brand-primary/20 rounded-md px-2 py-1"
                aria-label="Toggle Debugger"
            >
                <span>Engineered with</span>
                <Heart size={10} className="text-brand-primary fill-brand-primary animate-pulse" />
                <span>in India</span>
            </button>

            <div
                className={`absolute bottom-full left-0 mb-3 w-80 p-4 bg-slate-900/95 text-white text-[10px] font-mono rounded-lg border border-white/10 shadow-xl transition-all z-[100] backdrop-blur-md ${forceShow
                    ? 'opacity-100 translate-y-0 pointer-events-auto'
                    : 'opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0'
                    }`}
            >
                <div className="space-y-2">
                    {/* Header */}
                    <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-2">
                        <span className="text-brand-primary font-black uppercase tracking-widest text-[11px]">BMB Debugger</span>
                        <span className="opacity-50">{commitSha.slice(0, 7)}</span>
                    </div>

                    {/* Viewport Info */}
                    <div className="grid grid-cols-2 gap-2 text-[9px] border-b border-white/10 pb-2">
                        <div>
                            <p className="text-slate-500 uppercase">Viewport</p>
                            <p className="font-bold text-white">{width}x{height}</p>
                        </div>
                        <div>
                            <p className="text-slate-500 uppercase">Device/Mode</p>
                            <p className="font-bold text-white">
                                {(() => {
                                    if (typeof navigator === 'undefined') return 'Server';
                                    const ua = navigator.userAgent;
                                    let b = 'Unknown';
                                    if (ua.includes('Edg')) b = 'Edge';
                                    else if (ua.includes('Chrome') && !ua.includes('Edg')) b = 'Chrome';
                                    else if (ua.includes('Safari') && !ua.includes('Chrome')) b = 'Safari';
                                    else if (ua.includes('Firefox')) b = 'Firefox';
                                    return `${b} | ${device}`;
                                })()}
                            </p>
                            <p className="font-mono text-[8px] text-slate-500 mt-0.5">{mode}</p>
                        </div>
                    </div>

                    {/* Marketplace Runtime Diagnostics */}
                    <div className="space-y-2 py-2">
                        <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest bg-brand-primary/10 px-2 py-1 rounded-md">Marketplace Diagnostics</p>

                        {(window as any).__BMB_DEBUG__ ? (
                            <div className="space-y-2">
                                {/* USER LOCATION */}
                                <div className="space-y-1">
                                    <p className="text-slate-400 uppercase text-[8px] font-bold">📍 User Location</p>
                                    <div className="bg-blue-500/10 border border-blue-500/20 p-2 rounded-md space-y-1">
                                        <div className="flex justify-between">
                                            <span>Pincode:</span>
                                            <span className="text-blue-400 font-mono">{(window as any).__BMB_DEBUG__.pincode || 'NOT_SET'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>District:</span>
                                            <span className="text-white">{(window as any).__BMB_DEBUG__.district || 'NOT_SET'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>State:</span>
                                            <span className="text-white">{(window as any).__BMB_DEBUG__.stateCode || 'NOT_SET'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Loc Source:</span>
                                            <span className="text-orange-400">{(window as any).__BMB_DEBUG__.locSource || 'AUTO'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* PRICING RESOLUTION */}
                                <div className="space-y-1">
                                    <p className="text-slate-400 uppercase text-[8px] font-bold">💰 Pricing</p>
                                    <div className="bg-white/5 p-2 rounded-md">
                                        <div className="flex justify-between">
                                            <span>Source:</span>
                                            <span className="text-emerald-400">{(window as any).__BMB_DEBUG__.pricingSource || 'MARKET_BEST'}</span>
                                        </div>
                                        <div className="flex justify-between mt-1">
                                            <span>Offers Loaded:</span>
                                            <span className="text-cyan-400">{(window as any).__BMB_DEBUG__.marketOffersCount || 0}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* STUDIO/DEALER INFO */}
                                <div className="space-y-1">
                                    <p className="text-slate-400 uppercase text-[8px] font-bold">🏪 Studio/Dealer</p>
                                    <div className="bg-amber-500/10 border border-amber-500/20 p-2 rounded-md space-y-1">
                                        {(window as any).__BMB_DEBUG__.studioName ? (
                                            <>
                                                <div className="flex justify-between">
                                                    <span>✅ Served:</span>
                                                    <span className="text-amber-400 font-mono text-[9px]">{(window as any).__BMB_DEBUG__.studioName}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>ID:</span>
                                                    <span className="text-slate-300 font-mono text-[8px]">{(window as any).__BMB_DEBUG__.dealerId || 'N/A'}</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-red-400 text-[9px] italic">
                                                ⚠️ Studio name NOT loaded<br />
                                                <span className="text-slate-500 text-[8px]">Check: Location set? Offers loaded?</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* EXPECTED (For debugging) */}
                                <div className="space-y-1">
                                    <p className="text-slate-400 uppercase text-[8px] font-bold">🎯 Expected</p>
                                    <div className="bg-green-500/10 border border-green-500/20 p-2 rounded-md space-y-1 text-[9px]">
                                        <div className="text-green-400">
                                            {(window as any).__BMB_DEBUG__.marketOffersCount > 0
                                                ? `${(window as any).__BMB_DEBUG__.marketOffersCount} dealer offers loaded`
                                                : 'No dealer offers (check RPC)'}
                                        </div>
                                        {(window as any).__BMB_DEBUG__.stateCode && (
                                            <div className="text-slate-400">
                                                For {(window as any).__BMB_DEBUG__.stateCode}: Should show dealer name from RPC
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Finance Logic */}
                                <div className="space-y-1">
                                    <p className="text-slate-500 uppercase">Finance Resolution</p>
                                    <div className="bg-white/5 p-2 rounded-md space-y-1">
                                        <div className="flex justify-between">
                                            <span>Bank:</span>
                                            <span className="text-emerald-400">{(window as any).__BMB_DEBUG__?.bankName || 'NOT_SET'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Scheme ID:</span>
                                            <span className="text-indigo-400">{(window as any).__BMB_DEBUG__?.schemeId || 'NONE'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Scheme Name:</span>
                                            <span className="text-indigo-300 text-xs">{(window as any).__BMB_DEBUG__?.schemeName || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Resolution:</span>
                                            <span className="text-white text-xs">{(window as any).__BMB_DEBUG__?.financeLogic || 'NOT_RESOLVED'}</span>
                                        </div>
                                        {(window as any).__BMB_DEBUG__?.dealerId && (
                                            <div className="flex justify-between border-t border-white/5 pt-1 mt-1">
                                                <span>Dealership:</span>
                                                <span className="text-amber-400 text-[9px] font-mono">{(window as any).__BMB_DEBUG__.dealerId}</span>
                                            </div>
                                        )}
                                        {(window as any).__BMB_DEBUG__?.leadId && (
                                            <div className="flex justify-between">
                                                <span>Lead ID:</span>
                                                <span className="text-rose-400 text-[9px] font-mono">{(window as any).__BMB_DEBUG__.leadId}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Context */}
                                {(window as any).__BMB_DEBUG__.leadId && (
                                    <div className="space-y-1">
                                        <p className="text-slate-500 uppercase">Active Context</p>
                                        <div className="bg-amber-500/10 border border-amber-500/20 p-2 rounded-md flex justify-between items-center">
                                            <span className="italic text-amber-500">Lead Mode</span>
                                            <span className="text-[9px] font-mono text-white">{(window as any).__BMB_DEBUG__.leadId}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-slate-500 italic p-2 text-center border border-dashed border-white/10 rounded-lg">No runtime diagnostics captured yet. Navigate to a catalog or PDP to populate.</p>
                        )}
                    </div>

                    {/* Context Info */}
                    <div className="space-y-1 pt-2 border-t border-white/10">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Context Info</p>
                        <div className="bg-white/5 p-2 rounded-md space-y-1 text-[9px]">
                            <div className="flex justify-between">
                                <span>Tenant:</span>
                                <span className="text-purple-400 font-mono">{(window as any).__BMB_DEBUG__?.tenantId || 'NOT_SET'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Page:</span>
                                <span className="text-cyan-400 font-mono">{(window as any).__BMB_DEBUG__?.pageId || 'NOT_SET'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>User:</span>
                                <span className="text-pink-400 font-mono">{(window as any).__BMB_DEBUG__?.userId || 'GUEST'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Build & Time */}
                    <div className="flex justify-between pt-2 border-t border-white/10 text-slate-500">
                        <span>Local Time</span>
                        <span>{time}</span>
                    </div>
                </div>
                <div className="absolute -bottom-1 right-8 w-2 h-2 bg-slate-900 rotate-45 border-r border-b border-white/10"></div>
            </div>
        </div>
    );
};

const SocialIcon = ({ icon, href, brandColor }: { icon: React.ReactElement; href: string; brandColor: string }) => {
    const [isHovered, setIsHovered] = React.useState(false);

    return (
        <a
            href={href}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-slate-500 hover:text-white transition-all duration-300 border border-transparent hover:border-white/10"
            style={{
                backgroundColor: isHovered ? brandColor : undefined,
                boxShadow: isHovered ? `0 10px 20px -5px ${brandColor}60` : undefined,
            }}
        >
            <div className={`transition-all duration-300 ${isHovered ? 'scale-110' : 'scale-100'}`}>
                {React.cloneElement(icon as React.ReactElement<{ fill: string; strokeWidth: number }>, {
                    fill: isHovered ? 'white' : 'none',
                    strokeWidth: 2,
                })}
            </div>
        </a>
    );
};
