'use client';

import React from 'react';
import { ArrowRight, BadgeCheck, CircleDollarSign, Compass, Gauge, MapPin, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { Syne, Space_Mono } from 'next/font/google';

const syne = Syne({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700', '800'],
});

const spaceMono = Space_Mono({
    subsets: ['latin'],
    weight: ['400', '700'],
});

const flowSteps = [
    {
        title: 'Scan Inventory',
        detail: 'Live dealer SKUs, color availability, and pricing signals.',
        icon: Gauge,
    },
    {
        title: 'Confirm Dealer',
        detail: 'Distance, delivery ETA, and verified fulfillment score.',
        icon: MapPin,
    },
    {
        title: 'Lock Lowest EMI',
        detail: 'Smart downpayment + tenure gives the lowest legal EMI.',
        icon: CircleDollarSign,
    },
];

const signalCards = [
    { label: 'Dealer Sync', stat: '98.4%', meta: 'Active inventory feed' },
    { label: 'Approval Time', stat: '2m 48s', meta: 'Median underwriting' },
    { label: 'Delivery Window', stat: '72 hrs', meta: 'Urban zones' },
];

const emiBands = [
    { label: 'Starter', down: 'INR 10k', emi: 'INR 1,490', glow: 'from-lime-300/30 via-lime-300/5 to-transparent' },
    { label: 'Smart', down: 'INR 25k', emi: 'INR 2,150', glow: 'from-amber-300/40 via-amber-300/10 to-transparent' },
    { label: 'Premium', down: 'INR 50k', emi: 'INR 3,250', glow: 'from-cyan-300/30 via-cyan-300/10 to-transparent' },
];

export default function LowestEmiConcept() {
    return (
        <div
            className={`${syne.className} min-h-screen bg-[#0b0d10] text-white`}
            style={
                {
                    '--accent': '#fbbf24',
                    '--mint': '#4ade80',
                    '--ice': '#22d3ee',
                } as React.CSSProperties
            }
        >
            {/* Atmosphere */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_15%,rgba(251,191,36,0.25),transparent_42%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(34,211,238,0.2),transparent_45%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_85%,rgba(74,222,128,0.16),transparent_40%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(130deg,rgba(255,255,255,0.08)_0%,transparent_55%)]" />
                <div className="absolute -top-32 right-8 h-72 w-72 rounded-full bg-[conic-gradient(from_140deg,rgba(251,191,36,0.3),transparent_60%)] blur-3xl" />
                <div className="absolute left-0 top-1/2 h-[480px] w-[480px] -translate-y-1/2 rounded-full border border-white/10 opacity-40" />
            </div>

            <div className="relative mx-auto max-w-6xl px-6 sm:px-10 lg:px-16 pt-20 pb-24 space-y-20">
                {/* Hero */}
                <section className="grid lg:grid-cols-[1.05fr_0.95fr] gap-12 items-center">
                    <div className="space-y-8 animate-fade-in">
                        <p className={`${spaceMono.className} text-[11px] uppercase tracking-[0.4em] text-white/60`}>
                            BookMyBike Marketplace
                        </p>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.05]">
                            The lowest EMI is not a promise.
                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-lime-300 to-cyan-300">
                                It is a product feature.
                            </span>
                        </h1>
                        <p className="text-base sm:text-lg text-white/70 max-w-xl">
                            A high-intent motorcycle flow that compresses dealer inventory, approvals, and delivery
                            into a single EMI-first decision screen.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <button className="px-6 py-3 rounded-2xl bg-white text-black font-semibold inline-flex items-center gap-2 shadow-[0_12px_32px_rgba(255,255,255,0.22)]">
                                Start EMI Scan <ArrowRight size={18} />
                            </button>
                            <button className="px-6 py-3 rounded-2xl border border-white/20 text-white/80 hover:text-white hover:border-white/60 transition">
                                Browse Dealer Catalog
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-6 pt-2 text-sm text-white/60">
                            <span className="flex items-center gap-2">
                                <BadgeCheck size={16} className="text-lime-300" /> Dealer-verified pricing
                            </span>
                            <span className="flex items-center gap-2">
                                <ShieldCheck size={16} className="text-cyan-300" /> Secure credit route
                            </span>
                        </div>
                    </div>

                    <div className="space-y-6 animate-fade-in" style={{ animationDelay: '120ms' }}>
                        <div className="relative rounded-[28px] p-[1px] bg-gradient-to-br from-white/30 via-white/5 to-transparent">
                            <div className="rounded-[27px] bg-[#11151b] border border-white/10 p-6 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className={`${spaceMono.className} text-[10px] uppercase tracking-[0.35em] text-white/50`}>
                                            EMI Console
                                        </p>
                                        <h3 className="text-2xl font-semibold">3-tap quote window</h3>
                                    </div>
                                    <Sparkles className="text-amber-300" />
                                </div>
                                <div className="space-y-4">
                                    {emiBands.map(tier => (
                                        <div
                                            key={tier.label}
                                            className={`rounded-2xl border border-white/10 bg-gradient-to-r ${tier.glow} p-4 flex items-center justify-between`}
                                        >
                                            <div>
                                                <p className={`${spaceMono.className} text-[10px] uppercase tracking-[0.3em] text-white/60`}>
                                                    {tier.label}
                                                </p>
                                                <p className="text-sm text-white/80">Downpayment {tier.down}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-white/60">Monthly EMI</p>
                                                <p className="text-lg font-semibold">{tier.emi}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-white/60">
                                    <Zap className="text-amber-300" size={16} />
                                    Updated with live dealer price feeds and tenure rules.
                                </div>
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
                                <p className={`${spaceMono.className} text-[10px] uppercase tracking-[0.3em] text-white/50`}>
                                    Flow Status
                                </p>
                                <p className="text-sm text-white/80 mt-2">Identity verified. Quote lock enabled.</p>
                                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-lime-400/15 px-3 py-1 text-xs text-lime-300">
                                    <span className="h-1.5 w-1.5 rounded-full bg-lime-300" />
                                    Ready
                                </div>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
                                <p className={`${spaceMono.className} text-[10px] uppercase tracking-[0.3em] text-white/50`}>
                                    Safety Layer
                                </p>
                                <p className="text-sm text-white/80 mt-2">Rate locked, credit scan within 24 hours.</p>
                                <div className="mt-4 inline-flex items-center gap-2 text-xs text-white/60">
                                    <Compass size={14} className="text-cyan-300" />
                                    Smart routing enabled
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Flow */}
                <section className="grid md:grid-cols-3 gap-6">
                    {flowSteps.map((step, index) => (
                        <div
                            key={step.title}
                            className="rounded-[26px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl space-y-5 animate-fade-in"
                            style={{ animationDelay: `${index * 120}ms` }}
                        >
                            <div className="flex items-center justify-between">
                                <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center">
                                    <step.icon className="text-amber-300" size={20} />
                                </div>
                                <span className={`${spaceMono.className} text-[10px] tracking-[0.3em] text-white/50`}>
                                    0{index + 1}
                                </span>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold">{step.title}</h3>
                                <p className="text-sm text-white/70 mt-2">{step.detail}</p>
                            </div>
                        </div>
                    ))}
                </section>

                {/* Signal section */}
                <section className="rounded-[36px] border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-8 lg:p-12">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                        <div className="space-y-4 max-w-xl">
                            <p className={`${spaceMono.className} text-[10px] uppercase tracking-[0.35em] text-white/60`}>
                                Marketplace Signal
                            </p>
                            <h2 className="text-3xl lg:text-4xl font-semibold">
                                Price integrity is the conversion lever.
                            </h2>
                            <p className="text-white/70">
                                Every SKU is synced from dealer inventory. EMI values are recalculated per city to keep
                                the lowest EMI promise honest and defensible.
                            </p>
                        </div>
                        <div className="grid sm:grid-cols-3 gap-4 flex-1">
                            {signalCards.map(card => (
                                <div key={card.label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                                    <p className="text-lg font-semibold">{card.stat}</p>
                                    <p className={`${spaceMono.className} text-[10px] uppercase tracking-[0.3em] text-white/50 mt-2`}>
                                        {card.label}
                                    </p>
                                    <p className="text-sm text-white/70 mt-3">{card.meta}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="flex flex-col lg:flex-row items-center justify-between gap-6 rounded-[32px] border border-white/10 bg-white/5 p-8">
                    <div className="space-y-2">
                        <p className={`${spaceMono.className} text-[10px] uppercase tracking-[0.35em] text-white/60`}>
                            Demo Only
                        </p>
                        <h3 className="text-2xl font-semibold">Launch the lowest EMI marketplace flow.</h3>
                        <p className="text-white/70 text-sm">Modern edge UI to validate demand and conversion.</p>
                    </div>
                    <button className="px-6 py-3 rounded-2xl bg-amber-300 text-black font-semibold inline-flex items-center gap-2">
                        Generate Demo Quote <ArrowRight size={18} />
                    </button>
                </section>
            </div>
        </div>
    );
}
