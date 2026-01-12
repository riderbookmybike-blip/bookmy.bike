'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, Zap, Shield, FileCheck, Clock, ChevronDown, Check } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';

/**
 * Landing V5 - ORIGINAL DESIGN
 * BookMy.Bike Signature Style
 * 
 * Unique Elements:
 * 1. Animated EMI counter as hero centerpiece
 * 2. Floating trust badges that follow scroll
 * 3. Bold diagonal sections
 * 4. Custom gold gradient accents
 * 5. Interactive hover states with depth
 */

const GOLD = '#F4B000';
const GOLD_DARK = '#D49A00';

export default function LandingV5Page() {
    const [emiValue, setEmiValue] = useState(999);
    const [scrollY, setScrollY] = useState(0);
    const heroRef = useRef<HTMLDivElement>(null);

    // Animated EMI counter effect
    useEffect(() => {
        const interval = setInterval(() => {
            setEmiValue(prev => {
                if (prev >= 4999) return 999;
                return prev + Math.floor(Math.random() * 100) + 50;
            });
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    // Scroll tracking
    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="bg-[#030712] text-white overflow-x-hidden">

            {/* ══════════════════ HERO ══════════════════ */}
            <section ref={heroRef} className="relative min-h-screen flex flex-col">

                {/* Background - Blurred with Gold Accent */}
                <div className="absolute inset-0">
                    <img
                        src="/images/hero/blurred_bike_hero.png"
                        alt=""
                        className="w-full h-full object-cover opacity-40"
                        style={{ transform: `translateY(${scrollY * 0.3}px)` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-[#030712] via-[#030712]/90 to-transparent" />
                    {/* Gold Glow */}
                    <div
                        className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full blur-[150px] opacity-20"
                        style={{ background: GOLD }}
                    />
                </div>

                {/* Header */}
                <header className="relative z-50 px-6 md:px-12 py-6">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <Logo mode="dark" size={36} variant="full" />
                        <Link
                            href="/store/catalog"
                            className="px-6 py-3 rounded-full font-bold text-sm text-black transition-all hover:scale-105"
                            style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DARK})` }}
                        >
                            Get Started
                        </Link>
                    </div>
                </header>

                {/* Main Content */}
                <div className="relative z-10 flex-1 flex items-center">
                    <div className="max-w-7xl mx-auto px-6 md:px-12 w-full">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                            {/* Left - Message */}
                            <div className="space-y-8">
                                {/* Tagline */}
                                <div className="inline-flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: GOLD }} />
                                    <span className="text-sm font-bold uppercase tracking-[0.2em] opacity-60">
                                        India's Lowest EMI Platform
                                    </span>
                                </div>

                                {/* Headline */}
                                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.1]">
                                    <span className="block">Ride Now.</span>
                                    <span
                                        className="block text-transparent bg-clip-text"
                                        style={{ backgroundImage: `linear-gradient(135deg, ${GOLD}, #FBBF24, ${GOLD})` }}
                                    >
                                        Pay Later.
                                    </span>
                                </h1>

                                {/* Description */}
                                <p className="text-lg text-white/50 max-w-md leading-relaxed">
                                    Zero paperwork. 10-minute approval.
                                    Your dream two-wheeler delivered to your doorstep.
                                </p>

                                {/* CTA */}
                                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                    <Link
                                        href="/store/catalog"
                                        className="group flex items-center justify-center gap-3 px-8 py-5 rounded-2xl font-bold transition-all hover:scale-105"
                                        style={{
                                            background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DARK})`,
                                            color: '#000',
                                            boxShadow: `0 20px 60px ${GOLD}40`
                                        }}
                                    >
                                        Check Your EMI
                                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                    <Link
                                        href="/how-it-works"
                                        className="flex items-center justify-center gap-3 px-8 py-5 rounded-2xl font-bold border border-white/10 hover:bg-white/5 transition-all"
                                    >
                                        How It Works
                                    </Link>
                                </div>
                            </div>

                            {/* Right - EMI Counter Card */}
                            <div className="relative">
                                {/* Glow behind card */}
                                <div
                                    className="absolute -inset-8 rounded-[3rem] blur-3xl opacity-30"
                                    style={{ background: `linear-gradient(135deg, ${GOLD}, transparent)` }}
                                />

                                {/* Card */}
                                <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 space-y-8">
                                    <div className="text-center">
                                        <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/40 mb-4">
                                            EMI Starting From
                                        </p>
                                        <div className="flex items-baseline justify-center gap-2">
                                            <span className="text-2xl font-bold" style={{ color: GOLD }}>₹</span>
                                            <span
                                                className="text-7xl md:text-8xl font-black tabular-nums"
                                                style={{ color: GOLD }}
                                            >
                                                {emiValue.toLocaleString()}
                                            </span>
                                            <span className="text-2xl text-white/40">/mo</span>
                                        </div>
                                    </div>

                                    {/* Features */}
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { icon: <Clock size={18} />, text: '10min Approval' },
                                            { icon: <FileCheck size={18} />, text: 'Min. Documents' },
                                            { icon: <Shield size={18} />, text: 'No Hidden Fees' },
                                            { icon: <Zap size={18} />, text: '48hr Delivery' },
                                        ].map((item, i) => (
                                            <div
                                                key={i}
                                                className="flex items-center gap-3 p-4 rounded-2xl bg-white/5"
                                            >
                                                <div style={{ color: GOLD }}>{item.icon}</div>
                                                <span className="text-sm font-medium text-white/70">{item.text}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Bank Partners */}
                                    <div className="pt-6 border-t border-white/5">
                                        <p className="text-center text-xs text-white/30 uppercase tracking-widest mb-4">15+ Partner Banks</p>
                                        <div className="flex justify-center gap-6 opacity-30">
                                            {['HDFC', 'ICICI', 'SBI', 'AXIS', 'KOTAK'].map((bank) => (
                                                <span key={bank} className="text-xs font-bold tracking-wider">{bank}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="relative z-10 pb-8 flex justify-center">
                    <button
                        onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
                        className="flex flex-col items-center gap-2 text-white/30 hover:text-white/60 transition-colors animate-bounce"
                    >
                        <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Scroll</span>
                        <ChevronDown size={20} />
                    </button>
                </div>
            </section>


            {/* ══════════════════ WHY US ══════════════════ */}
            <section className="relative py-32 overflow-hidden">
                {/* Diagonal Background */}
                <div
                    className="absolute inset-0 -skew-y-3 origin-top-left"
                    style={{ background: `linear-gradient(135deg, ${GOLD}10, transparent 50%)` }}
                />

                <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                        {/* Left - Title */}
                        <div>
                            <p
                                className="text-sm font-bold uppercase tracking-[0.3em] mb-4"
                                style={{ color: GOLD }}
                            >
                                Why BookMy.Bike
                            </p>
                            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight">
                                Financing That
                                <br />
                                <span style={{ color: GOLD }}>Actually Works.</span>
                            </h2>
                            <p className="mt-6 text-lg text-white/40 max-w-md">
                                No more running around. No more hidden charges.
                                Just simple, transparent financing.
                            </p>
                        </div>

                        {/* Right - Features */}
                        <div className="space-y-6">
                            {[
                                {
                                    title: 'Zero Processing Fee',
                                    desc: 'What you see is what you pay. Period.',
                                    highlight: true
                                },
                                {
                                    title: 'Instant Pre-Approval',
                                    desc: 'Know your eligibility in 2 minutes without affecting credit score.',
                                    highlight: false
                                },
                                {
                                    title: 'Just Aadhaar + PAN',
                                    desc: 'No salary slips. No bank statements. Minimal paperwork.',
                                    highlight: true
                                },
                                {
                                    title: 'Doorstep Delivery',
                                    desc: 'Your bike delivered to your home within 48 hours.',
                                    highlight: false
                                },
                            ].map((item, i) => (
                                <div
                                    key={i}
                                    className={`group p-6 rounded-2xl border transition-all hover:translate-x-2 cursor-default ${item.highlight
                                            ? 'bg-white/5 border-white/10'
                                            : 'bg-transparent border-white/5 hover:border-white/10'
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                            style={{ background: `${GOLD}20` }}
                                        >
                                            <Check size={16} style={{ color: GOLD }} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold mb-1">{item.title}</h3>
                                            <p className="text-sm text-white/40">{item.desc}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>


            {/* ══════════════════ STATS ══════════════════ */}
            <section className="py-24 border-y border-white/5">
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {[
                            { value: '₹12K', label: 'Average Savings' },
                            { value: '15K+', label: 'Happy Riders' },
                            { value: '500+', label: 'Models Available' },
                            { value: '10min', label: 'Approval Time' },
                        ].map((stat, i) => (
                            <div key={i} className="space-y-2">
                                <p
                                    className="text-4xl md:text-5xl font-black"
                                    style={{ color: i === 0 || i === 3 ? GOLD : 'white' }}
                                >
                                    {stat.value}
                                </p>
                                <p className="text-sm text-white/40 uppercase tracking-widest">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>


            {/* ══════════════════ CTA ══════════════════ */}
            <section className="py-32 relative overflow-hidden">
                {/* Gold Gradient Background */}
                <div
                    className="absolute inset-0"
                    style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DARK})` }}
                />
                <div className="absolute inset-0 bg-[url('/images/hero/blurred_bike_hero.png')] bg-cover bg-center opacity-10" />

                <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
                    <h2 className="text-4xl md:text-6xl font-black text-black mb-6">
                        Ready to Ride?
                    </h2>
                    <p className="text-xl text-black/60 mb-10">
                        Check your EMI in 30 seconds. No impact on credit score.
                    </p>
                    <Link
                        href="/store/catalog"
                        className="inline-flex items-center gap-3 px-12 py-6 bg-black text-white rounded-2xl font-bold transition-all hover:scale-105 group"
                    >
                        Calculate My EMI
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </section>


            {/* ══════════════════ FOOTER ══════════════════ */}
            <footer className="py-16 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <Logo mode="dark" size={32} variant="full" />
                        <div className="flex items-center gap-8">
                            {['Privacy', 'Terms', 'Help'].map((link) => (
                                <Link key={link} href={`/${link.toLowerCase()}`} className="text-sm text-white/30 hover:text-white transition-colors">
                                    {link}
                                </Link>
                            ))}
                        </div>
                        <p className="text-sm text-white/20">© 2026 BookMy.Bike</p>
                    </div>
                </div>
            </footer>

        </div>
    );
}
