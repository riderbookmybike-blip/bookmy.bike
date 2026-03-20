'use client';

import React, { useMemo, useState } from 'react';
import {
    BadgeIndianRupee,
    Bike,
    CalendarClock,
    CreditCard,
    FileText,
    IdCard,
    Receipt,
    Save,
    ShieldCheck,
    Sparkles,
    User,
    Wallet,
} from 'lucide-react';
import { MarketplaceHeader } from '@/components/layout/MarketplaceHeader';
import { MarketplaceFooter } from '@/components/layout/MarketplaceFooter';
import { getDefaultAvatar } from '@/lib/avatars';
import { updateMemberProfile } from '@/actions/profileActions';
import { toast } from 'sonner';

type MemberHubClientProps = {
    user: any;
    member: any;
    quotes: any[];
    bookings: any[];
    payments: any[];
    memberDocuments: any[];
    wallet: any | null;
    ledger: any[];
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

export default function MemberHubClient({
    user,
    member,
    quotes,
    bookings,
    payments,
    memberDocuments,
    wallet,
    ledger,
}: MemberHubClientProps) {
    const basePreferences = (
        member?.preferences && typeof member.preferences === 'object' ? member.preferences : {}
    ) as any;
    const [fullName, setFullName] = useState(member?.full_name || '');
    const [primaryPhone, setPrimaryPhone] = useState(member?.primary_phone || '');
    const [coverImageUrl, setCoverImageUrl] = useState(basePreferences?.cover_image_url || '');
    const [isSaving, setIsSaving] = useState(false);

    const profileImage =
        member?.avatar_url || getDefaultAvatar(user?.id || 'anon', fullName || member?.full_name || 'Member');
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

    const handleSaveProfile = async () => {
        if (!member?.id) return;
        setIsSaving(true);
        try {
            const nextPreferences = { ...basePreferences, cover_image_url: coverImageUrl || null };
            await updateMemberProfile(member.id, {
                full_name: fullName || null,
                primary_phone: primaryPhone || null,
                preferences: nextPreferences,
            });
            toast.success('Profile updated');
        } catch (error) {
            console.error('Profile save failed', error);
            toast.error('Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#fffdf5] via-white to-slate-50">
            <MarketplaceHeader onLoginClick={() => {}} />

            <main className="page-container py-24 space-y-8">
                <section className="rounded-[32px] border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div
                        className="h-44 md:h-56 w-full bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500"
                        style={
                            coverImageUrl
                                ? {
                                      backgroundImage: `url(${coverImageUrl})`,
                                      backgroundSize: 'cover',
                                      backgroundPosition: 'center',
                                  }
                                : undefined
                        }
                    />
                    <div className="px-6 md:px-8 pb-8">
                        <div className="-mt-14 flex flex-col md:flex-row md:items-end gap-5">
                            <img
                                src={profileImage}
                                alt={fullName || 'Member'}
                                className="w-28 h-28 rounded-[28px] border-4 border-white shadow-lg object-cover bg-white"
                            />
                            <div className="flex-1">
                                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-indigo-600">
                                    My O&apos;Circle
                                </p>
                                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">
                                    {fullName || member?.full_name || 'Member Profile'}
                                </h1>
                                <p className="text-sm text-slate-500 mt-1">
                                    Member ID: {member?.display_id || '—'} • Joined {formatDate(member?.created_at)}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 md:w-[340px]">
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

                <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 rounded-[28px] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <User className="text-indigo-600" size={20} />
                            <h2 className="text-xl font-black text-slate-900">Personal Details</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                                placeholder="Full Name"
                                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900"
                            />
                            <input
                                value={primaryPhone}
                                onChange={e => setPrimaryPhone(e.target.value)}
                                placeholder="Primary Phone"
                                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900"
                            />
                            <input
                                value={member?.primary_email || user?.email || ''}
                                disabled
                                className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-500"
                            />
                            <input
                                value={coverImageUrl}
                                onChange={e => setCoverImageUrl(e.target.value)}
                                placeholder="Cover image URL (optional)"
                                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900"
                            />
                        </div>
                        <button
                            onClick={handleSaveProfile}
                            disabled={isSaving}
                            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-xs font-black uppercase tracking-widest text-white disabled:opacity-60"
                        >
                            <Save size={14} />
                            {isSaving ? 'Saving...' : 'Save Profile'}
                        </button>
                    </div>

                    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles size={18} className="text-amber-600" />
                            <h3 className="text-lg font-black text-slate-900">Quick Snapshot</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500">Quotes</span>
                                <span className="text-sm font-black text-slate-900">{quotes.length}</span>
                            </div>
                            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500">Bookings</span>
                                <span className="text-sm font-black text-slate-900">{bookings.length}</span>
                            </div>
                            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500">Payments</span>
                                <span className="text-sm font-black text-slate-900">{payments.length}</span>
                            </div>
                            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500">Document Files</span>
                                <span className="text-sm font-black text-slate-900">{memberDocuments.length}</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <Wallet size={18} className="text-indigo-600" />
                            <h3 className="text-lg font-black text-slate-900">O&apos;Circle Earnings Activity</h3>
                        </div>
                        <div className="space-y-2 max-h-[360px] overflow-auto pr-1">
                            {(ledger || []).length === 0 && (
                                <p className="text-sm text-slate-500">No earnings activity yet.</p>
                            )}
                            {(ledger || []).map((row: any) => (
                                <div
                                    key={row.id}
                                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between"
                                >
                                    <div>
                                        <p className="text-xs font-black text-slate-900 uppercase tracking-wide">
                                            {row.source_type || 'Activity'}
                                        </p>
                                        <p className="text-[11px] text-slate-500">
                                            {formatDate(row.created_at)} • {row.status || 'POSTED'}
                                        </p>
                                    </div>
                                    <p
                                        className={`text-sm font-black ${Number(row.delta || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}
                                    >
                                        {Number(row.delta || 0) >= 0 ? '+' : ''}
                                        {Number(row.delta || 0).toLocaleString('en-IN')}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <CalendarClock size={18} className="text-indigo-600" />
                            <h3 className="text-lg font-black text-slate-900">Transactions & Booking History</h3>
                        </div>
                        <div className="space-y-2 max-h-[360px] overflow-auto pr-1">
                            {[
                                ...quotes
                                    .slice(0, 6)
                                    .map((q: any) => ({
                                        type: 'QUOTE',
                                        id: q.display_id || q.id,
                                        date: q.created_at,
                                        amount: q.on_road_price,
                                    })),
                                ...bookings
                                    .slice(0, 6)
                                    .map((b: any) => ({
                                        type: 'BOOKING',
                                        id: b.display_id || b.id,
                                        date: b.created_at,
                                        amount: b.grand_total,
                                    })),
                                ...payments
                                    .slice(0, 6)
                                    .map((p: any) => ({
                                        type: 'PAYMENT',
                                        id: p.display_id || p.id,
                                        date: p.created_at,
                                        amount: p.amount,
                                    })),
                            ]
                                .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
                                .map((item, idx) => (
                                    <div
                                        key={`${item.type}-${item.id}-${idx}`}
                                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-3">
                                            {item.type === 'QUOTE' && (
                                                <FileText size={16} className="text-indigo-500" />
                                            )}
                                            {item.type === 'BOOKING' && <Bike size={16} className="text-emerald-500" />}
                                            {item.type === 'PAYMENT' && (
                                                <CreditCard size={16} className="text-amber-500" />
                                            )}
                                            <div>
                                                <p className="text-xs font-black text-slate-900">
                                                    {item.type} • {item.id}
                                                </p>
                                                <p className="text-[11px] text-slate-500">{formatDate(item.date)}</p>
                                            </div>
                                        </div>
                                        <p className="text-sm font-black text-slate-900">
                                            {formatINR(Number(item.amount || 0))}
                                        </p>
                                    </div>
                                ))}
                        </div>
                    </div>
                </section>

                <section className="rounded-[28px] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-5">
                        <IdCard size={18} className="text-indigo-600" />
                        <h3 className="text-lg md:text-xl font-black text-slate-900">Documents Vault</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {identityDocs.map(doc => (
                            <div key={doc.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
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
                            <div key={doc.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <FileText size={14} className="text-indigo-500" />
                                    <p className="text-xs font-black text-slate-900 truncate">
                                        {doc.label || doc.name || 'Document'}
                                    </p>
                                </div>
                                <p className="text-[11px] text-slate-500 mb-1">{doc.category || 'General'}</p>
                                <p className="text-[11px] text-slate-500 mb-3">{formatDate(doc.created_at)}</p>
                                <div className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-4 text-[11px] text-slate-400 truncate">
                                    {doc.file_path || 'No file path'}
                                </div>
                            </div>
                        ))}

                        {bookingDocs.slice(0, 6).map(doc => (
                            <div key={doc.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-black text-slate-900 truncate">{doc.title}</p>
                                    <span className="text-[10px] font-black text-indigo-600 uppercase">
                                        {doc.status}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    {doc.metadata.map(line => (
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
                        <p className="text-xs md:text-sm font-semibold text-indigo-700">
                            Booking confirmation, delivery note, PDI report, payment receipt, tax receipt, and invoice
                            links are consolidated here as data becomes available.
                        </p>
                    </div>
                </section>

                <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Quotes Value</p>
                        <p className="text-lg font-black text-slate-900">
                            {formatINR(quotes.reduce((s, q) => s + Number(q.on_road_price || 0), 0))}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                            Bookings Value
                        </p>
                        <p className="text-lg font-black text-slate-900">
                            {formatINR(bookings.reduce((s, b) => s + Number(b.grand_total || 0), 0))}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Paid So Far</p>
                        <p className="text-lg font-black text-slate-900">
                            {formatINR(payments.reduce((s, p) => s + Number(p.amount || 0), 0))}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                            Tax/Receipt Docs
                        </p>
                        <p className="text-lg font-black text-slate-900">{memberDocuments.length}</p>
                    </div>
                </section>
            </main>

            <MarketplaceFooter />
        </div>
    );
}
