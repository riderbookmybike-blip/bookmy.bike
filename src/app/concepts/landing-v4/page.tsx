'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronDown, Shield, Zap, FileCheck, Calculator, Clock, BadgeCheck, CheckCircle2, Star, TrendingDown, Wallet, FileX } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';

/**
 * Landing Page V4 - MBO Focused (Multi-Brand Outlet)
 * 
 * NO specific brand/model promotion
 * FOCUS: Lowest EMI, Affordability, Easy Finance, Quick Approval, No Docs, No Cost EMI
 * Brand Color: #F4B000 (Gold)
 */

const BRAND_GOLD = '#F4B000';

export default function LandingV4Page() {
    const [activeFeature, setActiveFeature] = React.useState(0);

    const scrollToContent = () => {
        window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
    };

    return (
        <div className="bg-white dark:bg-[#020617] text-slate-900 dark:text-white overflow-x-hidden transition-colors">

            {/* =============== HERO - FINANCE FOCUSED =============== */}
            <section className="relative min-h-screen flex flex-col">

                {/* Subtle Blurred Background Image - Model not identifiable */}
                <div className="absolute inset-0 z-0 opacity-40 dark:opacity-50">
                    <img
                        src="/images/hero/blurred_bike_hero.png"
                        alt=""
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Gradient Overlay */}
                <div className="absolute inset-0 z-0 bg-gradient-to-b from-white via-white/95 to-white dark:from-[#020617] dark:via-[#020617]/95 dark:to-[#020617]" />

                {/* Header */}
                <header className="relative z-20 flex items-center justify-between px-6 md:px-12 lg:px-20 py-6">
                    <Logo mode="auto" size={36} variant="full" />
                    <nav className="hidden lg:flex items-center gap-10">
                        {['How It Works', 'EMI Calculator', 'Compare', 'Help'].map((item) => (
                            <Link
                                key={item}
                                href={`/${item.toLowerCase().replace(/\s+/g, '-')}`}
                                className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                            >
                                {item}
                            </Link>
                        ))}
                    </nav>
                    <Link
                        href="/store/catalog"
                        className="text-[11px] font-black uppercase tracking-[0.15em] px-6 py-3 rounded-full transition-all"
                        style={{ backgroundColor: BRAND_GOLD, color: '#000' }}
                    >
                        Get Started
                    </Link>
                </header>

                {/* Hero Content */}
                <div className="relative z-10 flex-1 flex items-center">
                    <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 py-16 w-full">
                        <div className="max-w-4xl">

                            {/* Trust Badge */}
                            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border mb-8"
                                style={{ borderColor: `${BRAND_GOLD}40`, backgroundColor: `${BRAND_GOLD}10` }}
                            >
                                <span className="flex h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: BRAND_GOLD }} />
                                <span className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: BRAND_GOLD }}>
                                    India's Lowest EMI Guarantee
                                </span>
                            </div>

                            {/* Main Headline */}
                            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.05] mb-8">
                                <span className="block">Your Dream Ride.</span>
                                <span className="block" style={{ color: BRAND_GOLD }}>Zero Stress EMI.</span>
                            </h1>

                            {/* Subheadline - Value Props */}
                            <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mb-10 leading-relaxed">
                                Get <strong className="text-slate-900 dark:text-white">instant finance approval</strong> with
                                minimal documents. Compare EMIs from 15+ banks.
                                <span className="font-bold" style={{ color: BRAND_GOLD }}> No hidden charges. No processing fees.</span>
                            </p>

                            {/* CTA Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 mb-16">
                                <Link
                                    href="/store/catalog"
                                    className="inline-flex items-center justify-center gap-3 px-8 py-5 rounded-2xl font-bold text-sm uppercase tracking-wide transition-all shadow-lg group"
                                    style={{ backgroundColor: BRAND_GOLD, color: '#000', boxShadow: `0 20px 40px ${BRAND_GOLD}30` }}
                                >
                                    Check Your EMI
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <Link
                                    href="/how-it-works"
                                    className="inline-flex items-center justify-center gap-3 px-8 py-5 border-2 border-slate-200 dark:border-white/10 rounded-2xl font-bold text-sm uppercase tracking-wide hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                                >
                                    <Calculator size={18} style={{ color: BRAND_GOLD }} />
                                    EMI Calculator
                                </Link>
                            </div>

                            {/* Key Stats - Above the fold */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-slate-200 dark:border-white/10">
                                {[
                                    { value: '0%', label: 'Processing Fee' },
                                    { value: '10min', label: 'Approval Time' },
                                    { value: '15+', label: 'Partner Banks' },
                                    { value: '₹999', label: 'EMI Starts At' },
                                ].map((stat, i) => (
                                    <div key={i} className="text-center md:text-left">
                                        <p className="text-3xl md:text-4xl font-black tracking-tight" style={{ color: i === 0 || i === 3 ? BRAND_GOLD : undefined }}>
                                            {stat.value}
                                        </p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{stat.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <button
                    onClick={scrollToContent}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors animate-bounce"
                >
                    <span className="text-[9px] font-bold uppercase tracking-[0.3em] mb-2">See Benefits</span>
                    <ChevronDown size={20} />
                </button>
            </section>


            {/* =============== VALUE PROPOSITIONS =============== */}
            <section className="py-24 md:py-32 bg-slate-50 dark:bg-slate-900/50">
                <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20">

                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <p className="text-[11px] font-bold uppercase tracking-[0.3em] mb-4" style={{ color: BRAND_GOLD }}>
                            Why Us
                        </p>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight">
                            Financing Made Simple
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            {
                                icon: <TrendingDown size={28} />,
                                title: 'Lowest EMI Guarantee',
                                desc: 'We guarantee the lowest EMI in the market. Found lower? We\'ll match it.',
                                highlight: true
                            },
                            {
                                icon: <Zap size={28} />,
                                title: 'Instant Approval',
                                desc: '10-minute digital approval. No branch visits. No long queues.',
                                highlight: false
                            },
                            {
                                icon: <FileX size={28} />,
                                title: 'Minimal Documents',
                                desc: 'Just Aadhaar & PAN. No salary slips. No bank statements for salaried.',
                                highlight: true
                            },
                            {
                                icon: <Wallet size={28} />,
                                title: 'No Cost EMI',
                                desc: 'Zero processing fee. Zero foreclosure charges. What you see is what you pay.',
                                highlight: false
                            },
                            {
                                icon: <BadgeCheck size={28} />,
                                title: 'Pre-Approved Offers',
                                desc: 'Check your eligibility without affecting credit score. Soft inquiry only.',
                                highlight: false
                            },
                            {
                                icon: <Shield size={28} />,
                                title: 'Transparent Pricing',
                                desc: 'Complete on-road price breakdown. No hidden RTO, insurance surprises.',
                                highlight: true
                            },
                        ].map((item, i) => (
                            <div
                                key={i}
                                className={`p-8 rounded-3xl border transition-all hover:shadow-xl ${item.highlight
                                    ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10'
                                    : 'bg-transparent border-slate-200 dark:border-white/5 hover:bg-white dark:hover:bg-slate-800/50'
                                    }`}
                            >
                                <div
                                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                                    style={{ backgroundColor: `${BRAND_GOLD}15`, color: BRAND_GOLD }}
                                >
                                    {item.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>


            {/* =============== HOW IT WORKS =============== */}
            <section className="py-24 md:py-32 bg-white dark:bg-[#020617]">
                <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20">

                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <p className="text-[11px] font-bold uppercase tracking-[0.3em] mb-4" style={{ color: BRAND_GOLD }}>
                            The Process
                        </p>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight">
                            3 Steps to Your Ride
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
                        {[
                            {
                                step: '01',
                                title: 'Select Your Ride',
                                desc: 'Browse 500+ models from all major brands. Filter by budget, category, or features.'
                            },
                            {
                                step: '02',
                                title: 'Get EMI Options',
                                desc: 'Compare EMI plans from 15+ banks instantly. Choose the tenure that fits your budget.'
                            },
                            {
                                step: '03',
                                title: 'Doorstep Delivery',
                                desc: 'Complete minimal paperwork online. Get your vehicle delivered in 48 hours.'
                            },
                        ].map((item, i) => (
                            <div key={i} className="relative text-center md:text-left">
                                <p
                                    className="text-8xl md:text-9xl font-black opacity-10 absolute -top-8 left-1/2 md:left-0 -translate-x-1/2 md:translate-x-0"
                                    style={{ color: BRAND_GOLD }}
                                >
                                    {item.step}
                                </p>
                                <div className="relative pt-16 md:pt-20">
                                    <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>


            {/* =============== EMI CALCULATOR TEASER =============== */}
            <section className="py-24 md:py-32" style={{ backgroundColor: BRAND_GOLD }}>
                <div className="max-w-5xl mx-auto px-6 md:px-12 lg:px-20 text-center">
                    <Calculator size={48} className="mx-auto mb-8 text-black/20" />
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-black mb-6">
                        ₹999/month EMI
                    </h2>
                    <p className="text-xl text-black/60 mb-10 max-w-2xl mx-auto">
                        Two-wheelers starting at just ₹999/month. Check your exact EMI in 30 seconds.
                    </p>
                    <Link
                        href="/calculator"
                        className="inline-flex items-center gap-3 px-10 py-5 bg-black text-white rounded-2xl font-bold text-sm uppercase tracking-wider hover:bg-slate-900 transition-all group"
                    >
                        Calculate My EMI
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </section>


            {/* =============== TRUST INDICATORS =============== */}
            <section className="py-24 md:py-32 bg-slate-50 dark:bg-slate-900/50">
                <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20">

                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <p className="text-[11px] font-bold uppercase tracking-[0.3em] mb-4" style={{ color: BRAND_GOLD }}>
                            Trusted By
                        </p>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight">
                            15,000+ Happy Riders
                        </h2>
                    </div>

                    {/* Review Stats */}
                    <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-16">
                        <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map(i => <Star key={i} size={24} fill={BRAND_GOLD} color={BRAND_GOLD} />)}
                        </div>
                        <p className="text-lg">
                            <span className="font-bold">4.9/5</span> from <span className="font-bold">2,400+ reviews</span>
                        </p>
                    </div>

                    {/* Key Benefits Checklist */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
                        {[
                            'No Hidden Charges',
                            'Instant Approval',
                            'Lowest EMI Guaranteed',
                            'Doorstep Delivery'
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3 justify-center sm:justify-start">
                                <CheckCircle2 size={20} style={{ color: BRAND_GOLD }} />
                                <span className="font-bold">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>


            {/* =============== FINAL CTA =============== */}
            <section className="py-24 md:py-32 bg-slate-900 dark:bg-black text-white text-center relative overflow-hidden">
                {/* Subtle background */}
                <div className="absolute inset-0 opacity-5">
                    <img src="/images/hero/lifestyle_1.png" alt="" className="w-full h-full object-cover" />
                </div>

                <div className="relative z-10 max-w-3xl mx-auto px-6">
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6">
                        Ready to Ride?
                    </h2>
                    <p className="text-xl text-white/60 mb-10 max-w-xl mx-auto">
                        Get pre-approved in 10 minutes. No impact on credit score.
                    </p>
                    <Link
                        href="/store/catalog"
                        className="inline-flex items-center gap-3 px-12 py-6 rounded-2xl font-bold text-sm uppercase tracking-wider transition-all group"
                        style={{ backgroundColor: BRAND_GOLD, color: '#000' }}
                    >
                        Check Eligibility Now
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </section>


            {/* =============== FOOTER =============== */}
            <footer className="bg-black py-16 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <Logo mode="dark" size={32} variant="full" />
                        <div className="flex items-center gap-8">
                            {['Privacy', 'Terms', 'Help', 'Contact'].map((link) => (
                                <Link key={link} href={`/${link.toLowerCase()}`} className="text-sm text-white/40 hover:text-white transition-colors">
                                    {link}
                                </Link>
                            ))}
                        </div>
                        <p className="text-sm text-white/30">© 2026 BookMy.Bike Technologies</p>
                    </div>
                </div>
            </footer>

        </div>
    );
}
