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

declare global {
    interface Window {
        isMsg91Ready?: boolean;
        sendOtp?: (phone: string, success: (data: unknown) => void, error: (err: unknown) => void) => void;
        verifyOtp?: (otp: string, success: (data: unknown) => void, error: (err: unknown) => void) => void;
    }
}

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

    // Independent Tenant Branding Fetch (doesn't rely on context)
    const [localBrandName, setLocalBrandName] = useState<string | null>(null);
    const [localPrimaryColor, setLocalPrimaryColor] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        const fetchBranding = async () => {
            try {
                if (tenantSlug) {
                    const { data: tenant } = await supabase
                        .from('tenants')
                        .select('name, config')
                        .eq('slug', tenantSlug)
                        .maybeSingle();
                    if (tenant) {
                        setLocalBrandName(tenant.name);
                        setLocalPrimaryColor(tenant.config?.brand?.primaryColor || null);
                    }
                }
            } catch (error) {
                // Suppress auth errors on login page - they're expected if user has corrupt cookies
                // This is harmless as we're just fetching public branding info
                console.debug('[Login Page] Branding fetch skipped due to auth state');
            }
        };
        fetchBranding();
    }, [supabase, tenantSlug]);

    // Branding Defaults
    const brandName = localBrandName || tenantConfig?.brand?.displayName || tenantName || 'BookMyBike';
    const primaryColor = localPrimaryColor || tenantConfig?.brand?.primaryColor || '#4F46E5';
    const logoUrl = tenantConfig?.brand?.logoUrl;

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
                    className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_0%_0%,var(--primary-color-alpha,rgba(79,70,229,0.05)),transparent_70%)]"
                    style={{ '--primary-color-alpha': `${primaryColor}1A` } as React.CSSProperties}
                />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:40px_40px] opacity-30" />
            </div>

            {/* Left Section: Branding */}
            <div className="hidden md:flex md:w-1/2 lg:w-[45%] bg-slate-900 relative overflow-hidden flex-col p-16 justify-between">
                <div className="relative z-10 space-y-8">
                    {logoUrl ? (
                        <img src={logoUrl} alt={brandName} className="h-10 object-contain brightness-0 invert" />
                    ) : (
                        <Logo mode="dark" />
                    )}
                    <h1 className="text-5xl font-black uppercase tracking-tighter italic text-white leading-tight">
                        {brandName} <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                            Portal
                        </span>
                    </h1>
                    <p className="text-slate-400 max-w-sm leading-relaxed border-l-2 border-indigo-500/30 pl-6">
                        Welcome to the next generation of dealership management. Authenticate to access your secure
                        terminal.
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
                        Launch Terminal
                    </button>
                )}
            </div>

            <LoginSidebar
                isOpen={isSidebarOpen}
                onClose={handleClose}
                variant="TERMINAL"
                redirectTo={nextPath || undefined}
                tenantSlug={tenantSlug || undefined}
            />
        </div>
    );
}
