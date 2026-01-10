'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, User, Search, MapPin, Menu, X } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface MarketplaceHeaderProps {
    onLoginClick: () => void;
}

export const MarketplaceHeader = ({ onLoginClick }: MarketplaceHeaderProps) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [userName, setUserName] = useState<string | null>(null);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);

        const storedName = localStorage.getItem('user_name');
        if (storedName) setUserName(storedName);

        const handleLoginSync = () => {
            const name = localStorage.getItem('user_name');
            setUserName(name);
        };
        window.addEventListener('storage', handleLoginSync);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('storage', handleLoginSync);
        };
    }, []);

    // Cinematic Styling Logic
    // Scrolled: Glassmorphism (Blur, Semi-white/dark) -> Text: Theme Default
    // Top: Transparent -> Text: White (For Hero Contrast)

    // NOTE: We force Dark Mode / White Text when transparent because Hero is Dark/Image.
    const headerClass = scrolled
        ? "bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 py-3"
        : "bg-transparent border-transparent py-5";

    const navLinkClass = scrolled
        ? "text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white transition-colors"
        : "text-[10px] font-black uppercase tracking-[0.2em] text-white/80 hover:text-white transition-colors drop-shadow-md";

    const logoVariant = scrolled ? "blue" : "white"; // Assuming Logo supports 'white' variant or we force it

    const iconClass = scrolled
        ? "text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white"
        : "text-white/80 hover:text-white drop-shadow-md";

    const mobileMenuButtonClass = scrolled
        ? "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
        : "text-white hover:bg-white/10";

    return (
        <header className={`sticky top-0 z-50 transition-all duration-500 ${headerClass}`}>
            <div className="max-w-[1400px] mx-auto px-6 flex items-center justify-between">
                <Link href="/" className="flex items-center group">
                    <Logo
                        variant="blue"
                        className={`transition-all ${scrolled ? 'text-slate-900 dark:text-white' : 'text-white'}`}
                    />
                </Link>

                <div className="flex items-center gap-8">
                    <nav className="hidden md:flex items-center gap-8">
                        <Link href="/store" className={navLinkClass}>Home</Link>
                        <Link href="/store/blog" className={navLinkClass}>Blog</Link>
                        <Link href="/about" className={navLinkClass}>About</Link>
                        <Link href="/contact" className={navLinkClass}>Contact</Link>
                    </nav>

                    <div className="flex items-center gap-2 md:gap-8">
                        {/* MapPin Removed */}

                        <div className="flex items-center gap-1 md:gap-4">
                            {/* Theme Toggle - Always Visible */}
                            <ThemeToggle />

                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className={`p-2 md:p-3 rounded-xl transition-all md:hidden ${mobileMenuButtonClass}`}
                            >
                                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                            </button>

                            {userName ? (
                                <Link
                                    href="/dashboard"
                                    className={`${navLinkClass} flex items-center gap-2 group cursor-pointer`}
                                >
                                    <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-[8px] font-black text-white shadow-lg group-hover:bg-blue-500 transition-colors">
                                        {userName.charAt(0)}
                                    </div>
                                    <span className="group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        Hi, {userName.split(' ')[0]}
                                    </span>
                                </Link>
                            ) : (
                                <button
                                    onClick={onLoginClick}
                                    className={`${navLinkClass} flex items-center gap-2 group transition-all active:scale-95`}
                                >
                                    <User size={14} className="group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                                    Hi, Member
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/5 p-6 space-y-8 animate-in slide-in-from-top-4 duration-300 shadow-2xl h-screen fixed inset-0 top-20 z-40">
                    <nav className="flex flex-col gap-6">
                        <Link href="/store" className="text-xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">Home</Link>
                        <Link href="/store/catalog?category=ELECTRIC" className="text-xl font-black uppercase tracking-tighter text-slate-500 dark:text-slate-400">Electric</Link>
                        <Link href="/store/finance" className="text-xl font-black uppercase tracking-tighter text-slate-500 dark:text-slate-400">Finance</Link>
                        <Link href="/members" className="text-xl font-black uppercase tracking-tighter text-amber-600">Members Club</Link>

                        {!userName && (
                            <button
                                onClick={() => {
                                    onLoginClick();
                                    setIsMobileMenuOpen(false);
                                }}
                                className="w-full py-4 bg-blue-600 text-white rounded-xl text-sm font-black uppercase tracking-widest mt-8"
                            >
                                Members Login
                            </button>
                        )}
                    </nav>
                </div>
            )}
        </header>
    );
};
