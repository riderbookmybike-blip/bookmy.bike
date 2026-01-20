import React from 'react';
import { Search, Bell, Menu } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useTenant } from '@/lib/tenant/tenantContext';
import { useRouter } from 'next/navigation';
import { ProfileDropdown } from './ProfileDropdown';
// Removed: import { DashboardGreeting } from './DashboardGreeting';
// Removed: import { WorkspaceSwitcher } from '@/components/layout/WorkspaceSwitcher';

interface DashboardHeaderProps {
    onMenuClick?: () => void;
    showSearch?: boolean;
}

export const DashboardHeader = ({ onMenuClick, showSearch = false }: DashboardHeaderProps) => {
    const { isSidebarExpanded } = useTenant();
    const { theme } = useTheme();
    const router = useRouter();
    const handleLoginClick = () => router.push('/login');

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isSidebarExpanded ? 'md:left-[280px]' : 'md:left-[80px]'} backdrop-blur-2xl bg-white/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-white/5`}>
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

                    {/* No Greeting */}
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

                    <div className="pl-4 border-l border-slate-200 dark:border-white/10 ml-2">
                        <ProfileDropdown onLoginClick={handleLoginClick} scrolled={true} theme={theme} />
                    </div>
                </div>
            </div >
        </nav >
    );
};
