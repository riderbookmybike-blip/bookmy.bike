'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User,
    Mail,
    MapPin,
    ShieldCheck,
    Share2,
    Copy,
    Check,
    ChevronRight,
    Clock,
    FileText,
    Activity,
    Package,
    Gem,
    TrendingUp,
    Camera,
    Facebook,
    Instagram,
    MessageCircle,
    Plus,
    Save,
    PhoneCall,
    Home,
    Briefcase,
    Fingerprint,
    Shield,
    Smartphone,
    Map as MapIcon,
    AlertCircle,
    Building2,
    Users,
    LayoutDashboard,
    Star,
} from 'lucide-react';
import { useDealerSession } from '@/hooks/useDealerSession';
import { Logo } from '@/components/brand/Logo';
import { MarketplaceHeader } from '@/components/layout/MarketplaceHeader';
import { MarketplaceFooter } from '@/components/layout/MarketplaceFooter';
import { updateMemberProfile } from '@/actions/profileActions';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { LocationPicker } from '@/components/store/LocationPicker';
import dynamic from 'next/dynamic';
const LoginSidebar = dynamic(() => import('@/components/auth/LoginSidebar'), { ssr: false });
import { getDefaultAvatar } from '@/lib/avatars';
import { formatMembershipCardCode } from '@/lib/oclub/membershipCardIdentity';

interface ProfileClientProps {
    user: any;
    member: any;
    memberships: any[];
    quotes: any[];
    addresses: any[];
    initialTab?: 'QUOTES' | 'BOOKINGS' | 'PAYMENTS' | 'INVOICES';
}

