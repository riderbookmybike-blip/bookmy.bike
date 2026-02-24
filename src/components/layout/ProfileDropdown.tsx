'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
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
import { useFavorites } from '@/lib/favorites/favoritesContext';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Logo } from '@/components/brand/Logo';
import { useDealerSession } from '@/hooks/useDealerSession';
import { MembershipCard, WalletData } from '@/components/auth/MembershipCard';
import { useTenant } from '@/lib/tenant/tenantContext';
import { getDefaultAvatar, AVATAR_PRESETS } from '@/lib/avatars';
import { useAuth } from '@/components/providers/AuthProvider';

const ADMIN_ROLES = new Set(['OWNER', 'ADMIN', 'SUPER_ADMIN', 'DEALERSHIP_ADMIN', 'MARKETPLACE_ADMIN']);

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
    const [bCoins, setBCoins] = useState<number | null>(null);
    const [memberCode, setMemberCode] = useState<string>('BMB-000-000');
    const [walletData, setWalletData] = useState<WalletData | null>(null);

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

    // O'Circle vs Business mode toggle (persisted)
    const [businessMode, setBusinessMode] = useState(() => {
        if (typeof window === 'undefined') return false;
        return localStorage.getItem('bkmb_sidebar_mode') === 'business';
    });
    const toggleMode = () => {
        setBusinessMode(prev => {
            const next = !prev;
            localStorage.setItem('bkmb_sidebar_mode', next ? 'business' : 'ocircle');
            return next;
        });
    };

    // Dealer Session Hook
    const { activeTenantId, setDealerContext, clearDealerContext } = useDealerSession();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLButtonElement>(null); // Fixed: Ref is attached to a button

    // Close on click outside is now handled by the Backdrop overlay in the logic below

    useEffect(() => {
        setUser(authUser);

        if (authUser?.id) {
            import('@/actions/oclub').then(({ getOClubWallet }) => {
                getOClubWallet(authUser.id).then(res => {
                    if (res.success && res.wallet) {
                        const w = res.wallet as any;
                        setBCoins(w.available_system || 0);
                        setWalletData({
                            available_system: w.available_system || 0,
                            available_referral: w.available_referral || 0,
                            available_sponsored: w.available_sponsored || 0,
                            lifetime_earned: w.lifetime_earned || 0,
                            lifetime_redeemed: w.lifetime_redeemed || 0,
                            locked: w.locked || 0,
                        });
                    }
                });
            });

            // Fetch referral_code (9-char customer ID) for membership card
            const supabase = createClient();
            supabase
                .from('id_members')
                .select('referral_code')
                .eq('id', authUser.id)
                .maybeSingle()
                .then(({ data }) => {
                    if (data?.referral_code) {
                        const code = data.referral_code.toUpperCase();
                        // Format as XXX-XXX-XXX if it's 9 chars
                        if (code.length === 9) {
                            setMemberCode(`${code.slice(0, 3)}-${code.slice(3, 6)}-${code.slice(6, 9)}`);
                        } else {
                            setMemberCode(code);
                        }
                    }
                });
        } else {
            setBCoins(null);
        }
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

    const getWorkspaceDashboardHref = (slug: string | null | undefined) =>
        slug ? `/app/${slug}/dashboard` : '/dashboard';

    const handleWorkspaceLogin = (tenantId: string | null | undefined) => {
        if (!tenantId) return;
        setDealerContext(tenantId);
    };

    const handleWorkspaceLogout = () => {
        clearDealerContext();
    };

    const sortedMemberships = useMemo(
        () =>
            memberships
                .filter(m => m.tenants)
                .sort((a, b) => {
                    const aIsDealer = a.tenants?.type === 'DEALER';
                    const bIsDealer = b.tenants?.type === 'DEALER';
                    if (aIsDealer && !bIsDealer) return -1;
                    if (!aIsDealer && bIsDealer) return 1;
                    return (a.tenants?.name || '').localeCompare(b.tenants?.name || '');
                }),
        [memberships]
    );

    const activeMembership = useMemo(
        () => sortedMemberships.find(m => m.tenant_id === activeTenantId) || sortedMemberships[0] || null,
        [sortedMemberships, activeTenantId]
    );

    const hasWorkspaceAccess = sortedMemberships.length > 0;
    const activeWorkspaceRole = (activeMembership?.role || '').toUpperCase();
    const workspaceBasePath = activeMembership?.tenants?.slug
        ? `/app/${activeMembership.tenants.slug}/dashboard`
        : '/dashboard';
    const isAdminWorkspaceRole = ADMIN_ROLES.has(activeWorkspaceRole);

    const accountMenuItems = useMemo(() => {
        if (!user) return [];

        if (!hasWorkspaceAccess || !businessMode) {
            // O'Circle / consumer mode
            return [
                {
                    label: 'Profile',
                    icon: LucideUser,
                    href: '/profile',
                    color: 'text-blue-500',
                    bg: 'bg-blue-500/10',
                },
                {
                    label: 'Favorites',
                    icon: Heart,
                    href: '/store/favorites',
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
                    label: 'Notifications',
                    icon: Bell,
                    href: '/notifications',
                    color: 'text-purple-500',
                    bg: 'bg-purple-500/10',
                },
            ];
        }

        // Business mode
        const workspaceItems = [
            {
                label: 'Dashboard',
                icon: LayoutDashboard,
                href: workspaceBasePath,
                color: 'text-indigo-500',
                bg: 'bg-indigo-500/10',
            },
            {
                label: 'Profile',
                icon: LucideUser,
                href: `${workspaceBasePath}/settings/profile`,
                color: 'text-blue-500',
                bg: 'bg-blue-500/10',
            },
            {
                label: isAdminWorkspaceRole ? 'Team' : 'Settings',
                icon: isAdminWorkspaceRole ? Building2 : Settings,
                href: isAdminWorkspaceRole ? `${workspaceBasePath}/settings/team` : `${workspaceBasePath}/settings`,
                color: isAdminWorkspaceRole ? 'text-emerald-500' : 'text-slate-500',
                bg: isAdminWorkspaceRole ? 'bg-emerald-500/10' : 'bg-slate-500/10',
            },
            {
                label: 'Notifications',
                icon: Bell,
                href: '/notifications',
                color: 'text-purple-500',
                bg: 'bg-purple-500/10',
            },
        ];

        return workspaceItems;
    }, [user, hasWorkspaceAccess, workspaceBasePath, isAdminWorkspaceRole, businessMode]);

    const isLight = tone === 'light' || (tone !== 'dark' && (mounted ? theme !== 'dark' : true));
    const isDarkSurface = !isLight;
    const triggerClass = isDarkSurface
        ? 'border-white/10 text-white hover:bg-white hover:text-black hover:border-white hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]'
        : 'border-slate-900/10 text-slate-900 hover:bg-slate-100 dark:border-white/10 dark:text-white dark:hover:bg-white/10 shadow-sm';

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
                    className={`flex h-10 w-auto pl-1 pr-4 rounded-full border transition-all duration-300 relative flex-shrink-0 items-center gap-3 group z-[101] ${triggerClass}`}
                >
                    <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-slate-900 dark:text-white font-black text-xs transition-all ring-1 ring-white/10 shadow-inner">
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
                    className={`flex w-10 h-10 rounded-full border items-center justify-center transition-all duration-300 group ${triggerClass}`}
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
                                                    className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 flex flex-col items-center gap-4 text-center relative overflow-hidden group shadow-sm"
                                                >
                                                    <div className="absolute top-[-50px] left-[-50px] w-32 h-32 bg-brand-primary/20 rounded-full blur-[40px] pointer-events-none" />
                                                    <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-brand-primary">
                                                        <LucideUser size={32} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                                                            Welcome to BookMyBike
                                                        </h3>
                                                        <p className="text-xs text-slate-500 font-medium px-4">
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

                                            {/* O' CIRCLE MEMBERSHIP CARD — Reusable SOT */}
                                            {user && (
                                                <motion.div variants={itemVariants} className="mt-2">
                                                    <MembershipCard
                                                        name={
                                                            user.user_metadata?.full_name ||
                                                            user.user_metadata?.name ||
                                                            'MEMBER'
                                                        }
                                                        id={memberCode}
                                                        validity="∞"
                                                        compact
                                                        wallet={walletData}
                                                    />
                                                </motion.div>
                                            )}

                                            {/* Simplified Unified Navigation — only for logged-in users */}
                                            {user && (
                                                <div className="space-y-6 pt-2">
                                                    {/* O'Circle / Business Mode Toggle */}
                                                    {sortedMemberships.length > 0 && (
                                                        <div className="flex items-center gap-0 p-1 rounded-2xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10">
                                                            <button
                                                                onClick={() => {
                                                                    if (businessMode) toggleMode();
                                                                }}
                                                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${
                                                                    !businessMode
                                                                        ? 'bg-brand-primary text-black shadow-md shadow-brand-primary/20'
                                                                        : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
                                                                }`}
                                                            >
                                                                <Logo variant="icon" size={12} />
                                                                O&apos; Circle
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    if (!businessMode) toggleMode();
                                                                }}
                                                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${
                                                                    businessMode
                                                                        ? 'bg-slate-900 dark:bg-white text-white dark:text-black shadow-md'
                                                                        : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
                                                                }`}
                                                            >
                                                                <Building2 size={12} />
                                                                Business
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* Account & Profile Section — O'Circle mode only */}
                                                    {!businessMode && (
                                                        <>
                                                            {/* Main Menu — inside O'Circle mode */}
                                                            <div className="lg:hidden space-y-3 pb-2 pt-1">
                                                                <p className="px-1 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                                                    Main Menu
                                                                </p>
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    {[
                                                                        { label: 'Home', icon: HomeIcon, href: '/' },
                                                                        {
                                                                            label: 'Catalog',
                                                                            icon: Bike,
                                                                            href: '/catalog',
                                                                        },
                                                                        {
                                                                            label: 'Wishlist',
                                                                            icon: HeartIcon,
                                                                            href: '/wishlist',
                                                                        },
                                                                        {
                                                                            label: 'Compare',
                                                                            icon: ArrowRightLeft,
                                                                            href: '/compare',
                                                                        },
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
                                                                                    const el =
                                                                                        document.getElementById(
                                                                                            'o-circle'
                                                                                        );
                                                                                    el?.scrollIntoView({
                                                                                        behavior: 'smooth',
                                                                                    });
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

                                                            {/* My Account */}
                                                            <div className="space-y-3">
                                                                <p className="px-1 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-2">
                                                                    <LucideUser size={10} strokeWidth={3} />
                                                                    My Account
                                                                </p>
                                                                <div className="space-y-1.5">
                                                                    {accountMenuItems.map(item => (
                                                                        <a
                                                                            key={item.label}
                                                                            href={item.href}
                                                                            onClick={() => setIsOpen(false)}
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
                                                        </>
                                                    )}

                                                    {/* Workspaces Section — only in Business mode */}
                                                    {businessMode && sortedMemberships.length > 0 && (
                                                        <div className="space-y-3">
                                                            <p className="px-1 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center justify-between">
                                                                <span className="flex items-center gap-2">
                                                                    <Building2 size={10} strokeWidth={3} />
                                                                    My Workspaces
                                                                </span>
                                                            </p>
                                                            <div className="space-y-1.5">
                                                                {sortedMemberships.map(m => {
                                                                    const t = m.tenants;
                                                                    if (!t) return null;
                                                                    const isActive = activeTenantId === t.id;
                                                                    const dashboardHref = getWorkspaceDashboardHref(
                                                                        t.slug
                                                                    );

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
                                                                                {isActive ? (
                                                                                    <a
                                                                                        href={dashboardHref}
                                                                                        onClick={() => setIsOpen(false)}
                                                                                        className="block font-black text-xs text-slate-900 dark:text-white uppercase tracking-tight truncate hover:text-brand-primary transition-colors"
                                                                                    >
                                                                                        {t.name}
                                                                                    </a>
                                                                                ) : (
                                                                                    <h5 className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-tight truncate">
                                                                                        {t.name}
                                                                                    </h5>
                                                                                )}
                                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                                    <span className="text-[9px] font-black text-brand-primary uppercase tracking-widest">
                                                                                        {getRoleLabel(m.role || '')}
                                                                                    </span>
                                                                                    <span
                                                                                        className={`text-[8px] font-black uppercase tracking-widest ${
                                                                                            isActive
                                                                                                ? 'text-emerald-500'
                                                                                                : 'text-slate-400 dark:text-slate-500'
                                                                                        }`}
                                                                                    >
                                                                                        {isActive
                                                                                            ? 'Active'
                                                                                            : 'Inactive'}
                                                                                    </span>
                                                                                </div>
                                                                                {isActive && (
                                                                                    <a
                                                                                        href={dashboardHref}
                                                                                        onClick={() => setIsOpen(false)}
                                                                                        className="inline-flex mt-1 text-[8px] font-black uppercase tracking-widest text-slate-500 hover:text-brand-primary transition-colors"
                                                                                    >
                                                                                        Open Dashboard
                                                                                    </a>
                                                                                )}
                                                                            </div>
                                                                            {isActive ? (
                                                                                <button
                                                                                    onClick={handleWorkspaceLogout}
                                                                                    className="px-3 py-1.5 rounded-full bg-white text-slate-700 border border-slate-200 text-[8px] font-black uppercase tracking-wider hover:scale-105 transition-all shadow-sm"
                                                                                >
                                                                                    Logout
                                                                                </button>
                                                                            ) : (
                                                                                <button
                                                                                    onClick={() =>
                                                                                        handleWorkspaceLogin(t.id)
                                                                                    }
                                                                                    className="px-3 py-1.5 rounded-full bg-brand-primary text-black text-[8px] font-black uppercase tracking-wider hover:scale-105 transition-all shadow-lg shadow-brand-primary/20"
                                                                                >
                                                                                    Login
                                                                                </button>
                                                                            )}
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
