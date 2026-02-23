import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, Menu } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useTenant } from '@/lib/tenant/tenantContext';
import { useRouter } from 'next/navigation';
import { HeaderCommandSearch } from '@/components/layout/HeaderCommandSearch';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';

import { AppHeaderShell } from './AppHeaderShell';
import { ProfileDropdown } from './ProfileDropdown';

interface AumsHeaderProps {
    onLoginClick?: () => void;
    onMenuClick?: () => void;
    showSearch?: boolean;
}

export const AumsHeader = ({ onLoginClick, onMenuClick, showSearch = true }: AumsHeaderProps) => {
    const { userName: contextUserName, tenantId } = useTenant();
    const { resolvedTheme } = useTheme();
    const router = useRouter();
    const [localUserName, setLocalUserName] = useState<string | null>(null);
    const { unreadCount } = useUnreadNotifications(tenantId);

    useEffect(() => {
        const storedName = localStorage.getItem('user_name');
        if (storedName) setLocalUserName(storedName);

        const handleLoginSync = () => {
            const name = localStorage.getItem('user_name');
            setLocalUserName(name);
        };
        window.addEventListener('storage', handleLoginSync);
        return () => window.removeEventListener('storage', handleLoginSync);
    }, []);

    const displayUserName = contextUserName && contextUserName !== 'Guest User' ? contextUserName : localUserName;
    const handleLoginClick = () => (onLoginClick ? onLoginClick() : router.push('/login'));

    return (
        <AppHeaderShell
            variant="dashboard"
            left={
                <div className="flex items-center gap-6 md:gap-12 h-full">
                    {onMenuClick && (
                        <button
                            onClick={onMenuClick}
                            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white md:hidden"
                        >
                            <Menu size={24} />
                        </button>
                    )}
                    <Link href="/" className="flex items-center group">
                        <Logo mode="auto" size={30} />
                    </Link>
                </div>
            }
            right={
                <div className="flex items-center gap-4 lg:gap-6 h-full">
                    {displayUserName && (
                        <>
                            {showSearch && (
                                <HeaderCommandSearch className="p-2.5 text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100/40 dark:bg-white/5 border border-slate-200/40 dark:border-white/5 rounded-xl transition-all relative group shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50" />
                            )}
                            <button
                                type="button"
                                onClick={() => router.push('/notifications')}
                                className="p-2.5 text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100/40 dark:bg-white/5 border border-slate-200/40 dark:border-white/5 rounded-xl transition-all relative group shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50"
                                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                                title={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
                            >
                                <Bell size={18} />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-rose-500 text-white text-[10px] font-black rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </button>
                        </>
                    )}

                    <ProfileDropdown onLoginClick={handleLoginClick} scrolled={true} theme={resolvedTheme} />
                </div>
            }
        />
    );
};
