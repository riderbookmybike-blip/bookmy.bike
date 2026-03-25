'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    Bike,
    Briefcase,
    CalendarClock,
    Camera,
    CreditCard,
    FileText,
    Home,
    IdCard,
    ImagePlus,
    Loader2,
    MapPin,
    Phone,
    Receipt,
    Save,
    ShieldCheck,
    Sparkles,
    User,
} from 'lucide-react';
import { getDefaultAvatar } from '@/lib/avatars';
import { updateSelfMemberCanonical, uploadMemberImage } from '@/actions/members';
import { formatMembershipCardCode } from '@/lib/oclub/membershipCardIdentity';
import { toast } from 'sonner';
import { ImageCropModal } from '@/components/image/ImageCropModal';
import type { ImageCropVariant } from '@/components/image/ImageCropModal';

type MemberHubClientProps = {
    user: any;
    member: any;
    quotes: any[];
    bookings: any[];
    payments: any[];
    memberDocuments: any[];
    wallet: any | null;
    ledger: any[];
    memberContacts: any[];
    memberAddresses: any[];
    activityTimeline?: any[];
};

const formatINR = (n: number | null | undefined) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const formatDate = (v: string | null | undefined) => {
    if (!v) return '—';
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const mask = (v: string | null | undefined, keep = 4) => {
    const raw = String(v || '').trim();
    if (!raw) return '—';
    if (raw.length <= keep) return raw;
    return `${'•'.repeat(Math.max(0, raw.length - keep))}${raw.slice(-keep)}`;
};

type TabId = 'profile' | 'quotes' | 'bookings' | 'referral' | 'documents' | 'notes' | 'timeline';

export default function MemberHubClient({
    user,
    member,
    quotes,
    bookings,
    payments,
    memberDocuments,
    wallet,
    ledger,
    memberContacts,
    memberAddresses,
    activityTimeline = [],
}: MemberHubClientProps) {
    const basePreferences = (
        member?.preferences && typeof member.preferences === 'object' ? member.preferences : {}
    ) as any;

    // ── State ──
    const [activeTab, setActiveTab] = useState<TabId>('profile');
    const [fullName, setFullName] = useState(member?.full_name || '');
    const [primaryPhone, setPrimaryPhone] = useState(member?.primary_phone || '');
    const [whatsapp, setWhatsapp] = useState(member?.whatsapp || '');
    const [dob, setDob] = useState(member?.date_of_birth || '');
    const [anniversary, setAnniversary] = useState(basePreferences?.anniversary_date || '');
    const [fatherName, setFatherName] = useState(member?.father_name || '');
    const [motherName, setMotherName] = useState(member?.mother_name || '');
    const [workCompany, setWorkCompany] = useState(member?.work_company || '');
    const [workDesignation, setWorkDesignation] = useState(member?.work_designation || '');
    const [coverImageUrl, setCoverImageUrl] = useState<string>(basePreferences?.cover_image_url || '');
    const [isSaving, setIsSaving] = useState(false);
    const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(member?.avatar_url || null);

    // Crop modal state
    const [cropSrc, setCropSrc] = useState<string | null>(null);
    const [cropVariant, setCropVariant] = useState<ImageCropVariant>('avatar');
    const [isUploading, setIsUploading] = useState(false);

    const avatarInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    const profileImage =
        localAvatarUrl || getDefaultAvatar(user?.id || 'anon', fullName || member?.full_name || 'Member');

    // Create client inside the component so it always runs in the browser
    // after hydration — ensuring the auth session cookie is present.
    const supabase = useMemo(() => createClient(), []);

    const totalAvailableCoins = useMemo(() => {
        if (!wallet) return 0;
        return (
            Number(wallet.available_system || 0) +
            Number(wallet.available_referral || 0) +
            Number(wallet.available_sponsored || 0)
        );
    }, [wallet]);

    const identityDocs = [
        {
            id: 'aadhaar-front',
            title: 'Aadhaar Front',
            previewUrl: member?.aadhaar_front || null,
            value: mask(member?.aadhaar_number),
            status: member?.aadhaar_front ? 'Uploaded' : 'Pending',
        },
        {
            id: 'pan-card',
            title: 'PAN Card',
            previewUrl: member?.pan_card_url || null,
            value: mask(member?.pan_number),
            status: member?.pan_card_url ? 'Uploaded' : 'Pending',
        },
    ];

    const bookingDocs = bookings.map((b: any) => ({
        id: `booking-${b.id}`,
        title: `${b.display_id || 'Booking'} Documents`,
        status: b.status || 'PENDING',
        metadata: [
            `Delivery: ${formatDate(b.delivery_date)}`,
            `RTO Receipt: ${b.rto_receipt_number || '—'}`,
            `Insurance Policy: ${b.insurance_policy_number || '—'}`,
            `VIN: ${b.vin_number || '—'}`,
        ],
    }));

    // ── Tab definitions ──
    const tabs: { id: TabId; label: string; Icon: React.FC<{ size?: number; className?: string }>; count?: number }[] =
        [
            { id: 'profile', label: 'Profile', Icon: User, count: undefined },
            { id: 'quotes', label: 'Quotes', Icon: FileText, count: quotes.length },
            { id: 'bookings', label: 'Bookings', Icon: Bike, count: bookings.length },
            { id: 'referral', label: "O'Circle", Icon: Sparkles, count: ledger.length || undefined },
            { id: 'documents', label: 'Documents', Icon: IdCard, count: memberDocuments.length || undefined },
            { id: 'notes', label: 'Notes', Icon: Receipt, count: undefined },
            {
                id: 'timeline',
                label: 'Timeline',
                Icon: CalendarClock,
                count: activityTimeline.length || undefined,
            },
        ];

    // ── Open file picker → show crop ──
    const openCropForFile = useCallback((file: File, variant: ImageCropVariant) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                setCropSrc(reader.result);
                setCropVariant(variant);
            }
        };
        reader.readAsDataURL(file);
    }, []);

    // ── Upload blob → server action (admin client, bypasses RLS) ──
    const uploadBlob = useCallback(
        async (blob: Blob, variant: ImageCropVariant) => {
            if (!member?.id) {
                toast.error('Member ID missing — please refresh');
                return;
            }
            setIsUploading(true);
            setCropSrc(null);
            try {
                // Convert Blob to base64 using browser-native APIs (Buffer is Node-only)
                const arrayBuffer = await blob.arrayBuffer();
                const uint8 = new Uint8Array(arrayBuffer);
                let binary = '';
                uint8.forEach(b => {
                    binary += String.fromCharCode(b);
                });
                const base64 = btoa(binary);

                const result = await uploadMemberImage(String(member.id), base64, variant);

                if (!result.success) {
                    toast.error(`Upload failed: ${result.error}`);
                    return;
                }

                if (variant === 'avatar') {
                    setLocalAvatarUrl(result.url);
                    toast.success('Profile photo updated ✓');
                } else {
                    setCoverImageUrl(result.url);
                    toast.success('Cover photo updated ✓');
                }
            } catch (err: any) {
                console.error('Upload failed', err);
                toast.error(err?.message || 'Upload failed');
            } finally {
                setIsUploading(false);
            }
        },
        [member]
    );

    // ── Save profile ──
    const handleSaveProfile = async () => {
        if (!member?.id) return;
        setIsSaving(true);
        try {
            const result = await updateSelfMemberCanonical({
                fullName: fullName || undefined,
                primaryPhone: primaryPhone || undefined,
            });
            if (!result.success) {
                toast.error(`Failed to update profile: ${result.error}`);
                return;
            }
            const nextPrefs = {
                ...basePreferences,
                anniversary_date: anniversary || undefined,
                cover_image_url: coverImageUrl || undefined,
            };
            const { error } = await supabase
                .from('id_members')
                .update({
                    whatsapp: whatsapp || null,
                    date_of_birth: dob || null,
                    father_name: fatherName || null,
                    mother_name: motherName || null,
                    work_company: workCompany || null,
                    work_designation: workDesignation || null,
                    preferences: nextPrefs,
                })
                .eq('id', member.id);
            if (error) {
                toast.error(`Save failed: ${error.message}`);
            } else {
                toast.success('Profile updated ✓');
            }
        } catch (error) {
            console.error('Profile save failed', error);
            toast.error('Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    // ── Address sections derived ──
    const aadhaarAddress = [member?.aadhaar_address1, member?.aadhaar_address2].filter(Boolean).join(', ') || null;
    const currentAddress =
        [member?.current_address1, member?.current_address2].filter(Boolean).join(', ') || member?.address || null;
    const altPhones = memberContacts.filter((c: any) => c.contact_type === 'PHONE');
    const altEmails = memberContacts.filter((c: any) => c.contact_type === 'EMAIL');

    return (
        <>
            {/* ── Crop Modal ── */}
            {cropSrc && (
                <ImageCropModal
                    imageSrc={cropSrc}
                    variant={cropVariant}
                    onCancel={() => {
                        setCropSrc(null);
                        if (avatarInputRef.current) avatarInputRef.current.value = '';
                        if (coverInputRef.current) coverInputRef.current.value = '';
                    }}
                    onDone={blob => uploadBlob(blob, cropVariant)}
                />
            )}

            {/* Hidden file inputs */}
            <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) openCropForFile(file, 'avatar');
                    e.target.value = '';
                }}
            />
            <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) openCropForFile(file, 'cover');
                    e.target.value = '';
                }}
            />

            <div className="min-h-screen relative bg-gradient-to-br from-indigo-50/60 via-white to-slate-50 overflow-x-hidden">
                {/* Decorative background blobs */}
                <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-indigo-100/40 blur-[120px]" />
                    <div className="absolute top-1/2 -left-60 w-[500px] h-[500px] rounded-full bg-purple-100/30 blur-[100px]" />
                    <div className="absolute -bottom-40 right-1/4 w-[400px] h-[400px] rounded-full bg-cyan-100/30 blur-[100px]" />
                </div>

                <main className="page-container pt-4 pb-16">
                    {/* ── Hero Card ── */}
                    <section className="rounded-[32px] border border-slate-200/80 bg-white shadow-md overflow-hidden mb-5">
                        {/* Cover Image */}
                        <div
                            className="relative h-44 md:h-56 w-full bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 cursor-pointer group"
                            onClick={() => !isUploading && coverInputRef.current?.click()}
                            style={
                                coverImageUrl
                                    ? {
                                          backgroundImage: `url(${coverImageUrl})`,
                                          backgroundSize: 'cover',
                                          backgroundPosition: 'center',
                                      }
                                    : undefined
                            }
                            title="Click to upload cover photo"
                        >
                            {/* Hover overlay — only shows on hover */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all duration-200 flex items-center justify-center pointer-events-none">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 bg-black/60 text-white text-xs font-black px-4 py-2 rounded-xl backdrop-blur-sm">
                                    {isUploading && cropVariant === 'cover' ? (
                                        <>
                                            <Loader2 size={13} className="animate-spin" /> Uploading…
                                        </>
                                    ) : (
                                        <>
                                            <Camera size={13} /> Change Cover Photo
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Body — avatar straddles cover edge via absolute positioning */}
                        <div className="relative px-6 md:px-8">
                            {/* Avatar */}
                            <div className="absolute -top-14 left-6 md:left-8 group/avatar">
                                <img
                                    src={profileImage}
                                    alt={fullName || 'Member'}
                                    className="w-28 h-28 rounded-[28px] border-4 border-white shadow-xl object-cover bg-white"
                                />
                                {/* Hover-only camera overlay on avatar */}
                                <button
                                    onClick={e => {
                                        e.stopPropagation();
                                        if (!isUploading) avatarInputRef.current?.click();
                                    }}
                                    disabled={isUploading}
                                    className="absolute inset-0 rounded-[24px] bg-black/0 group-hover/avatar:bg-black/40 transition-all flex items-center justify-center text-white opacity-0 group-hover/avatar:opacity-100 disabled:cursor-default"
                                    title="Upload profile photo — 400×400px recommended"
                                >
                                    {isUploading && cropVariant === 'avatar' ? (
                                        <Loader2 size={20} className="animate-spin" />
                                    ) : (
                                        <Camera size={20} />
                                    )}
                                </button>
                            </div>

                            {/* Name + coins — pt-16 makes room for the 112px avatar that hangs above */}
                            <div className="pt-16 pb-6 flex flex-col md:flex-row md:items-center gap-4">
                                <div className="flex-1">
                                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 leading-tight">
                                        {fullName || member?.full_name || 'Member Profile'}
                                    </h1>
                                    <p className="text-sm text-slate-400 mt-1.5 flex items-center gap-2">
                                        <span className="font-mono font-bold text-slate-600">
                                            {member?.display_id ? formatMembershipCardCode(member.display_id) : '—'}
                                        </span>
                                        <span className="text-slate-300">•</span>
                                        <span>Joined {formatDate(member?.created_at)}</span>
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3 md:w-[300px]">
                                    <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-3">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                                            Available Coins
                                        </p>
                                        <p className="text-2xl font-black text-emerald-700">
                                            {totalAvailableCoins.toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-3">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">
                                            Lifetime Earned
                                        </p>
                                        <p className="text-2xl font-black text-indigo-700">
                                            {Number(wallet?.lifetime_earned || 0).toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ── Zoho-style Tab Bar ── */}
                    <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border border-slate-200 shadow-sm rounded-2xl overflow-hidden mb-6">
                        <div className="flex">
                            {tabs.map(({ id, label, Icon, count }) => (
                                <button
                                    key={id}
                                    onClick={() => setActiveTab(id)}
                                    className={`flex-1 flex items-center justify-center gap-2 px-2 py-3.5 text-[12px] font-bold whitespace-nowrap border-b-2 transition-all ${
                                        activeTab === id
                                            ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                                            : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                    }`}
                                >
                                    <Icon size={14} />
                                    {label}
                                    {count !== undefined && (
                                        <span
                                            className={`text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                                                activeTab === id
                                                    ? 'bg-indigo-100 text-indigo-600'
                                                    : 'bg-slate-100 text-slate-500'
                                            }`}
                                        >
                                            {count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── Tab Content ── */}
                    <div className="pb-16">
                        {/* ════════ PROFILE ════════ */}
                        {activeTab === 'profile' && (
                            <div className="space-y-5">
                                {/* Basic Info */}
                                <div className="rounded-[24px] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
                                    <div className="flex items-center gap-3 mb-5">
                                        <User size={16} className="text-indigo-600" />
                                        <h2 className="text-base font-black text-slate-900">Basic Information</h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                        <label className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                Full Name
                                            </span>
                                            <input
                                                value={fullName}
                                                onChange={e => setFullName(e.target.value)}
                                                placeholder="Full Name"
                                                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                            />
                                        </label>
                                        <label className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                Primary Phone
                                            </span>
                                            <input
                                                value={primaryPhone}
                                                onChange={e => setPrimaryPhone(e.target.value)}
                                                placeholder="10-digit mobile"
                                                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                            />
                                        </label>
                                        <label className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                WhatsApp
                                            </span>
                                            <input
                                                value={whatsapp}
                                                onChange={e => setWhatsapp(e.target.value)}
                                                placeholder="10-digit WhatsApp"
                                                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                            />
                                        </label>
                                        <label className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                Email
                                            </span>
                                            <input
                                                value={member?.primary_email || user?.email || ''}
                                                disabled
                                                className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm font-semibold text-slate-400"
                                            />
                                        </label>
                                        <label className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                Date of Birth
                                            </span>
                                            <input
                                                type="date"
                                                value={dob}
                                                onChange={e => setDob(e.target.value)}
                                                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                            />
                                        </label>
                                        <label className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                Anniversary
                                            </span>
                                            <input
                                                type="date"
                                                value={anniversary}
                                                onChange={e => setAnniversary(e.target.value)}
                                                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                            />
                                        </label>
                                        <label className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                Father&apos;s Name
                                            </span>
                                            <input
                                                value={fatherName}
                                                onChange={e => setFatherName(e.target.value)}
                                                placeholder="Father's name"
                                                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                            />
                                        </label>
                                        <label className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                Mother&apos;s Name
                                            </span>
                                            <input
                                                value={motherName}
                                                onChange={e => setMotherName(e.target.value)}
                                                placeholder="Mother's name"
                                                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                            />
                                        </label>
                                    </div>

                                    {/* KYC (read-only masked) */}
                                    <div className="mt-5 pt-5 border-t border-slate-100">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                                            KYC Numbers (masked)
                                        </p>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5">
                                                <p className="text-[10px] text-slate-400 mb-0.5">Aadhaar</p>
                                                <p className="text-sm font-black text-slate-700 font-mono">
                                                    {mask(member?.aadhaar_number, 4)}
                                                </p>
                                            </div>
                                            <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5">
                                                <p className="text-[10px] text-slate-400 mb-0.5">PAN</p>
                                                <p className="text-sm font-black text-slate-700 font-mono">
                                                    {mask(member?.pan_number, 4)}
                                                </p>
                                            </div>
                                            <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5">
                                                <p className="text-[10px] text-slate-400 mb-0.5">Pincode</p>
                                                <p className="text-sm font-black text-slate-700">
                                                    {member?.pincode || '—'}
                                                </p>
                                            </div>
                                            <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5">
                                                <p className="text-[10px] text-slate-400 mb-0.5">RTO</p>
                                                <p className="text-sm font-black text-slate-700">
                                                    {(member as any)?.rto || '—'}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="mt-2 text-[10px] text-slate-400">
                                            Sensitive ID numbers are masked. Full values are stored securely and used
                                            for KYC only.
                                        </p>
                                    </div>

                                    <button
                                        onClick={handleSaveProfile}
                                        disabled={isSaving}
                                        className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-xs font-black uppercase tracking-widest text-white disabled:opacity-60 hover:bg-indigo-700 transition-colors"
                                    >
                                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                        {isSaving ? 'Saving...' : 'Save Profile'}
                                    </button>
                                </div>

                                {/* Addresses */}
                                <div className="rounded-[24px] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
                                    <div className="flex items-center gap-3 mb-5">
                                        <MapPin size={16} className="text-indigo-600" />
                                        <h2 className="text-base font-black text-slate-900">Addresses</h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {aadhaarAddress && (
                                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <IdCard size={13} className="text-indigo-400" />
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                        Aadhaar Address
                                                    </p>
                                                </div>
                                                <p className="text-sm font-semibold text-slate-800">{aadhaarAddress}</p>
                                                {member?.aadhaar_pincode && (
                                                    <p className="text-xs text-slate-400 mt-1">
                                                        PIN: {member.aadhaar_pincode}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                        {currentAddress && (
                                            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Home size={13} className="text-indigo-500" />
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">
                                                        Current Address
                                                    </p>
                                                    <span className="ml-auto text-[9px] font-black bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full">
                                                        Current
                                                    </span>
                                                </div>
                                                <p className="text-sm font-semibold text-slate-800">{currentAddress}</p>
                                            </div>
                                        )}
                                        {memberAddresses.map((addr: any) => (
                                            <div
                                                key={addr.id}
                                                className={`rounded-2xl border p-4 ${addr.is_current ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200 bg-slate-50'}`}
                                            >
                                                <div className="flex items-center gap-2 mb-2">
                                                    <MapPin
                                                        size={13}
                                                        className={
                                                            addr.is_current ? 'text-emerald-500' : 'text-slate-400'
                                                        }
                                                    />
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                        {addr.label || 'Address'}
                                                    </p>
                                                    {addr.is_current && (
                                                        <span className="ml-auto text-[9px] font-black bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full">
                                                            Current
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm font-semibold text-slate-800">
                                                    {[addr.line1, addr.line2, addr.line3].filter(Boolean).join(', ')}
                                                </p>
                                                {(addr.taluka || addr.state) && (
                                                    <p className="text-xs text-slate-400 mt-1">
                                                        {[addr.taluka, addr.state, addr.country]
                                                            .filter(Boolean)
                                                            .join(', ')}
                                                    </p>
                                                )}
                                                {addr.pincode && (
                                                    <p className="text-xs text-slate-400">PIN: {addr.pincode}</p>
                                                )}
                                            </div>
                                        ))}
                                        {!aadhaarAddress && !currentAddress && memberAddresses.length === 0 && (
                                            <div className="col-span-full rounded-2xl border-2 border-dashed border-slate-200 py-10 text-center text-slate-400 text-sm">
                                                No addresses on file yet.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Contacts */}
                                <div className="rounded-[24px] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
                                    <div className="flex items-center gap-3 mb-5">
                                        <Phone size={16} className="text-indigo-600" />
                                        <h2 className="text-base font-black text-slate-900">Alternate Contacts</h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Phone size={12} className="text-indigo-500" />
                                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">
                                                    Primary
                                                </p>
                                                <span className="ml-auto text-[9px] font-black bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full">
                                                    Primary
                                                </span>
                                            </div>
                                            <p className="text-sm font-black text-slate-900">
                                                {member?.primary_phone || '—'}
                                            </p>
                                            <p className="text-[11px] text-slate-400 mt-0.5">
                                                {member?.primary_email || user?.email || '—'}
                                            </p>
                                        </div>
                                        {altPhones.map((c: any) => (
                                            <div
                                                key={c.id}
                                                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                                            >
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Phone size={12} className="text-slate-400" />
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                        {c.label || 'Phone'}
                                                    </p>
                                                    {c.verified_at && (
                                                        <span className="ml-auto text-[9px] font-black bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full">
                                                            ✓ Verified
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm font-black text-slate-900">{c.value}</p>
                                            </div>
                                        ))}
                                        {altEmails.map((c: any) => (
                                            <div
                                                key={c.id}
                                                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                                            >
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Phone size={12} className="text-slate-400" />
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                        {c.label || 'Email'}
                                                    </p>
                                                </div>
                                                <p className="text-sm font-semibold text-slate-900 truncate">
                                                    {c.value}
                                                </p>
                                            </div>
                                        ))}
                                        {memberContacts.length === 0 && (
                                            <div className="rounded-2xl border-2 border-dashed border-slate-200 py-8 text-center text-slate-400 text-sm">
                                                No alternate contacts yet.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Work Info */}
                                <div className="rounded-[24px] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
                                    <div className="flex items-center gap-3 mb-5">
                                        <Briefcase size={16} className="text-indigo-600" />
                                        <h2 className="text-base font-black text-slate-900">Work Information</h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                        <label className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                Company
                                            </span>
                                            <input
                                                value={workCompany}
                                                onChange={e => setWorkCompany(e.target.value)}
                                                placeholder="Company / Employer"
                                                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                            />
                                        </label>
                                        <label className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                Designation
                                            </span>
                                            <input
                                                value={workDesignation}
                                                onChange={e => setWorkDesignation(e.target.value)}
                                                placeholder="Job title"
                                                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                            />
                                        </label>
                                        <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5">
                                            <p className="text-[10px] text-slate-400 mb-0.5">Work Phone</p>
                                            <p className="text-sm font-semibold text-slate-700">
                                                {member?.work_phone || '—'}
                                            </p>
                                        </div>
                                        <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5">
                                            <p className="text-[10px] text-slate-400 mb-0.5">Work Email</p>
                                            <p className="text-sm font-semibold text-slate-700 truncate">
                                                {member?.work_email || '—'}
                                            </p>
                                        </div>
                                        {member?.work_address1 && (
                                            <div className="md:col-span-2 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5">
                                                <p className="text-[10px] text-slate-400 mb-0.5">Work Address</p>
                                                <p className="text-sm font-semibold text-slate-700">
                                                    {member.work_address1}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={handleSaveProfile}
                                        disabled={isSaving}
                                        className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-xs font-black uppercase tracking-widest text-white disabled:opacity-60 hover:bg-indigo-700 transition-colors"
                                    >
                                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                        {isSaving ? 'Saving...' : 'Save Profile'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ════════ QUOTES ════════ */}
                        {activeTab === 'quotes' && (
                            <div className="rounded-[24px] border border-slate-200 bg-white shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                                    <FileText size={18} className="text-indigo-600" />
                                    <h2 className="text-lg font-black text-slate-900">Quotes</h2>
                                    <span className="ml-auto text-xs font-bold text-slate-400">
                                        {quotes.length} total
                                    </span>
                                </div>
                                {quotes.length === 0 ? (
                                    <div className="py-20 text-center text-slate-400 text-sm font-semibold">
                                        No quotes yet.
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {quotes.map((q: any) => (
                                            <div
                                                key={q.id}
                                                className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                                            >
                                                <div>
                                                    <p className="text-sm font-black text-slate-900">
                                                        {q.display_id || q.id}
                                                    </p>
                                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                                        {q.crm_leads?.customer_name || '—'} • {formatDate(q.created_at)}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-slate-900">
                                                        {formatINR(q.on_road_price)}
                                                    </p>
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                                                        {q.status || 'DRAFT'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ════════ BOOKINGS ════════ */}
                        {activeTab === 'bookings' && (
                            <div className="rounded-[24px] border border-slate-200 bg-white shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                                    <Bike size={18} className="text-indigo-600" />
                                    <h2 className="text-lg font-black text-slate-900">Bookings</h2>
                                    <span className="ml-auto text-xs font-bold text-slate-400">
                                        {bookings.length} total
                                    </span>
                                </div>
                                {bookings.length === 0 ? (
                                    <div className="py-20 text-center text-slate-400 text-sm font-semibold">
                                        No bookings yet.
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {bookings.map((b: any) => (
                                            <div
                                                key={b.id}
                                                className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                                            >
                                                <div>
                                                    <p className="text-sm font-black text-slate-900">
                                                        {b.display_id || b.id}
                                                    </p>
                                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                                        Delivery: {formatDate(b.delivery_date)} • VIN:{' '}
                                                        {b.vin_number || '—'}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-slate-900">
                                                        {formatINR(b.grand_total)}
                                                    </p>
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                                        {b.status || 'PENDING'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ════════ REFERRAL ════════ */}
                        {activeTab === 'referral' && (
                            <div>
                                <div className="rounded-[24px] border border-slate-200 bg-white shadow-sm overflow-hidden">
                                    <div className="p-5 border-b border-slate-100 flex items-center gap-3">
                                        <Sparkles size={16} className="text-amber-500" />
                                        <h3 className="text-base font-black text-slate-900">O&apos;Circle Privilege</h3>
                                    </div>
                                    {/* Column headers */}
                                    <div className="hidden md:grid grid-cols-[1.2fr_1.2fr_70px_100px_70px_60px_60px_70px] gap-4 px-6 py-3 bg-slate-50 border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                                        <span>Transaction</span>
                                        <span>Notes</span>
                                        <span>Status</span>
                                        <span>Date</span>
                                        <span>Validity</span>
                                        <span className="text-right">Credit</span>
                                        <span className="text-right">Debit</span>
                                        <span className="text-right">Balance</span>
                                    </div>
                                    {ledger.length === 0 ? (
                                        <div className="py-12 text-center text-slate-400 text-sm font-semibold">
                                            No earnings activity yet.
                                        </div>
                                    ) : (
                                        (() => {
                                            const sourceLabel: Record<string, string> = {
                                                SIGNUP: 'Welcome Bonus',
                                                REFERRAL_LEAD: 'Thank you!!!',
                                                REFERRAL_UNLOCK: 'Thank you!!!',
                                            };
                                            const toLabel = (s: string) =>
                                                sourceLabel[s] ??
                                                s
                                                    .toLowerCase()
                                                    .replace(/_/g, ' ')
                                                    .replace(/\b\w/g, c => c.toUpperCase());
                                            const statusMap: Record<string, string> = {
                                                LOCKED: 'Lock',
                                                UNLOCKED: 'Released',
                                                AVAILABLE: 'Refilled',
                                                CONSUMED: 'Consumed',
                                                EXPIRED: 'Expired',
                                                PENDING_BACKED: 'Pending',
                                            };
                                            const now = new Date();
                                            const fmtDate = (d: Date) =>
                                                d.toLocaleDateString('en-IN', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric',
                                                });

                                            type EntryRow = {
                                                id: string;
                                                label: string;
                                                notes: string | null;
                                                status: string;
                                                date: Date;
                                                validity: number | null;
                                                isLifetime: boolean;
                                                credit: number | null;
                                                debit: number | null;
                                                balance: number;
                                                muted: boolean;
                                            };
                                            const entries: EntryRow[] = [];
                                            let running = 0;

                                            const sorted = [...ledger].reverse();
                                            sorted.forEach((row: any) => {
                                                const delta = Number(row.delta || 0);
                                                const exp = row.expires_at ? new Date(row.expires_at) : null;
                                                const isExpired = exp ? exp < now : false;

                                                running += delta;

                                                let creditAmount = delta > 0 ? delta : null;
                                                let debitAmount = delta < 0 ? Math.abs(delta) : null;

                                                if (exp && isExpired) {
                                                    // Reverse the added credit from the running balance since it expired
                                                    running -= delta;
                                                    // Show the expired amount as debit on the same row
                                                    debitAmount = (debitAmount || 0) + (delta > 0 ? delta : 0);
                                                }

                                                const labelStr = toLabel(row.source_type || 'Activity');
                                                let finalNotes: string | null =
                                                    row.referred_customer_name || row.metadata?.notes || null;

                                                if (labelStr === 'Welcome Bonus') {
                                                    finalNotes = 'Welcome to BookMyBike!';
                                                } else if (labelStr.includes('Valentine')) {
                                                    finalNotes = 'Happy Valentine!';
                                                }

                                                entries.push({
                                                    id: `${row.id}-cr`,
                                                    label: labelStr,
                                                    notes: finalNotes,
                                                    status: isExpired ? 'Expired' : statusMap[row.status] || row.status,
                                                    date: new Date(row.created_at),
                                                    validity: row.validity_days ?? null,
                                                    isLifetime: !exp,
                                                    credit: creditAmount,
                                                    debit: debitAmount && debitAmount > 0 ? debitAmount : null,
                                                    balance: running,
                                                    muted: isExpired,
                                                });
                                            });

                                            return (
                                                <>
                                                    <div className="max-h-[540px] overflow-auto">
                                                        {entries.map((entry, i) => {
                                                            const isFirst =
                                                                i === 0 ||
                                                                entries[i - 1].muted !== entry.muted ||
                                                                entries[i - 1].label !== entry.label;
                                                            return (
                                                                <div
                                                                    key={entry.id}
                                                                    className={`px-6 py-3.5 grid grid-cols-1 md:grid-cols-[1.2fr_1.2fr_70px_100px_70px_60px_60px_70px] gap-2 md:gap-4 md:items-center border-b border-slate-100 last:border-0 transition-colors ${
                                                                        entry.muted
                                                                            ? 'border-l-2 border-l-rose-300 bg-rose-50/30 hover:bg-rose-50/60'
                                                                            : 'hover:bg-slate-50/80'
                                                                    }`}
                                                                >
                                                                    {/* Label */}
                                                                    <div className="flex items-center gap-2">
                                                                        <p
                                                                            className={`text-[12px] md:text-[13px] font-bold ${
                                                                                entry.muted
                                                                                    ? 'text-slate-400'
                                                                                    : 'text-slate-800'
                                                                            }`}
                                                                        >
                                                                            {entry.label}
                                                                        </p>
                                                                        {entry.muted && (
                                                                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-400">
                                                                                Expired
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    {/* Notes */}
                                                                    <p
                                                                        className="text-[12px] font-medium text-slate-500 truncate"
                                                                        title={entry.notes || ''}
                                                                    >
                                                                        {entry.notes || '—'}
                                                                    </p>

                                                                    {/* Status */}
                                                                    <p className="text-[11px] font-bold text-slate-600">
                                                                        {entry.status}
                                                                    </p>

                                                                    {/* Date */}
                                                                    <p
                                                                        className={`text-[12px] font-medium ${
                                                                            entry.muted
                                                                                ? 'text-rose-400'
                                                                                : 'text-slate-500'
                                                                        }`}
                                                                    >
                                                                        {fmtDate(entry.date)}
                                                                    </p>

                                                                    {/* Validity */}
                                                                    <div>
                                                                        {entry.validity !== null ? (
                                                                            <span className="text-[11px] font-semibold text-slate-500">
                                                                                {entry.validity} days
                                                                            </span>
                                                                        ) : entry.isLifetime ? (
                                                                            <span className="inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                                                                                Lifetime
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-slate-300 text-xs">
                                                                                —
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    {/* Credit */}
                                                                    <p className="text-[13px] font-bold text-right text-emerald-600">
                                                                        {entry.credit ? (
                                                                            `+${entry.credit.toLocaleString('en-IN')}`
                                                                        ) : (
                                                                            <span className="text-slate-200 text-xs">
                                                                                —
                                                                            </span>
                                                                        )}
                                                                    </p>

                                                                    {/* Debit */}
                                                                    <p className="text-[13px] font-bold text-right text-rose-500">
                                                                        {entry.debit ? (
                                                                            `-${entry.debit.toLocaleString('en-IN')}`
                                                                        ) : (
                                                                            <span className="text-slate-200 text-xs">
                                                                                —
                                                                            </span>
                                                                        )}
                                                                    </p>

                                                                    {/* Balance */}
                                                                    <p
                                                                        className={`text-[13px] font-black text-right ${
                                                                            entry.balance === 0
                                                                                ? 'text-slate-400'
                                                                                : 'text-slate-800'
                                                                        }`}
                                                                    >
                                                                        {entry.balance.toLocaleString('en-IN')}
                                                                    </p>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </>
                                            );
                                        })()
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ════════ DOCUMENTS ════════ */}
                        {activeTab === 'documents' && (
                            <div className="rounded-[24px] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <IdCard size={18} className="text-indigo-600" />
                                    <h2 className="text-lg font-black text-slate-900">Documents Vault</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {identityDocs.map(doc => (
                                        <div
                                            key={doc.id}
                                            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-xs font-black text-slate-900">{doc.title}</p>
                                                <span
                                                    className={`text-[10px] font-black uppercase ${doc.previewUrl ? 'text-emerald-600' : 'text-amber-600'}`}
                                                >
                                                    {doc.status}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 mb-3">ID: {doc.value}</p>
                                            {doc.previewUrl ? (
                                                <img
                                                    src={doc.previewUrl}
                                                    alt={doc.title}
                                                    className="w-full h-28 rounded-xl border border-slate-200 object-cover bg-white"
                                                />
                                            ) : (
                                                <div className="w-full h-28 rounded-xl border border-dashed border-slate-300 bg-white flex items-center justify-center text-[11px] text-slate-400">
                                                    Preview unavailable
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {memberDocuments.slice(0, 9).map((doc: any) => (
                                        <div
                                            key={doc.id}
                                            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <FileText size={14} className="text-indigo-500" />
                                                <p className="text-xs font-black text-slate-900 truncate">
                                                    {doc.label || doc.name || 'Document'}
                                                </p>
                                            </div>
                                            <p className="text-[11px] text-slate-500 mb-1">
                                                {doc.category || 'General'}
                                            </p>
                                            <p className="text-[11px] text-slate-500 mb-3">
                                                {formatDate(doc.created_at)}
                                            </p>
                                            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-4 text-[11px] text-slate-400 truncate">
                                                {doc.file_path || 'No file path'}
                                            </div>
                                        </div>
                                    ))}
                                    {bookingDocs.slice(0, 6).map(doc => (
                                        <div
                                            key={doc.id}
                                            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-xs font-black text-slate-900 truncate">
                                                    {doc.title}
                                                </p>
                                                <span className="text-[10px] font-black text-indigo-600 uppercase">
                                                    {doc.status}
                                                </span>
                                            </div>
                                            <div className="space-y-1">
                                                {doc.metadata.map((line: string) => (
                                                    <p key={line} className="text-[11px] text-slate-500">
                                                        {line}
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 flex items-center gap-3">
                                    <ShieldCheck size={16} className="text-indigo-600" />
                                    <p className="text-xs font-semibold text-indigo-700">
                                        Booking confirmation, delivery note, PDI report, payment receipt, tax receipt,
                                        and invoice links consolidated here as data becomes available.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* ════════ NOTES ════════ */}
                        {activeTab === 'notes' && (
                            <div className="rounded-[24px] border border-slate-200 bg-white shadow-sm flex flex-col items-center justify-center py-24">
                                <Receipt size={40} className="text-slate-200 mb-4" />
                                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">
                                    Notes Coming Soon
                                </p>
                                <p className="text-xs text-slate-400 mt-2">
                                    You&apos;ll be able to add personal notes and reminders here.
                                </p>
                            </div>
                        )}

                        {/* ════════ TIMELINE ════════ */}
                        {activeTab === 'timeline' &&
                            (() => {
                                // Group events into sessions
                                const fmtTime = (d: string) =>
                                    new Date(d).toLocaleTimeString('en-IN', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: true,
                                    });
                                const fmtDur = (ms: number) => {
                                    const s = Math.round(ms / 1000);
                                    if (s < 60) return `${s}s`;
                                    const m = Math.floor(s / 60);
                                    if (m < 60) return `${m}m ${s % 60}s`;
                                    return `${Math.floor(m / 60)}h ${m % 60}m`;
                                };

                                // Reverse to oldest-first for grouping, then re-reverse for display
                                const sorted = [...activityTimeline].sort(
                                    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                                );

                                // Group into sessions
                                type Session = { start: any; end: any | null; pages: any[] };
                                const sessions: Session[] = [];
                                let cur: Session | null = null;
                                sorted.forEach(ev => {
                                    if (ev.event_type === 'SESSION_START') {
                                        cur = { start: ev, end: null, pages: [] };
                                        sessions.push(cur);
                                    } else if (ev.event_type === 'PAGE_VIEW' && cur) {
                                        cur.pages.push(ev);
                                    } else if (ev.event_type === 'SESSION_END' && cur) {
                                        cur.end = ev;
                                        cur = null;
                                    }
                                });

                                const reversedSessions = [...sessions].reverse();

                                return (
                                    <div className="rounded-[24px] border border-slate-200 bg-white shadow-sm overflow-hidden">
                                        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
                                            <CalendarClock size={16} className="text-indigo-500" />
                                            <h2 className="text-base font-black text-slate-900">Online Activity</h2>
                                            <span className="ml-auto text-[11px] font-semibold text-slate-400">
                                                {sessions.length} session{sessions.length !== 1 ? 's' : ''}
                                            </span>
                                        </div>

                                        {sessions.length === 0 ? (
                                            <div className="py-16 text-center">
                                                <p className="text-slate-400 text-sm font-semibold">
                                                    No activity recorded yet.
                                                </p>
                                                <p className="text-slate-300 text-xs mt-1">
                                                    Activity will appear after the member visits the store.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-slate-100 max-h-[600px] overflow-auto">
                                                {reversedSessions.map((sess, si) => {
                                                    const startDate = new Date(sess.start.created_at);
                                                    const durMs = sess.end?.payload?.total_duration_ms;
                                                    const device = sess.start.payload?.device || 'unknown';
                                                    const deviceIcon =
                                                        device === 'mobile' ? '📱' : device === 'tablet' ? '📟' : '🖥️';
                                                    return (
                                                        <div key={si} className="px-5 py-4">
                                                            {/* Session header */}
                                                            <div className="flex items-center gap-2.5 mb-3">
                                                                <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                                                                <p className="text-[12px] font-bold text-slate-700">
                                                                    {startDate.toLocaleDateString('en-IN', {
                                                                        day: '2-digit',
                                                                        month: 'short',
                                                                        year: 'numeric',
                                                                    })}{' '}
                                                                    &nbsp;
                                                                    <span className="text-slate-400 font-medium">
                                                                        {fmtTime(sess.start.created_at)}
                                                                    </span>
                                                                </p>
                                                                <span className="text-base">{deviceIcon}</span>
                                                                {durMs && (
                                                                    <span className="ml-auto text-[11px] font-semibold text-slate-400">
                                                                        {fmtDur(durMs)}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Pages visited */}
                                                            {sess.pages.length > 0 && (
                                                                <div className="ml-4 border-l-2 border-slate-100 pl-4 space-y-2">
                                                                    {sess.pages.map((pg: any, pi: number) => {
                                                                        const url: string = pg.payload?.url || '/';
                                                                        const dur: number =
                                                                            pg.payload?.duration_ms || 0;
                                                                        const label =
                                                                            url
                                                                                .replace('/store', '')
                                                                                .replace(/\?.*/, '') || '/';
                                                                        return (
                                                                            <div
                                                                                key={pi}
                                                                                className="flex items-center gap-2"
                                                                            >
                                                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                                                                                <p
                                                                                    className="text-[11px] font-medium text-slate-600 truncate flex-1"
                                                                                    title={url}
                                                                                >
                                                                                    {label || 'Home'}
                                                                                </p>
                                                                                {dur > 0 && (
                                                                                    <span className="text-[10px] text-slate-400 shrink-0">
                                                                                        {fmtDur(dur)}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}

                                                            {/* Session end */}
                                                            {sess.end && (
                                                                <div className="flex items-center gap-2 mt-3">
                                                                    <div className="w-2 h-2 rounded-full bg-rose-300 shrink-0" />
                                                                    <p className="text-[11px] text-slate-400 font-medium">
                                                                        Left at {fmtTime(sess.end.created_at)}
                                                                        {' · '}
                                                                        {sess.end.payload?.page_count || 0} pages
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                    </div>
                </main>
            </div>
        </>
    );
}
