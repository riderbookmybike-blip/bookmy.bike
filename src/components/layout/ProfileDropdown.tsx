'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
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
    MapPin,
    X,
    MessageSquare,
    Facebook,
    Twitter,
    Instagram,
    Linkedin,
    ChevronRight,
    Camera,
    Zap,
    Power,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useFavorites } from '@/lib/favorites/favoritesContext';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Logo } from '@/components/brand/Logo';
import { useDealerSession } from '@/hooks/useDealerSession';

interface Membership {
    role: string;
    tenant_id?: string;
    tenants: {
        id?: string;
        slug: string;
        name: string;
        type: string;
        studio_id?: string;
        district_name?: string;
    };
}

interface ProfileDropdownProps {
    onLoginClick: () => void;
    scrolled: boolean;
    theme: string;
    tone?: 'light' | 'dark';
}

export function ProfileDropdown({ onLoginClick, scrolled, theme, tone }: ProfileDropdownProps) {
    const [user, setUser] = useState<User | null>(null);
    const [memberships, setMemberships] = useState<Membership[]>([]);
    const [activeTab, setActiveTab] = useState<'account' | 'workspace'>('account');
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [location, setLocation] = useState<{
        area: string;
        taluka: string;
        district?: string;
        state?: string;
        stateCode?: string;
    } | null>(null);
    const [uploading, setUploading] = useState(false);

    // Dealer Session Hook
    const {
        isTeamMode,
        activeTenantId,
        studioId: activeStudioId,
        tenantName: activeTenantName,
        activateDealer,
        switchToIndividual,
        isLoaded: isSessionLoaded,
    } = useDealerSession();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLButtonElement>(null); // Fixed: Ref is attached to a button

    // Close on click outside is now handled by the Backdrop overlay in the logic below

    useEffect(() => {
        const supabase = createClient();

        const loadMemberships = async (userId: string) => {
            const { data, error } = await supabase
                .from('id_team')
                .select('role, tenant_id, id_tenants!inner(id, slug, name, type, studio_id)')
                .eq('user_id', userId)
                .eq('status', 'ACTIVE');

            if (error) {
                console.error('Error loading memberships:', error);
                return;
            }

            if (data) {
                setMemberships(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    data.map((m: any) => {
                        const tenant = Array.isArray(m.id_tenants) ? m.id_tenants[0] : m.id_tenants;
                        return {
                            role: m.role,
                            tenant_id: m.tenant_id,
                            tenants: {
                                ...tenant,
                                district_name: null, // Will be resolved separately if needed
                            },
                        };
                    })
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

    // Trigger Button Logic matches original
    if (!user) {
        return (
            <button
                onClick={onLoginClick}
                className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-300 group ${triggerClass}`}
                title="Sign In"
            >
                <UserIcon size={20} />
            </button>
        );
    }

    const displayName =
        user.user_metadata?.full_name?.split(' ')[0] ||
        user.user_metadata?.name?.split(' ')[0] ||
        user.email?.split('@')[0] ||
        'User';

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
            <button
                onClick={() => setIsOpen(!isOpen)}
                ref={dropdownRef}
                className={`h-10 w-auto pl-1 pr-4 rounded-full border transition-all duration-300 relative flex-shrink-0 flex items-center gap-3 group z-[101] ${triggerClass}`}
            >
                <div
                    className={`w-8 h-8 rounded-full overflow-hidden bg-brand-primary flex items-center justify-center text-black font-bold text-xs ring-2 transition-all ${
                        scrolled || theme === 'dark'
                            ? 'ring-white/20 group-hover:ring-transparent'
                            : 'ring-slate-100 group-hover:ring-brand-primary/20'
                    }`}
                >
                    {user.user_metadata?.avatar_url ? (
                        <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        (displayName[0] || 'U').toUpperCase()
                    )}
                </div>
                <div className="flex items-center gap-1.5 leading-none">
                    <span className="text-[11px] font-black uppercase tracking-widest group-hover:opacity-100 transition-opacity">
                        HI,
                    </span>
                    <span className="text-[11px] font-black uppercase tracking-widest whitespace-nowrap max-w-[150px] truncate">
                        {displayName}
                    </span>
                    {isTeamMode && activeStudioId && (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[8px] font-black uppercase tracking-wider">
                            ⚡ {activeStudioId}
                        </span>
                    )}
                </div>
            </button>

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
                                            {/* COMPACT USER CARD */}
                                            <motion.div
                                                variants={itemVariants}
                                                className="bg-slate-50 dark:bg-white/[0.03] p-4 rounded-3xl border border-slate-100 dark:border-white/5 flex items-center gap-4 relative overflow-hidden group"
                                            >
                                                <div className="absolute top-0 right-0 p-4 opacity-30">
                                                    <div className="w-24 h-24 bg-brand-primary/20 rounded-full blur-2xl absolute -top-5 -right-5 pointer-events-none" />
                                                </div>

                                                {/* Smaller Avatar */}
                                                <div className="relative shrink-0 group/avatar">
                                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-primary to-[#F4B000] flex items-center justify-center text-white text-xl font-black shadow-lg shadow-brand-primary/20 overflow-hidden relative z-10 ring-2 ring-white dark:ring-[#0F172A]">
                                                        {user.user_metadata?.avatar_url ? (
                                                            <img
                                                                src={user.user_metadata.avatar_url}
                                                                alt={user.user_metadata?.full_name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <span>
                                                                {(
                                                                    user.user_metadata?.full_name?.[0] ||
                                                                    user.user_metadata?.name?.[0] ||
                                                                    user.email?.[0] ||
                                                                    'U'
                                                                ).toUpperCase()}
                                                            </span>
                                                        )}
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

                                            {/* Tabs Toggle */}
                                            <div className="flex p-1 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5 mx-1">
                                                <button
                                                    onClick={() => setActiveTab('account')}
                                                    className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                                                        activeTab === 'account'
                                                            ? 'bg-white dark:bg-brand-primary text-black shadow-md shadow-black/5 dark:shadow-none'
                                                            : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-white/5'
                                                    }`}
                                                >
                                                    <UserIcon size={12} strokeWidth={3} />
                                                    The O' Circle
                                                </button>
                                                <button
                                                    onClick={() => setActiveTab('workspace')}
                                                    className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                                                        activeTab === 'workspace'
                                                            ? 'bg-white dark:bg-brand-primary text-black shadow-md shadow-black/5 dark:shadow-none'
                                                            : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-white/5'
                                                    }`}
                                                >
                                                    <Building2 size={12} strokeWidth={3} />
                                                    My Workspace
                                                </button>
                                            </div>

                                            {/* Compact Quick Actions List */}
                                            {activeTab === 'account' && (
                                                <motion.div
                                                    variants={itemVariants}
                                                    initial="hidden"
                                                    animate="visible"
                                                    exit="hidden"
                                                    className="space-y-4 pt-2"
                                                >
                                                    <div className="flex flex-col gap-1.5">
                                                        {[
                                                            {
                                                                label: 'Profile Settings',
                                                                icon: UserIcon,
                                                                href: '/profile',
                                                                color: 'text-blue-500',
                                                                bg: 'bg-blue-500/10',
                                                            },
                                                            {
                                                                label: 'My Orders',
                                                                icon: Package,
                                                                href: '/orders',
                                                                color: 'text-orange-500',
                                                                bg: 'bg-orange-500/10',
                                                            },
                                                            {
                                                                label: 'Wishlist',
                                                                icon: Heart,
                                                                href: '/wishlist',
                                                                color: 'text-rose-500',
                                                                bg: 'bg-rose-500/10',
                                                            },
                                                            {
                                                                label: 'Notifications',
                                                                icon: Bell,
                                                                href: '/notifications',
                                                                color: 'text-purple-500',
                                                                bg: 'bg-purple-500/10',
                                                            },
                                                        ].map(item => (
                                                            <a
                                                                key={item.label}
                                                                href={item.href}
                                                                className="flex items-center gap-3 p-2.5 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 hover:border-brand-primary/30 dark:hover:border-brand-primary/30 transition-all group hover:shadow-md hover:shadow-brand-primary/5 dark:hover:bg-white/[0.06]"
                                                            >
                                                                <div
                                                                    className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform shadow-sm shrink-0`}
                                                                >
                                                                    <item.icon size={16} />
                                                                </div>
                                                                <div className="flex-1 flex items-center justify-between">
                                                                    <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-wider leading-tight">
                                                                        {item.label}
                                                                    </p>
                                                                    <ChevronRight
                                                                        size={12}
                                                                        className="text-slate-300 group-hover:text-brand-primary transition-colors"
                                                                    />
                                                                </div>
                                                            </a>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}

                                            {/* Compact Memberships */}
                                            {activeTab === 'workspace' && (
                                                <motion.div
                                                    variants={itemVariants}
                                                    initial="hidden"
                                                    animate="visible"
                                                    exit="hidden"
                                                    className="space-y-2 pt-2"
                                                >
                                                    {memberships.length === 0 ? (
                                                        <div className="p-8 text-center border-2 border-dashed border-slate-100 dark:border-white/5 rounded-2xl">
                                                            <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-white/5 mx-auto flex items-center justify-center mb-3">
                                                                <Building2
                                                                    className="text-slate-300 dark:text-slate-600"
                                                                    size={18}
                                                                />
                                                            </div>
                                                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                                                No Workspaces Found
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-1.5">
                                                            {/* Sort: Dealers first (alphabetically), then others (alphabetically) */}
                                                            {[...memberships]
                                                                .sort((a, b) => {
                                                                    const aIsDealer = a.tenants.type === 'DEALER';
                                                                    const bIsDealer = b.tenants.type === 'DEALER';
                                                                    if (aIsDealer && !bIsDealer) return -1;
                                                                    if (!aIsDealer && bIsDealer) return 1;
                                                                    return a.tenants.name.localeCompare(b.tenants.name);
                                                                })
                                                                .map(m => {
                                                                    const isDealer = m.tenants.type === 'DEALER';
                                                                    const isActive =
                                                                        isTeamMode && activeTenantId === m.tenant_id;

                                                                    return (
                                                                        <div
                                                                            key={m.tenants.slug}
                                                                            className={`flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-white/[0.03] border transition-all group hover:shadow-md relative overflow-hidden ${
                                                                                isActive
                                                                                    ? 'border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-500/10'
                                                                                    : 'border-slate-100 dark:border-white/5'
                                                                            }`}
                                                                        >
                                                                            {/* Tenant Icon */}
                                                                            <div
                                                                                className={`w-10 h-10 rounded-xl bg-slate-50 dark:bg-black border border-slate-100 dark:border-white/10 flex items-center justify-center shrink-0 ${
                                                                                    isActive
                                                                                        ? 'text-emerald-500'
                                                                                        : 'text-slate-400'
                                                                                }`}
                                                                            >
                                                                                {getTenantIcon(m.tenants.type)}
                                                                            </div>

                                                                            {/* Info */}
                                                                            <div className="flex-1 min-w-0">
                                                                                <h5 className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-tight truncate">
                                                                                    {m.tenants.name}
                                                                                    {isDealer &&
                                                                                        m.tenants.studio_id && (
                                                                                            <span className="ml-1 text-brand-primary">
                                                                                                ({m.tenants.studio_id})
                                                                                            </span>
                                                                                        )}
                                                                                </h5>
                                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                                    <span className="px-1.5 py-px rounded bg-slate-100 dark:bg-white/10 text-[7px] font-bold text-slate-500 uppercase tracking-wider">
                                                                                        {m.tenants.type.replace(
                                                                                            '_',
                                                                                            ' '
                                                                                        )}
                                                                                    </span>
                                                                                    <span className="text-[8px] font-bold text-slate-300">
                                                                                        •
                                                                                    </span>
                                                                                    <span className="text-[8px] font-black text-brand-primary uppercase tracking-widest">
                                                                                        {getRoleLabel(m.role)}
                                                                                    </span>
                                                                                </div>
                                                                            </div>

                                                                            {/* Simple Pill Buttons */}
                                                                            <div className="flex items-center gap-1.5 shrink-0">
                                                                                {/* Green/Red Toggle for Dealers */}
                                                                                {isDealer && (
                                                                                    <button
                                                                                        onClick={e => {
                                                                                            e.preventDefault();
                                                                                            e.stopPropagation();
                                                                                            if (isActive) {
                                                                                                switchToIndividual();
                                                                                            } else {
                                                                                                activateDealer({
                                                                                                    tenantId:
                                                                                                        m.tenant_id!,
                                                                                                    studioId:
                                                                                                        m.tenants
                                                                                                            .studio_id ||
                                                                                                        null,
                                                                                                    district:
                                                                                                        m.tenants
                                                                                                            .district_name ||
                                                                                                        null,
                                                                                                    tenantName:
                                                                                                        m.tenants.name,
                                                                                                });
                                                                                            }
                                                                                        }}
                                                                                        className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-wider transition-all ${
                                                                                            isActive
                                                                                                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                                                                                : 'bg-rose-500 hover:bg-rose-600 text-white'
                                                                                        }`}
                                                                                        title={
                                                                                            isActive
                                                                                                ? 'Click to Deactivate'
                                                                                                : 'Click to Activate'
                                                                                        }
                                                                                    >
                                                                                        {isActive
                                                                                            ? 'Active'
                                                                                            : 'Inactive'}
                                                                                    </button>
                                                                                )}

                                                                                {/* Dashboard Pill */}
                                                                                <a
                                                                                    href={`/app/${m.tenants.slug}/dashboard`}
                                                                                    className="px-2.5 py-1 rounded-full bg-blue-500 hover:bg-blue-600 text-white text-[8px] font-black uppercase tracking-wider transition-all"
                                                                                    title="Go to Dashboard"
                                                                                >
                                                                                    Dashboard
                                                                                </a>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    </div>

                                    {/* Compact Footer */}
                                    <div className="flex-none p-5 z-10 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0F172A]/50">
                                        <div className="flex items-center gap-3">
                                            <a
                                                href="/help"
                                                className="flex-1 flex items-center justify-center gap-2 px-3 py-3 border border-slate-200 dark:border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-[0.15em] text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all bg-white dark:bg-white/[0.03] hover:shadow-md"
                                            >
                                                <HelpCircle size={14} />
                                                Help
                                            </a>
                                            <button
                                                onClick={handleLogout}
                                                className="flex-1 flex items-center justify-center gap-2 px-3 py-3 bg-rose-500 text-white rounded-2xl text-[9px] font-black uppercase tracking-[0.15em] hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 hover:shadow-rose-500/30 hover:-translate-y-0.5"
                                            >
                                                <LogOut size={14} />
                                                Sign Out
                                            </button>
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
