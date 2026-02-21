'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
    Sparkles,
    ShieldCheck,
    Zap,
    MapPin,
    ArrowRight,
    TrendingUp,
    BadgeCheck,
    Search,
    Heart,
    User,
} from 'lucide-react';
import { useSystemCatalogLogic } from '@/hooks/SystemCatalogLogic';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { Logo } from '@/components/brand/Logo';

const gradientBg = 'bg-gradient-to-b from-[#0b0f1a] via-[#0b0f1a] to-[#0d111c]';

const TrustBadge = ({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) => (
    <div className="flex items-center gap-3 px-3 py-2 rounded-2xl bg-white/5 border border-white/5 text-white/80">
        <div className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center">
            <Icon size={18} className="text-emerald-400" />
        </div>
        <div className="text-xs leading-tight">
            <p className="font-black text-white">{title}</p>
            <p className="text-white/60 text-[11px]">{desc}</p>
        </div>
    </div>
);

const SectionTitle = ({ kicker, title }: { kicker: string; title: string }) => (
    <div className="flex items-center justify-between px-4 mb-4">
        <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-300/80">{kicker}</p>
            <h2 className="text-2xl font-black text-white tracking-tight">{title}</h2>
        </div>
        <Link href="/store/catalog" className="text-[10px] font-bold text-white/60 flex items-center gap-1 uppercase">
            View All <ArrowRight size={12} />
        </Link>
    </div>
);

export default function MobileHomeM1() {
    const { items } = useSystemCatalogLogic();
    const picks = items?.slice(0, 6) || [];

    return (
        <div className={`min-h-screen ${gradientBg} text-white pb-24`}>
            {/* Top App Bar */}
            <header className="fixed top-0 inset-x-0 z-40 backdrop-blur-xl bg-black/40 border-b border-white/10 px-4 py-3 flex items-center justify-between">
                <Logo variant="full" size={32} mode="dark" />
                <div className="flex items-center gap-2 text-white/80">
                    <Link
                        href="/store/catalog"
                        className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition"
                        aria-label="Search"
                    >
                        <Search size={18} />
                    </Link>
                    <Link
                        href="/wishlist"
                        className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition"
                        aria-label="Wishlist"
                    >
                        <Heart size={18} />
                    </Link>
                    <Link
                        href="/profile"
                        className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition"
                        aria-label="Profile"
                    >
                        <User size={18} />
                    </Link>
                </div>
            </header>

            {/* Hero */}
            <section className="relative overflow-hidden px-4 pt-24 pb-10">
                <div className="absolute inset-0 opacity-70">
                    <Image src="/images/templates/t3_night.png" alt="hero" fill className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-[#0b0f1a]" />
                </div>
                <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-2 text-emerald-300 text-[11px] uppercase font-black tracking-[0.3em]">
                        <Sparkles size={14} /> Trusted EV & ICE marketplace
                    </div>
                    <h1 className="text-4xl font-black leading-[1.05] tracking-tight">
                        Find your next ride
                        <br /> at the lowest EMI.
                    </h1>
                    <p className="text-sm text-white/70 max-w-xl">
                        Curated bikes & scooters, on-road prices upfront, booking-ready in minutes.
                    </p>
                    <div className="flex gap-3">
                        <Link
                            href="/store/catalog"
                            className="px-4 py-3 rounded-2xl bg-emerald-500 text-black font-black uppercase text-xs tracking-widest shadow-lg shadow-emerald-500/30"
                        >
                            Browse Catalog
                        </Link>
                        <Link
                            href="/bookings"
                            className="px-4 py-3 rounded-2xl border border-white/10 text-white font-black uppercase text-xs tracking-widest"
                        >
                            Start Booking
                        </Link>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-2 text-[10px] text-white/60">
                        <div className="flex items-center gap-2">
                            <ShieldCheck size={14} className="text-emerald-300" /> Verified dealers
                        </div>
                        <div className="flex items-center gap-2">
                            <Zap size={14} className="text-amber-300" /> Instant EMI offers
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-sky-300" /> Pan-India delivery
                        </div>
                    </div>
                </div>
            </section>

            {/* Trust badges */}
            <section className="px-4 py-6 flex flex-col gap-2">
                <TrustBadge
                    icon={ShieldCheck}
                    title="Authentic On-Road Prices"
                    desc="No hidden charges. Dealer-stamped."
                />
                <TrustBadge icon={TrendingUp} title="Best EMI Match" desc="Banks + NBFCs compared in seconds." />
                <TrustBadge icon={BadgeCheck} title="Certified Dealers" desc="KYC-verified showrooms only." />
            </section>

            {/* Top Picks */}
            <section className="py-6">
                <SectionTitle kicker="Popular" title="Top Picks for You" />
                <div className="flex gap-4 overflow-x-auto px-4 pb-3 no-scrollbar">
                    {picks.map((item, idx) => (
                        <Link
                            key={item.id || idx}
                            href={`/store/${(item.make || '').toLowerCase().replace(/\s+/g, '-')}/${item.modelSlug || item.slug || ''}`}
                            className="flex-none w-[220px] rounded-2xl border border-white/8 bg-white/5 backdrop-blur-xl overflow-hidden active:scale-[0.97] transition-all"
                        >
                            <div className="relative h-40 bg-gradient-to-b from-white/5 to-transparent flex items-center justify-center p-4">
                                {item.imageUrl ? (
                                    <Image
                                        src={item.imageUrl}
                                        alt={item.displayName || 'Bike'}
                                        fill
                                        className="object-contain"
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                                        <Sparkles size={22} className="text-white/50" />
                                    </div>
                                )}
                            </div>
                            <div className="px-4 py-3 space-y-1">
                                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-200/80">
                                    {item.make || 'Brand'}
                                </p>
                                <h3 className="text-lg font-black leading-tight">{item.displayName || item.name}</h3>
                                <p className="text-sm text-white/70">
                                    ₹
                                    {Math.round(item.price?.onRoad || item.price?.exShowroom || 0).toLocaleString(
                                        'en-IN'
                                    )}{' '}
                                    on-road
                                </p>
                                <div className="flex items-center gap-2 text-[10px] text-emerald-200/90">
                                    <Zap size={14} /> Instant booking
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* EMI CTA strip */}
            <section className="px-4 pb-8">
                <div className="rounded-3xl border border-emerald-400/30 bg-gradient-to-r from-emerald-500/15 via-emerald-400/10 to-transparent p-5 flex items-center justify-between gap-3">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-200/80">
                            Smart EMI
                        </p>
                        <h3 className="text-xl font-black text-white">Get offers in 30 seconds</h3>
                        <p className="text-sm text-white/70">Compare banks & NBFCs without leaving the app.</p>
                    </div>
                    <Link
                        href="/finance"
                        className="px-4 py-2 rounded-xl bg-emerald-400 text-black font-black text-[11px] uppercase tracking-wider"
                    >
                        Check EMI
                    </Link>
                </div>
            </section>

            {/* Compare CTA */}
            <section className="px-4 pb-8">
                <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 flex flex-col gap-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-200/80">Unsure?</p>
                    <h3 className="text-xl font-black text-white leading-tight">Compare side by side in seconds</h3>
                    <p className="text-sm text-white/70">
                        Add scooters or bikes, swipe to see specs, price, EMI, mileage, and what&apos;s different.
                    </p>
                    <Link
                        href="/store/compare"
                        className="inline-flex items-center justify-center px-4 py-3 rounded-2xl bg-white text-black font-black uppercase text-xs tracking-widest active:scale-95 transition"
                    >
                        Open Compare
                    </Link>
                </div>
            </section>

            {/* Mini Catalog Grid */}
            {picks.length > 0 && (
                <section className="px-4 pb-10">
                    <SectionTitle kicker="Browse" title="Hot in catalog" />
                    <div className="grid grid-cols-2 gap-3">
                        {picks.slice(0, 4).map((item, idx) => (
                            <Link
                                key={item.id || idx}
                                href={`/store/${(item.make || '').toLowerCase().replace(/\\s+/g, '-')}/${item.modelSlug || item.slug || ''}`}
                                className="rounded-2xl border border-white/10 bg-white/5 p-3 flex flex-col gap-2 active:scale-[0.98] transition"
                            >
                                <div className="relative h-28 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden">
                                    {item.imageUrl ? (
                                        <Image
                                            src={item.imageUrl}
                                            alt={item.displayName || 'Bike'}
                                            fill
                                            className="object-contain"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                            <Sparkles size={18} className="text-white/50" />
                                        </div>
                                    )}
                                </div>
                                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-200/80">
                                    {item.make || 'Brand'}
                                </p>
                                <h4 className="text-base font-black leading-snug line-clamp-2">
                                    {item.displayName || item.name}
                                </h4>
                                <p className="text-xs text-white/70">
                                    ₹
                                    {Math.round(item.price?.onRoad || item.price?.exShowroom || 0).toLocaleString(
                                        'en-IN'
                                    )}{' '}
                                    on-road
                                </p>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Footer minimal */}
            <section className="px-4 pb-10 text-white/50 text-[11px] flex flex-col gap-1">
                <span>BookMyBike • Modern mobility marketplace</span>
                <span>Secure payments · Verified dealers · Pan-India logistics</span>
            </section>
        </div>
    );
}
