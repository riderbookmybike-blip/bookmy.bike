'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Heart, Globe, CreditCard, Banknote, X, Pencil } from 'lucide-react';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import { useFavorites } from '@/lib/favorites/favoritesContext';
import { useTenant } from '@/lib/tenant/tenantContext';
import { QuickLeadMiniModal } from '@/components/leads/QuickLeadMiniModal';

// ─── Pricing constants ────────────────────────────────────────────────────────
const DP_MIN = 5000;
const DP_MAX = 200000;
const DP_STEP = 5000;
const TENURE_OPTIONS = [12, 18, 24, 36, 48, 60];

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const STATIC_TABS = [
    { key: 'home', label: 'Home', icon: Home, href: '/' },
    { key: 'ride', label: 'Ride', icon: MotorcycleIcon, href: '/store/catalog' },
    { key: 'pricing', label: 'EMI', icon: CreditCard, href: null },
    { key: 'wishlist', label: 'Favorites', icon: Heart, href: '/store/compare/favorites' },
    { key: 'ocircle', label: "O' Circle", icon: Globe, href: '/store/ocircle' },
] as const;

// ─── LocalStorage helpers ─────────────────────────────────────────────────────
function readPricing() {
    try {
        const raw = localStorage.getItem('bkmb_pricing_prefs');
        if (raw) return JSON.parse(raw);
    } catch {
        /* ignore */
    }
    return { mode: 'finance', downpayment: 10000, tenure: 36 };
}
function writePricing(payload: unknown) {
    try {
        localStorage.setItem('bkmb_pricing_prefs', JSON.stringify(payload));
    } catch {
        /* ignore */
    }
}

