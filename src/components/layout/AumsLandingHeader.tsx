'use client';

import React from 'react';
import Link from 'next/link';
import { Terminal } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';

interface AumsLandingHeaderProps {
    onLoginClick: () => void;
}

import { AppHeaderShell } from './AppHeaderShell';

interface AumsLandingHeaderProps {
    onLoginClick: () => void;
}

export const AumsLandingHeader = ({ onLoginClick }: AumsLandingHeaderProps) => {
    return (
        <AppHeaderShell
            left={
                <Link href="/" className="flex items-center group">
                    <Logo mode="dark" size="sm" />
                </Link>
            }
            right={
                <div className="flex items-center gap-4 lg:gap-6 h-full">
                    <button
                        onClick={onLoginClick}
                        className="px-6 h-9 bg-white dark:bg-white text-slate-950 hover:bg-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-white/10 transition-all flex items-center gap-2 active:scale-95 flex-shrink-0"
                    >
                        <Terminal size={14} className="text-blue-600" />
                        Partner Login
                    </button>
                </div>
            }
        />
    );
};
