'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import {
    Building2,
    Store,
    Landmark,
    Linkedin,
    ChevronRight,
    Camera,
    Zap,
    Power,
    Home as HomeIcon,
    Bike,
    Heart as HeartIcon,
    ArrowRightLeft,
    Box,
    Globe,
    LayoutDashboard,
    User as LucideUser,
    Package,
    Heart,
    Bell,
    Settings,
    HelpCircle,
    LogOut,
    ChevronDown,
    MapPin,
    X,
    MessageSquare,
    Facebook,
    Twitter,
    Instagram,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useFavorites } from '@/lib/favorites/favoritesContext';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Logo } from '@/components/brand/Logo';
import { useDealerSession } from '@/hooks/useDealerSession';
import { useTenant } from '@/lib/tenant/tenantContext';
import { getDefaultAvatar, AVATAR_PRESETS } from '@/lib/avatars';
import { useAuth } from '@/components/providers/AuthProvider';

interface ProfileMembership {
    role: string | null;
    tenant_id: string | null;
    tenants: {
        id: string | null;
        slug: string | null;
        name: string | null;
        type: string | null;
        studio_id?: string | null;
        district_name?: string | null;
    } | null;
}

interface ProfileDropdownProps {
    onLoginClick: () => void;
    scrolled: boolean;
    theme: string;
    tone?: 'light' | 'dark';
    externalOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function ProfileDropdown({
    onLoginClick,
    scrolled,
    theme,
    tone,
    externalOpen,
    onOpenChange,
}: ProfileDropdownProps) {
    const { isUnifiedContext } = useTenant();
    const { user: authUser } = useAuth();
    const [user, setUser] = useState<User | null>(null);
    const [memberships, setProfileMemberships] = useState<ProfileMembership[]>([]);
    const [internalOpen, setInternalOpen] = useState(false);

    const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
    const setIsOpen = (open: boolean) => {
        if (onOpenChange) onOpenChange(open);
        setInternalOpen(open);
    };
    const [mounted, setMounted] = useState(false);
    const [location, setLocation] = useState<{
        area: string;
        taluka: string;
        district?: string;
        state?: string;
        stateCode?: string;
    } | null>(null);
    const [uploading, setUploading] = useState(false);
    const [showAvatarPicker, setShowAvatarPicker] = useState(false);

    // Dealer Session Hook
    const { activeTenantId } = useDealerSession();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLButtonElement>(null); // Fixed: Ref is attached to a button

    // Close on click outside is now handled by the Backdrop overlay in the logic below

    useEffect(() => {
        setUser(authUser);
    }, [authUser]);

    useEffect(() => {
        const loadProfileMemberships = async (userId: string) => {
            const supabase = createClient();
            const { data: rawProfileMemberships, error } = await supabase.rpc('get_user_memberships', {
                p_user_id: userId,
            });

            if (error && (error.message || error.code)) {
                const message = (error.message || error.code || '').toString();
                if (message.includes('AbortError')) {
                    return;
                }
                console.error('Error loading memberships:', message);
                return;
            }

            const mapped = (Array.isArray(rawProfileMemberships) ? rawProfileMemberships : []).map((m: any) => ({
                role: m.role,
                tenant_id: m.tenant_id,
                tenants: {
                    id: m.tenant_id,
                    slug: m.tenant_slug || '',
                    name: m.tenant_name || '',
                    type: m.tenant_type || '',
                    studio_id: m.studio_id || null,
                    district_name: m.district_name || undefined,
                },
            })) as unknown as ProfileMembership[];

            if (mapped.length === 0) {
                const { data: fallbackProfileMemberships } = await supabase
                    .from('id_team')
                    .select('id, user_id, tenant_id, role, status, id_tenants!inner(id, name, slug, type, studio_id)')
                    .eq('user_id', userId)
                    .eq('status', 'ACTIVE');

                const fallback = (fallbackProfileMemberships || []).map((m: any) => {
                    const t = Array.isArray(m.id_tenants) ? m.id_tenants[0] : m.id_tenants;
                    return {
                        role: m.role,
                        tenant_id: m.tenant_id,
                        tenants: {
                            id: t?.id,
                            slug: t?.slug || '',
                            name: t?.name || '',
                            type: t?.type || '',
                            studio_id: t?.studio_id || null,
                            district_name: undefined,
                        },
                    } as ProfileMembership;
                });
                setProfileMemberships(fallback);
                return;
            }

            setProfileMemberships(mapped);
        };

        if (authUser?.id) {
            loadProfileMemberships(authUser.id);
            return;
        }

        setProfileMemberships([]);
    }, [authUser?.id]);

    useEffect(() => {
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

    useEffect(() => {
        const mountedFrame = window.requestAnimationFrame(() => setMounted(true));
        return () => window.cancelAnimationFrame(mountedFrame);
    }, []);

    const { clearFavorites } = useFavorites();

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();

        clearFavorites();

        // Only clear auth-related keys
        localStorage.removeItem('user_name');
        localStorage.removeItem('user_role');
        localStorage.removeItem('active_role');
        localStorage.removeItem('base_role');
        localStorage.removeItem('tenant_type');

        window.location.href = '/';
    };

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            const file = event.target.files?.[0];
            if (!file || !user) return;

            const fileExt = file.name.split('.').pop();
            const filePath = `${user.id}/${Math.random()}.${fileExt}`;
            const supabase = createClient();

            const { error: uploadError } = await supabase.storage.from('users').upload(filePath, file);

            if (uploadError) throw uploadError;

            const {
                data: { publicUrl },
            } = supabase.storage.from('users').getPublicUrl(filePath);

            const { error: updateError } = await supabase.auth.updateUser({
                data: { avatar_url: publicUrl },
            });

            if (updateError) throw updateError;

            // Sync avatar to id_members (SOT for member data)
            await supabase.from('id_members').update({ avatar_url: publicUrl }).eq('id', user.id);

            setUser(prev =>
                prev ? { ...prev, user_metadata: { ...prev.user_metadata, avatar_url: publicUrl } } : null
            );
        } catch (error) {
            console.error('Error uploading avatar:', error);
            alert('Error uploading avatar!');
        } finally {
            setUploading(false);
        }
    };

