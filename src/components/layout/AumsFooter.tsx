'use client';

import React from 'react';
import { Shield, Terminal, Globe } from 'lucide-react';

export const AumsFooter = () => {
    return (
        <footer className="py-12 border-t border-white/5 text-center bg-black">
            <div className="flex items-center justify-center gap-6 mb-8">
                <Shield size={20} className="text-slate-600" />
                <Terminal size={20} className="text-slate-600" />
                <Globe size={20} className="text-slate-600" />
            </div>
            <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">© 2026 BookMyBike AUMS. Infrastructure Division.</p>
        </footer>
    );
};
