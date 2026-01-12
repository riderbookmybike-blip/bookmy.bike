'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, User, ChevronDown, Zap } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';

export const BladeHeader = () => {
    const [scrolled, setScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [userName, setUserName] = useState<string>('Hritik Roshan');

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);

        const storedName = localStorage.getItem('user_name');
        if (storedName) setUserName(storedName);

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'Arsenal', href: '/concepts/catalog-blade' },
        { name: 'Showroom', href: '/concepts/pdp-blade' },
        { name: 'Comparison', href: '/store/compare' },
        { name: 'Zero', href: '/zero' }
    ];

    return (
        <header className={`fixed top-0 inset-x-0 z-[150] transition-all duration-500 ${scrolled ? 'bg-black/90 backdrop-blur-xl border-b border-[#F4B000]/20 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.5)]' : 'bg-transparent py-8'}`}>
            <div className="max-w-[1800px] mx-auto px-6 md:px-12 flex items-center justify-between">

                {/* Logo & Brand */}
                <Link href="/" className="group relative flex items-center gap-4">
                    <div className="absolute -inset-2 bg-[#F4B000]/0 group-hover:bg-[#F4B000]/5 transition-colors skew-x-[-15deg]" />
                    <Logo mode="dark" size={32} variant="full" />
                    <div className="hidden lg:block h-4 w-[1px] bg-white/10 rotate-12 ml-2" />
                    <span className="hidden lg:block text-[10px] font-black uppercase tracking-[0.4em] text-[#F4B000] italic">Blade Edition</span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden xl:flex items-center gap-12">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className="group relative px-4 py-2"
                        >
                            <span className="relative z-10 text-[11px] font-black uppercase tracking-[0.3em] text-white/50 group-hover:text-[#F4B000] transition-colors italic">
                                {link.name}
                            </span>
                            <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#F4B000] group-hover:w-full transition-all duration-300 shadow-[0_0_10px_#F4B000]" />
                        </Link>
                    ))}
                </nav>

                {/* Right Actions */}
                <div className="flex items-center gap-6">
                    <button className="hidden md:flex items-center gap-3 px-6 py-2.5 bg-white/[0.03] border border-white/10 hover:border-[#F4B000]/40 transition-all skew-x-[-15deg] group">
                        <User size={14} className="text-white/40 group-hover:text-[#F4B000] skew-x-[15deg]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white skew-x-[15deg]">
                            {userName.split(' ')[0]}
                        </span>
                    </button>

                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="p-3 bg-[#F4B000] text-black hover:bg-white transition-colors skew-x-[-15deg] active:scale-95"
                    >
                        {isMenuOpen ? <X size={20} className="skew-x-[15deg]" /> : <Menu size={20} className="skew-x-[15deg]" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="fixed inset-0 top-[header-h] bg-black/95 backdrop-blur-2xl z-[140] flex flex-col p-12 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="absolute inset-0 pointer-events-none opacity-10">
                        <div className="absolute top-0 right-0 w-1/2 h-full bg-[#F4B000] skew-x-[-20deg] translate-x-32" />
                    </div>

                    <div className="relative z-10 flex flex-col gap-8">
                        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#F4B000] mb-4">Mission Navigation</p>
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                onClick={() => setIsMenuOpen(false)}
                                className="text-5xl font-black italic tracking-tighter uppercase text-white/40 hover:text-[#F4B000] transition-colors hover:translate-x-4 transition-transform"
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    <div className="mt-auto border-t border-white/10 pt-12 flex flex-col gap-8 relative z-10">
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-[#F4B000] flex items-center justify-center text-black">
                                <Zap size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#F4B000]">Blade Account</p>
                                <p className="text-lg font-black uppercase tracking-tight italic">{userName}</p>
                            </div>
                        </div>
                        <button className="w-full py-6 bg-white text-black text-xs font-black uppercase tracking-[0.4em] skew-x-[-10deg]">
                            Synchronize Profile
                        </button>
                    </div>
                </div>
            )}
        </header>
    );
};