    const handleAvatarSelect = async (presetUrl: string) => {
        try {
            setUploading(true);
            if (!user) return;
            const supabase = createClient();

            const { error: updateError } = await supabase.auth.updateUser({
                data: { avatar_url: presetUrl },
            });
            if (updateError) throw updateError;

            await supabase.from('id_members').update({ avatar_url: presetUrl }).eq('id', user.id);

            setUser(prev =>
                prev ? { ...prev, user_metadata: { ...prev.user_metadata, avatar_url: presetUrl } } : null
            );
            setShowAvatarPicker(false);
        } catch (error) {
            console.error('Error setting avatar:', error);
        } finally {
            setUploading(false);
        }
    };

    const getTenantIcon = (type: string) => {
        switch (type) {
            case 'SUPER_ADMIN':
                return <Building2 className="w-5 h-5" />;
            case 'DEALER':
                return <Store className="w-5 h-5" />;
            case 'BANK':
                return <Landmark className="w-5 h-5" />;
            default:
                return <Building2 className="w-5 h-5" />;
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

    const isLight = tone === 'light' || (tone !== 'dark' && (mounted ? theme === 'light' : true));
    const isDarkSurface = !isLight;
    const triggerClass = isDarkSurface
        ? 'border-white/20 text-white hover:bg-white hover:text-black hover:border-white hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]'
        : 'border-slate-200/80 text-slate-900 hover:bg-slate-100 hover:border-slate-200 dark:border-white/10 dark:text-white dark:hover:bg-white/10';

    const displayName = user
        ? user.user_metadata?.full_name?.split(' ')[0] ||
          user.user_metadata?.name?.split(' ')[0] ||
          user.email?.split('@')[0] ||
          'User'
        : 'Guest';

    /** Animation Variants borrowed from LoginSidebar */
    const overlayVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: { opacity: 0 },
    };

    const sidebarVariants: Variants = {
        hidden: { x: '100%', opacity: 0, scale: 0.95 },
        visible: {
            x: 0,
            opacity: 1,
            scale: 1,
            transition: {
                type: 'spring',
                damping: 25,
                stiffness: 300,
                mass: 0.8,
            },
        },
        exit: {
            x: '100%',
            opacity: 0,
            scale: 0.95,
            transition: { duration: 0.2, ease: 'easeIn' },
        },
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                delayChildren: 0.1,
                staggerChildren: 0.05,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, x: 20 },
        visible: { opacity: 1, x: 0 },
    };

