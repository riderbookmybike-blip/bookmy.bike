'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    Home,
    Heart,
    Menu,
    X,
    LogOut,
    LogIn,
    Search,
    Settings,
    Package,
    Bell,
    ArrowRightLeft,
    Zap,
    Globe,
    Bike,
    ChevronRight,
    MapPin,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import { useFavorites } from '@/lib/favorites/favoritesContext';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/AuthProvider';
import { Logo } from '@/components/brand/Logo';

const TABS = [
    { key: 'home', label: 'Home', icon: Home, href: '/' },
    { key: 'ride', label: 'Ride', icon: MotorcycleIcon, href: '/store/catalog' },
    { key: 'search', label: 'Search', icon: Search, href: null },
    { key: 'love', label: 'Love', icon: Heart, href: '/wishlist' },
    { key: 'menu', label: 'Menu', icon: Menu, href: null },
] as const;

const MENU_ITEMS = [
    { label: 'Home', icon: Home, href: '/' },
    { label: 'Catalog', icon: Bike, href: '/store/catalog' },
    { label: 'Wishlist', icon: Heart, href: '/wishlist' },
    { label: 'Compare', icon: ArrowRightLeft, href: '/compare' },
    { label: 'Zero', icon: Zap, href: '/zero' },
    { label: "O' Circle", icon: Globe, href: '/#o-circle' },
];

const ACCOUNT_ITEMS = [
    { label: 'Settings', icon: Settings, href: '/profile' },
    { label: 'Orders', icon: Package, href: '/orders' },
    { label: 'Notifications', icon: Bell, href: '/notifications' },
];

