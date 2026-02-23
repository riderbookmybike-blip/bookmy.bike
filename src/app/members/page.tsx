'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowRight,
    Zap,
    Copy,
    LogOut,
    Car,
    Headphones,
    Calendar,
    Share2,
    Sparkles,
    RotateCw,
    Loader2,
    X,
    Coins,
    Gem,
    Gift,
    Star,
    Trophy,
} from 'lucide-react';
import { MarketplaceHeader } from '@/components/layout/MarketplaceHeader';
import { MarketplaceFooter } from '@/components/layout/MarketplaceFooter';
import { useTenant } from '@/lib/tenant/tenantContext';
import { createClient } from '@/lib/supabase/client';

type WheelItem = {
    id: string;
    label: string;
    weight: number;
};

type SlotIcon = {
    id: string;
    label: string;
    color: string;
    Icon: typeof Sparkles;
};

type SlotCombo = {
    id: string;
    icons: string[];
    reward: string;
    weight: number;
};

const MOCK_SPIN_ENABLED = true;

const WHEEL_ITEMS: WheelItem[] = [
    { id: 'stud-helmet', label: 'Stud Helmet', weight: 14 },
    { id: 'parking-cover', label: 'Parking Cover', weight: 14 },
    { id: 'cashback-500', label: 'INR 500 Cashback', weight: 10 },
    { id: 'service-coupon', label: 'Service Coupon', weight: 12 },
    { id: 'voucher-200', label: 'INR 200 Voucher', weight: 12 },
    { id: 'rider-gloves', label: 'Rider Gloves', weight: 10 },
    { id: 'fuel-coupon', label: 'Fuel Coupon', weight: 14 },
    { id: 'free-wash', label: 'Free Wash', weight: 14 },
];

