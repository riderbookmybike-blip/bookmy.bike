'use client';

import React from 'react';
import Link from 'next/link';
import { Terminal } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface AumsLandingHeaderProps {
    onLoginClick: () => void;
}

export const AumsLandingHeader = ({ onLoginClick }: AumsLandingHeaderProps) => {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-white/5 transition-colors duration-300">
            <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
                <Link href="/" className="w-40 md:w-48">
                    <Logo variant="blue" className="text-white" />
                </Link>

                <div className="flex items-center gap-4 lg:gap-6">
                    <ThemeToggle />

                    <button
                        onClick={onLoginClick}
                        className="px-6 py-2.5 bg-white text-slate-950 hover:bg-slate-200 rounded-lg text-xs font-black uppercase tracking-widest shadow-lg shadow-white/10 transition-all flex items-center gap-2 active:scale-95"
                    >
                        <Terminal size={14} className="text-blue-600" />
                        Partner Login
                    </button>
                </div>
            </div>
        </nav>
    );
};
