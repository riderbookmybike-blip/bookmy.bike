import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, Menu, Search } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useTenant } from '@/lib/tenant/tenantContext';
import { useRouter } from 'next/navigation';

import { AppHeaderShell } from './AppHeaderShell';
import { ProfileDropdown } from './ProfileDropdown';
// import { DashboardGreeting } from './DashboardGreeting';

interface AumsHeaderProps {
    onLoginClick?: () => void;
    onMenuClick?: () => void;
    showSearch?: boolean;
}

export const AumsHeader = ({ onLoginClick, onMenuClick, showSearch = false }: AumsHeaderProps) => {
    const { userName: contextUserName } = useTenant();
    const { theme } = useTheme();
    const router = useRouter();
    const [localUserName, setLocalUserName] = useState<string | null>(null);

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

    const displayUserName = (contextUserName && contextUserName !== 'Guest User') ? contextUserName : localUserName;
    const handleLoginClick = () => (onLoginClick ? onLoginClick() : router.push('/login'));

    return (
        <AppHeaderShell
            left={
                <div className="flex items-center gap-6 md:gap-12 h-full">
                    {onMenuClick && (
                        <button
                            onClick={onMenuClick}
                            className="p-2 text-slate-400 hover:text-white md:hidden"
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
                            <button className="p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all relative group">
                                <Search size={18} />
                            </button>
                            <button className="p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all relative group">
                                <Bell size={18} />
                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-900" />
                            </button>
                        </>
                    )}

                    <ProfileDropdown onLoginClick={handleLoginClick} scrolled={true} theme={theme} />
                </div>
            }
        />
    );
};