export function ShopperBottomNav() {
    const pathname = usePathname();
    const router = useRouter();
    const { user } = useAuth();
    const { favorites } = useFavorites();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [bCoins, setBCoins] = useState<number | null>(null);
    const [location, setLocation] = useState<{
        area: string;
        taluka: string;
        district?: string;
        state?: string;
        stateCode?: string;
    } | null>(null);

    React.useEffect(() => {
        const handleLocationChange = () => {
            const stored = localStorage.getItem('bkmb_user_pincode');
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    setLocation({
                        area: parsed.area,
                        taluka: parsed.taluka || parsed.city,
                        district: parsed.district,
                        stateCode: parsed.stateCode,
                    });
                } catch (e) {
                    console.error('Error parsing stored location:', e);
                }
            }
        };

        handleLocationChange();
        window.addEventListener('locationChanged', handleLocationChange);
        window.addEventListener('storage', handleLocationChange);

        return () => {
            window.removeEventListener('locationChanged', handleLocationChange);
            window.removeEventListener('storage', handleLocationChange);
        };
    }, []);

    React.useEffect(() => {
        if (user?.id) {
            import('@/actions/oclub').then(({ getOClubWallet }) => {
                getOClubWallet(user.id).then(res => {
                    if (res.success && res.wallet) {
                        setBCoins((res.wallet as any).available_system || 0);
                    }
                });
            });
        } else {
            setBCoins(null);
        }
    }, [user?.id]);

    const isTabActive = (href: string) => {
        if (!pathname) return false;
        if (href === '/') return pathname === '/' || pathname === '/store';
        return pathname.startsWith(href);
    };

    const handleLogout = useCallback(async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        setSidebarOpen(false);
        router.refresh();
    }, [router]);

    const handleLogin = useCallback(() => {
        setSidebarOpen(false);
        // Dispatch event for the login modal (same as MarketplaceHeader's onLoginClick)
        window.dispatchEvent(new Event('openLogin'));
    }, []);

    return (
        <>
            {/* Bottom Nav Bar */}
            <nav
                className="fixed bottom-0 left-0 right-0 z-[55] bg-[#0b0d10]/95 backdrop-blur-2xl border-t border-white/5"
                style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
                <div className="flex items-stretch justify-around h-[60px]">
                    {TABS.map(tab => {
                        const active = tab.href ? isTabActive(tab.href) : sidebarOpen;
                        const Icon = tab.icon;
                        const isLove = tab.key === 'love';
                        const isMenu = tab.key === 'menu';

                        const inner = (
                            <>
                                <div className="relative">
                                    <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
                                    {isLove && favorites.length > 0 && (
                                        <span className="absolute -top-1.5 -right-2.5 w-4 h-4 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border border-[#0b0d10]">
                                            {favorites.length > 9 ? '9+' : favorites.length}
                                        </span>
                                    )}
                                </div>
                                <span
                                    className={`text-[9px] tracking-[0.15em] uppercase ${active ? 'font-black' : 'font-semibold'}`}
                                >
                                    {tab.label}
                                </span>
                                {active && (
                                    <div className="absolute top-1 w-1 h-1 rounded-full bg-[#FFD700] shadow-[0_0_6px_#FFD700]" />
                                )}
                            </>
                        );

                        const cls = `flex flex-col items-center justify-center flex-1 gap-1 transition-all duration-300 min-h-[44px] relative ${
                            active ? 'text-[#FFD700]' : 'text-slate-500 active:text-slate-300'
                        }`;

                        if (isMenu) {
                            return (
                                <button key={tab.key} onClick={() => setSidebarOpen(prev => !prev)} className={cls}>
                                    {sidebarOpen ? (
                                        <>
                                            <X size={20} strokeWidth={2.5} />
                                            <span className="text-[9px] tracking-[0.15em] uppercase font-black">
                                                Close
                                            </span>
                                        </>
                                    ) : (
                                        inner
                                    )}
                                </button>
                            );
                        }
                        if (tab.key === 'search') {
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => {
                                        setSidebarOpen(false);
                                        if (pathname !== '/store/catalog') {
                                            router.push('/store/catalog');
                                        }
                                        setTimeout(() => window.dispatchEvent(new Event('toggleCatalogSearch')), 100);
                                    }}
                                    className={cls}
                                >
                                    {inner}
                                </button>
                            );
                        }
                        return (
                            <Link key={tab.key} href={tab.href!} className={cls} onClick={() => setSidebarOpen(false)}>
                                {inner}
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Half-Width Sidebar */}
            <AnimatePresence>
                {sidebarOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => setSidebarOpen(false)}
                            className="fixed inset-0 z-[52] bg-black/50 backdrop-blur-sm"
                        />

                        {/* Sidebar Panel — right side, half width, below header */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                            className="fixed top-14 right-0 z-[53] w-[55vw] bg-black/40 backdrop-blur-2xl border-l border-white/10 rounded-l-2xl flex flex-col overflow-hidden"
                            style={{ height: 'calc(100% - 56px - 60px - env(safe-area-inset-bottom, 0px))' }}
                        >
                            {/* Top: Login/User Section */}
                            <div className="px-4 pt-6 pb-4 border-b border-white/8">
                                {user ? (
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FFD700] to-[#F4B000] flex items-center justify-center text-black text-sm font-black shrink-0">
                                            {(
                                                user.user_metadata?.full_name?.[0] ||
                                                user.email?.[0] ||
                                                'U'
                                            ).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[13px] font-black text-white uppercase tracking-wide truncate">
                                                {user.user_metadata?.full_name ||
                                                    user.user_metadata?.name ||
                                                    user.email?.split('@')[0] ||
                                                    'User'}
                                            </p>
                                            <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                                {user.email || user.phone}
                                            </p>
                                            {location && (
                                                <div className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full bg-blue-500/10 text-[9px] font-black uppercase tracking-[0.05em] text-blue-400">
                                                    <MapPin size={9} className="fill-blue-500/20" strokeWidth={2.5} />
                                                    {location.district || location.taluka}{' '}
                                                    {location.stateCode
                                                        ? `(${location.stateCode})`
                                                        : location.state
                                                          ? `(${location.state})`
                                                          : ''}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleLogin}
                                        className="w-full flex items-center gap-3 py-3 px-4 rounded-xl bg-[#FFD700] text-black active:scale-95 transition-transform"
                                    >
                                        <LogIn size={18} strokeWidth={2.5} />
                                        <span className="text-xs font-black uppercase tracking-widest">Sign In</span>
                                    </button>
                                )}
                            </div>

                            {/* Menu Items */}
                            <div className="flex-1 overflow-y-auto py-3 px-2">
                                <p className="px-3 pb-2 text-[8px] font-black uppercase tracking-[0.2em] text-slate-600">
                                    Navigate
                                </p>
                                {MENU_ITEMS.map(item => {
                                    const active = isTabActive(item.href);
                                    return (
                                        <Link
                                            key={item.label}
                                            href={item.href}
                                            onClick={() => setSidebarOpen(false)}
                                            className={`flex items-center gap-3 px-3 py-3 rounded-xl mb-0.5 transition-all ${
                                                active
                                                    ? 'bg-[#FFD700]/10 text-[#FFD700]'
                                                    : 'text-slate-400 active:bg-white/5'
                                            }`}
                                        >
                                            <item.icon size={18} strokeWidth={active ? 2.5 : 1.5} />
                                            <div className="flex-1 flex items-center justify-between">
                                                <span className="text-[11px] font-bold uppercase tracking-widest">
                                                    {item.label}
                                                </span>
                                                {item.label === "O' Circle" && bCoins !== null && (
                                                    <div className="flex items-center gap-1 bg-[#F4B000]/10 px-1.5 py-[2px] rounded-md border border-[#F4B000]/20 mr-2">
                                                        <Logo variant="icon" size={8} />
                                                        <span className="text-[9px] font-black text-[#F4B000] italic leading-none pt-[1px]">
                                                            {bCoins.toLocaleString('en-IN')}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            {active && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#FFD700] shrink-0" />
                                            )}
                                        </Link>
                                    );
                                })}

                                {/* Account items — only when logged in */}
                                {user && (
                                    <>
                                        <div className="my-3 border-t border-white/5" />
                                        <p className="px-3 pb-2 text-[8px] font-black uppercase tracking-[0.2em] text-slate-600">
                                            Account
                                        </p>
                                        {ACCOUNT_ITEMS.map(item => {
                                            const active = isTabActive(item.href);
                                            return (
                                                <Link
                                                    key={item.label}
                                                    href={item.href}
                                                    onClick={() => setSidebarOpen(false)}
                                                    className={`flex items-center gap-3 px-3 py-3 rounded-xl mb-0.5 transition-all ${
                                                        active
                                                            ? 'bg-[#FFD700]/10 text-[#FFD700]'
                                                            : 'text-slate-400 active:bg-white/5'
                                                    }`}
                                                >
                                                    <item.icon size={18} strokeWidth={active ? 2.5 : 1.5} />
                                                    <span className="text-[11px] font-bold uppercase tracking-widest flex-1">
                                                        {item.label}
                                                    </span>
                                                    <ChevronRight size={14} className="opacity-30" />
                                                </Link>
                                            );
                                        })}
                                    </>
                                )}
                            </div>

                            {/* Bottom: Logout */}
                            {user && (
                                <div className="px-3 py-3 border-t border-white/8">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-500/10 text-rose-400 active:bg-rose-500/20 transition-all"
                                    >
                                        <LogOut size={16} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">
                                            Sign Out
                                        </span>
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