    return (
        <>
            {user ? (
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    ref={dropdownRef}
                    className={`hidden lg:flex h-10 w-auto pl-1 pr-4 rounded-full border transition-all duration-300 relative flex-shrink-0 items-center gap-3 group z-[101] ${triggerClass}`}
                >
                    <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-slate-900 dark:text-white font-black text-xs transition-all">
                        <img
                            src={user.user_metadata?.avatar_url || getDefaultAvatar(user.id, displayName)}
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="flex items-center gap-1.5 leading-none">
                        <span className="text-[11px] font-black uppercase tracking-widest group-hover:opacity-100 transition-opacity">
                            HI,
                        </span>
                        <span className="text-[11px] font-black uppercase tracking-widest whitespace-nowrap max-w-[150px] truncate">
                            {displayName}
                        </span>
                    </div>
                </button>
            ) : (
                <button
                    onClick={onLoginClick}
                    className={`hidden lg:flex w-10 h-10 rounded-full border items-center justify-center transition-all duration-300 group ${triggerClass}`}
                    title="Sign In"
                >
                    <LucideUser size={20} />
                </button>
            )}

            {/* Full Screen Sidebar Portal */}
            {mounted &&
                createPortal(
                    <AnimatePresence>
                        {isOpen && (
                            <div className="fixed inset-0 z-[100] flex justify-end items-center overflow-hidden sm:p-4 font-sans">
                                {/* Backdrop */}
                                <motion.div
                                    variants={overlayVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    onClick={() => setIsOpen(false)}
                                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
                                />

                                {/* Sidebar */}
                                <motion.div
                                    variants={sidebarVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="relative w-full sm:w-[480px] h-full sm:h-[96vh] bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-3xl border border-slate-200 dark:border-white/20 shadow-2xl flex flex-col overflow-hidden sm:rounded-[2.5rem] ml-auto"
                                >
                                    {/* Decorative Glows */}
                                    <div className="absolute top-[-20%] right-[-20%] w-[500px] h-[500px] bg-[#F4B000]/10 rounded-full blur-[100px] pointer-events-none" />

                                    {/* Header - Reduced Padding */}
                                    <div className="flex-none px-6 py-5 flex items-center justify-between z-10 shrink-0">
                                        <div className="h-8 shrink-0">
                                            <Logo
                                                mode="auto"
                                                size={32}
                                                variant="full"
                                                customColors={{
                                                    bike: '#F4B000',
                                                }}
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setIsOpen(false)}
                                                className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors text-slate-500 dark:text-slate-400"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Main Content - Condensed Spacing */}
                                    <div className="flex-1 overflow-y-auto px-6 z-10 flex flex-col min-h-0 custom-scrollbar pb-2">
                                        <motion.div
                                            variants={containerVariants}
                                            initial="hidden"
                                            animate="visible"
                                            className="space-y-4"
                                        >
                                            {/* USER/GUEST CARD */}
                                            {user ? (
                                                <motion.div
                                                    variants={itemVariants}
                                                    className="bg-slate-50 dark:bg-white/[0.03] p-4 rounded-3xl border border-slate-100 dark:border-white/5 flex items-center gap-4 relative overflow-hidden group"
                                                >
                                                    <div className="absolute top-0 right-0 p-4 opacity-30">
                                                        <div className="w-24 h-24 bg-brand-primary/20 rounded-full blur-2xl absolute -top-5 -right-5 pointer-events-none" />
                                                    </div>

                                                    {/* Smaller Avatar */}
                                                    <div className="relative shrink-0 group/avatar">
                                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-primary to-[#F4B000] flex items-center justify-center text-black text-xl font-black shadow-lg shadow-brand-primary/20 overflow-hidden relative z-10 ring-2 ring-white dark:ring-[#0F172A]">
                                                            <img
                                                                src={
                                                                    user.user_metadata?.avatar_url ||
                                                                    getDefaultAvatar(
                                                                        user.id,
                                                                        user.user_metadata?.full_name ||
                                                                            user.user_metadata?.name ||
                                                                            user.email
                                                                    )
                                                                }
                                                                alt={user.user_metadata?.full_name || 'Profile'}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={() => fileInputRef.current?.click()}
                                                            className="absolute bottom-0 right-0 w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform z-20 border-2 border-white dark:border-[#0F172A]"
                                                            title="Change Photo"
                                                        >
                                                            {uploading ? (
                                                                <div className="w-2 h-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                            ) : (
                                                                <Camera size={10} />
                                                            )}
                                                        </button>
                                                        <input
                                                            type="file"
                                                            ref={fileInputRef}
                                                            className="hidden"
                                                            accept="image/*"
                                                            onChange={handleAvatarUpload}
                                                        />
                                                    </div>

                                                    <div className="relative z-10 min-w-0 flex-1">
                                                        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight truncate">
                                                            {user.user_metadata?.full_name || 'BookMyBike User'}
                                                        </h3>
                                                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 tracking-wide uppercase truncate">
                                                            {user.email}
                                                        </p>
                                                        {location && (
                                                            <div className="inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-full bg-blue-500/10 text-[9px] font-black uppercase tracking-[0.05em] text-blue-600 dark:text-blue-400">
                                                                <MapPin size={10} className="fill-blue-500/20" />
                                                                {location.district || location.taluka}{' '}
                                                                {location.stateCode
                                                                    ? `(${location.stateCode})`
                                                                    : location.state
                                                                      ? `(${location.state})`
                                                                      : ''}
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    variants={itemVariants}
                                                    className="bg-slate-900 dark:bg-black p-6 rounded-[2rem] border border-white/10 dark:border-white/5 flex flex-col items-center gap-4 text-center relative overflow-hidden group shadow-xl"
                                                >
                                                    <div className="absolute top-[-50px] left-[-50px] w-32 h-32 bg-brand-primary/20 rounded-full blur-[40px] pointer-events-none" />
                                                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-brand-primary">
                                                        <LucideUser size={32} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h3 className="text-lg font-black text-white uppercase tracking-tight">
                                                            Welcome to BookMyBike
                                                        </h3>
                                                        <p className="text-xs text-slate-400 font-medium px-4">
                                                            Sign in to manage your bookings, wishlist, and exclusive
                                                            offers.
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            setIsOpen(false);
                                                            onLoginClick();
                                                        }}
                                                        className="w-full mt-2 py-4 rounded-2xl bg-brand-primary text-black text-xs font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-brand-primary/20"
                                                    >
                                                        Sign In Now
                                                    </button>
                                                </motion.div>
                                            )}

                                            {/* Avatar Picker (Only for logged in users) */}
                                            {user && (
                                                <motion.div variants={itemVariants}>
                                                    <button
                                                        onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                                                        className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 hover:border-[#F4B000]/30 transition-all group"
                                                    >
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 group-hover:text-[#F4B000] transition-colors">
                                                            Change Avatar
                                                        </span>
                                                        <ChevronDown
                                                            size={12}
                                                            className={`text-slate-400 transition-transform duration-200 ${showAvatarPicker ? 'rotate-180' : ''}`}
                                                        />
                                                    </button>
                                                    <AnimatePresence>
                                                        {showAvatarPicker && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                transition={{ duration: 0.2 }}
                                                                className="overflow-hidden"
                                                            >
                                                                <div className="flex gap-2 pt-3 pb-1 overflow-x-auto custom-scrollbar">
                                                                    {AVATAR_PRESETS.map(preset => (
                                                                        <button
                                                                            key={preset.id}
                                                                            onClick={() =>
                                                                                handleAvatarSelect(preset.url)
                                                                            }
                                                                            disabled={uploading}
                                                                            title={preset.label}
                                                                            className={`w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 transition-all duration-200 hover:scale-110 ${
                                                                                user.user_metadata?.avatar_url ===
                                                                                preset.url
                                                                                    ? 'ring-[#F4B000] shadow-lg shadow-[#F4B000]/30'
                                                                                    : 'ring-transparent hover:ring-slate-300 dark:hover:ring-white/20'
                                                                            } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                                                                        >
                                                                            <img
                                                                                src={preset.url}
                                                                                alt={preset.label}
                                                                                className="w-full h-full"
                                                                            />
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                                <button
                                                                    onClick={() => fileInputRef.current?.click()}
                                                                    className="w-full mt-2 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-[#F4B000] hover:bg-[#F4B000]/10 transition-all"
                                                                >
                                                                    Upload Custom Photo
                                                                </button>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </motion.div>
                                            )}

                                            {/* Unified Navigation - SOT for Mobile/Tablet */}
                                            <div className="lg:hidden space-y-3 pb-2 pt-1">
                                                <p className="px-1 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                                    Main Menu
                                                </p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {[
                                                        { label: 'Home', icon: HomeIcon, href: '/' },
                                                        { label: 'Catalog', icon: Bike, href: '/catalog' },
                                                        { label: 'Wishlist', icon: HeartIcon, href: '/wishlist' },
                                                        { label: 'Compare', icon: ArrowRightLeft, href: '/compare' },
                                                        { label: 'Zero', icon: Zap, href: '/zero' },
                                                        {
                                                            label: "O' Circle",
                                                            icon: Globe,
                                                            href: '#o-circle',
                                                            isScroll: true,
                                                        },
                                                    ].map(nav => (
                                                        <a
                                                            key={nav.label}
                                                            href={nav.href}
                                                            onClick={e => {
                                                                if (nav.isScroll) {
                                                                    e.preventDefault();
                                                                    setIsOpen(false);
                                                                    const el = document.getElementById('o-circle');
                                                                    el?.scrollIntoView({ behavior: 'smooth' });
                                                                } else {
                                                                    setIsOpen(false);
                                                                }
                                                            }}
                                                            className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 hover:border-brand-primary/30 dark:hover:border-brand-primary/30 transition-all group"
                                                        >
                                                            <div className="w-8 h-8 rounded-lg bg-white dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-brand-primary transition-colors shadow-sm">
                                                                <nav.icon size={16} />
                                                            </div>
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">
                                                                {nav.label}
                                                            </span>
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Simplified Unified Navigation — only for logged-in users */}
                                            {user && (
                                                <div className="space-y-6 pt-2">
                                                    {/* Account & Profile Section */}
                                                    <div className="space-y-3">
                                                        <p className="px-1 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-2">
                                                            <LucideUser size={10} strokeWidth={3} />
                                                            Account Settings
                                                        </p>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {[
                                                                {
                                                                    label: 'Settings',
                                                                    icon: LucideUser,
                                                                    href: '/profile',
                                                                    color: 'text-blue-500',
                                                                    bg: 'bg-blue-500/10',
                                                                },
                                                                {
                                                                    label: 'Wishlist',
                                                                    icon: Heart,
                                                                    href: '/wishlist',
                                                                    color: 'text-rose-500',
                                                                    bg: 'bg-rose-500/10',
                                                                },
                                                                {
                                                                    label: 'Orders',
                                                                    icon: Package,
                                                                    href: '/orders',
                                                                    color: 'text-orange-500',
                                                                    bg: 'bg-orange-500/10',
                                                                },
                                                                {
                                                                    label: 'Inbox',
                                                                    icon: Bell,
                                                                    href: '/notifications',
                                                                    color: 'text-purple-500',
                                                                    bg: 'bg-purple-500/10',
                                                                },
                                                            ].map(item => (
                                                                <a
                                                                    key={item.label}
                                                                    href={item.href}
                                                                    className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 hover:border-brand-primary/30 dark:hover:border-brand-primary/30 transition-all group"
                                                                >
                                                                    <div
                                                                        className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform shadow-sm shrink-0`}
                                                                    >
                                                                        <item.icon size={16} />
                                                                    </div>
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">
                                                                        {item.label}
                                                                    </span>
                                                                </a>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Workspaces Section */}
                                                    {memberships.length > 0 && (
                                                        <div className="space-y-3">
                                                            <p className="px-1 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center justify-between">
                                                                <span className="flex items-center gap-2">
                                                                    <Building2 size={10} strokeWidth={3} />
                                                                    My Workspaces
                                                                </span>
                                                            </p>
                                                            <div className="space-y-1.5">
                                                                {[...memberships]
                                                                    .filter(m => m.tenants)
                                                                    .sort((a, b) => {
                                                                        const aIsDealer = a.tenants?.type === 'DEALER';
                                                                        const bIsDealer = b.tenants?.type === 'DEALER';
                                                                        if (aIsDealer && !bIsDealer) return -1;
                                                                        if (!aIsDealer && bIsDealer) return 1;
                                                                        return (a.tenants?.name || '').localeCompare(
                                                                            b.tenants?.name || ''
                                                                        );
                                                                    })
                                                                    .map(m => {
                                                                        const t = m.tenants;
                                                                        if (!t) return null;
                                                                        const isActive = activeTenantId === t.id;

                                                                        return (
                                                                            <div
                                                                                key={t.id || t.slug || ''}
                                                                                className={`flex items-center gap-3 p-3 rounded-2xl border transition-all group hover:shadow-md relative overflow-hidden ${
                                                                                    isActive
                                                                                        ? 'bg-brand-primary/5 border-brand-primary/20 dark:bg-brand-primary/10'
                                                                                        : 'bg-white dark:bg-white/[0.03] border-slate-100 dark:border-white/5'
                                                                                }`}
                                                                            >
                                                                                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-black border border-slate-100 dark:border-white/10 flex items-center justify-center shrink-0 text-slate-400">
                                                                                    {getTenantIcon(t.type || '')}
                                                                                </div>
                                                                                <div className="flex-1 min-w-0">
                                                                                    <h5 className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-tight truncate">
                                                                                        {t.name}
                                                                                        {isActive &&
                                                                                            !isUnifiedContext && (
                                                                                                <span className="ml-2 text-[8px] px-1.5 py-0.5 rounded-full bg-brand-primary text-black font-black uppercase tracking-tighter">
                                                                                                    Active
                                                                                                </span>
                                                                                            )}
                                                                                    </h5>
                                                                                    <div className="flex items-center gap-2 mt-0.5">
                                                                                        <span className="text-[9px] font-black text-brand-primary uppercase tracking-widest">
                                                                                            {getRoleLabel(m.role || '')}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                                <a
                                                                                    href={`/app/${t.slug}/dashboard`}
                                                                                    className="px-3 py-1.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-black text-[8px] font-black uppercase tracking-wider hover:scale-105 transition-all shadow-lg shadow-black/10"
                                                                                >
                                                                                    Open
                                                                                </a>
                                                                            </div>
                                                                        );
                                                                    })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </motion.div>
                                    </div>

                                    {/* Compact Footer */}
                                    <div className="flex-none p-5 z-10 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0F172A]/50">
                                        <div className="flex items-center gap-3">
                                            <a
                                                href="/help"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 flex items-center justify-center gap-2 px-3 py-3 border border-slate-200 dark:border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-[0.15em] text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all bg-white dark:bg-white/[0.03] hover:shadow-md"
                                            >
                                                <HelpCircle size={14} />
                                                Help
                                            </a>
                                            {user && (
                                                <button
                                                    onClick={handleLogout}
                                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-3 bg-rose-500 text-white rounded-2xl text-[9px] font-black uppercase tracking-[0.15em] hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 hover:shadow-rose-500/30 hover:-translate-y-0.5"
                                                >
                                                    <LogOut size={14} />
                                                    Sign Out
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex justify-center gap-5 mt-4">
                                            {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                                                <a
                                                    key={i}
                                                    href="#"
                                                    className="w-6 h-6 rounded-full bg-transparent flex items-center justify-center text-slate-400 hover:text-brand-primary transition-all hover:scale-110"
                                                >
                                                    <Icon size={14} />
                                                </a>
                                            ))}
                                        </div>
                                        <div className="text-center mt-3">
                                            <p className="text-[9px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest">
                                                BookMyBike v2.4.0
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>,
                    document.body
                )}
        </>
    );
}
