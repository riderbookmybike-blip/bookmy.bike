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

    useEffect(() => {
        const storedName = localStorage.getItem('user_name');
        if (storedName) setUserName(storedName);

        // Listen for login events to update name immediately
        const handleLoginSync = () => {
            const name = localStorage.getItem('user_name');
            setUserName(name);
        };
        window.addEventListener('storage', handleLoginSync);
        return () => window.removeEventListener('storage', handleLoginSync);
    }, []);

    return (
        <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 transition-colors duration-300">
            <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
                <div className="flex items-center gap-12">
                    <Link href="/" className="flex items-center group">
                        <Logo variant="blue" className="w-40 md:w-48" />
                    </Link>

                    <nav className="hidden md:flex items-center gap-8">
                        <Link href="/store" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white transition-colors">Home</Link>
                        <Link href="/store/finance" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white transition-colors">Zero Downpayment</Link>
                        <Link href="/store/blog" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white transition-colors">Blog</Link>
                        <Link href="/store/accessories" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white transition-colors">Accessories</Link>
                    </nav>
                </div>

                <div className="flex items-center gap-2 md:gap-6">
                    <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full cursor-pointer hover:bg-slate-200 dark:hover:bg-white/10 transition-all">
                        <MapPin size={12} className="text-blue-600 dark:text-blue-500" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Delhi</span>
                    </div>

                    <div className="w-px h-6 bg-slate-200 dark:bg-white/10 hidden md:block" />

                    <div className="flex items-center gap-1 md:gap-2">
                        <ThemeToggle />
                        <button className="p-2 md:p-3 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all relative">
                            <ShoppingCart size={18} />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 dark:bg-blue-500 rounded-full border-2 border-slate-50 dark:border-slate-950" />
                        </button>
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2 md:p-3 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all md:hidden"
                        >
                            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>

                        {userName ? (
                            <div className="hidden sm:flex items-center gap-3 px-5 py-2.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full group cursor-pointer hover:bg-slate-200 dark:hover:bg-white/10 transition-all">
                                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-black text-white">
                                    {userName.charAt(0)}
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-500 transition-colors">
                                    {userName}
                                </span>
                            </div>
                        ) : (
                            <button
                                onClick={onLoginClick}
                                className="hidden sm:flex ml-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest items-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                            >
                                <User size={14} />
                                Sign In
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/5 p-6 space-y-8 animate-in slide-in-from-top-4 duration-300 shadow-2xl">
                    <nav className="flex flex-col gap-6">
                        <Link href="/store/catalog?category=ELECTRIC" className="text-xs font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300">Electric</Link>
                        <Link href="/store/catalog?category=SPORT" className="text-xs font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300">Sport</Link>
                        <Link href="/store/catalog?category=COMMUTER" className="text-xs font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300">Commuter</Link>
                        {!userName && (
                            <button
                                onClick={() => {
                                    onLoginClick();
                                    setIsMobileMenuOpen(false);
                                }}
                                className="w-full py-4 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                            >
                                Sign In
                            </button>
                        )}
                    </nav>
                </div>
            )}
        </header>
    );
};
