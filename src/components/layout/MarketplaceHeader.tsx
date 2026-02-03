import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Menu, X, Heart, Home as HomeIcon, ArrowRight, Languages } from 'lucide-react';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import { Logo } from '@/components/brand/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useI18n } from '@/components/providers/I18nProvider';
import { createClient } from '@/lib/supabase/client';
import { usePathname } from 'next/navigation';

import { AppHeaderShell } from './AppHeaderShell';
import { ProfileDropdown } from './ProfileDropdown';
import { useFavorites } from '@/lib/favorites/favoritesContext';

interface MarketplaceHeaderProps {
    onLoginClick: () => void;
}

export const MarketplaceHeader = ({ onLoginClick }: MarketplaceHeaderProps) => {
    const { favorites, removeFavorite } = useFavorites();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [userName, setUserName] = useState<string | null>(null);
    const [scrolled, setScrolled] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [showWishlistPreview, setShowWishlistPreview] = useState(false);
    const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
    const languageMenuRef = useRef<HTMLDivElement | null>(null);
    const [viewport, setViewport] = useState<{ width: number; height: number } | null>(null);
    const { theme } = useTheme();
    const { language, setLanguage, languages, t } = useI18n();
    const pathname = usePathname();

    useEffect(() => {
        setTimeout(() => setMounted(true), 0);

        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            setScrolled(currentScrollY > 100);
            setIsVisible(true);
        };

        const handleShowHeader = () => setIsVisible(true);
        const handleResize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });

        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('showHeader', handleShowHeader);
        window.addEventListener('resize', handleResize);
        handleResize();

        const supabase = createClient();
        const syncAuth = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            const fallbackName = typeof window !== 'undefined' ? localStorage.getItem('user_name') : null;
            const name =
                user?.user_metadata?.full_name ||
                user?.user_metadata?.name ||
                user?.email?.split('@')[0] ||
                fallbackName;
            setUserName(name);
        };

        syncAuth();

        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            const name =
                session?.user?.user_metadata?.full_name ||
                session?.user?.user_metadata?.name ||
                session?.user?.email?.split('@')[0];
            if (name) setUserName(name);
        });

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('showHeader', handleShowHeader);
            window.removeEventListener('resize', handleResize);
            authListener.subscription.unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (!isLanguageMenuOpen) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (!languageMenuRef.current?.contains(event.target as Node)) {
                setIsLanguageMenuOpen(false);
            }
        };
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setIsLanguageMenuOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isLanguageMenuOpen]);

    const isHome = pathname === '/' || pathname === '/store';

    // For the home page (StoreTV), we follow the global theme
    // We only use fallback if not mounted
    const isLight = mounted ? theme === 'light' : true;
    const isTv = Boolean(
        viewport &&
        (viewport.width >= 2000 ||
            (viewport.width === 960 && viewport.height === 540) ||
            (viewport.width === 1280 && viewport.height === 720) ||
            (viewport.width >= 1110 && viewport.width <= 1200 && viewport.height >= 600 && viewport.height <= 700))
    );
    const showTextNav = false;

    // Quick rollback: set navPreset to 'wide'.
    const navPreset: 'tight' | 'wide' = 'tight';
    const navTextClass =
        navPreset === 'tight'
            ? 'text-[12px] font-black uppercase tracking-[0.18em]'
            : 'text-[11px] font-black uppercase tracking-[0.3em]';
    const navGapClass = navPreset === 'tight' ? 'gap-8 mr-4' : 'gap-14 mr-6';
    const rightGapClass = navPreset === 'tight' ? 'gap-3 lg:gap-6' : 'gap-4 lg:gap-10';

    const isHeaderTransparent = isHome && !scrolled;

    const navLinkClass = !isHeaderTransparent
        ? `${navTextClass} text-white/70 hover:text-white transition-all duration-300`
        : `${isLight ? 'text-slate-900/90 hover:text-blue-600' : 'text-white/90 hover:text-blue-400'} ${navTextClass} transition-all duration-300 drop-shadow-md`;
    const activeNavClass =
        'relative text-slate-900 dark:text-white after:absolute after:-bottom-2 after:left-0 after:right-0 after:h-[2px] after:bg-brand-primary after:rounded-full';
    const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

    const mobileMenuButtonClass = !isHeaderTransparent
        ? 'text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5'
        : isLight
            ? 'text-slate-900 hover:bg-slate-900/5'
            : 'text-white hover:bg-white/10';

    const handleSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();

        // Match the cleanup logic in ProfileDropdown
        localStorage.removeItem('user_name');
        localStorage.removeItem('user_role');
        localStorage.removeItem('active_role');
        localStorage.removeItem('base_role');
        localStorage.removeItem('tenant_type');

        setUserName(null);
        window.location.reload();
    };

    return (
        <AppHeaderShell
            scrolled={scrolled}
            visible={isVisible}
            transparentAtTop={isHome}
            variant="marketplace"
            className={!isHeaderTransparent ? 'header-glass' : ''}
            left={
                <Link href="/" className="flex items-center group h-full">
                    <div className="flex items-center justify-center transition-all duration-300">
                        <Logo mode="dark" size={40} variant="full" />
                    </div>
                </Link>
            }
            center={null}
            right={
                <div className={`flex items-center ${rightGapClass}`}>
                    {/* Desktop Navigation - Always visible for better UX, except on TV/Catalog/PDP Mode where we want focus */}
                    {showTextNav && (
                        <div className={`hidden lg:flex items-center ${navGapClass}`}>
                            <Link href="/" className={`${navLinkClass} ${isActive('/') ? activeNavClass : ''}`}>
                                Home
                            </Link>
                            <Link
                                href="/store/catalog"
                                className={`${navLinkClass} ${isActive('/store/catalog') ? activeNavClass : ''}`}
                            >
                                Catalog
                            </Link>
                            {/* New Brands Link scrolling to footer or brands page */}
                            <Link
                                href="#brands"
                                onClick={e => {
                                    e.preventDefault();
                                    const footer = document.getElementById('footer-brands');
                                    if (footer) footer.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className={`${navLinkClass}`}
                            >
                                Brands
                            </Link>
                            <Link
                                href="/store/compare"
                                className={`${navLinkClass} ${isActive('/store/compare') ? activeNavClass : ''}`}
                            >
                                Compare
                            </Link>
                        </div>
                    )}

                    {/* Unified Action Group: Favorites, Home, Catalog, User */}
                    <div className="hidden md:flex items-center gap-3">
                        <Link
                            href="/"
                            className="w-10 h-10 rounded-full border transition-all duration-300 group flex items-center justify-center border-white/20 text-white hover:bg-white hover:text-black hover:border-white hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                        >
                            <HomeIcon size={18} />
                        </Link>
                        <Link
                            href="/store/catalog"
                            className="w-10 h-10 rounded-full border transition-all duration-300 group flex items-center justify-center border-white/20 text-white hover:bg-white hover:text-black hover:border-white hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                        >
                            <MotorcycleIcon size={20} />
                        </Link>
                        <div
                            className="relative"
                            onMouseEnter={() => setShowWishlistPreview(true)}
                            onMouseLeave={() => setShowWishlistPreview(false)}
                        >
                            <Link
                                href="/wishlist"
                                className="w-10 h-10 rounded-full border transition-all duration-300 group relative flex items-center justify-center border-white/20 text-white hover:bg-white hover:text-black hover:border-white hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                            >
                                <Heart size={18} />
                                {favorites.length > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 animate-in zoom-in duration-300">
                                        {favorites.length}
                                    </span>
                                )}
                            </Link>

                            <AnimatePresence>
                                {showWishlistPreview && favorites.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute top-full right-0 mt-4 w-72 bg-white dark:bg-[#0f1115] rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-slate-200 dark:border-white/10 p-4 z-50 py-6"
                                    >
                                        <div className="px-4 mb-4 flex justify-between items-center">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                My Wishlist
                                            </span>
                                            <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded-full">
                                                {favorites.length} Items
                                            </span>
                                        </div>
                                        <div className="space-y-2 max-h-80 overflow-y-auto px-1 custom-scrollbar">
                                            {favorites.slice(0, 3).map((v, idx) => {
                                                const uniqueKey = `${v.id}-${idx}`;
                                                return (
                                                    <div key={uniqueKey} className="group/wrapper relative">
                                                        <Link
                                                            href={`/store/product/${v.slug}`}
                                                            className="flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition-all group/item pr-10"
                                                        >
                                                            <div className="w-16 h-12 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center justify-center p-2 overflow-hidden flex-shrink-0">
                                                                <img
                                                                    src={v.imageUrl}
                                                                    alt={v.model}
                                                                    className="w-full h-full object-contain group-hover/item:scale-110 transition-transform"
                                                                />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-[10px] font-black uppercase tracking-tight text-slate-900 dark:text-white truncate">
                                                                    {v.model}
                                                                </p>
                                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">
                                                                    {v.variant}
                                                                </p>
                                                            </div>
                                                        </Link>
                                                        <button
                                                            onClick={e => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                removeFavorite(v.id);
                                                            }}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white flex items-center justify-center transition-all opacity-0 group-hover/wrapper:opacity-100 scale-90 hover:scale-100"
                                                            title="Remove from favorites"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 px-2">
                                            <Link
                                                href="/wishlist"
                                                className="w-full h-12 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center hover:bg-black dark:hover:bg-white/90 transition-all hover:gap-2 group"
                                            >
                                                View All Items
                                                <ArrowRight
                                                    size={14}
                                                    className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all"
                                                />
                                            </Link>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <div className="relative" ref={languageMenuRef}>
                            <button
                                onClick={() => setIsLanguageMenuOpen(prev => !prev)}
                                aria-label={t('Language')}
                                aria-haspopup="listbox"
                                aria-expanded={isLanguageMenuOpen}
                                className="w-10 h-10 rounded-full border transition-all duration-300 group flex items-center justify-center border-white/20 text-white hover:bg-white hover:text-black hover:border-white hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                                title={t('Language')}
                            >
                                <Languages size={18} />
                            </button>
                            <AnimatePresence>
                                {isLanguageMenuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                                        className="absolute right-0 mt-4 w-56 rounded-2xl bg-white dark:bg-[#0f1115] border border-slate-200 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] p-2 z-50"
                                    >
                                        <div className="px-2 pt-2 pb-3 border-b border-slate-100 dark:border-white/10">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                {t('Language')}
                                            </p>
                                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1">
                                                {language.toUpperCase()}
                                            </p>
                                        </div>
                                        <div className="py-2 space-y-1">
                                            {languages.map(lang => {
                                                const isActiveLang = language === lang.code;
                                                const isDisabled = lang.status !== 'ACTIVE';
                                                return (
                                                    <button
                                                        key={lang.code}
                                                        type="button"
                                                        disabled={isDisabled}
                                                        onClick={() => {
                                                            if (isDisabled) return;
                                                            setLanguage(lang.code);
                                                            setIsLanguageMenuOpen(false);
                                                        }}
                                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all ${isActiveLang
                                                            ? 'bg-brand-primary/15 text-slate-900 dark:text-white'
                                                            : 'text-slate-700 dark:text-slate-200'
                                                            } ${isDisabled
                                                                ? 'opacity-40 cursor-not-allowed'
                                                                : 'hover:bg-slate-100 dark:hover:bg-white/5'
                                                            }`}
                                                    >
                                                        <span className="text-sm font-bold">{lang.nativeName}</span>
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                            {lang.code.toUpperCase()}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <ThemeToggle className="w-10 h-10 rounded-full border border-white/20 text-white hover:bg-white hover:text-black hover:border-white hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all duration-300" />
                        <ProfileDropdown onLoginClick={onLoginClick} scrolled={!isHeaderTransparent} theme={theme} tone="dark" />
                    </div>

                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className={`w-10 h-10 rounded-xl transition-all lg:hidden flex items-center justify-center ${mobileMenuButtonClass}`}
                    >
                        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div >
            }
        >
            {/* Mobile Menu Overlay */}
            {
                isMobileMenuOpen && (
                    <div className="md:hidden bg-white dark:bg-[#0f1115] border-t border-slate-200 dark:border-white/5 p-6 space-y-8 animate-in slide-in-from-top-4 duration-300 shadow-2xl h-screen fixed inset-0 top-[var(--header-h)] z-40 overflow-y-auto">
                        <nav className="flex flex-col gap-6">
                            <Link
                                href="/"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="text-xl font-black uppercase tracking-tighter text-slate-900 dark:text-white"
                            >
                                Home
                            </Link>
                            <div className="flex flex-col gap-4">
                                <Link
                                    href="/store/catalog"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="text-xl font-black uppercase tracking-tighter text-slate-500 dark:text-slate-400"
                                >
                                    Catalog
                                </Link>
                                <Link
                                    href="/wishlist"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="text-xl font-black uppercase tracking-tighter text-rose-500 flex items-center justify-between"
                                >
                                    <span>Wishlist</span>
                                    {favorites.length > 0 && (
                                        <span className="bg-rose-500 text-white px-3 py-1 rounded-full text-[10px] font-bold">
                                            {favorites.length}
                                        </span>
                                    )}
                                </Link>
                            </div>
                            <Link
                                href="/store/compare"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="text-xl font-black uppercase tracking-tighter text-slate-500 dark:text-slate-400"
                            >
                                Compare
                            </Link>
                            <Link
                                href="/zero"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="text-xl font-black uppercase tracking-tighter text-slate-500 dark:text-slate-400"
                            >
                                Zero
                            </Link>
                            <Link
                                href="#o-circle"
                                onClick={e => {
                                    e.preventDefault();
                                    setIsMobileMenuOpen(false);
                                    document.getElementById('o-circle')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="text-xl font-black uppercase tracking-tighter text-[#F4B000]"
                            >
                                O' Circle
                            </Link>

                            {/* User Info in Mobile Menu */}
                            <div className="pt-6 mt-6 border-t border-slate-200 dark:border-white/10">
                                {userName ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-brand-primary flex items-center justify-center text-black font-bold">
                                                    {(userName?.[0] || 'U').toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-white">{userName}</p>
                                                    <p className="text-xs text-slate-500">Member</p>
                                                </div>
                                            </div>
                                            {/* Mobile Menu Theme Toggle */}
                                            <ThemeToggle className="w-10 h-10" />
                                        </div>
                                        <button
                                            onClick={handleSignOut}
                                            className="w-full py-3 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 rounded-xl text-sm font-bold uppercase tracking-wide"
                                        >
                                            Sign Out
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-slate-500">Appearance</span>
                                            <ThemeToggle className="w-10 h-10" />
                                        </div>
                                        <button
                                            onClick={() => {
                                                setIsMobileMenuOpen(false);
                                                onLoginClick();
                                            }}
                                            className="w-full py-4 bg-brand-primary text-black rounded-xl text-sm font-black uppercase tracking-widest hover:bg-[#F4B000] transition-colors flex items-center justify-center"
                                        >
                                            Login / Sign Up
                                        </button>
                                    </div>
                                )}
                            </div>
                        </nav>
                    </div>
                )
            }
        </AppHeaderShell >
    );
};
