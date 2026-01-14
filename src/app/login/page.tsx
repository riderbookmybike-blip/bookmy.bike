'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Phone,
    Lock,
    ArrowRight,
    ShieldCheck,
    AlertTriangle,
    Check,
    Globe,
    ChevronRight,
    BarChart3,
    Zap,
} from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { useTenant } from '@/lib/tenant/tenantContext';
import { createClient } from '@/lib/supabase/client';
import { useSearchParams } from 'next/navigation';

import LoginSidebar from '@/components/auth/LoginSidebar';

export default function LoginPage() {
    const { tenantConfig, tenantName } = useTenant();
    const searchParams = useSearchParams();
    const nextPath = searchParams.get('next');
    const tenantSlug = useMemo(() => {
        const direct = searchParams.get('tenant');
        if (direct) return direct;
        const match = nextPath?.match(/^\/app\/([^/]+)/);
        return match ? match[1] : null;
    }, [nextPath, searchParams]);

    // Unified Branding
    const brandName = 'BookMyBike';
    const primaryColor = '#F4B000'; // Brand Gold

    // Auto-open sidebar on mount
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const handleClose = () => {
        setIsSidebarOpen(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row font-sans relative overflow-hidden">
            {/* Background Magic */}
            <div className="absolute inset-0 pointer-events-none">
                <div
                    className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_0%_0%,var(--primary-color-alpha,rgba(244,176,0,0.05)),transparent_70%)]"
                    style={{ '--primary-color-alpha': `${primaryColor}1A` } as React.CSSProperties}
                />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:40px_40px] opacity-30" />
            </div>

            {/* Left Section: Branding */}
            <div className="hidden md:flex md:w-1/2 lg:w-[45%] bg-slate-900 relative overflow-hidden flex-col p-16 justify-between">
                <div className="relative z-10 space-y-8">
                    <Logo mode="dark" />
                    <h1 className="text-5xl font-black uppercase tracking-tighter italic text-white leading-tight">
                        BOOKMYBIKE <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F4B000] to-amber-500">
                            Portal
                        </span>
                    </h1>
                    <p className="text-slate-400 max-w-sm leading-relaxed border-l-2 border-[#F4B000]/30 pl-6">
                        Welcome to the unified dealership & marketplace terminal. Authenticate to access your secure
                        workspace.
                    </p>
                </div>
                <div className="relative z-10 text-[10px] font-black uppercase tracking-widest text-slate-500 flex gap-6">
                    <span>Secure Uptime 100%</span>
                    <span>Support 24/7</span>
                </div>
            </div>

            {/* Right Section: The Login Sidebar */}
            <div className="flex-1 flex items-center justify-center p-4 relative z-20">
                {!isSidebarOpen && (
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="px-8 py-4 bg-slate-900 text-white rounded-full font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-transform"
                    >
                        Launch Portal
                    </button>
                )}
            </div>

            <LoginSidebar
                isOpen={isSidebarOpen}
                onClose={handleClose}
                variant="RETAIL"
                redirectTo={nextPath || undefined}
                tenantSlug={tenantSlug || undefined}
            />
        </div>
    );
}
