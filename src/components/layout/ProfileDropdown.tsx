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

    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient();
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (user) {
                setUser(user);

                // Fetch memberships
                const { data } = await supabase
                    .from('memberships')
                    .select('role, tenants!inner(slug, name, type)')
                    .eq('user_id', user.id)
                    .eq('status', 'ACTIVE');

                if (data) {
                    // Fix type casting: ensure tenants is treated as a single object
                    setMemberships(
                        data.map(m => ({
                            role: m.role,
                            tenants: Array.isArray(m.tenants) ? m.tenants[0] : m.tenants,
                        }))
                    );
                }
            }
        };

        fetchData();
    }, []);

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        localStorage.clear();
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

    if (!user) {
        return (
            <button
                onClick={onLoginClick}
                className={`flex items-center gap-2 md:gap-3 p-2 md:pl-3 md:pr-4 md:py-1.5 rounded-full border transition-all group ${
                    scrolled || theme === 'light'
                        ? 'border-blue-600/20 dark:border-blue-600/40 bg-slate-100 dark:bg-black/40'
                        : 'border-blue-600/60 bg-black/40'
                }`}
            >
                <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                    <UserIcon size={12} className="text-white" />
                </div>
                <span
                    className={`text-[10px] font-black uppercase tracking-widest ${
                        scrolled || theme === 'light' ? 'text-slate-900 dark:text-white' : 'text-white'
                    }`}
                >
                    Sign In
                </span>
            </button>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 md:gap-3 p-2 md:pl-3 md:pr-2 md:py-1.5 rounded-full border transition-all group ${
                    scrolled || theme === 'light'
                        ? 'border-blue-600/20 dark:border-blue-600/40 bg-slate-100 dark:bg-black/40'
                        : 'border-blue-600/60 bg-black/40'
                }`}
            >
                <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                    {user.email?.[0].toUpperCase()}
                </div>
                <span
                    className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                        scrolled || theme === 'light' ? 'text-slate-900 dark:text-white' : 'text-white'
                    }`}
                >
                    Hi, {user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0]}
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
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                        {/* User Info */}
                        <div className="p-4 border-b border-gray-200">
                            <p className="font-semibold text-gray-900">{user.user_metadata?.full_name || 'User'}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                        </div>

                        {/* Member Access */}
                        {memberships.length > 0 && (
                            <>
                                <div className="px-4 py-2 bg-gray-50">
                                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Member Access
                                    </p>
                                </div>
                                <div className="py-2">
                                    {memberships.map(m => (
                                        <a
                                            key={m.tenants.slug}
                                            href={`/app/${m.tenants.slug}/dashboard`}
                                            className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                {getTenantIcon(m.tenants.type)}
                                                <span className="text-gray-900">{m.tenants.name}</span>
                                            </div>
                                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                                {getRoleLabel(m.role)}
                                            </span>
                                        </a>
                                    ))}
                                </div>
                                <div className="border-t border-gray-200" />
                            </>
                        )}

                        {/* My Account */}
                        <div className="px-4 py-2 bg-gray-50">
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">My Account</p>
                        </div>
                        <div className="py-2">
                            <a
                                href="/profile"
                                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                            >
                                <UserIcon className="w-4 h-4 text-gray-600" />
                                <span className="text-gray-900">My Profile</span>
                            </a>
                            <a
                                href="/orders"
                                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                            >
                                <Package className="w-4 h-4 text-gray-600" />
                                <span className="text-gray-900">My Orders</span>
                            </a>
                            <a
                                href="/wishlist"
                                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                            >
                                <Heart className="w-4 h-4 text-gray-600" />
                                <span className="text-gray-900">My Wishlist</span>
                            </a>
                            <a
                                href="/notifications"
                                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                            >
                                <Bell className="w-4 h-4 text-gray-600" />
                                <span className="text-gray-900">Notifications</span>
                            </a>
                            <a
                                href="/settings"
                                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                            >
                                <Settings className="w-4 h-4 text-gray-600" />
                                <span className="text-gray-900">Settings</span>
                            </a>
                        </div>

                        <div className="border-t border-gray-200" />

                        {/* Help & Logout */}
                        <div className="py-2">
                            <a
                                href="/help"
                                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                            >
                                <HelpCircle className="w-4 h-4 text-gray-600" />
                                <span className="text-gray-900">Help & Support</span>
                            </a>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                            >
                                <LogOut className="w-4 h-4 text-red-600" />
                                <span className="text-red-600">Logout</span>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