export function ShopperBottomNav() {
    const pathname = usePathname();
    const { favorites } = useFavorites();
    const { userRole, memberships } = useTenant();
    const hasActiveTeamMembership = (memberships || []).some(m => {
        if (String(m?.status || '').toUpperCase() !== 'ACTIVE') return false;
        const type = String(m?.tenants?.type || '').toUpperCase();
        return type === 'DEALER' || type === 'DEALERSHIP' || type === 'BANK' || type === 'SUPER_ADMIN';
    });
    const isTeamRole = Boolean(userRole && userRole !== 'MEMBER' && userRole !== 'BMB_USER');
    const isTeamUser = hasActiveTeamMembership || isTeamRole;
    const tabs = useMemo(
        () =>
            STATIC_TABS.map(tab =>
                tab.key === 'ocircle'
                    ? {
                          ...tab,
                          key: 'lead' as const,
                          label: 'Lead',
                          icon: Banknote,
                          href: null,
                      }
                    : tab
            ),
        []
    );

    // ── Pricing state ─────────────────────────────────────────────────────────
    const [pricingMode, setPricingMode] = useState<'cash' | 'finance'>('finance');
    const [downpayment, setDownpayment] = useState(10000);
    const [tenure, setTenure] = useState(36);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [isQuickLeadOpen, setIsQuickLeadOpen] = useState(false);
    const sheetRef = useRef<HTMLDivElement>(null);
    const [editingDp, setEditingDp] = useState(false);
    const [dpRaw, setDpRaw] = useState('');
    const dpInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const saved = readPricing();
        setPricingMode(saved.mode || 'finance');
        setDownpayment(saved.downpayment || 10000);
        setTenure(saved.tenure || 36);
    }, []);

    const dispatchPricing = (mode: 'cash' | 'finance', dp: number, ten: number) => {
        const payload = { mode, downpayment: dp, tenure: ten };
        writePricing(payload);
        window.dispatchEvent(new CustomEvent('discoveryPricingChanged', { detail: payload }));
    };

    const handlePricingTabClick = () => {
        if (pricingMode === 'finance') {
            setSheetOpen(prev => !prev);
        } else {
            setPricingMode('finance');
            dispatchPricing('finance', downpayment, tenure);
            setSheetOpen(true);
        }
    };

    const handleDpChange = (val: number) => {
        setDownpayment(val);
        dispatchPricing(pricingMode, val, tenure);
    };
    const handleTenureChange = (val: number) => {
        setTenure(val);
        dispatchPricing(pricingMode, downpayment, val);
    };

    // Close sheet on outside tap
    useEffect(() => {
        if (!sheetOpen) return;
        const handler = (e: MouseEvent) => {
            if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
                setSheetOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [sheetOpen]);

    const isTabActive = (href: string) => {
        if (!pathname) return false;
        if (href === '/') return pathname === '/' || pathname === '/store' || pathname === '/d2';
        return pathname.startsWith(href);
    };

    return (
        <>
            {/* ── EMI Pricing Sheet — Light Glassmorphism ── */}
            {sheetOpen && pricingMode === 'finance' && (
                <div
                    className="fixed inset-x-0 bottom-[60px] z-[60]"
                    style={{ paddingBottom: 'env(safe-area-inset-bottom,0px)' }}
                >
                    <div
                        ref={sheetRef}
                        className="mx-3 mb-3 rounded-3xl overflow-hidden ring-1 ring-amber-200/50"
                        style={{
                            background: 'rgba(255,255,255,0.88)',
                            backdropFilter: 'blur(48px) saturate(180%)',
                            boxShadow: '0 -4px 40px rgba(251,191,36,0.12), 0 8px 32px rgba(0,0,0,0.10)',
                        }}
                    >
                        {/* Gold accent stripe */}
                        <div
                            className="h-[3px] w-full"
                            style={{ background: 'linear-gradient(90deg,#F4B000,#FFD700,#F4B000)' }}
                        />

                        <div className="px-5 pt-4 pb-5">
                            {/* Handle + Close */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-7" />
                                <div className="w-8 h-1 rounded-full bg-amber-200/70" />
                                <button
                                    onClick={() => setSheetOpen(false)}
                                    className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 active:bg-slate-200 transition-colors"
                                >
                                    <X size={13} strokeWidth={2.5} />
                                </button>
                            </div>

                            {/* Finance / Cash toggle */}
                            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl mb-5">
                                {(['finance', 'cash'] as const).map(m => (
                                    <button
                                        key={m}
                                        onClick={() => {
                                            setPricingMode(m);
                                            dispatchPricing(m, downpayment, tenure);
                                            if (m === 'cash') setSheetOpen(false);
                                        }}
                                        className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${
                                            pricingMode === m
                                                ? 'bg-[#FFD700] text-black shadow-sm shadow-amber-300/40'
                                                : 'text-slate-400'
                                        }`}
                                    >
                                        {m === 'finance' ? '⚡ Finance / EMI' : '💵 Cash'}
                                    </button>
                                ))}
                            </div>

                            {/* Downpayment */}
                            <div className="mb-5">
                                <div className="flex items-end justify-between mb-3">
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">
                                        Downpayment
                                    </span>
                                    {editingDp ? (
                                        <div className="flex items-baseline gap-0.5">
                                            <span className="text-xl font-black text-amber-400">₹</span>
                                            <input
                                                ref={dpInputRef}
                                                type="number"
                                                value={dpRaw}
                                                onChange={e => setDpRaw(e.target.value)}
                                                onBlur={() => {
                                                    const val = Math.min(
                                                        DP_MAX,
                                                        Math.max(DP_MIN, Math.round(Number(dpRaw) / DP_STEP) * DP_STEP)
                                                    );
                                                    if (!isNaN(val)) {
                                                        setDownpayment(val);
                                                        dispatchPricing(pricingMode, val, tenure);
                                                    }
                                                    setEditingDp(false);
                                                }}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                                                }}
                                                className="w-28 text-2xl font-black text-slate-900 text-right border-b-2 border-amber-400 outline-none bg-transparent"
                                                autoFocus
                                            />
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setDpRaw(String(downpayment));
                                                setEditingDp(true);
                                            }}
                                            className="flex items-center gap-1.5"
                                        >
                                            <span className="text-2xl font-black text-slate-900 tracking-tight">
                                                ₹{downpayment.toLocaleString('en-IN')}
                                            </span>
                                            <Pencil size={12} className="text-amber-400 mb-0.5" strokeWidth={2.5} />
                                        </button>
                                    )}
                                </div>

                                {/* Slider — dynamic track fill */}
                                <input
                                    type="range"
                                    min={DP_MIN}
                                    max={DP_MAX}
                                    step={DP_STEP}
                                    value={downpayment}
                                    onChange={e => handleDpChange(Number(e.target.value))}
                                    className="w-full h-2 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#F4B000] [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:shadow-amber-300/40 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#F4B000] [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white"
                                    style={{
                                        background: (() => {
                                            const pct = ((downpayment - DP_MIN) / (DP_MAX - DP_MIN)) * 100;
                                            return `linear-gradient(to right, #F4B000 0%, #F4B000 ${pct}%, #e2e8f0 ${pct}%, #e2e8f0 100%)`;
                                        })(),
                                        WebkitAppearance: 'none',
                                    }}
                                />
                            </div>

                            {/* Tenure */}
                            <div>
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 block mb-3">
                                    Tenure (Months)
                                </span>
                                <div className="grid grid-cols-6 gap-2">
                                    {TENURE_OPTIONS.map(t => (
                                        <button
                                            key={t}
                                            onClick={() => handleTenureChange(t)}
                                            className={`py-2.5 rounded-2xl text-[11px] font-black tracking-tight transition-all duration-200 ${
                                                tenure === t
                                                    ? 'bg-[#FFD700] text-black shadow-md shadow-amber-200/60 scale-105'
                                                    : 'bg-slate-100/80 text-slate-700 active:bg-slate-200'
                                            }`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Bottom Nav Bar ── */}
            <nav
                className="fixed bottom-0 left-0 right-0 z-[55] bg-white/95 backdrop-blur-2xl border-t border-slate-200"
                style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
                <div className="flex items-stretch justify-around h-[60px]">
                    {(isTeamUser ? tabs : STATIC_TABS).map(tab => {
                        const isPricing = tab.key === 'pricing';
                        const isWishlist = tab.key === 'wishlist';
                        const active = isPricing ? sheetOpen : tab.href ? isTabActive(tab.href) : false;

                        const Icon = tab.icon;
                        const cls = `flex flex-col items-center justify-center flex-1 gap-1 transition-all duration-300 min-h-[44px] relative ${
                            active ? 'text-[#D6A900]' : 'text-slate-500 active:text-slate-700'
                        }`;

                        if (isPricing) {
                            const PricingIcon = pricingMode === 'finance' ? CreditCard : Banknote;
                            return (
                                <button key={tab.key} onClick={handlePricingTabClick} className={cls}>
                                    <div className="relative">
                                        <PricingIcon size={20} strokeWidth={sheetOpen ? 2.5 : 1.5} />
                                        {active && (
                                            <div className="absolute top-0 -right-2 w-1 h-1 rounded-full bg-[#FFD700] shadow-[0_0_6px_#FFD700]" />
                                        )}
                                    </div>
                                    <span
                                        className={`text-[9px] tracking-[0.15em] uppercase ${sheetOpen ? 'font-black' : 'font-semibold'}`}
                                    >
                                        {pricingMode === 'finance' ? 'EMI' : 'Cash'}
                                    </span>
                                    {sheetOpen && (
                                        <div className="absolute top-1 w-1 h-1 rounded-full bg-[#FFD700] shadow-[0_0_6px_#FFD700]" />
                                    )}
                                </button>
                            );
                        }

                        if (tab.key === 'lead') {
                            return (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setIsQuickLeadOpen(true)}
                                    className={cls}
                                >
                                    <div className="relative">
                                        <Icon size={20} strokeWidth={1.5} />
                                    </div>
                                    <span className="text-[9px] font-semibold uppercase tracking-[0.15em]">
                                        {tab.label}
                                    </span>
                                </button>
                            );
                        }

                        return (
                            <Link key={tab.key} href={tab.href!} className={cls}>
                                <div className="relative">
                                    <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
                                    {isWishlist && favorites.length > 0 && (
                                        <span className="absolute -top-1.5 -right-2.5 w-4 h-4 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border border-white">
                                            {favorites.length > 9 ? '9+' : favorites.length}
                                        </span>
                                    )}
                                </div>
                                <span
                                    className={`text-[9px] tracking-[0.15em] uppercase ${active ? 'font-black' : 'font-semibold'}`}
                                >
                                    {tab.label}
                                </span>
                                {active && (
                                    <div className="absolute top-1 w-1 h-1 rounded-full bg-[#FFD700] shadow-[0_0_6px_#FFD700]" />
                                )}
                            </Link>
                        );
                    })}
                </div>
            </nav>
            <QuickLeadMiniModal isOpen={isQuickLeadOpen} onClose={() => setIsQuickLeadOpen(false)} />
        </>
    );
}
