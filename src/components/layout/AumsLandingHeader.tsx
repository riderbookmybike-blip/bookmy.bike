'use client';

import React from 'react';
import Link from 'next/link';
import { Terminal } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { AppHeaderShell } from './AppHeaderShell';

interface AumsLandingHeaderProps {
    onLoginClick: () => void;
}

export const AumsLandingHeader = ({ onLoginClick }: AumsLandingHeaderProps) => {
    return (
        <AppHeaderShell
            className=""
            left={
                <Link href="/" className="flex items-center group">
                    <Logo mode="light" size="sm" />
                </Link>
            }
            right={
                <div className="flex items-center gap-4 lg:gap-6 h-full">
                    <button
                        onClick={onLoginClick}
                        className="px-6 h-9 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all flex items-center gap-2 active:scale-95 flex-shrink-0 bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/20"
                    >
                        <Terminal size={14} className="text-blue-600" />
                        Partner Login
                    </button>
                </div>
            }
        />
    );
};
