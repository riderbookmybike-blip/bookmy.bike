import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Facebook, Twitter, Linkedin, Instagram, ArrowRight, Heart, Newspaper, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { useBrands } from '@/hooks/useBrands';
import { slugify } from '@/utils/slugs';

export const MobileFooter = () => {
    const { brands } = useBrands();
    const [activeSection, setActiveSection] = useState<number | null>(0);

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

    const footerSections: FooterSection[] = [
        {
            title: 'Collection',
            gradient: 'from-zinc-900 to-black',
            links: [
                { label: 'All Inventory', href: '/m/store/catalog' },
                { label: 'Scooters', href: '/m/store/catalog?cat=scooter' },
                { label: 'Motorcycles', href: '/m/store/catalog?cat=motorcycle' },
                { label: 'Price: Low to High', href: '/m/store/catalog?sort=price_asc' },
                { label: 'Best Mileage', href: '/m/store/catalog?sort=mileage' },
            ],
        },
        {
            title: 'Brands',
            gradient: 'from-zinc-800 to-zinc-950',
            links: [
                ...brands.slice(0, 4).map(b => ({ label: b.name, href: `/m/store/catalog?brand=${b.slug || slugify(b.name)}` })),
                { label: 'View All Brands', href: '/m/store/catalog', highlight: true },
            ],
        },
        {
            title: 'Ecosystem',
            gradient: 'from-zinc-900 to-black',
            links: [
                { label: 'About Us', href: '/about' },
                { label: 'Our Blog', href: '/blog' },
                { label: 'Partner Login', href: '/login' },
                { label: 'Media Kit', href: '/mediakit' },
                { label: 'Contact', href: '/contact' },
            ],
        },
        {
            title: 'Services',
            gradient: 'from-zinc-800 to-black',
            links: [
                { label: 'Help Center', href: '/help' },
                { label: 'Finance Options', href: '/finance' },
                { label: 'Insurance Hub', href: '/insurance' },
                { label: 'RTO Rules', href: '/rto' },
                { label: 'Privacy Policy', href: '/privacy' },
            ],
        },
    ];

    return (
        <footer className="bg-[#0b0d10] border-t border-white/5 pt-20 pb-12 relative overflow-hidden text-white">
            {/* Background Glow */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute bottom-[-10%] right-[-10%] w-full h-full bg-[#F4B000]/5 blur-[120px] rounded-full" />
            </div>

            <div className="px-8 relative z-10 w-full">
                {/* Brand Identity */}
                <div className="space-y-12 mb-20">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="h-px w-8 bg-[#F4B000]" />
                            <p className="text-[10px] font-black text-[#F4B000] uppercase tracking-[0.3em]">
                                The Final Chapter
                            </p>
                        </div>
                        <Logo mode="dark" size={48} variant="full" />
                        <h3 className="text-5xl font-black uppercase tracking-tighter text-white leading-[0.9] italic">
                            Redefining <br />
                            <span className="text-zinc-600">How India Rides.</span>
                        </h3>
                        <p className="text-sm text-zinc-500 leading-relaxed font-medium border-l border-white/10 pl-6">
                            India&apos;s premier marketplace for the next generation of riders. Engineering excellence into every booking.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <SocialIcon icon={<Newspaper size={18} />} href="/blog" brandColor="#F4B000" />
                        <SocialIcon icon={<Instagram size={18} />} href="#" brandColor="#E4405F" />
                        <SocialIcon icon={<Twitter size={18} />} href="#" brandColor="#1DA1F2" />
                        <SocialIcon icon={<Linkedin size={18} />} href="#" brandColor="#0077B5" />
                        <SocialIcon icon={<Facebook size={18} />} href="#" brandColor="#1877F2" />
                    </div>
                </div>

                {/* Interactive Sections */}
                <div className="space-y-4 mb-20">
                    {footerSections.map((section, idx) => (
                        <div
                            key={section.title}
                            className={`rounded-3xl border transition-all duration-500 overflow-hidden ${activeSection === idx
                                ? `bg-gradient-to-br ${section.gradient} border-white/10`
                                : 'bg-white/5 border-white/5'
                                }`}
                        >
                            <button
                                onClick={() => setActiveSection(activeSection === idx ? null : idx)}
                                className="w-full p-8 flex justify-between items-center"
                            >
                                <div className="flex gap-4 items-center">
                                    <span className={`text-[10px] font-black tracking-widest ${activeSection === idx ? 'text-white/40' : 'text-zinc-600'}`}>0{idx + 1}</span>
                                    <span className={`text-lg font-black uppercase italic tracking-tighter ${activeSection === idx ? 'text-[#F4B000]' : 'text-white/80'}`}>{section.title}</span>
                                </div>
                                <motion.div animate={{ rotate: activeSection === idx ? 45 : 0 }}>
                                    <ArrowRight size={20} className={activeSection === idx ? 'text-white' : 'text-zinc-600'} />
                                </motion.div>
                            </button>

                            <AnimatePresence>
                                {activeSection === idx && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-8 pb-10 space-y-4">
                                            {section.links.map((link) => (
                                                <Link
                                                    key={link.label}
                                                    href={link.href}
                                                    className={`group flex items-center gap-3 text-base font-medium transition-colors ${link.highlight ? 'text-white underline decoration-white/20' : 'text-zinc-400'
                                                        }`}
                                                >
                                                    {link.label}
                                                    <ChevronRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[#F4B000]" />
                                                </Link>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-white/5 text-center space-y-6">
                    <div className="flex justify-center gap-3">
                        <div className="w-12 h-0.5 bg-[#FF9933] opacity-50" />
                        <div className="w-12 h-0.5 bg-white opacity-50" />
                        <div className="w-12 h-0.5 bg-[#138808] opacity-50" />
                    </div>

                    <div className="flex flex-col items-center gap-3">
                        <p className="text-[10px] font-black text-white/20 tracking-[0.4em] uppercase">
                            © 2011-2026 BOOKMY.BIKE MOTORSPORTS
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-700 font-black uppercase tracking-widest italic">
                            <span>Engineered with ❤️ in India</span>
                            <span className="opacity-30">•</span>
                            <span>v2.6.4</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

const SocialIcon = ({ icon, href, brandColor }: { icon: React.ReactElement; href: string; brandColor: string }) => {
    return (
        <a
            href={href}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 text-zinc-500 transition-all active:scale-90"
            style={{ transition: '0.3s cubic-bezier(0.23, 1, 0.32, 1)' }}
        >
            {icon}
        </a>
    );
};
