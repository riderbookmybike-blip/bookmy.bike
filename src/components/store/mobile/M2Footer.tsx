'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Facebook, Twitter, Linkedin, Instagram, Heart, Newspaper, Plus, Minus } from 'lucide-react';
import { useSystemBrandsLogic } from '@/hooks/SystemBrandsLogic';
import { slugify } from '@/utils/slugs';
import { motion, AnimatePresence } from 'framer-motion';

/* ────────── Palette ────────── */
const GOLD = '#FFD700';

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
        <footer className="bg-[#050608] text-white pt-12 pb-24 px-5 relative overflow-hidden border-t border-white/[0.04]">
            {/* Background Ambient Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-800/20 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#F4B000]/5 blur-[100px] rounded-full pointer-events-none" />

            {/* Brand Header */}
            <div className="mb-10 relative z-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-[1px] w-8" style={{ background: GOLD }} />
                    <p className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: GOLD }}>
                        The Final Chapter
                    </p>
                </div>
                <h3 className="text-3xl font-black uppercase tracking-tight leading-[1.1] italic">
                    Redefining
                    <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-500">
                        How India Rides.
                    </span>
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed mt-4 max-w-[280px]">
                    India's premier marketplace for the next generation of riders. Engineering excellence into every
                    booking.
                </p>
            </div>

            {/* Mobile Accordion Links */}
            <div className="flex flex-col gap-2 mb-10 relative z-10 w-full max-w-sm mx-auto">
                {footerSections.map(section => {
                    const isOpen = openSection === section.title;
                    return (
                        <div
                            key={section.title}
                            className="rounded-2xl border border-white/[0.05] bg-white/[0.02] overflow-hidden"
                        >
                            <button
                                onClick={() => toggleSection(section.title)}
                                className="w-full flex items-center justify-between p-4"
                            >
                                <span className="text-sm font-bold tracking-wide uppercase text-white/90">
                                    {section.title}
                                </span>
                                <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-white/50 transition-transform">
                                    {isOpen ? <Minus size={14} /> : <Plus size={14} />}
                                </div>
                            </button>

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
                                                        className={`text-xs font-medium transition-colors ${
                                                            (link as any).highlight
                                                                ? 'text-white underline decoration-white/30'
                                                                : 'text-zinc-500 hover:text-white'
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
                    );
                })}
            </div>

            {/* Social & Meta */}
            <div className="flex flex-col items-center text-center gap-6 relative z-10 mt-12 pt-8 border-t border-white/5 w-full mx-auto max-w-sm">
                <div className="flex gap-3">
                    <SocialIcon icon={<Newspaper size={16} />} href="/blog" bg="hover:bg-[#F4B000]" />
                    <SocialIcon icon={<Instagram size={16} />} href="https://instagram.com" bg="hover:bg-[#E4405F]" />
                    <SocialIcon icon={<Twitter size={16} />} href="https://twitter.com" bg="hover:bg-[#1DA1F2]" />
                    <SocialIcon icon={<Linkedin size={16} />} href="https://linkedin.com" bg="hover:bg-[#0077B5]" />
                    <SocialIcon icon={<Facebook size={16} />} href="https://facebook.com" bg="hover:bg-[#1877F2]" />
                </div>

                <div className="flex flex-col gap-1.5 items-center">
                    <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-[0.2em]">
                        © 2011-2026 BOOKMYBIKE
                    </p>
                    <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-1">
                        Engineered with <Heart size={10} className="text-red-500 fill-red-500 animate-pulse" /> in
                        India.
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
            className={`w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-slate-400 hover:text-white transition-all duration-300 border border-transparent hover:border-white/10 ${bg}`}
        >
            {icon}
        </a>
    );
};
