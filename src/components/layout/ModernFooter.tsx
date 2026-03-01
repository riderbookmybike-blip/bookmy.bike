'use client';

// Refined Modern Footer - Optimized SSR

import React, { useState } from 'react';
import Link from 'next/link';
import { Facebook, Twitter, Linkedin, Instagram, Heart, Plus, Minus, MapPin } from 'lucide-react';
import { useSystemBrandsLogic } from '@/hooks/SystemBrandsLogic';
import { slugify } from '@/utils/slugs';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from '@/components/brand/Logo';

export const ModernFooter = () => {
    const { brands } = useSystemBrandsLogic();
    const [openSection, setOpenSection] = useState<string | null>(null);
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const toggleSection = (title: string) => {
        setOpenSection(openSection === title ? null : title);
    };

    // Filter brands to only show those with vehicles (Logic: name matches confirmed brands)
    const activeBrandNames = ['HONDA', 'TVS', 'HERO', 'SUZUKI'];
    const filteredBrands = brands.filter(b => activeBrandNames.includes(b.name.toUpperCase()));

    const footerSections = [
        {
            title: 'Inventory',
            links: [
                { label: 'All Inventory', href: '/store/catalog' },
                { label: 'Scooters', href: '/store/catalog?category=SCOOTER' },
                { label: 'Motorcycles', href: '/store/catalog?category=MOTORCYCLE' },
                { label: 'Lowest Price', href: '/store/catalog?sort=price_asc' },
                { label: 'Highest Mileage', href: '/store/catalog?sort=mileage' },
            ],
        },
        {
            title: 'Honda Hub',
            links: [
                { label: 'Activa 6G', href: '/store/honda/activa-6g' },
                { label: 'Activa 125', href: '/store/honda/activa-125' },
                { label: 'Dio 125', href: '/store/honda/dio-125' },
                { label: 'Shine 125', href: '/store/honda/shine-125' },
                { label: 'SP 125', href: '/store/honda/sp-125' },
            ],
        },
        {
            title: 'TVS & Hero',
            links: [
                { label: 'Jupiter 110', href: '/store/tvs/jupiter' },
                { label: 'Ntorq 125', href: '/store/tvs/ntorq' },
                { label: 'Raider 125', href: '/store/tvs/raider' },
                { label: 'Splendor+', href: '/store/hero/splendor-plus' },
                { label: 'Xtreme 125R', href: '/store/hero/xtreme-125r' },
            ],
        },
        {
            title: 'Local SEO',
            links: [
                { label: 'Mumbai', href: '/store/catalog?district=MUMBAI' },
                { label: 'Palghar', href: '/store/catalog?district=PALGHAR' },
                { label: 'Kalyan', href: '/store/catalog?district=THANE' },
                { label: 'Panvel', href: '/store/catalog?district=RAIGAD' },
                { label: 'Pune', href: '/store/catalog?district=PUNE' },
            ],
        },
        {
            title: 'Support',
            links: [
                { label: 'Finance Options', href: '/finance' },
                { label: 'Insurance Hub', href: '/insurance' },
                { label: 'RTO Rules', href: '/rto' },
                { label: 'Help Center', href: '/help' },
                { label: 'Privacy Policy', href: '/privacy' },
            ],
        },
        {
            title: 'Company',
            links: [
                { label: 'About Us', href: '/about' },
                { label: 'Our Blog', href: '/blog' },
                { label: "O' Circle", href: '/store/ocircle' },
                { label: 'Media Kit', href: '/mediakit' },
            ],
        },
    ];

    if (!mounted) {
        return <div className="bg-black min-h-[400px]" />;
    }

    return (
        <footer className="bg-black min-h-screen flex flex-col justify-between border-t border-white/10 selection:bg-brand-primary/20 overflow-hidden relative">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-brand-primary/50 to-transparent" />

            {/* 1. Brand Hero Header */}
            <div className="pt-[calc(var(--header-h)+6rem)] lg:pt-[calc(var(--header-h)+8rem)] relative z-10 border-b border-white/5">
                <div className="page-container flex flex-col items-center text-center">
                    <Link href="/" className="inline-block mb-10 group">
                        <Logo
                            size={48}
                            variant="full"
                            className="brightness-0 invert opacity-80 group-hover:opacity-100 transition-opacity"
                        />
                    </Link>
                    <p className="text-[14px] lg:text-[16px] font-medium text-white/70 leading-relaxed mb-12 tracking-tight max-w-2xl px-6">
                        India&apos;s most trusted digital marketplace for the next generation of riders.
                        <br className="hidden lg:block" />
                        Engineering transparency and speed into every bike booking.
                    </p>

                    <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10 shadow-2xl mb-16">
                        <div className="relative">
                            <div className="w-2.5 h-2.5 rounded-full bg-brand-primary animate-pulse" />
                            <div className="absolute inset-0 rounded-full bg-brand-primary/40 animate-ping" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">
                            Operational: Maharashtra
                        </span>
                    </div>
                </div>
            </div>

            {/* 2. Main Navigation Block (6 Columns) */}
            <div className="flex-1 flex flex-col justify-center py-20 lg:py-32 relative z-10">
                <div className="page-container w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 lg:gap-8 items-start">
                        {footerSections.map(section => {
                            const isOpen = openSection === section.title;
                            const isLocalSection = section.title === 'Local SEO';

                            return (
                                <div
                                    key={section.title}
                                    className="flex flex-col border-b border-white/5 lg:border-none last:border-none group"
                                >
                                    <button
                                        onClick={() => toggleSection(section.title)}
                                        className="w-full flex items-center justify-between py-6 lg:py-0 lg:mb-12 lg:cursor-default text-left"
                                    >
                                        <span className="text-[11px] font-black uppercase tracking-[0.4em] text-white/50 lg:border-l lg:border-white/10 lg:pl-6 transition-all group-hover:text-brand-primary group-hover:border-brand-primary">
                                            {section.title}
                                        </span>
                                        <div className="lg:hidden w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50">
                                            {isOpen ? <Minus size={14} /> : <Plus size={14} />}
                                        </div>
                                    </button>

                                    <div className="hidden lg:block lg:pl-6">
                                        <ul className="flex flex-col gap-6">
                                            {section.links.map((link, i) => (
                                                <li key={i}>
                                                    <Link
                                                        href={link.href}
                                                        className="group/link flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-all underline-offset-4"
                                                    >
                                                        {isLocalSection && (
                                                            <MapPin
                                                                size={10}
                                                                className="text-white/20 group-hover/link:text-brand-primary transition-colors"
                                                            />
                                                        )}
                                                        <span className="group-hover/link:translate-x-1 duration-300 transition-transform">
                                                            {link.label}
                                                        </span>
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <AnimatePresence>
                                        {isOpen && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                className="lg:hidden overflow-hidden"
                                            >
                                                <ul className="flex flex-col gap-5 pb-8 pl-4">
                                                    {section.links.map((link, i) => (
                                                        <li key={i}>
                                                            <Link
                                                                href={link.href}
                                                                className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-colors"
                                                            >
                                                                {isLocalSection && (
                                                                    <MapPin size={10} className="text-brand-primary" />
                                                                )}
                                                                {link.label}
                                                            </Link>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* 2. Unified Legal & Social Rail */}
            <div className="py-14 bg-black border-t border-white/5 relative z-10">
                <div className="page-container">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
                        {/* Legal Cluster */}
                        <div className="flex flex-col md:flex-row items-center gap-6 lg:gap-16">
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white">
                                © 2011-2026 BOOKMYBIKE
                            </p>
                            <div className="flex items-center gap-10">
                                <Link
                                    href="#"
                                    className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 hover:text-white transition-colors"
                                >
                                    Safety
                                </Link>
                                <Link
                                    href="#"
                                    className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 hover:text-white transition-colors"
                                >
                                    Privacy
                                </Link>
                                <Link
                                    href="#"
                                    className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 hover:text-white transition-colors"
                                >
                                    Terms
                                </Link>
                            </div>
                        </div>

                        {/* Social Cluster */}
                        <div className="flex items-center gap-4">
                            <SocialLink icon={<Instagram size={18} />} />
                            <SocialLink icon={<Twitter size={18} />} />
                            <SocialLink icon={<Facebook size={18} />} />
                            <SocialLink icon={<Linkedin size={18} />} />
                        </div>

                        {/* Credit Cluster */}
                        <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.3em] text-white/40">
                            Engineered with{' '}
                            <Heart size={10} className="text-brand-primary fill-brand-primary mx-0.5 animate-pulse" />{' '}
                            By A-Team
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

const SocialLink = ({ icon }: { icon: React.ReactNode }) => (
    <Link
        href="#"
        className="w-11 h-11 flex items-center justify-center rounded-2xl text-white/60 bg-white/5 border border-white/10 hover:text-white hover:border-brand-primary hover:bg-brand-primary/10 transition-all duration-300 group"
    >
        <span className="group-hover:scale-110 transition-transform duration-300">{icon}</span>
    </Link>
);