export default function ProfileClient({
    user,
    member,
    memberships,
    quotes,
    addresses,
    initialTab = 'QUOTES',
}: ProfileClientProps) {
    const [copied, setCopied] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [localMember, setLocalMember] = useState(member || {});
    const [localAddresses, setLocalAddresses] = useState(addresses || []);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [showLocationPickerForProfile, setShowLocationPickerForProfile] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const allowedTabs = new Set(['QUOTES', 'BOOKINGS', 'PAYMENTS', 'INVOICES']);
    const safeInitialTab = allowedTabs.has(String(initialTab).toUpperCase())
        ? String(initialTab).toUpperCase()
        : 'QUOTES';
    const [activeTab, setActiveTab] = useState(safeInitialTab);
    const [originalMember, setOriginalMember] = useState(member || {});
    const [originalAddresses, setOriginalAddresses] = useState(addresses || []);

    // Dealer Session Hook (Placeholder for Phase 3 resolution)
    const { activeTenantId } = useDealerSession();

    // Filter DEALER type memberships only
    const dealerMemberships = (memberships || []).filter(
        (m: any) => m.tenant_type === 'DEALER' && m.status === 'ACTIVE'
    );

    // Sync local state if prop changes
    React.useEffect(() => {
        setLocalMember(member || {});
        setOriginalMember(member || {});
    }, [member]);

    React.useEffect(() => {
        setLocalAddresses(addresses || []);
        setOriginalAddresses(addresses || []);
    }, [addresses]);

    // Real-time Subscription
    React.useEffect(() => {
        if (!member?.id) return;

        const supabase = createClient();
        const channel = supabase
            .channel(`member_${member.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'id_members',
                    filter: `id=eq.${member.id}`,
                },
                payload => {
                    // console.log('[Realtime] Profile updated:', payload.new);
                    setLocalMember(payload.new);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [member?.id]);

    const normalizePhone = (phone: string) => {
        const clean = (phone || '').replace(/\D/g, '');
        return clean.length >= 10 ? clean.slice(-10) : clean;
    };

    const handleSaveChanges = async () => {
        if (!member?.id) {
            toast.error('Identity record not found');
            return;
        }

        setIsSaving(true);
        try {
            // 1. Normalize phones
            const memberToSave = {
                ...localMember,
                whatsapp: normalizePhone(localMember.whatsapp),
                primary_phone: normalizePhone(localMember.primary_phone),
            };

            // 2. Save Member Profile
            await updateMemberProfile(member.id, memberToSave);

            // 3. Save Addresses (Later: parallelize if multiple)
            // For now, assume we only handle the addresses in localAddresses
            // (Minimal implementation for Step 2)

            setOriginalMember(memberToSave);
            setLocalMember(memberToSave);
            setIsEditMode(false);
            toast.success('Jan Kundali updated successfully');
        } catch (err) {
            toast.error('Sync failed');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setLocalMember(originalMember);
        setLocalAddresses(originalAddresses);
        setIsEditMode(false);
    };

    const handleUpdateField = (field: string, value: any) => {
        setLocalMember((prev: any) => ({ ...prev, [field]: value }));
    };

    const displayName =
        user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
    const initials = displayName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase();
    const avatarUrl = user?.user_metadata?.avatar_url;
    const membershipId = member?.display_id ? formatMembershipCardCode(member.display_id) : 'PENDING';

    const handleCopyCode = () => {
        navigator.clipboard.writeText(membershipId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleInviteFriend = async () => {
        const shareUrl = `${window.location.origin}?ref=${membershipId}`;
        const shareData = {
            title: "Join The O' Circle at BookMyBike",
            text: `Hey! Join me on BookMyBike and get exclusive O' Circle benefits on your next bike booking. Use my O' Circle Membership ID: ${membershipId}`,
            url: shareUrl,
        };

        if (navigator.share && navigator.canShare(shareData)) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.error('Error sharing:', err);
            }
        } else {
            // Fallback: Copy link and message to clipboard
            const message = `${shareData.text}\nCheck it out here: ${shareUrl}`;
            navigator.clipboard.writeText(message);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            alert('Referral message copied to clipboard!');
        }
    };

    const handleSocialShare = (platform: string) => {
        const shareUrl = `${window.location.origin}?ref=${membershipId}`;
        const shareText = `Hey! Join me on BookMyBike and get exclusive O' Circle benefits on your next bike booking. Use my O' Circle Membership ID: ${membershipId}`;
        const fullMessage = `${shareText}\n${shareUrl}`;

        const encodedText = encodeURIComponent(fullMessage);
        const encodedUrl = encodeURIComponent(shareUrl);

        switch (platform) {
            case 'whatsapp':
                window.open(`https://wa.me/?text=${encodedText}`, '_blank');
                break;
            case 'facebook':
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank');
                break;
            case 'instagram':
                // Instagram doesn't have a direct share URL, so we copy and alert
                navigator.clipboard.writeText(fullMessage);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
                alert('Share message copied! Open Instagram to paste and share with friends.');
                break;
        }
    };

    // Group quotes by status
    const quotesByStatus = quotes.reduce((acc: any, q: any) => {
        const status = q.status || 'DRAFT';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {});

    const statusConfig: any = {
        DRAFT: { color: 'text-slate-400', bg: 'bg-slate-400/10', icon: Clock },
        IN_REVIEW: { color: 'text-amber-500', bg: 'bg-amber-500/10', icon: Clock },
        APPROVED: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: ShieldCheck },
        DENIED: { color: 'text-rose-500', bg: 'bg-rose-500/10', icon: Package },
        CONFIRMED: { color: 'text-indigo-500', bg: 'bg-indigo-500/10', icon: FileText },
        REJECTED: { color: 'text-rose-500', bg: 'bg-rose-500/10', icon: Package },
        CANCELED: { color: 'text-rose-500', bg: 'bg-rose-500/10', icon: Package },
        SUPERSEDED: { color: 'text-slate-400', bg: 'bg-slate-400/10', icon: FileText },
        EXPIRED: { color: 'text-rose-500', bg: 'bg-rose-500/10', icon: Package },
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#fffdf5] via-white to-slate-50 font-sans">
            <MarketplaceHeader onLoginClick={() => setIsLoginOpen(true)} />

            <motion.div
                className="page-container py-32 md:py-40"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Hero Section */}
                <motion.div variants={itemVariants} className="mb-12">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left">
                            <div className="relative group">
                                <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2.5rem] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl md:text-5xl font-black text-white shadow-2xl shadow-indigo-500/20 ring-4 ring-white overflow-hidden">
                                    <img
                                        src={avatarUrl || getDefaultAvatar(user?.id || 'anon', displayName)}
                                        alt={displayName}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-2xl border border-slate-200 shadow-lg flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-colors">
                                    <Camera size={18} />
                                </button>
                            </div>
                            <div className="space-y-1">
                                <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900 uppercase italic scale-y-110 origin-left">
                                    {displayName.split(' ')[0]}'S <span className="text-indigo-600">PROFILE</span>
                                </h1>
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-4">
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                                        <Mail size={12} className="text-indigo-500" />
                                        {user?.email}
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                                        <Shield size={12} className="text-emerald-500" />
                                        O&apos; Circle Membership ID: {membershipId}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {!isEditMode ? (
                                <button
                                    onClick={() => setIsEditMode(true)}
                                    className="px-8 py-3 rounded-2xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2"
                                >
                                    <User size={16} />
                                    Edit Profile
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={handleCancelEdit}
                                        className="px-8 py-3 rounded-2xl bg-slate-100 text-slate-500 text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveChanges}
                                        disabled={isSaving}
                                        className="px-8 py-3 rounded-2xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {isSaving ? (
                                            <Activity size={16} className="animate-spin" />
                                        ) : (
                                            <Save size={16} />
                                        )}
                                        Save Changes
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Workspace Section */}
                {dealerMemberships.length > 0 && (
                    <motion.div variants={itemVariants} className="mb-12">
                        <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-[40px] p-8 md:p-12 border border-indigo-100 shadow-xl relative overflow-hidden">
                            {/* Background Pattern */}
                            <div className="absolute inset-0 opacity-5">
                                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full blur-[100px]" />
                            </div>

                            <div className="relative z-10">
                                {/* Header with Toggle */}
                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
                                    <div>
                                        <h3 className="text-xl font-black uppercase tracking-tighter italic text-slate-900 flex items-center gap-3">
                                            <Building2 size={24} className="text-orange-500" />
                                            Work<span className="text-orange-500">space</span>
                                        </h3>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                                            Select a workspace to access the dashboard
                                        </p>
                                    </div>
                                </div>

                                {/* Dealership Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {dealerMemberships.map((m: any) => {
                                        return (
                                            <div
                                                key={m.id}
                                                className="group p-6 rounded-3xl border bg-white border-indigo-100 hover:border-indigo-200 transition-all"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black bg-indigo-600 text-white">
                                                            {m.studio_id || m.tenant_name?.charAt(0) || '?'}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
                                                                {m.tenant_name}
                                                            </p>
                                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                                                                {m.studio_id && `${m.studio_id} • `}
                                                                {m.district_name || m.role}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <a
                                                            href={`/app/${m.tenant_slug}/dashboard`}
                                                            className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all"
                                                            title="Go to Dashboard"
                                                        >
                                                            <LayoutDashboard size={16} />
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Jan Kundali: Primary Matrix */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                    {/* Personal Matrix */}
                    <motion.div
                        variants={itemVariants}
                        className="lg:col-span-2 bg-white rounded-[40px] p-8 md:p-12 border border-slate-200 shadow-sm"
                    >
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tighter italic text-slate-900 flex items-center gap-3">
                                    <User size={24} className="text-indigo-600" />
                                    Personal <span className="text-indigo-600">Matrix</span>
                                </h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                    Foundational Identity Details
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
                                    Full Name (On Documents)
                                </label>
                                <input
                                    type="text"
                                    value={localMember.full_name || ''}
                                    onChange={e => handleUpdateField('full_name', e.target.value)}
                                    disabled={!isEditMode}
                                    placeholder="Enter full name"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-300 disabled:opacity-50"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
                                    Date of Birth
                                </label>
                                <input
                                    type="date"
                                    value={localMember.date_of_birth || ''}
                                    onChange={e => handleUpdateField('date_of_birth', e.target.value)}
                                    disabled={!isEditMode}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all disabled:opacity-50"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
                                    Father's Name
                                </label>
                                <input
                                    type="text"
                                    value={localMember.father_name || ''}
                                    onChange={e => handleUpdateField('father_name', e.target.value)}
                                    disabled={!isEditMode}
                                    placeholder="Father's full name"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-300 disabled:opacity-50"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
                                    Mother's Name
                                </label>
                                <input
                                    type="text"
                                    value={localMember.mother_name || ''}
                                    onChange={e => handleUpdateField('mother_name', e.target.value)}
                                    disabled={!isEditMode}
                                    placeholder="Mother's full name"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-300 disabled:opacity-50"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
                                    Religion
                                </label>
                                <select
                                    value={localMember.religion || ''}
                                    onChange={e => handleUpdateField('religion', e.target.value)}
                                    disabled={!isEditMode}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                >
                                    <option value="">Select Religion</option>
                                    <option value="HINDU">HINDU</option>
                                    <option value="MUSLIM">MUSLIM</option>
                                    <option value="CHRISTIAN">CHRISTIAN</option>
                                    <option value="SIKH">SIKH</option>
                                    <option value="JAIN">JAIN</option>
                                    <option value="BUDDHIST">BUDDHIST</option>
                                    <option value="OTHER">OTHER</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
                                    Social Category
                                </label>
                                <select
                                    value={localMember.category || ''}
                                    onChange={e => handleUpdateField('category', e.target.value)}
                                    disabled={!isEditMode}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                >
                                    <option value="">Select Category</option>
                                    <option value="GENERAL">GENERAL</option>
                                    <option value="OBC">OBC</option>
                                    <option value="SC">SC</option>
                                    <option value="ST">ST</option>
                                    <option value="EWS">EWS</option>
                                </select>
                            </div>
                        </div>
                    </motion.div>

                    {/* Communication Hub */}
                    <motion.div
                        variants={itemVariants}
                        className="lg:col-span-1 bg-white rounded-[40px] p-8 md:p-12 text-slate-900 relative overflow-hidden shadow-xl border border-slate-200"
                    >
                        <div className="absolute top-0 right-0 p-12 opacity-5">
                            <Smartphone size={160} />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-xl font-black uppercase tracking-tighter italic mb-8 flex items-center gap-3 text-slate-900">
                                <PhoneCall size={24} className="text-indigo-400" />
                                Comms <span className="text-indigo-400">Hub</span>
                            </h3>

                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            Login Phone (Auth)
                                        </p>
                                        <Shield size={12} className="text-emerald-500" />
                                    </div>
                                    <div className="bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700">
                                        {(() => {
                                            const phone = user?.phone || member?.primary_phone || '';
                                            // Extract only last 10 digits (remove +91, 91, etc.)
                                            const digits = phone.replace(/\D/g, '');
                                            return digits.length >= 10 ? digits.slice(-10) : phone || 'NOT SET';
                                        })()}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        WhatsApp Number
                                    </p>
                                    <input
                                        type="tel"
                                        value={localMember.whatsapp || ''}
                                        onChange={e => handleUpdateField('whatsapp', e.target.value)}
                                        disabled={!isEditMode}
                                        placeholder="WhatsApp number"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Alternate Phone
                                    </p>
                                    <input
                                        type="tel"
                                        value={localMember.primary_phone || ''}
                                        onChange={e => handleUpdateField('primary_phone', e.target.value)}
                                        disabled={!isEditMode}
                                        placeholder="Secondary contact"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Alternate Email
                                    </p>
                                    <input
                                        type="email"
                                        value={localMember.primary_email || ''}
                                        onChange={e => handleUpdateField('primary_email', e.target.value)}
                                        disabled={!isEditMode}
                                        placeholder="Backup email"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400"
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Location Matrix */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white rounded-[40px] p-8 md:p-12 border border-slate-200 shadow-sm mb-12"
                >
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tighter italic text-slate-900 flex items-center gap-3">
                                <MapPin size={24} className="text-emerald-600" />
                                Location <span className="text-emerald-600">Matrix</span>
                            </h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                GPS Coordinates & Service Area Details
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* GPS Coordinates */}
                        <div className="md:col-span-3 p-6 rounded-3xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200">
                            <div className="flex items-center gap-3 mb-4">
                                <MapPin size={20} className="text-emerald-600" />
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                                    GPS Coordinates (Signup Location)
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                        Latitude
                                    </label>
                                    <div className="bg-white border border-emerald-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 font-mono">
                                        {localMember.latitude?.toFixed(6) || '—'}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                        Longitude
                                    </label>
                                    <div className="bg-white border border-emerald-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 font-mono">
                                        {localMember.longitude?.toFixed(6) || '—'}
                                    </div>
                                </div>
                            </div>
                            {localMember.latitude && localMember.longitude && (
                                <a
                                    href={`https://www.google.com/maps?q=${localMember.latitude},${localMember.longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-4 inline-flex items-center gap-2 text-[10px] font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-widest transition-colors"
                                >
                                    <MapIcon size={12} />
                                    View on Google Maps →
                                </a>
                            )}
                        </div>

                        {/* Pincode */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
                                Pincode
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={localMember.pincode || ''}
                                    onChange={e =>
                                        handleUpdateField('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))
                                    }
                                    disabled={!isEditMode}
                                    placeholder="6-digit pincode"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-slate-300 disabled:opacity-50"
                                />
                                {localMember.pincode && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <span className="text-[8px] font-black bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                            GPS
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* State */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
                                State
                            </label>
                            <input
                                type="text"
                                value={localMember.state || ''}
                                onChange={e => handleUpdateField('state', e.target.value)}
                                disabled={!isEditMode}
                                placeholder="State"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-slate-300 disabled:opacity-50"
                            />
                        </div>

                        {/* District */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
                                District
                            </label>
                            <input
                                type="text"
                                value={localMember.district || ''}
                                onChange={e => handleUpdateField('district', e.target.value)}
                                disabled={!isEditMode}
                                placeholder="District"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-slate-300 disabled:opacity-50"
                            />
                        </div>

                        {/* Taluka */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
                                Taluka
                            </label>
                            <input
                                type="text"
                                value={localMember.taluka || ''}
                                onChange={e => handleUpdateField('taluka', e.target.value)}
                                disabled={!isEditMode}
                                placeholder="Taluka/Tehsil"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-slate-300 disabled:opacity-50"
                            />
                        </div>

                        {/* Area (if captured) */}
                        {localMember.area && (
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
                                    Area/Locality
                                </label>
                                <input
                                    type="text"
                                    value={localMember.area || ''}
                                    onChange={e => handleUpdateField('area', e.target.value)}
                                    disabled={!isEditMode}
                                    placeholder="Area/Locality"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-slate-300 disabled:opacity-50"
                                />
                            </div>
                        )}
                    </div>

                    {/* Enrichment Button for Incomplete Data */}
                    {localMember.pincode && (!localMember.state || !localMember.district || !localMember.taluka) && (
                        <div className="mt-6 p-6 rounded-3xl bg-blue-50 border border-blue-200">
                            <div className="flex items-start gap-3">
                                <MapPin size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-blue-600">Incomplete Location Data</p>
                                    <p className="text-xs font-medium text-slate-600 mt-1">
                                        We have your pincode ({localMember.pincode}) but state/district/taluka details
                                        are missing. Click below to auto-fill these details.
                                    </p>
                                    <button
                                        onClick={async () => {
                                            try {
                                                toast.loading('Fetching location details...', { id: 'enrich' });
                                                const { getPincodeDetails } = await import('@/actions/pincode');
                                                const result = await getPincodeDetails(localMember.pincode!);

                                                if (result.success && result.data) {
                                                    handleUpdateField('state', result.data.state || '');
                                                    handleUpdateField('district', result.data.district || '');
                                                    handleUpdateField('taluka', result.data.taluka || '');
                                                    handleUpdateField('area', result.data.area || '');
                                                    toast.success('Location details updated!', {
                                                        id: 'enrich',
                                                    });
                                                } else {
                                                    toast.error('Could not fetch location details', {
                                                        id: 'enrich',
                                                    });
                                                }
                                            } catch (err) {
                                                toast.error('Failed to enrich location data', { id: 'enrich' });
                                            }
                                        }}
                                        className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-colors"
                                    >
                                        Enrich Location Data
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {!localMember.latitude && !localMember.longitude && (
                        <div className="mt-6 p-6 rounded-3xl bg-amber-50 border border-amber-200">
                            <div className="flex items-start gap-3">
                                <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-amber-600">GPS Location Not Captured</p>
                                    <p className="text-xs font-medium text-slate-600 mt-1">
                                        {localMember.pincode
                                            ? `Pincode ${localMember.pincode} is set, but GPS was not captured at signup.`
                                            : 'No location signal found for your account. Add your pincode to unlock accurate pricing and offers.'}
                                    </p>
                                    <button
                                        onClick={() => setShowLocationPickerForProfile(true)}
                                        className="mt-3 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-colors"
                                    >
                                        📍 Update Location
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Inline LocationPicker for profile update */}
                    <LocationPicker
                        isOpen={showLocationPickerForProfile}
                        onClose={() => setShowLocationPickerForProfile(false)}
                        initialPincode={localMember.pincode || ''}
                        onLocationSet={async (pincode: string, taluka: string) => {
                            // Enrich pincode → state/district
                            const { getPincodeDetails } = await import('@/actions/pincode');
                            const enriched = await getPincodeDetails(pincode);
                            const { updateSelfMemberLocation } = await import('@/actions/members');
                            await updateSelfMemberLocation({
                                pincode,
                                taluka: taluka || enriched.data?.taluka || '',
                                district: enriched.data?.district || '',
                                state: enriched.data?.state || '',
                            });
                            handleUpdateField('pincode', pincode);
                            handleUpdateField('district', enriched.data?.district || '');
                            handleUpdateField('taluka', taluka || enriched.data?.taluka || '');
                            handleUpdateField('state', enriched.data?.state || '');
                            setShowLocationPickerForProfile(false);
                        }}
                    />
                </motion.div>

                {/* Jan Kundali: Address & Vault Matrix */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                    {/* Address Portfolio */}
                    <motion.div
                        variants={itemVariants}
                        className="lg:col-span-2 bg-white rounded-[40px] p-8 md:p-12 border border-slate-200 shadow-sm"
                    >
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tighter italic text-slate-900 flex items-center gap-3">
                                    <MapIcon size={24} className="text-orange-500" />
                                    Address <span className="text-orange-500">Portfolio</span>
                                </h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                    Labeled Delivery & Registration Hub
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {localAddresses.length > 0 ? (
                                localAddresses.map((addr: any) => (
                                    <div
                                        key={addr.id}
                                        className="p-6 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div
                                                className={`w-12 h-12 rounded-2xl flex items-center justify-center ${addr.is_current ? 'bg-orange-500/10 text-orange-500' : 'bg-indigo-500/10 text-indigo-500'}`}
                                            >
                                                {addr.is_current ? <Home size={20} /> : <Shield size={20} />}
                                            </div>
                                            <div>
                                                <p className="text-[12px] font-black uppercase text-slate-900 tracking-tight">
                                                    {addr.label}{' '}
                                                    {addr.is_current && (
                                                        <span className="ml-2 text-[8px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500">
                                                            CURRENT
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest line-clamp-1">
                                                    {addr.line1}, {addr.pincode}
                                                </p>
                                            </div>
                                        </div>
                                        <button className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 opacity-0 group-hover:opacity-100 transition-all">
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-[32px]">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        No addresses on portfolio
                                    </p>
                                    <button className="mt-4 px-6 py-2 rounded-xl bg-orange-500 text-white text-[9px] font-black uppercase tracking-widest hover:bg-orange-400 transition-all">
                                        Add New Entry
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Identity Vault */}
                    <motion.div
                        variants={itemVariants}
                        className="lg:col-span-1 bg-white rounded-[40px] p-8 md:p-12 border border-slate-200 shadow-sm"
                    >
                        <h3 className="text-xl font-black uppercase tracking-tighter italic mb-8 flex items-center gap-3 text-slate-900">
                            <Fingerprint size={24} className="text-emerald-500" />
                            Identity <span className="text-emerald-500">Vault</span>
                        </h3>

                        <div className="space-y-10">
                            {/* Aadhaar Vault */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Aadhaar Number
                                    </p>
                                    {localMember.aadhaar_number ? (
                                        <span className="text-[8px] font-black bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                            VERIFIED
                                        </span>
                                    ) : (
                                        <span className="text-[8px] font-black bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full border border-amber-500/20">
                                            REQUIRED
                                        </span>
                                    )}
                                </div>
                                <div className="relative group">
                                    <input
                                        type="password"
                                        value={localMember.aadhaar_number || ''}
                                        onChange={e =>
                                            setLocalMember({ ...localMember, aadhaar_number: e.target.value })
                                        }
                                        onBlur={e =>
                                            handleUpdateField('aadhaar_number', e.target.value.replace(/\s/g, ''))
                                        }
                                        placeholder="XXXX XXXX XXXX"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-slate-300"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-white border border-slate-200 text-slate-400 cursor-pointer">
                                        <Activity size={14} />
                                    </div>
                                </div>
                                <button className="w-full py-4 rounded-2xl border border-dashed border-slate-200 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all flex flex-col items-center justify-center gap-2 group">
                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-colors">
                                        <Plus size={18} />
                                    </div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover:text-emerald-500 transition-colors">
                                        Upload Aadhaar Front
                                    </p>
                                </button>
                            </div>

                            {/* PAN Vault */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        PAN Number
                                    </p>
                                    {localMember.pan_number ? (
                                        <span className="text-[8px] font-black bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                            VERIFIED
                                        </span>
                                    ) : (
                                        <span className="text-[8px] font-black bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full border border-amber-500/20">
                                            REQUIRED
                                        </span>
                                    )}
                                </div>
                                <input
                                    type="text"
                                    value={localMember.pan_number || ''}
                                    onChange={e =>
                                        setLocalMember({ ...localMember, pan_number: e.target.value.toUpperCase() })
                                    }
                                    onBlur={e => handleUpdateField('pan_number', e.target.value.toUpperCase())}
                                    placeholder="ABCDE1234F"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-slate-300"
                                />
                                <button className="w-full py-4 rounded-2xl border border-dashed border-slate-200 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all flex flex-col items-center justify-center gap-2 group">
                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-colors">
                                        <Plus size={18} />
                                    </div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover:text-emerald-500 transition-colors">
                                        Upload PAN Card
                                    </p>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Transaction Registry (Full Width) */}
                <motion.div variants={itemVariants} className="mb-24">
                    <div className="bg-white rounded-[40px] border border-slate-200 shadow-2xl overflow-hidden">
                        {/* Registry Navigation */}
                        <div className="flex flex-wrap items-center justify-between p-8 border-b border-slate-100">
                            <div className="flex items-center gap-4 mb-4 sm:mb-0">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                                    <TrendingUp size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tighter italic text-slate-900">
                                        Transaction <span className="text-indigo-600">Registry</span>
                                    </h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        Unified Commercial Log
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl">
                                {['QUOTES', 'BOOKINGS', 'PAYMENTS', 'INVOICES'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                            activeTab === tab
                                                ? 'bg-white text-indigo-600 shadow-sm'
                                                : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Registry Content */}
                        <div className="p-8">
                            <AnimatePresence mode="wait">
                                {activeTab === 'QUOTES' && (
                                    <motion.div
                                        key="quotes"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-4"
                                    >
                                        {quotes.length > 0 ? (
                                            quotes.map((q: any) => (
                                                <div
                                                    key={q.id}
                                                    className="group p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:border-indigo-500/20 transition-all"
                                                >
                                                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                                                                <FileText size={24} />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-black uppercase tracking-tight text-slate-900">
                                                                    {q.commercials?.label || 'Vehicle Quote'}
                                                                </p>
                                                                <div className="flex items-center gap-3 mt-1.5">
                                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white px-2 py-0.5 rounded-lg border border-slate-100">
                                                                        {q.display_id}
                                                                    </span>
                                                                    <span
                                                                        className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${statusConfig[q.status]?.bg || 'bg-slate-100'} ${statusConfig[q.status]?.color || 'text-slate-500'}`}
                                                                    >
                                                                        {q.status}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-wrap items-center gap-8 md:gap-12 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-slate-200/50">
                                                            <div className="space-y-1">
                                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                                                    Base Price
                                                                </p>
                                                                <p className="text-sm font-bold text-slate-700">
                                                                    ₹{' '}
                                                                    {Number(q.ex_showroom_price || 0).toLocaleString(
                                                                        'en-IN'
                                                                    )}
                                                                </p>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-[#FF5F1F]">
                                                                    Grand Total
                                                                </p>
                                                                <p className="text-lg font-black text-[#FF5F1F]">
                                                                    ₹{' '}
                                                                    {Number(q.on_road_price || 0).toLocaleString(
                                                                        'en-IN'
                                                                    )}
                                                                </p>
                                                            </div>
                                                            <button className="flex-1 md:flex-none px-6 py-3 rounded-2xl bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-900 hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                                                                View Details
                                                                <ChevronRight size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-24">
                                                <FileText size={48} className="mx-auto text-slate-200 mb-4" />
                                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                                    No commercial quotes found
                                                </p>
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {activeTab === 'BOOKINGS' && (
                                    <motion.div
                                        key="bookings"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="text-center py-24"
                                    >
                                        <Package size={48} className="mx-auto text-slate-200 mb-4" />
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                            No active bookings detected
                                        </p>
                                    </motion.div>
                                )}

                                {/* Payments & Invoices Placeholders */}
                                {['PAYMENTS', 'INVOICES'].includes(activeTab) && (
                                    <motion.div
                                        key={activeTab}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="text-center py-24"
                                    >
                                        <ShieldCheck size={48} className="mx-auto text-slate-200 mb-4" />
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                            No {activeTab.toLowerCase()} recorded yet
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            <MarketplaceFooter />
            <LoginSidebar isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} variant="RETAIL" />
        </div>
    );
}
