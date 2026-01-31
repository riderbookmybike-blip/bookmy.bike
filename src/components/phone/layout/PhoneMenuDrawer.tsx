'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Home,
    Search,
    FileText,
    Heart,
    Award,
    Settings,
    HelpCircle,
    Info,
    LogOut,
    User,
    ChevronRight,
} from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';

interface PhoneMenuDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

const MENU_ITEMS = [
    { icon: Home, label: 'Home', href: '/m2', color: 'text-[#F4B000]' },
    { icon: Search, label: 'Search', href: '/m2/search', color: 'text-[#F4B000]' },
    { icon: FileText, label: 'My Quotes', href: '/m2/quotes', color: 'text-blue-400' },
    { icon: Heart, label: 'Saved Bikes', href: '/m2/saved', color: 'text-red-400' },
    { icon: Award, label: 'O-Club', href: '/m2/oclub', color: 'text-yellow-400' },
    { icon: Settings, label: 'Settings', href: '/m2/settings', color: 'text-zinc-400' },
    { icon: HelpCircle, label: 'Help & Support', href: '/m2/help', color: 'text-zinc-400' },
    { icon: Info, label: 'About', href: '/m2/about', color: 'text-zinc-400' },
];

export const PhoneMenuDrawer = ({ isOpen, onClose }: PhoneMenuDrawerProps) => {
    const router = useRouter();
    const { theme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const isDark = mounted && (theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches));

    const handleNavigate = (href: string) => {
        router.push(href);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[300] bg-black/40 dark:bg-black/90 backdrop-blur-md transition-colors duration-500"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="absolute right-0 top-0 bottom-0 w-[85vw] max-w-sm bg-white dark:bg-zinc-950 border-l border-slate-200 dark:border-zinc-800 flex flex-col transition-colors duration-500"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header with Close Button */}
                        <div className="p-5 border-b border-slate-100 dark:border-zinc-800">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white">
                                    Menu
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="w-10 h-10 bg-slate-100 dark:bg-zinc-900 rounded-full flex items-center justify-center active:scale-95 transition-transform"
                                >
                                    <X size={20} className="text-slate-500 dark:text-zinc-400" />
                                </button>
                            </div>

                            {/* User Profile Preview */}
                            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-zinc-900 rounded-2xl">
                                <div className="w-12 h-12 bg-[#F4B000] rounded-full flex items-center justify-center">
                                    <User size={24} className="text-black" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-black text-slate-900 dark:text-white mb-1">Guest User</p>
                                    <button className="text-xs font-bold text-[#F4B000] hover:text-yellow-400 transition-colors">
                                        Sign In
                                    </button>
                                </div>
                                <ChevronRight size={20} className="text-zinc-600" />
                            </div>
                        </div>

                        {/* Navigation Links */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-2">
                            {MENU_ITEMS.map((item, idx) => (
                                <motion.button
                                    key={item.label}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={() => handleNavigate(item.href)}
                                    className="w-full flex items-center gap-4 p-4 bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-all active:scale-95 group"
                                >
                                    <div className="w-10 h-10 bg-white dark:bg-zinc-800 group-hover:bg-slate-200 dark:group-hover:bg-zinc-700 rounded-full flex items-center justify-center transition-colors shadow-sm dark:shadow-none">
                                        <item.icon size={20} className={item.color} />
                                    </div>
                                    <span className="flex-1 text-left text-sm font-bold text-slate-900 dark:text-white">{item.label}</span>
                                    <ChevronRight
                                        size={18}
                                        className="text-zinc-600 group-hover:text-zinc-400 transition-colors"
                                    />
                                </motion.button>
                            ))}
                        </div>

                        {/* Footer with App Version & Logout */}
                        <div className="p-5 border-t border-slate-100 dark:border-zinc-800 space-y-3">
                            <button
                                onClick={() => {
                                    // Logout logic here
                                    console.log('Logout clicked');
                                    onClose();
                                }}
                                className="w-full flex items-center justify-center gap-3 h-14 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 font-black uppercase tracking-wider text-sm active:scale-95 transition-transform hover:bg-red-500/20"
                            >
                                <LogOut size={20} />
                                Logout
                            </button>
                            <p className="text-center text-xs text-zinc-600 font-medium">BookMyBike v1.0.0</p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
