'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Facebook, Twitter, Linkedin, Instagram, Heart, Newspaper, Plus, Minus } from 'lucide-react';
import { useSystemBrandsLogic } from '@/hooks/SystemBrandsLogic';
import { slugify } from '@/utils/slugs';
import { motion, AnimatePresence } from 'framer-motion';

/* ────────── Palette ────────── */
const GOLD = '#FFD700';
const GOLD_INT = '#F4B000';

export const M2Footer = () => {
    const { brands } = useSystemBrandsLogic();
    const [openSection, setOpenSection] = useState<string | null>(null);

    const toggleSection = (title: string) => {
        setOpenSection(openSection === title ? null : title);
    };

    const footerSections = [
        {
            title: 'Collection',
            links: [
                { label: 'All Inventory', href: '/store/catalog' },
                { label: 'Scooters', href: '/store/catalog?category=SCOOTER' },
                { label: 'Motorcycles', href: '/store/catalog?category=MOTORCYCLE' },
                { label: 'Price: Low to High', href: '/store/catalog?sort=price_asc' },
                { label: 'Best Mileage', href: '/store/catalog?sort=mileage' },
            ],
        },
        {
            title: 'Top Brands',
            links: [
                ...brands.slice(0, 6).map(b => ({ label: b.name, href: `/store/${b.slug || slugify(b.name)}` })),
                { label: 'View All Brands', href: '/store/catalog', highlight: true },
            ],
        },
        {
            title: 'Ecosystem',
            links: [
                { label: 'About Us', href: '#' },
                { label: 'Our Blog', href: '/blog' },
                { label: "O' Circle", href: '/store/ocircle' },
                { label: 'Partner Login', href: '/login' },
                { label: 'Media Kit', href: '/mediakit' },
                { label: 'Contact', href: '#' },
            ],
        },
        {
            title: 'Services & Support',
            links: [
                { label: 'Help Center', href: '#' },
                { label: 'Finance Options', href: '#' },
                { label: 'Insurance Hub', href: '#' },
                { label: 'RTO Rules', href: '#' },
                { label: 'Privacy Policy', href: '#' },
            ],
        },
    ];

    return (
        <footer className="bg-white text-slate-900 pt-16 pb-24 relative overflow-hidden border-t border-slate-100">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#F4B000]/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="page-container relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-8">
                    {/* Brand Header Column */}
                    <div className="lg:col-span-1">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-[1px] w-8" style={{ background: GOLD }} />
                            <p className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: GOLD_INT }}>
                                Trusted Expertise
                            </p>
                        </div>
                        <h3 className="text-3xl font-black uppercase tracking-tight leading-[1.1] italic text-slate-900">
                            Redefining
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-400">
                                How India Rides.
                            </span>
                        </h3>
                        <p className="text-xs text-slate-500 font-bold leading-relaxed mt-4 max-w-[280px]">
                            India's premier marketplace for the next generation of riders. Engineering excellence into
                            every booking.
                        </p>
                    </div>

                    {/* Navigation Columns - Desktop Grid / Mobile Accordion */}
                    <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                        {footerSections.map(section => {
                            const isOpen = openSection === section.title;
                            return (
                                <div
                                    key={section.title}
                                    className="rounded-2xl border border-slate-100 bg-slate-50/50 lg:bg-transparent lg:border-none overflow-hidden"
                                >
                                    {/* Mobile Button / Desktop Header */}
                                    <div className="lg:mb-6">
                                        <button
                                            onClick={() => toggleSection(section.title)}
                                            className="w-full flex items-center justify-between p-4 lg:p-0 lg:cursor-default"
                                        >
                                            <span className="text-sm lg:text-[10px] font-black tracking-wide lg:tracking-[0.2em] uppercase text-slate-900 lg:text-slate-400 px-1 py-1 -ml-1">
                                                {section.title}
                                            </span>
                                            <div className="lg:hidden w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 transition-transform">
                                                {isOpen ? <Minus size={14} /> : <Plus size={14} />}
                                            </div>
                                        </button>
                                    </div>

                                    {/* Content - Static on Desktop, Animated on Mobile */}
                                    <div className="hidden lg:block">
                                        <ul className="flex flex-col gap-3">
                                            {section.links.map((link, i) => (
                                                <li key={i}>
                                                    <Link
                                                        href={link.href}
                                                        className={`text-[10px] font-black transition-all uppercase tracking-wider hover:translate-x-1 inline-block ${
                                                            (link as any).highlight
                                                                ? 'text-brand-primary'
                                                                : 'text-slate-500 hover:text-slate-900'
                                                        }`}
                                                    >
                                                        {link.label}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="lg:hidden">
                                        <AnimatePresence>
                                            {isOpen && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                >
                                                    <ul className="flex flex-col gap-3 px-4 pb-5 pt-1">
                                                        {section.links.map((link, i) => (
                                                            <li key={i}>
                                                                <Link
                                                                    href={link.href}
                                                                    className={`text-xs font-bold transition-colors uppercase tracking-wide ${
                                                                        (link as any).highlight
                                                                            ? 'text-slate-950 underline decoration-slate-300'
                                                                            : 'text-slate-400 hover:text-slate-900'
                                                                    }`}
                                                                >
                                                                    {link.label}
                                                                </Link>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Social & Meta */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 mt-20 pt-10 border-t border-slate-100">
                    <div className="flex gap-3">
                        <SocialIcon icon={<Newspaper size={16} />} href="/blog" bg="hover:bg-slate-900" />
                        <SocialIcon
                            icon={<Instagram size={16} />}
                            href="https://instagram.com"
                            bg="hover:bg-slate-900"
                        />
                        <SocialIcon icon={<Twitter size={16} />} href="https://twitter.com" bg="hover:bg-slate-900" />
                        <SocialIcon icon={<Linkedin size={16} />} href="https://linkedin.com" bg="hover:bg-slate-900" />
                        <SocialIcon icon={<Facebook size={16} />} href="https://facebook.com" bg="hover:bg-slate-900" />
                    </div>

                    <div className="flex flex-col md:items-end gap-1.5 items-center">
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">
                            © 2011-2026 BOOKMYBIKE
                        </p>
                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                            Engineered with <Heart size={10} className="text-red-500 fill-red-500 animate-pulse" /> in
                            India.
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

const SocialIcon = ({ icon, href, bg }: { icon: React.ReactElement; href: string; bg: string }) => {
    return (
        <a
            href={href}
            className={`w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-white transition-all duration-300 border border-slate-100 hover:border-slate-900 ${bg}`}
        >
            {icon}
        </a>
    );
};