const WHEEL_COLORS = ['#2563eb', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#f97316', '#22d3ee', '#84cc16'];

const getWheelColor = (index: number) => WHEEL_COLORS[index % WHEEL_COLORS.length];

const hexToRgba = (hex: string, alpha: number) => {
    const value = hex.replace('#', '');
    if (value.length !== 6) return `rgba(255,255,255,${alpha})`;
    const r = parseInt(value.slice(0, 2), 16);
    const g = parseInt(value.slice(2, 4), 16);
    const b = parseInt(value.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const pickReward = (items: WheelItem[]) => {
    const total = items.reduce((sum, item) => sum + item.weight, 0);
    const roll = Math.random() * total;
    let cursor = 0;
    for (const item of items) {
        cursor += item.weight;
        if (roll <= cursor) return item;
    }
    return items[items.length - 1];
};

const getRotationForItem = (rewardId: string, currentRotation: number, spins: number) => {
    const segmentAngle = 360 / WHEEL_ITEMS.length;
    const rewardIndex = WHEEL_ITEMS.findIndex(item => item.id === rewardId);
    const index = rewardIndex >= 0 ? rewardIndex : 0;
    const targetMod = (360 - (index * segmentAngle + segmentAngle / 2)) % 360;
    const currentMod = ((currentRotation % 360) + 360) % 360;
    const delta = (targetMod - currentMod + 360) % 360;
    return currentRotation + spins * 360 + delta;
};

const SLOT_ICONS: SlotIcon[] = [
    { id: 'trophy', label: 'Jackpot', color: '#f59e0b', Icon: Trophy },
    { id: 'star', label: 'Star', color: '#f472b6', Icon: Star },
    { id: 'gem', label: 'Gem', color: '#22d3ee', Icon: Gem },
    { id: 'coins', label: 'Coins', color: '#84cc16', Icon: Coins },
    { id: 'gift', label: 'Gift', color: '#a855f7', Icon: Gift },
];

const SLOT_COMBOS: SlotCombo[] = [
    { id: 'jackpot', icons: ['trophy', 'trophy', 'trophy'], reward: '₹1,000 Voucher', weight: 1 },
    { id: 'gems', icons: ['gem', 'gem', 'gem'], reward: '₹500 Cashback', weight: 2 },
    { id: 'coins', icons: ['coins', 'coins', 'coins'], reward: 'Free Accessories', weight: 2 },
    { id: 'gift-star', icons: ['gift', 'star', 'gift'], reward: '₹200 Voucher', weight: 4 },
    { id: 'mix', icons: ['star', 'coins', 'gem'], reward: "50 O' Circle Points", weight: 6 },
];

const getSlotIcon = (id: string) => SLOT_ICONS.find(icon => icon.id === id) || SLOT_ICONS[0];

const pickCombo = (combos: SlotCombo[]) => {
    const total = combos.reduce((sum, combo) => sum + combo.weight, 0);
    const roll = Math.random() * total;
    let cursor = 0;
    for (const combo of combos) {
        cursor += combo.weight;
        if (roll <= cursor) return combo;
    }
    return combos[combos.length - 1];
};

export default function MembersHome() {
    const { userName, tenantId } = useTenant();
    const router = useRouter();
    const supabase = createClient();
    const [referralCode, setReferralCode] = useState('FETCHING...');
    const [memberId, setMemberId] = useState('...');
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [wheelVisible, setWheelVisible] = useState(false);
    const [wheelEligible, setWheelEligible] = useState(false);
    const [wheelStatus, setWheelStatus] = useState<string | null>(null);
    const [wheelRotation, setWheelRotation] = useState(0);
    const [wheelResult, setWheelResult] = useState<WheelItem | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [wheelExpanded, setWheelExpanded] = useState(false);
    const [wheelLoading, setWheelLoading] = useState(true);
    const [wheelError, setWheelError] = useState<string | null>(null);
    const [wheelSpinning, setWheelSpinning] = useState(false);
    const [slotReels, setSlotReels] = useState<string[]>(['trophy', 'star', 'gift']);
    const [slotWinner, setSlotWinner] = useState<SlotCombo | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        async function fetchProfile() {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) {
                // If not logged in, we might want to stay or redirect
                setLoading(false);
                return;
            }

            const { data: profile } = await supabase
                .from('id_members')
                .select('referral_code, id')
                .eq('id', user.id)
                .single();

            if (profile) {
                setReferralCode(profile.referral_code || 'GENERATE_ONE');
                setMemberId(profile.id.slice(-6).toUpperCase());
            }
            setLoading(false);
        }
        fetchProfile();
    }, [supabase]);

    useEffect(() => {
        let active = true;

        if (MOCK_SPIN_ENABLED) {
            setWheelVisible(true);
            setWheelEligible(true);
            setWheelStatus('ELIGIBLE');
            setWheelLoading(false);
            setWheelError(null);
            return () => {
                active = false;
            };
        }

        const fetchWheelStatus = async () => {
            setWheelLoading(true);
            try {
                const response = await fetch('/api/me/wheel');
                if (!response.ok) {
                    if (response.status === 401) {
                        if (active) setWheelVisible(false);
                        return;
                    }
                    throw new Error('Failed to load wheel status');
                }

                const data = await response.json();
                if (!active) return;

                setWheelVisible(!!data.visible);
                setWheelEligible(!!data.eligible);
                setWheelStatus(data.status ?? null);
                setWheelError(null);
                if (data.reward?.id) {
                    setSlotWinner({
                        id: data.reward.id,
                        icons: ['sparkles', 'sparkles', 'sparkles'],
                        reward: data.reward.label,
                        weight: 1,
                    });
                    setSlotReels(['sparkles', 'sparkles', 'sparkles']);
                } else {
                    setSlotWinner(null);
                    setSlotReels(['coins', 'gem', 'gift']);
                }
            } catch (error) {
                if (active) {
                    setWheelError('Unable to load your reward status.');
                }
            } finally {
                if (active) setWheelLoading(false);
            }
        };

        fetchWheelStatus();

        return () => {
            active = false;
        };
    }, []);

    const copyToClipboard = () => {
        if (referralCode === 'FETCHING...') return;
        navigator.clipboard.writeText(referralCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        localStorage.removeItem('user_name');
        window.location.href = '/';
    };

    const handleWheelSpin = async () => {
        if (!wheelEligible || wheelSpinning) return;
        if (MOCK_SPIN_ENABLED) {
            setWheelSpinning(true);
            setSlotWinner(null);
            const spinInterval = window.setInterval(() => {
                setSlotReels([
                    SLOT_ICONS[Math.floor(Math.random() * SLOT_ICONS.length)].id,
                    SLOT_ICONS[Math.floor(Math.random() * SLOT_ICONS.length)].id,
                    SLOT_ICONS[Math.floor(Math.random() * SLOT_ICONS.length)].id,
                ]);
            }, 120);

            window.setTimeout(() => {
                window.clearInterval(spinInterval);
                const combo = pickCombo(SLOT_COMBOS);
                setSlotReels(combo.icons);
                setSlotWinner(combo);
                setWheelSpinning(false);
            }, 2000);
            return;
        }
        setWheelSpinning(true);
        setWheelError(null);

        try {
            const response = await fetch('/api/me/wheel', { method: 'POST' });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.error || 'Spin failed');
            }

            if (!data?.reward?.id) {
                setWheelEligible(false);
                setWheelStatus(data?.status ?? 'SPUN');
                setWheelSpinning(false);
                return;
            }

            setSlotReels(['sparkles', 'sparkles', 'sparkles']);
            setSlotWinner({
                id: data.reward.id,
                icons: ['sparkles', 'sparkles', 'sparkles'],
                reward: data.reward.label,
                weight: 1,
            });
            setWheelStatus('SPUN');
            setWheelEligible(false);
            setWheelSpinning(false);
        } catch (error) {
            setWheelError('Spin failed. Please try again.');
            setWheelSpinning(false);
        }
    };

    const displayName = mounted ? userName || 'Member' : 'Member';

    return (
        <div className="min-h-screen bg-black text-white selection:bg-rose-500/30 font-sans">
            <MarketplaceHeader onLoginClick={() => {}} />

            <main className="page-container py-12 md:py-24 space-y-16">
                {/* Dashboard Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-12">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 italic">
                                Live Session
                            </span>
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-5xl md:text-7xl font-black tracking-tighter italic">
                                Welcome Back,{' '}
                                <span className="text-rose-600 truncate max-w-[400px] inline-block align-bottom">
                                    {displayName}
                                </span>
                            </h1>
                            <div className="flex items-center gap-4">
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                                    ID: {memberId}
                                </p>
                                <span className="px-3 py-0.5 bg-rose-600/10 border border-rose-600 text-rose-600 text-[10px] font-black uppercase tracking-widest italic rounded">
                                    Founder Member
                                </span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:border-white/20 transition-all group"
                    >
                        <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Sign Out
                    </button>
                </div>

                {/* Dashboard Grid */}
                {wheelVisible && (
                    <section className="relative w-full min-h-screen rounded-[3rem] border border-white/5 bg-gradient-to-b from-slate-950 via-slate-900 to-black p-8 md:p-14 overflow-hidden">
                        <div className="absolute -top-32 right-0 h-72 w-72 bg-rose-600/20 blur-[120px]" />
                        <div className="absolute -bottom-32 left-0 h-72 w-72 bg-blue-600/20 blur-[120px]" />
                        <div className="relative z-10 flex flex-col items-center gap-10">
                            <div className="text-center space-y-3">
                                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-rose-400">
                                    Reward Machine
                                </p>
                                <h2 className="text-4xl md:text-6xl font-black italic tracking-tight">Lucky Spin</h2>
                                <p className="text-xs text-slate-400 uppercase tracking-widest">
                                    Match 3 icons to win big.
                                </p>
                            </div>

                            <div
                                className={`relative w-full max-w-4xl rounded-[2.5rem] border border-white/10 bg-slate-900/70 p-8 shadow-[0_40px_100px_rgba(0,0,0,0.6)] transition-transform duration-500 ${wheelSpinning ? 'scale-105' : 'scale-100'}`}
                            >
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 rounded-full bg-black/80 px-6 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 border border-white/10">
                                    up to INR 1000
                                </div>
                                <div className="grid grid-cols-3 gap-4 bg-black/60 p-6 rounded-[1.75rem] border border-white/10">
                                    {slotReels.map((iconId, index) => {
                                        const icon = getSlotIcon(iconId);
                                        const isWinner =
                                            !!slotWinner && slotWinner.icons[index] === iconId && !wheelSpinning;
                                        const glow = hexToRgba(icon.color, isWinner ? 0.8 : 0.25);
                                        return (
                                            <div
                                                key={`${iconId}-${index}`}
                                                className={`flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-slate-950/70 py-6 transition-all duration-300 ${wheelSpinning ? 'animate-pulse' : ''}`}
                                                style={{
                                                    boxShadow: isWinner ? `0 0 24px ${glow}` : undefined,
                                                    borderColor: isWinner ? glow : undefined,
                                                }}
                                            >
                                                <icon.Icon
                                                    size={44}
                                                    className="drop-shadow"
                                                    style={{ color: icon.color }}
                                                />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                                                    {icon.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="mt-8 flex flex-col items-center gap-4">
                                    <button
                                        onClick={handleWheelSpin}
                                        disabled={
                                            !wheelEligible || wheelSpinning || wheelLoading || wheelStatus === 'SPUN'
                                        }
                                        className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.4em] transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed bg-rose-600/90 hover:bg-rose-500 text-white"
                                    >
                                        {wheelSpinning ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <RotateCw size={16} />
                                        )}
                                        {wheelLoading
                                            ? 'Checking...'
                                            : wheelStatus === 'SPUN'
                                              ? 'Reward Claimed'
                                              : wheelEligible
                                                ? 'Spin Now'
                                                : 'Locked'}
                                    </button>

                                    {slotWinner && (
                                        <div className="text-center space-y-2">
                                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
                                                You Won
                                            </p>
                                            <p
                                                className="text-xl md:text-2xl font-black"
                                                style={{
                                                    color: getSlotIcon(slotWinner.icons[0]).color,
                                                    textShadow: `0 0 16px ${hexToRgba(getSlotIcon(slotWinner.icons[0]).color, 0.6)}`,
                                                }}
                                            >
                                                {slotWinner.reward}
                                            </p>
                                        </div>
                                    )}

                                    {!slotWinner && wheelEligible && !wheelSpinning && (
                                        <p className="text-[9px] text-slate-400 uppercase tracking-widest">
                                            Tap spin to reveal your reward.
                                        </p>
                                    )}

                                    {wheelError && (
                                        <p className="text-[9px] text-rose-400 uppercase tracking-widest">
                                            {wheelError}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-4">
                                {SLOT_COMBOS.map(combo => {
                                    const comboColor = getSlotIcon(combo.icons[0]).color;
                                    const isWinner = slotWinner?.id === combo.id;
                                    return (
                                        <div
                                            key={combo.id}
                                            className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/40 px-4 py-3"
                                            style={{
                                                borderColor: isWinner ? hexToRgba(comboColor, 0.7) : undefined,
                                                boxShadow: isWinner
                                                    ? `0 0 20px ${hexToRgba(comboColor, 0.5)}`
                                                    : undefined,
                                            }}
                                        >
                                            <div className="flex items-center gap-2">
                                                {combo.icons.map((iconId, idx) => {
                                                    const icon = getSlotIcon(iconId);
                                                    return (
                                                        <span
                                                            key={`${combo.id}-${iconId}-${idx}`}
                                                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900/60 border border-white/10"
                                                        >
                                                            <icon.Icon size={18} style={{ color: icon.color }} />
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                                                {combo.reward}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Invite Members - Large Card */}
                    <div className="md:col-span-2 lg:col-span-1 group relative bg-slate-900/40 border border-white/5 rounded-[3rem] p-10 overflow-hidden hover:border-blue-600/30 transition-all duration-700">
                        {/* Metallic Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                        <div className="relative z-10 space-y-8">
                            <div className="w-14 h-14 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-600 border border-blue-600/20 group-hover:scale-110 transition-transform">
                                <Share2 size={24} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black uppercase tracking-tighter italic">
                                    Invite Members
                                </h3>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                                    Unlimited Referrals
                                </p>
                            </div>

                            <div className="relative group/copy">
                                <div className="w-full p-6 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 flex items-center justify-between group-hover/copy:border-blue-600/50 transition-colors shadow-2xl">
                                    <span className="text-xl font-black tracking-[0.2em] text-blue-500 uppercase font-mono">
                                        {referralCode}
                                    </span>
                                    <button
                                        onClick={copyToClipboard}
                                        className="p-3 text-slate-500 hover:text-white transition-colors"
                                    >
                                        <Copy size={20} className={copied ? 'text-emerald-500' : ''} />
                                    </button>
                                </div>
                                {copied && (
                                    <span className="absolute -top-8 right-0 text-[10px] font-black text-emerald-500 uppercase tracking-widest animate-in fade-in slide-in-from-bottom-2">
                                        Copied!
                                    </span>
                                )}
                            </div>

                            <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic">
                                Share your unique referral code. This code is permanently linked to your profile and
                                unlocks Founder rewards.
                            </p>
                        </div>

                        {/* Abstract Background Icon */}
                        <Share2
                            size={200}
                            className="absolute -right-16 -top-16 text-white/5 -rotate-12 pointer-events-none group-hover:text-blue-500/10 transition-colors duration-700"
                        />
                    </div>

                    {/* My Garage */}
                    <div className="group relative bg-slate-900/40 border border-white/5 rounded-[3rem] p-10 overflow-hidden hover:border-blue-600/30 transition-all duration-700">
                        <div className="relative z-10 space-y-8">
                            <div className="w-14 h-14 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-600 border border-blue-600/20 group-hover:scale-110 transition-transform">
                                <Car size={24} />
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black uppercase tracking-tighter italic">My Garage</h3>
                                    <p className="text-[10px] text-slate-500 font-medium italic">
                                        Track your deliveries and service milestones.
                                    </p>
                                </div>
                                <Link
                                    href="/store/catalog"
                                    className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-blue-500 hover:text-white transition-colors"
                                >
                                    Add Vehicle <ArrowRight size={12} />
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Concierge */}
                    <a
                        href="https://wa.me/91XXXXXXXXXX"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative bg-slate-900/40 border border-white/5 rounded-[3rem] p-10 overflow-hidden hover:border-emerald-600/30 transition-all duration-700"
                    >
                        <div className="relative z-10 space-y-8">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-600/10 flex items-center justify-center text-emerald-600 border border-emerald-600/20 group-hover:scale-110 transition-transform">
                                <Headphones size={24} />
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black uppercase tracking-tighter italic">Concierge</h3>
                                    <p className="text-[10px] text-slate-500 font-medium italic">
                                        Direct WhatsApp line to your Elite account manager.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-emerald-500 group-hover:text-white transition-colors">
                                    Chat Now <ArrowRight size={12} />
                                </div>
                            </div>
                        </div>
                    </a>

                    {/* Events */}
                    <div className="group relative bg-slate-900/40 border border-white/5 rounded-[3rem] p-10 overflow-hidden hover:border-amber-600/30 transition-all duration-700">
                        <div className="relative z-10 space-y-8">
                            <div className="w-14 h-14 rounded-2xl bg-amber-600/10 flex items-center justify-center text-amber-600 border border-amber-600/20 group-hover:scale-110 transition-transform">
                                <Calendar size={24} />
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black uppercase tracking-tighter italic">Events</h3>
                                    <p className="text-[10px] text-slate-500 font-medium italic">
                                        Exclusive rides and meetups near you.
                                    </p>
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 italic">
                                    No events scheduled
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Pro Tip/Ad */}
                    <div className="group relative bg-gradient-to-br from-rose-600 to-rose-900 border border-white/10 rounded-[3rem] p-10 overflow-hidden shadow-2xl shadow-rose-600/20">
                        <div className="relative z-10 h-full flex flex-col justify-between">
                            <Zap size={32} className="text-white fill-white animate-pulse" />
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <h3 className="text-3xl font-black uppercase tracking-tighter italic leading-none">
                                        Upgrade Your <br /> Experience
                                    </h3>
                                    <p className="text-[10px] font-bold text-rose-100 uppercase tracking-widest italic">
                                        Get priority allocation on new drops.
                                    </p>
                                </div>
                                <button className="w-full py-4 bg-white dark:bg-white text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl">
                                    O' Circle Pro
                                </button>
                            </div>
                        </div>
                        <div className="absolute -right-4 -bottom-4 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000" />
                    </div>
                </div>

                {/* Membership Status Footer */}
                <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 backdrop-blur-2xl group hover:border-blue-600/30 transition-all duration-700">
                    <div className="flex items-center gap-8">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2">
                                Membership Status
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse" />
                                <span className="text-2xl font-black uppercase italic tracking-widest text-white">
                                    Elite Verified
                                </span>
                            </div>
                        </div>
                        <div className="hidden md:block w-px h-12 bg-white/5" />
                        <div className="hidden md:block">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2">
                                Rewards Earned
                            </p>
                            <p className="text-2xl font-black uppercase italic tracking-widest text-blue-500">
                                ₹12,450
                            </p>
                        </div>
                    </div>
                    <button className="w-full md:w-auto px-12 py-5 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-2xl shadow-blue-600/20 active:scale-95 italic">
                        Access Founder Perks
                    </button>
                </div>
            </main>

            <MarketplaceFooter />
        </div>
    );
}
