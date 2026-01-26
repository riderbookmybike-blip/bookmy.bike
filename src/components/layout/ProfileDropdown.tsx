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
    HelpCircle,
    LogOut,
    MapPin,
    X,
    Facebook,
    Twitter,
    Instagram,
    Linkedin,
    ChevronRight,
    Camera,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useFavorites } from '@/lib/favorites/favoritesContext';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Logo } from '@/components/brand/Logo';

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
    const [location, setLocation] = useState<{
        area: string;
        taluka: string;
        district?: string;
        state?: string;
        stateCode?: string;
    } | null>(null);
    const [uploading, setUploading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const supabase = createClient();

        const loadMemberships = async (userId: string) => {
            const { data } = await supabase
                .from('id_team')
                .select('role, id_tenants!inner(slug, name, type)')
                .eq('user_id', userId)
                .eq('status', 'ACTIVE');

            if (data) {
                setMemberships(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    data.map((m: any) => ({
                        role: m.role,
                        tenants: Array.isArray(m.id_tenants) ? m.id_tenants[0] : m.id_tenants,
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

    // Trigger Button Logic matches original
    if (!user) {
        return (
            <button
                onClick={onLoginClick}
                className="w-10 h-10 rounded-full border border-white/20 text-white flex items-center justify-center transition-all duration-300 hover:bg-white hover:text-black hover:border-white hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] group"
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

    const overlayVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: { opacity: 0 },
    };

    const sidebarVariants: Variants = {
        hidden: { x: '100%', opacity: 0 },
        visible: {
            x: 0,
            opacity: 1,
            transition: {
                type: 'spring',
                damping: 30,
                stiffness: 300,
                mass: 1,
            },
        },
        exit: {
            x: '100%',
            opacity: 0,
            transition: { duration: 0.3, ease: 'easeIn' },
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
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                ref={dropdownRef}
                className="h-10 w-auto pl-1 pr-4 rounded-full border transition-all duration-300 relative flex-shrink-0 flex items-center gap-3 border-white/20 text-white hover:bg-white hover:text-black hover:border-white hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] group"
            >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-brand-primary flex items-center justify-center text-black font-bold text-xs ring-2 ring-white/20 group-hover:ring-transparent transition-all">
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
                </div>
            </button>

            {/* Full Screen Sidebar Portal */}
            {mounted &&
                createPortal(
                    <AnimatePresence>
                        {isOpen && (
                            <div className="fixed inset-0 z-[100] overflow-hidden font-sans">
                                {/* Backdrop */}
                                <motion.div
                                    variants={overlayVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    onClick={() => setIsOpen(false)}
                                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
                                />

                                {/* Sidebar - Frosted Daylight */}
                                <motion.div
                                    variants={sidebarVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="absolute right-0 top-0 bottom-0 w-full sm:w-[480px] bg-white/80 backdrop-blur-3xl shadow-2xl border-l border-white/40 flex flex-col sm:rounded-l-[40px] overflow-hidden"
                                    style={{
                                        boxShadow:
                                            '-20px 0 50px -10px rgba(0,0,0,0.1), inset 1px 0 0 0 rgba(255,255,255,0.5)',
                                    }}
                                >
                                    {/* God Ray Lighting */}
                                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-b from-white/70 via-white/10 to-transparent pointer-events-none" />

                                    {/* Soft Pastel Glows */}
                                    <div className="absolute top-[-10%] left-[-20%] w-[300px] h-[300px] bg-[#BAE6FD]/40 rounded-full blur-[80px] pointer-events-none mix-blend-multiply" />
                                    <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-[#FCD34D]/30 rounded-full blur-[100px] pointer-events-none mix-blend-multiply" />

                                    {/* Header */}
                                    <div className="flex-none px-8 py-8 flex items-center justify-between z-10 shrink-0">
                                        <div className="h-8 shrink-0">
                                            <Logo
                                                mode="dark" // Using dark mode logo for contrast against white glass
                                                size={36}
                                                variant="full"
                                                customColors={{
                                                    bike: '#F4B000',
                                                }}
                                            />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <ThemeToggle className="w-10 h-10" />
                                            <button
                                                onClick={() => setIsOpen(false)}
                                                className="w-10 h-10 rounded-full bg-slate-900/5 hover:bg-slate-900/10 flex items-center justify-center transition-colors text-slate-500"
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Main Content */}
                                    <div className="flex-1 overflow-y-auto px-8 z-10 flex flex-col min-h-0 custom-scrollbar pb-6 gap-8">
                                        <motion.div
                                            variants={containerVariants}
                                            initial="hidden"
                                            animate="visible"
                                            className="space-y-8"
                                        >
                                            {/* USER CARD (Light Variant) */}
                                            <motion.div
                                                variants={itemVariants}
                                                className="bg-white/50 p-6 rounded-[2.5rem] border border-white/60 flex items-center gap-6 relative overflow-hidden group shadow-lg shadow-sky-100/50"
                                            >
                                                <div className="absolute top-0 right-0 p-4 opacity-30">
                                                    <div className="w-32 h-32 bg-brand-primary/10 rounded-full blur-2xl absolute -top-5 -right-5 pointer-events-none" />
                                                </div>

                                                {/* Avatar */}
                                                <div className="relative shrink-0 group/avatar">
                                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center text-white text-3xl font-black shadow-xl overflow-hidden relative z-10 ring-4 ring-white">
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
                                                        className="absolute bottom-0 right-0 w-8 h-8 bg-brand-primary text-black rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-20 border-2 border-white"
                                                        title="Change Photo"
                                                    >
                                                        {uploading ? (
                                                            <div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                                        ) : (
                                                            <Camera size={14} />
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
                                                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none truncate">
                                                        {user.user_metadata?.full_name || 'BookMyBike User'}
                                                    </h3>
                                                    <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider truncate">
                                                        {user.email}
                                                    </p>
                                                    {location && (
                                                        <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full bg-slate-900 text-[10px] font-black uppercase tracking-[0.05em] text-white">
                                                            <MapPin size={12} className="text-[#F4B000]" />
                                                            {location.district || location.taluka}{' '}
                                                            {location.stateCode || ''}
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>

                                            {/* MY ACCOUNT LINKS */}
                                            <motion.div variants={itemVariants} className="space-y-4">
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">
                                                    My Account
                                                </h4>
                                                <div className="flex flex-col gap-3">
                                                    {[
                                                        {
                                                            label: 'Profile Settings',
                                                            icon: UserIcon,
                                                            href: '/profile',
                                                            color: 'text-slate-900',
                                                            bg: 'bg-slate-100',
                                                        },
                                                        {
                                                            label: 'My Orders',
                                                            icon: Package,
                                                            href: '/orders',
                                                            color: 'text-orange-600',
                                                            bg: 'bg-orange-50',
                                                        },
                                                        {
                                                            label: 'Wishlist',
                                                            icon: Heart,
                                                            href: '/wishlist',
                                                            color: 'text-rose-600',
                                                            bg: 'bg-rose-50',
                                                        },
                                                        {
                                                            label: 'Notifications',
                                                            icon: Bell,
                                                            href: '/notifications',
                                                            color: 'text-purple-600',
                                                            bg: 'bg-purple-50',
                                                        },
                                                    ].map(item => (
                                                        <a
                                                            key={item.label}
                                                            href={item.href}
                                                            className="flex items-center gap-4 p-4 rounded-3xl bg-white/50 border border-white/60 hover:bg-white hover:border-white hover:shadow-xl hover:shadow-slate-200/50 transition-all group"
                                                        >
                                                            <div
                                                                className={`w-10 h-10 rounded-2xl ${item.bg} flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform shadow-sm shrink-0`}
                                                            >
                                                                <item.icon size={20} />
                                                            </div>
                                                            <div className="flex-1 flex items-center justify-between">
                                                                <p className="text-sm font-black text-slate-900 uppercase tracking-wide">
                                                                    {item.label}
                                                                </p>
                                                                <ChevronRight
                                                                    size={16}
                                                                    className="text-slate-300 group-hover:text-slate-900 transition-colors"
                                                                />
                                                            </div>
                                                        </a>
                                                    ))}
                                                </div>
                                            </motion.div>

                                            {/* MEMBERSHIPS */}
                                            {memberships.length > 0 && (
                                                <motion.div variants={itemVariants} className="space-y-4">
                                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">
                                                        Workspace Access
                                                    </h4>
                                                    <div className="space-y-3">
                                                        {memberships.map(m => (
                                                            <a
                                                                key={m.tenants.slug}
                                                                href={`/app/${m.tenants.slug}/dashboard`}
                                                                className="flex items-center gap-4 p-4 rounded-3xl bg-slate-900 border border-slate-800 hover:bg-black transition-all group relative overflow-hidden shadow-xl"
                                                            >
                                                                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white group-hover:text-[#F4B000] transition-colors shrink-0">
                                                                    {getTenantIcon(m.tenants.type)}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <h5 className="font-black text-sm text-white uppercase tracking-tight truncate">
                                                                        {m.tenants.name}
                                                                    </h5>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <span className="px-2 py-0.5 rounded bg-white/10 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                                                            {m.tenants.type.replace('_', ' ')}
                                                                        </span>
                                                                        <span className="text-[10px] font-black text-[#F4B000] uppercase tracking-widest">
                                                                            {getRoleLabel(m.role)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-white transition-colors">
                                                                    <ChevronRight size={16} />
                                                                </div>
                                                            </a>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </motion.div>

                                        {/* Footer */}
                                        <div className="mt-auto pt-8 border-t border-slate-200/50">
                                            <div className="flex items-center gap-4">
                                                <a
                                                    href="/help"
                                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-4 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 hover:text-slate-900 bg-white/50 hover:bg-white hover:shadow-lg transition-all"
                                                >
                                                    <HelpCircle size={16} />
                                                    Help
                                                </a>
                                                <button
                                                    onClick={handleLogout}
                                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-4 bg-rose-50 text-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] hover:bg-rose-500 hover:text-white transition-all shadow-sm hover:shadow-rose-500/30"
                                                >
                                                    <LogOut size={16} />
                                                    Sign Out
                                                </button>
                                            </div>

                                            <div className="flex justify-center gap-6 mt-6">
                                                {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                                                    <a
                                                        key={i}
                                                        href="#"
                                                        className="w-8 h-8 rounded-full bg-transparent flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all hover:scale-110"
                                                    >
                                                        <Icon size={18} />
                                                    </a>
                                                ))}
                                            </div>
                                            <div className="text-center mt-4 pb-2">
                                                <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                                                    BookMyBike v2.4.0
                                                </p>
                                            </div>
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
