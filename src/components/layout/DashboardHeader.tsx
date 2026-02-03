import React, { useEffect, useState } from 'react';
import { Search, Bell, Menu } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useTenant } from '@/lib/tenant/tenantContext';
import { useRouter } from 'next/navigation';
import { ProfileDropdown } from './ProfileDropdown';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { createClient } from '@/lib/supabase/client';
// Removed: import { DashboardGreeting } from './DashboardGreeting';
// Removed: import { WorkspaceSwitcher } from '@/components/layout/WorkspaceSwitcher';

interface DashboardHeaderProps {
    onMenuClick?: () => void;
    showSearch?: boolean;
}

export const DashboardHeader = ({ onMenuClick, showSearch = false }: DashboardHeaderProps) => {
    const { isSidebarExpanded, tenantName, tenantType, tenantConfig, tenantId } = useTenant();
    const { theme } = useTheme();
    const router = useRouter();
    const handleLoginClick = () => router.push('/login');
    const brandLogo = tenantConfig?.brand?.logoUrl;
    const brandColor = tenantConfig?.brand?.primaryColor || '#4F46E5';
    const initials = (tenantName || '')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0]?.toUpperCase())
        .join('');
    const [resolvedLogo, setResolvedLogo] = useState<string | null>(brandLogo || null);

    useEffect(() => {
        if (brandLogo) setResolvedLogo(brandLogo);
    }, [brandLogo]);

    useEffect(() => {
        const fetchTenantLogo = async () => {
            if (!tenantId || brandLogo) return;
            try {
                const supabase = createClient();
                const { data } = await supabase
                    .from('id_tenants')
                    .select('logo_url')
                    .eq('id', tenantId)
                    .maybeSingle();
                if (data?.logo_url) {
                    setResolvedLogo(data.logo_url);
                }
            } catch {
                // Ignore logo fetch errors; fallback to initials.
            }
        };
        fetchTenantLogo();
    }, [tenantId, brandLogo]);

    useEffect(() => {
        const handleLogoUpdate = (event: Event) => {
            const detail = (event as CustomEvent<string>).detail;
            if (detail) setResolvedLogo(detail);
        };
        window.addEventListener('tenantLogoUpdated', handleLogoUpdate);
        return () => window.removeEventListener('tenantLogoUpdated', handleLogoUpdate);
    }, []);


    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isSidebarExpanded ? 'md:left-[280px]' : 'md:left-[80px]'} bg-white/80 dark:bg-black/30 backdrop-blur-[20px] dark:backdrop-blur-[12px] border-b border-slate-200/50 dark:border-white/10`}>
            <div className="w-full px-6 h-16 flex items-center justify-between">
                <div className="flex items-center flex-1 gap-4">
                    {onMenuClick && (
                        <button
                            onClick={onMenuClick}
                            className="p-2 mr-4 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white md:hidden"
                        >
                            <Menu size={20} />
                        </button>
                    )}

                    {tenantName && (
                        <div
                            title={tenantName}
                            className="min-h-10 px-3 pr-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-white/5 flex items-center gap-2.5 text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white shadow-sm"
                        >
                            <div className="w-8 h-8 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-white/10 flex items-center justify-center overflow-hidden">
                                {resolvedLogo ? (
                                    <img
                                        src={resolvedLogo}
                                        alt={tenantName}
                                        className="w-full h-full object-contain p-1.5"
                                    />
                                ) : (
                                    <span
                                        className="text-[10px] font-black text-white"
                                        style={{ backgroundColor: brandColor, padding: '6px 7px', borderRadius: '0.7rem' }}
                                    >
                                        {initials || 'T'}
                                    </span>
                                )}
                            </div>
                            <span className="break-words">{tenantName}</span>
                        </div>
                    )}

                </div>

                <div className="flex items-center gap-4">
                    {/* Compact Search Icon */}
                    <button className="p-2 text-slate-400 hover:text-indigo-500 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all relative group">
                        <Search size={18} />
                    </button>

                    <button className="p-2 text-slate-400 hover:text-indigo-500 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all relative group">
                        <Bell size={18} />
                        <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-950" />
                    </button>

                    <div className="flex items-center gap-4">
                        <ThemeToggle className="w-10 h-10 text-slate-400 hover:text-indigo-500 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl" />
                        <ProfileDropdown onLoginClick={handleLoginClick} scrolled={true} theme={theme} />
                    </div>
                </div>
            </div >
        </nav >
    );
};
