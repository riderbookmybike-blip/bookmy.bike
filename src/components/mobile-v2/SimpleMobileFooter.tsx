'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, ArrowRight } from 'lucide-react';
import { useSystemBrandsLogic } from '@/hooks/SystemBrandsLogic';
import { slugify } from '@/utils/slugs';

export const SimpleMobileFooter = () => {
    const { brands } = useSystemBrandsLogic();

    return (
        <footer className="bg-[#0b0d10] border-t border-white/5 py-12 px-6">
            <div className="max-w-lg mx-auto space-y-8">
                {/* Logo & Tagline */}
                <div className="text-center space-y-3 pb-6 border-b border-white/5">
                    <h3 className="text-4xl font-black uppercase tracking-tighter text-white leading-[0.85] italic">
                        Redefining <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500">
                            How India Rides.
                        </span>
                    </h3>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                        India's premier marketplace for the next generation of riders.
                    </p>
                </div>

                {/* Collection Links */}
                <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#F4B000] mb-4">
                        Collection
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                        <Link
                            href="/store/catalog"
                            className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-2 group"
                        >
                            All Inventory
                            <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#F4B000]" />
                        </Link>
                        <Link
                            href="/store/catalog?category=SCOOTER"
                            className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-2 group"
                        >
                            Scooters
                            <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#F4B000]" />
                        </Link>
                        <Link
                            href="/store/catalog?category=MOTORCYCLE"
                            className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-2 group"
                        >
                            Motorcycles
                            <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#F4B000]" />
                        </Link>
                        <Link
                            href="/store/catalog?sort=price_asc"
                            className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-2 group"
                        >
                            Price: Low to High
                            <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#F4B000]" />
                        </Link>
                        <Link
                            href="/store/catalog?sort=mileage"
                            className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-2 group"
                        >
                            Best Mileage
                            <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#F4B000]" />
                        </Link>
                    </div>
                </div>

                {/* Brands */}
                <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#F4B000] mb-4">
                        Brands
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                        {brands.slice(0, 4).map((brand) => (
                            <Link
                                key={brand.id}
                                href={`/store/${brand.slug || slugify(brand.name)}`}
                                className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-2 group"
                            >
                                {brand.name}
                                <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#F4B000]" />
                            </Link>
                        ))}
                        <Link
                            href="/store/catalog"
                            className="text-sm text-white hover:text-white/80 transition-colors flex items-center gap-2 group underline decoration-white/30"
                        >
                            View All Brands
                            <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#F4B000]" />
                        </Link>
                    </div>
                </div>

                {/* Ecosystem */}
                <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#F4B000] mb-4">
                        Ecosystem
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                        <Link href="#" className="text-sm text-zinc-400 hover:text-white transition-colors">
                            About Us
                        </Link>
                        <Link href="/blog" className="text-sm text-zinc-400 hover:text-white transition-colors">
                            Our Blog
                        </Link>
                        <Link href="/login" className="text-sm text-zinc-400 hover:text-white transition-colors">
                            Partner Login
                        </Link>
                        <Link href="/mediakit" className="text-sm text-zinc-400 hover:text-white transition-colors">
                            Media Kit
                        </Link>
                        <Link href="#" className="text-sm text-zinc-400 hover:text-white transition-colors">
                            Contact
                        </Link>
                    </div>
                </div>

                {/* Services */}
                <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#F4B000] mb-4">
                        Services
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                        <Link href="#" className="text-sm text-zinc-400 hover:text-white transition-colors">
                            Help Center
                        </Link>
                        <Link href="#" className="text-sm text-zinc-400 hover:text-white transition-colors">
                            Finance Options
                        </Link>
                        <Link href="#" className="text-sm text-zinc-400 hover:text-white transition-colors">
                            Insurance Hub
                        </Link>
                        <Link href="#" className="text-sm text-zinc-400 hover:text-white transition-colors">
                            RTO Rules
                        </Link>
                        <Link href="#" className="text-sm text-zinc-400 hover:text-white transition-colors">
                            Privacy Policy
                        </Link>
                    </div>
                </div>

                {/* Divider */}
                <div className="relative py-6">
                    <div className="h-px bg-white/10" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 bg-[#0b0d10]">
                        <div className="w-2 h-2 rounded-full bg-[#F4B000]/30" />
                    </div>
                </div>

                {/* Bottom */}
                <div className="text-center space-y-4">
                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em]">
                        © 2011-2026
                    </p>
                    <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-medium uppercase tracking-widest">
                        <span>Engineered with</span>
                        <Heart size={10} className="text-brand-primary fill-brand-primary animate-pulse" />
                        <span>in India</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};
