'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { Facebook, Twitter, Linkedin, Instagram, Heart, Newspaper, ArrowRight } from 'lucide-react';
import { useBrands } from '@/hooks/useBrands';
import { slugify } from '@/utils/slugs';
import { motion, AnimatePresence } from 'framer-motion';

export const Footer = () => {
    const { brands } = useBrands();
    const [activeSection, setActiveSection] = useState(0);

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
            title: 'Collection',
            gradient: 'from-amber-400 to-yellow-600',
            links: [
                { label: 'All Inventory', href: '/store/catalog' },
                { label: 'Scooters', href: '/store/catalog?category=SCOOTER' },
                { label: 'Motorcycles', href: '/store/catalog?category=MOTORCYCLE' },
                { label: 'Price: Low to High', href: '/store/catalog?sort=price_asc' },
                { label: 'Best Mileage', href: '/store/catalog?sort=mileage' },
            ]
        },
        {
            title: 'Brands',
            gradient: 'from-yellow-500 to-amber-700',
            links: [
                ...brands.slice(0, 4).map(b => ({ label: b.name, href: `/store/${b.slug || slugify(b.name)}` })),
                { label: 'View All Brands', href: '/store/catalog', highlight: true }
            ]
        },
        {
            title: 'Ecosystem',
            gradient: 'from-orange-400 to-amber-600',
            links: [
                { label: 'About Us', href: '#' },
                { label: 'Our Blog', href: '/blog' },
                { label: 'Partner Login', href: '/login' },
                { label: 'Media Kit', href: '/mediakit' },
                { label: 'Contact', href: '#' },
            ]
        },
        {
            title: 'Services',
            gradient: 'from-amber-500 to-orange-700',
            links: [
                { label: 'Help Center', href: '#' },
                { label: 'Finance Options', href: '#' },
                { label: 'Insurance Hub', href: '#' },
                { label: 'RTO Rules', href: '#' },
                { label: 'Privacy Policy', href: '#' },
            ]
        }
    ];

    return (
        <footer className="snap-start min-h-screen flex flex-col bg-[#0b0d10] border-t border-white/5 pt-[var(--header-h)] pb-12 overflow-hidden relative text-white">
            {/* Ambient Background Glows - BRAND GOLD THEME */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-yellow-600/10 blur-[120px] rounded-full" />
            </div>

            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <div className="max-w-[1440px] mx-auto w-full px-8 md:px-16 relative z-10 flex-1 flex flex-col justify-center">

                {/* SPLIT LAYOUT: Left Content (5) | Right Accordion (7) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-16 items-stretch relative h-[60vh]">

                    {/* LEFT COLUMN: Brand & Socials (5/12) */}
                    <div className="lg:col-span-5 flex flex-col justify-between h-full relative z-20">
                        <div className="space-y-12">
                            <div className="space-y-8">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="h-px w-12 bg-brand-primary" />
                                    <p className="text-sm font-black text-brand-primary uppercase tracking-[0.3em]">
                                        The Next Chapter
                                    </p>
                                </div>
                                <h3 className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-white leading-[0.85] italic drop-shadow-2xl">
                                    Redefining <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-500">Mobility.</span>
                                </h3>
                                <p className="text-lg text-zinc-400 leading-relaxed max-w-lg font-medium mt-[60px] border-l-2 border-white/10 pl-6">
                                    India&apos;s premier marketplace for the next generation of
                                    riders. Engineering excellence into every booking.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-6">
                            <div className="flex gap-4">
                                <SocialIcon icon={<Newspaper size={20} />} href="/blog" brandColor="#ffd700" />
                                <SocialIcon icon={<Instagram size={20} />} href="https://instagram.com" brandColor="#E4405F" />
                                <SocialIcon icon={<Twitter size={20} />} href="https://twitter.com" brandColor="#1DA1F2" />
                                <SocialIcon icon={<Linkedin size={20} />} href="https://linkedin.com" brandColor="#0077B5" />
                                <SocialIcon icon={<Facebook size={20} />} href="https://facebook.com" brandColor="#1877F2" />
                            </div>

                            {/* Minimized Metadata Block */}
                            <div className="space-y-2">
                                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em]">
                                    © 2011-2026
                                </p>
                                <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-medium uppercase tracking-widest select-none">
                                    <span>Engineered with</span>
                                    <Heart size={10} className="text-brand-primary fill-brand-primary animate-pulse" />
                                    <span>in India</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Interactive Accordion (7/12) */}
                    <div className="lg:col-span-7 flex flex-col lg:flex-row gap-4 h-full">
                        {footerSections.map((section, idx) => {
                            const isActive = activeSection === idx;
                            return (
                                <motion.div
                                    key={idx}
                                    layout
                                    onMouseEnter={() => setActiveSection(idx)}
                                    className={`relative rounded-[2rem] overflow-hidden cursor-pointer border transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col justify-between ${isActive
                                        ? `flex-[3] bg-gradient-to-br ${section.gradient} text-black border-amber-500/50 shadow-[0_0_80px_rgba(245,158,11,0.3)]`
                                        : 'flex-[1] bg-white/5 border-white/5 text-zinc-500 hover:bg-white/10'
                                        }`}
                                >
                                    <div className="absolute inset-0 p-8 flex flex-col justify-between">

                                        {/* Header / Vertical Title */}
                                        <div className="flex justify-between items-start">
                                            <span className={`text-xs font-black uppercase tracking-[0.2em] transition-colors ${isActive ? 'text-black/80' : 'text-zinc-500'}`}>
                                                {`0${idx + 1}`}
                                            </span>
                                            {isActive && <ArrowRight className="text-black -rotate-45" />}
                                        </div>

                                        {/* Content Area */}
                                        <div className="relative flex-1 flex items-center">

                                            {/* Inactive Vertical Text */}
                                            <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 pointer-events-none transition-all duration-500 ${!isActive ? 'opacity-100' : 'opacity-0'}`}>
                                                <span className="text-4xl font-black uppercase tracking-widest text-white/20 whitespace-nowrap">
                                                    {section.title}
                                                </span>
                                            </div>

                                            {/* Active List Content */}
                                            <div className={`w-full transition-all duration-500 delay-100 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 absolute inset-0 pointer-events-none'}`}>
                                                <h4 className="text-4xl font-black uppercase italic tracking-tighter mb-8 leading-none drop-shadow-sm">
                                                    {section.title}
                                                </h4>
                                                <ul className="space-y-3">
                                                    {section.links.map((link, i) => (
                                                        <li key={i}>
                                                            <Link
                                                                href={link.href}
                                                                className={`text-lg font-medium transition-colors flex items-center gap-2 group/link ${link.highlight
                                                                    ? 'text-black hover:text-black/70 underline decoration-black/30'
                                                                    : 'text-black/70 hover:text-black'
                                                                    }`}
                                                            >
                                                                {link.label}
                                                                <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all text-black" />
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
                </div>

                {/* Bottom Section: REMOVED (Content Moved Up) */}
                <div className="hidden">
                    <ViewportDebug />
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
        <div className="group relative cursor-help" onDoubleClick={() => setForceShow(!forceShow)}>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-600 font-medium uppercase tracking-widest hover:text-brand-primary transition-colors select-none">
                <span>Engineered with</span>
                <Heart size={10} className="text-brand-primary fill-brand-primary animate-pulse" />
                <span>in India</span>
            </div>

            <div
                className={`absolute bottom-full right-0 mb-3 w-72 p-3 bg-slate-900/95 text-white text-[10px] font-mono rounded-lg border border-white/10 shadow-xl transition-all pointer-events-none z-50 backdrop-blur-md ${forceShow
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
                    }`}
            >
                <div className="space-y-1.5">
                    <div className="flex justify-between border-b border-white/10 pb-1">
                        <span className="text-slate-400">Viewport</span>
                        <span className="font-bold text-brand-primary">
                            {width}x{height} <span className="text-[8px] opacity-60">({aspect})</span>
                        </span>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-1">
                        <span className="text-slate-400">Screen</span>
                        <span className="font-bold">
                            {screenWidth}x{screenHeight} <span className="text-[8px] opacity-60">@{dpr}x</span>
                        </span>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-1">
                        <span className="text-slate-400">Device/Mode</span>
                        <span className="font-bold">
                            {device} | {mode}
                        </span>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-1">
                        <span className="text-slate-400">Build Info</span>
                        <span className="font-mono text-xs">{commitSha.slice(0, 7)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-400">Local Time</span>
                        <span>{time}</span>
                    </div>
                </div>
                <div className="absolute -bottom-1 right-8 w-2 h-2 bg-slate-900 rotate-45 border-r border-b border-white/10"></div>
            </div>
        </div>
    );
};

const SocialIcon = ({ icon, href, brandColor }: { icon: React.ReactElement<any>; href: string; brandColor: string }) => {
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
                {React.cloneElement(icon, {
                    fill: isHovered ? 'white' : 'none',
                    strokeWidth: 2
                })}
            </div>
        </a>
    );
};
