'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import {
    Building2,
    Store,
    Landmark,
    User as UserIcon,
    Package,
    Heart,
    Bell,
    Settings,
    HelpCircle,
    LogOut,
    ChevronDown,
} from 'lucide-react';

interface Membership {
    role: string;
    tenants: {
        slug: string;
        name: string;
        type: string;
    };
}

interface ProfileDropdownProps {
    onLoginClick: () => void;
    scrolled: boolean;
    theme: string;
}

export function ProfileDropdown({ onLoginClick, scrolled, theme }: ProfileDropdownProps) {
    const [user, setUser] = useState<User | null>(null);
    const [memberships, setMemberships] = useState<Membership[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const supabase = createClient();

        const loadMemberships = async (userId: string) => {
            const { data } = await supabase
                .from('memberships')
                .select('role, tenants!inner(slug, name, type)')
                .eq('user_id', userId)
                .eq('status', 'ACTIVE');

            if (data) {
                setMemberships(
                    data.map(m => ({
                        role: m.role,
                        tenants: Array.isArray(m.tenants) ? m.tenants[0] : m.tenants,
                    }))
                );
            }
        };

        const fetchData = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (user) {
                setUser(user);
                await loadMemberships(user.id);
            } else {
                setUser(null);
                setMemberships([]);
            }
        };

        fetchData();

        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setUser(session.user);
                loadMemberships(session.user.id);
            } else {
                setUser(null);
                setMemberships([]);
            }
        });

        return () => {
            data.subscription.unsubscribe();
        };
    }, []);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();

        // Only clear auth-related keys
        localStorage.removeItem('user_name');
        localStorage.removeItem('user_role');
        localStorage.removeItem('active_role');
        localStorage.removeItem('tenant_type');

        window.location.href = '/';
    };

    const getTenantIcon = (type: string) => {
        switch (type) {
            case 'SUPER_ADMIN':
                return <Building2 className="w-4 h-4" />;
            case 'DEALER':
                return <Store className="w-4 h-4" />;
            case 'BANK':
                return <Landmark className="w-4 h-4" />;
            default:
                return <Building2 className="w-4 h-4" />;
        }
    };

    const getRoleLabel = (role: string) => {
        const labels: Record<string, string> = {
            OWNER: 'Owner',
            ADMIN: 'Admin',
            STAFF: 'Staff',
            DEALERSHIP_ADMIN: 'Admin',
        };
        return labels[role] || role;
    };

    const isLight = mounted ? theme === 'light' : true;

    if (!user) {
        return (
            <button
                onClick={onLoginClick}
                className={`flex items-center gap-2 md:gap-3 p-2 md:pl-3 md:pr-4 md:py-1.5 rounded-full border transition-all group ${scrolled || isLight
                    ? 'border-blue-600/20 dark:border-blue-600/40 bg-slate-100 dark:bg-black/40'
                    : 'border-blue-600/60 bg-black/40'
                    }`}
            >
                <div className="w-5 h-5 bg-brand-primary rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                    <UserIcon size={12} className="text-black" />
                </div>
                <span
                    suppressHydrationWarning
                    className={`text-[11px] font-black uppercase tracking-[0.18em] ${(mounted && theme === 'dark') ? 'text-white' : (scrolled || theme === 'light' ? 'text-slate-900 dark:text-white' : 'text-white')
                        }`}
                >
                    Sign In
                </span>
            </button>
        );
    }

    const displayName =
        user.user_metadata?.full_name?.split(' ')[0] || user.user_metadata?.name?.split(' ')[0] || user.email?.split('@')[0] || 'User';

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 md:gap-3 p-2 md:pl-3 md:pr-2 md:py-1.5 rounded-full border transition-all group ${scrolled || isLight
                    ? 'border-blue-600/20 dark:border-blue-600/40 bg-slate-100 dark:bg-black/40'
                    : 'border-blue-600/60 bg-black/40'
                    }`}
            >
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black shadow-lg shadow-brand-primary/20 bg-gradient-to-br from-brand-primary to-[#F4B000] border-2 border-white dark:border-slate-800 overflow-hidden shrink-0">
                    {user.user_metadata?.avatar_url ? (
                        <img src={user.user_metadata.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                        <span>{(user.user_metadata?.full_name?.[0] || user.user_metadata?.name?.[0] || user.email?.[0] || 'U').toUpperCase()}</span>
                    )}
                </div>
                <span
                    suppressHydrationWarning
                    className={`text-[11px] font-black uppercase tracking-[0.18em] ${(mounted && theme === 'dark') ? 'text-white' : (scrolled || theme === 'light' ? 'text-slate-900 dark:text-white' : 'text-white')
                        }`}
                >
                    Hi, {displayName}
                </span>
                <div
                    className={`transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-500' : 'text-slate-500'}`}
                >
                    <ChevronDown size={14} />
                </div>
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 z-50 overflow-hidden">
                        {/* User Info */}
                        <div className="p-6 bg-slate-50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-primary to-[#F4B000] flex items-center justify-center text-white text-xl font-black shadow-inner overflow-hidden uppercase">
                                {user.user_metadata?.avatar_url ? (
                                    <img src={user.user_metadata.avatar_url} alt={user.user_metadata?.full_name} className="w-full h-full object-cover" />
                                ) : (
                                    <span>{(user.user_metadata?.full_name?.[0] || user.user_metadata?.name?.[0] || user.email?.[0] || 'U').toUpperCase()}</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-black text-slate-900 dark:text-white truncate uppercase tracking-tight">
                                    {user.user_metadata?.full_name || 'BookMyBike User'}
                                </p>
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 truncate uppercase tracking-widest leading-none mt-1">
                                    {user.email}
                                </p>
                            </div>
                        </div>

                        {/* Member Access */}
                        {memberships.length > 0 && (
                            <div className="p-2">
                                <div className="px-4 py-3 flex items-center justify-between">
                                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                                        Member Access
                                    </p>
                                    <div className="h-px flex-1 ml-4 bg-slate-100 dark:bg-white/5" />
                                </div>
                                <div className="space-y-1">
                                    {memberships.map(m => (
                                        <a
                                            key={m.tenants.slug}
                                            href={`/app/${m.tenants.slug}/dashboard`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group flex items-center justify-between px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-all border border-transparent hover:border-slate-100 dark:hover:border-white/5"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 group-hover:text-brand-primary transition-colors">
                                                    {getTenantIcon(m.tenants.type)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{m.tenants.name}</span>
                                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{m.tenants.type.replace('_', ' ')}</span>
                                                </div>
                                            </div>
                                            <span className="text-[8px] font-black px-2 py-1 bg-brand-primary/10 text-brand-primary border border-brand-primary/20 rounded-full uppercase tracking-widest">
                                                {getRoleLabel(m.role)}
                                            </span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* My Account */}
                        <div className="p-2 border-t border-slate-100 dark:border-white/5">
                            <div className="px-4 py-3 flex items-center justify-between">
                                <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">My Account</p>
                                <div className="h-px flex-1 ml-4 bg-slate-100 dark:bg-white/10" />
                            </div>
                            <div className="grid grid-cols-2 gap-1 px-2">
                                {[
                                    { label: 'Profile', icon: UserIcon, href: '/profile' },
                                    { label: 'Orders', icon: Package, href: '/orders' },
                                    { label: 'Wishlist', icon: Heart, href: '/wishlist' },
                                    { label: 'Alerts', icon: Bell, href: '/notifications' },
                                ].map((item) => (
                                    <a
                                        key={item.label}
                                        href={item.href}
                                        className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-all group border border-transparent hover:border-slate-100 dark:hover:border-white/5 text-center"
                                    >
                                        <item.icon className="w-4 h-4 text-slate-400 group-hover:text-brand-primary transition-colors" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">{item.label}</span>
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Help & Logout */}
                        <div className="p-4 bg-slate-50 dark:bg-white/[0.01] border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2">
                            <a
                                href="/help"
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all bg-white dark:bg-slate-800/50"
                            >
                                <HelpCircle className="w-3.5 h-3.5" />
                                Help
                            </a>
                            <button
                                onClick={handleLogout}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border border-rose-500/20"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                                Logout
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
