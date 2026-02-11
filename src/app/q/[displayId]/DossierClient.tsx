'use client';

import React, { useCallback } from 'react';
import { Logo } from '@/components/brand/Logo';
import { getProxiedUrl } from '@/lib/utils/urlHelper';
import {
    ShieldCheck,
    Zap,
    Sparkles,
    CreditCard,
    ChevronRight,
    ArrowRight,
    MapPin,
    Phone,
    Mail,
    Globe,
    Info,
    Activity,
    Clock,
    CheckCircle2,
    LayoutDashboard,
    Package,
    Settings2,
    Truck,
    Milestone,
    Target,
    TrendingUp,
    Weight,
    Ruler,
    ChevronDown,
    AlertCircle,
    Share2,
    Instagram,
    Facebook,
    Twitter,
    Linkedin,
    Newspaper,
} from 'lucide-react';

import { formatDisplayId } from '@/utils/displayId';

/**
 * Utility for conditional class names
 */
function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}

interface DossierClientProps {
    quote: any;
}

const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(Number.isFinite(val) ? val : 0);

const toNumber = (val: any, fallback = 0) => {
    const n = Number(val);
    return Number.isFinite(n) ? n : fallback;
};

const calcItemsTotal = (items: any[], useDiscount = true) =>
    (items || []).reduce((sum, item) => {
        const qty = toNumber(item.qty, 1) || 1;
        const base = toNumber(item.basePrice ?? item.price ?? item.amount, 0);
        const offer =
            item.discountPrice !== undefined && item.discountPrice !== null ? toNumber(item.discountPrice, base) : base;
        const effective = useDiscount ? offer : base;
        return sum + effective * qty;
    }, 0);

const DossierRow = ({
    label,
    value,
    description,
    isSub = false,
    isBold = false,
    isSaving = false,
    extra,
}: {
    label: React.ReactNode;
    value: React.ReactNode;
    description?: React.ReactNode;
    isSub?: boolean;
    isBold?: boolean;
    isSaving?: boolean;
    extra?: React.ReactNode;
}) => (
    <div
        className={cn(
            'group flex items-start justify-between py-2 px-6 border-b border-slate-100 dark:border-white/5',
            isSub && 'bg-slate-50/30 dark:bg-white/[0.01]',
            isBold && 'bg-slate-50/50 dark:bg-white/[0.02]'
        )}
    >
        <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex items-center gap-2">
                {isSub && <span className="text-slate-300 dark:text-white/20 select-none">└</span>}
                <div
                    className={cn(
                        'text-sm font-medium',
                        isBold ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-white/70',
                        isSub && 'text-xs'
                    )}
                >
                    {label}
                </div>
                {extra}
            </div>
            {description && <div className="pl-4 text-[10px] text-slate-400 dark:text-white/40">{description}</div>}
        </div>
        <div className="flex items-center gap-3 shrink-0">
            <span
                className={cn(
                    'text-sm font-bold tabular-nums',
                    isBold ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-white/80',
                    isSub && 'text-xs'
                )}
            >
                {value}
            </span>
        </div>
    </div>
);

const DossierGroup = ({
    title,
    total,
    icon: Icon,
    children,
    quote,
}: {
    title: React.ReactNode;
    icon: any;
    total?: React.ReactNode;
    children: React.ReactNode;
    quote: any;
}) => (
    <div className="border-b border-slate-100 dark:border-white/5 last:border-0 bg-white dark:bg-[#0b0d10]">
        <div className="w-full flex items-center justify-between py-4 px-6 relative overflow-hidden bg-white dark:bg-[#0b0d10]">
            <div className="flex items-center gap-3">
                <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm border border-slate-100"
                    style={{ backgroundColor: 'white', color: '#64748B' }}
                >
                    <Icon size={16} />
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                    {title}
                </span>
            </div>
            {total !== undefined && (
                <div className="flex items-center gap-4">
                    <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums">
                        {typeof total === 'number' ? formatCurrency(total) : total}
                    </span>
                    <ChevronDown size={18} className="text-slate-300" />
                </div>
            )}
        </div>
        <div className="bg-slate-50/20 dark:bg-white/[0.005]">{children}</div>
    </div>
);

const PageHeader = ({ title, subtitle, accentColor }: { title: string; subtitle?: string; accentColor?: string }) => (
    <div className="space-y-4">
        <div className="flex items-center gap-2">
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">BookMyBike Strategy</div>
        </div>
        <h1 className="text-4xl font-black uppercase tracking-tight text-slate-900 leading-none">{title}</h1>
        {subtitle && <p className="text-sm font-medium text-slate-500 max-w-xl italic">{subtitle}</p>}
    </div>
);

/**
 * Utility to determine if text should be black or white based on background color luminance
 */
const getContrastColor = (hex: string) => {
    if (!hex || hex === 'transparent') return '#000000';
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substr(0, 2), 16);
    const g = parseInt(cleanHex.substr(2, 2), 16);
    const b = parseInt(cleanHex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6 ? '#000000' : '#FFFFFF';
};

export default function DossierClient({ quote }: DossierClientProps) {
    const pricing = quote.pricing || {};
    const accessories = pricing.accessories || [];
    const services = pricing.services || [];
    const insuranceAddons = pricing.insuranceAddons || [];
    const insuranceRequired = pricing.insuranceRequired || [];
    const warrantyItems = pricing.warrantyItems || [];
    const rtoOptions = pricing.rtoOptions || [];
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

    const accessoriesBase = calcItemsTotal(accessories, false);
    const accessoriesOffer = calcItemsTotal(accessories, true);
    const servicesBase = calcItemsTotal(services, false);
    const servicesOffer = calcItemsTotal(services, true);

    const insuranceAddonsBase = (insuranceAddons || []).reduce((sum: number, i: any) => {
        if (i.basePrice !== undefined) return sum + toNumber(i.basePrice, 0);
        if (Array.isArray(i.breakdown)) {
            return sum + i.breakdown.reduce((s: number, b: any) => s + toNumber(b.amount, 0), 0);
        }
        return sum + toNumber(i.amount, 0);
    }, 0);
    const insuranceAddonsOffer = (insuranceAddons || []).reduce(
        (sum: number, i: any) => sum + toNumber(i.amount, 0),
        0
    );

    const savingsFromDeltas =
        Math.abs(toNumber(pricing.offersDelta, 0)) +
        Math.abs(toNumber(pricing.dealerDiscount, 0)) +
        Math.abs(toNumber(pricing.managerDiscount, 0)) +
        Math.abs(toNumber(pricing.referralBonus, 0));
    const totalSavings =
        pricing.totalSavings !== undefined && pricing.totalSavings !== null
            ? toNumber(pricing.totalSavings, 0)
            : savingsFromDeltas;
    const offerOnRoad = toNumber(pricing.onRoadTotal ?? pricing.finalTotal, 0);
    const totalSurge =
        pricing.totalSurge !== undefined && pricing.totalSurge !== null ? toNumber(pricing.totalSurge, 0) : 0;
    const baseOnRoad = offerOnRoad + totalSavings;
    const deltaAmount = Math.abs(baseOnRoad - offerOnRoad);
    const deltaIsSaving = baseOnRoad >= offerOnRoad;

    const createdDate = quote.created_at ? new Date(quote.created_at) : null;
    const validDate = quote.valid_until ? new Date(quote.valid_until) : null;

    const handlePrint = useCallback(async () => {
        const imageUrl = quote.vehicle?.imageUrl;
        if (imageUrl) {
            await new Promise<void>(resolve => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.src = getProxiedUrl(imageUrl);
                if (img.complete) return resolve();
                img.onload = () => resolve();
                img.onerror = () => resolve();
            });
        }
        window.print();
    }, [quote.vehicle?.imageUrl]);

    return (
        <div className="dossier-stage">
            {/* Page 1 - Welcome */}
            <section
                className="a4-page relative overflow-hidden flex flex-col"
                style={{
                    backgroundColor: '#FAFAFA', // Light base like Catalog
                }}
            >
                {/* Secondary background layer for the dynamic tint (Catalog-card parity, 30% opacity) */}
                <div
                    className="absolute inset-0 z-0"
                    style={{
                        backgroundColor: quote?.vehicle?.hexCode ? `${quote.vehicle.hexCode}4D` : 'transparent',
                    }}
                />
                <div className="a4-grid">
                    <div className="a4-header">
                        <Logo size={42} variant="full" />
                        <div className="text-right">
                            <div className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Quote Reference</div>
                            <div className="text-xl font-black text-slate-900">{formatDisplayId(quote.display_id)}</div>
                        </div>
                    </div>
                    <div className="a4-body">
                        {/* Page 1 Hero Section */}
                        <div className="relative h-full flex flex-col justify-between">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="h-px w-12"
                                        style={{ backgroundColor: quote?.vehicle?.hexCode || '#FFD700' }}
                                    />
                                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.4em]">
                                        Official Digital Dossier
                                    </span>
                                </div>
                                <h1 className="text-6xl font-black text-slate-900 uppercase tracking-tighter leading-[0.9]">
                                    {quote.customer?.name?.split(' ')[0] || 'नमस्ते'}!
                                </h1>
                                <p className="text-xl text-slate-500 font-medium max-w-md">
                                    Your journey starts here. Explore your personalized quote for the{' '}
                                    <span
                                        className="text-slate-900 font-black italic underline decoration-4 underline-offset-4"
                                        style={{ textDecorationColor: quote?.vehicle?.hexCode || '#FFD700' }}
                                    >
                                        perfect ride
                                    </span>
                                    .
                                </p>
                            </div>

                            {/* Dramatic Hero Visual */}
                            <div className="relative flex-1 flex flex-col items-center justify-center py-12">
                                <div
                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] aspect-square blur-[100px] rounded-full pointer-events-none"
                                    style={{
                                        backgroundColor: quote?.vehicle?.hexCode
                                            ? `${quote.vehicle.hexCode}4D`
                                            : 'transparent',
                                    }}
                                />
                                <div className="relative z-10 w-full max-w-2xl transform hover:scale-105 transition-transform duration-700">
                                    {quote.vehicle?.imageUrl || quote.vehicle?.brand ? (
                                        <img
                                            src={getProxiedUrl(
                                                quote.vehicle.imageUrl ||
                                                    `/media/${(quote.vehicle.brand || '').toLowerCase()}/${(quote.vehicle.model || '').toLowerCase()}/product/primary.jpg`
                                            )}
                                            alt={quote.vehicle.model}
                                            className="w-full h-auto object-contain drop-shadow-[0_35px_80px_rgba(0,0,0,0.15)]"
                                        />
                                    ) : (
                                        <div className="w-full aspect-video bg-slate-100 rounded-3xl flex items-center justify-center text-slate-300">
                                            No Hero Image
                                        </div>
                                    )}
                                </div>
                                <div className="mt-8 text-center">
                                    <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic">
                                        {quote.vehicle?.brand} {quote.vehicle?.model}
                                    </h2>
                                    <div className="flex items-center justify-center gap-4 mt-2">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            {quote.vehicle?.variant}
                                        </span>
                                        <div
                                            className="h-1 w-1 rounded-full"
                                            style={{ backgroundColor: quote?.vehicle?.hexCode || '#FFD700' }}
                                        />
                                        <span
                                            className="text-[10px] font-black uppercase tracking-widest"
                                            style={{ color: quote?.vehicle?.hexCode || '#F4B000' }}
                                        >
                                            {quote.vehicle?.color}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Unified Premium Ribbon */}
                            <div className="pb-10">
                                <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white p-1 shadow-2xl shadow-slate-200/50 flex items-stretch">
                                    {/* On-Road Section */}
                                    <div className="flex-1 px-8 py-6 flex flex-col items-center justify-center text-center">
                                        <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
                                            On-Road
                                        </div>
                                        <div className="text-xl font-black text-slate-900">
                                            {formatCurrency(baseOnRoad)}
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div
                                        className="w-px my-6"
                                        style={{
                                            backgroundColor: quote?.vehicle?.hexCode
                                                ? `${quote.vehicle.hexCode}26`
                                                : '#E2E8F0',
                                        }}
                                    />

                                    {/* Our Offer Section (The Centerpiece) */}
                                    <div className="flex-1 flex px-8 py-6 flex flex-col items-center justify-center text-center relative">
                                        <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
                                            Our Offer
                                        </div>
                                        <div
                                            className="text-4xl font-black italic tracking-tighter"
                                            style={{ color: quote?.vehicle?.hexCode || '#F4B000' }}
                                        >
                                            {formatCurrency(offerOnRoad)}
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div
                                        className="w-px my-6"
                                        style={{
                                            backgroundColor: quote?.vehicle?.hexCode
                                                ? `${quote.vehicle.hexCode}26`
                                                : '#E2E8F0',
                                        }}
                                    />

                                    {/* Delta Section */}
                                    <div className="flex-1 px-8 py-6 flex flex-col items-center justify-center text-center">
                                        <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
                                            {deltaIsSaving ? 'You Save' : 'Surge'}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {deltaIsSaving && (
                                                <Sparkles
                                                    size={14}
                                                    style={{ color: quote?.vehicle?.hexCode || '#10B981' }}
                                                />
                                            )}
                                            <div
                                                className="text-xl font-black"
                                                style={{ color: quote?.vehicle?.hexCode || '#64748B' }}
                                            >
                                                {deltaIsSaving ? '-' : '+'}
                                                {formatCurrency(deltaAmount)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="a4-footer">
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck size={14} className="text-[#F4B000]" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        Official & Verified
                                    </span>
                                </div>
                                <div className="h-4 w-px bg-slate-100" />
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                                    Ref: {formatDisplayId(quote.display_id)}
                                </div>
                                <div className="h-4 w-px bg-slate-100" />
                                <div className="text-[10px] uppercase tracking-widest text-slate-400">Page 1 of 13</div>
                            </div>
                            <button
                                onClick={handlePrint}
                                className="no-print px-6 py-2 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/20 active:scale-95 transition-transform"
                            >
                                Download PDF
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Page 2 - Pricing */}
            <section className="a4-page relative overflow-hidden flex flex-col bg-white">
                <div
                    className="absolute left-0 top-0 bottom-0 w-2"
                    style={{ backgroundColor: quote?.vehicle?.hexCode || '#0b0d10' }}
                />
                <div className="a4-grid flex-1 relative z-10 border-l border-zinc-200">
                    <div className="a4-header">
                        <PageHeader
                            title="Pricing"
                            subtitle="Transparent breakup as seen on PDP and CRM."
                            accentColor={quote?.vehicle?.hexCode}
                        />
                        <div className="text-right text-sm text-zinc-500">
                            Quote: {formatDisplayId(quote.display_id)}
                        </div>
                    </div>
                    <div className="a4-body">
                        <div className="mb-4">
                            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">
                                Line-Item Breakdown
                            </div>
                            <div className="text-xs text-slate-500 mt-1">CRM Quote Tab (SOT)</div>
                        </div>

                        <div className="space-y-4">
                            <DossierGroup
                                quote={quote}
                                title="EX-SHOWROOM PRICE"
                                icon={Package}
                                total={pricing.exShowroom}
                            >
                                {(() => {
                                    const exShowroom = pricing.exShowroom || 0;
                                    const gstRate = quote.pricing?.exShowroomGstRate || (exShowroom > 100000 ? 28 : 18);
                                    const basePrice =
                                        quote.pricing?.exShowroomBasePrice ??
                                        Math.round(exShowroom / (1 + gstRate / 100));
                                    const gstAmount = quote.pricing?.exShowroomGstAmount ?? exShowroom - basePrice;
                                    return (
                                        <>
                                            <DossierRow isSub label="Base Price" value={formatCurrency(basePrice)} />
                                            <DossierRow
                                                isSub
                                                label={`GST (${gstRate}%)`}
                                                value={formatCurrency(gstAmount)}
                                            />
                                            {quote.pricing?.colorDelta !== undefined &&
                                                quote.pricing?.colorDelta !== 0 && (
                                                    <DossierRow
                                                        isSub
                                                        isSaving={quote.pricing.colorDelta < 0}
                                                        label={
                                                            quote.pricing.colorDelta < 0
                                                                ? 'Colour Discount'
                                                                : 'Colour Surge'
                                                        }
                                                        value={formatCurrency(quote.pricing.colorDelta)}
                                                    />
                                                )}
                                        </>
                                    );
                                })()}
                            </DossierGroup>

                            <DossierGroup
                                quote={quote}
                                title="REGISTRATION (RTO)"
                                icon={Milestone}
                                total={pricing.rtoTotal}
                            >
                                {pricing.rtoBreakdown && pricing.rtoBreakdown.length > 0 ? (
                                    pricing.rtoBreakdown.map((item: any, idx: number) => (
                                        <DossierRow
                                            key={idx}
                                            isSub
                                            label={item.label || item.name}
                                            value={formatCurrency(item.amount || item.price || 0)}
                                        />
                                    ))
                                ) : (
                                    <DossierRow
                                        isSub
                                        label="Standard Registration"
                                        value={formatCurrency(pricing.rtoTotal)}
                                    />
                                )}
                                {pricing.rtoType && (
                                    <div className="px-8 py-2 text-[9px] uppercase tracking-widest text-slate-400">
                                        Registration Type: {pricing.rtoType}
                                    </div>
                                )}
                            </DossierGroup>

                            <DossierGroup
                                quote={quote}
                                title="INSURANCE PACKAGE"
                                icon={ShieldCheck}
                                total={pricing.insuranceTotal}
                            >
                                <DossierRow
                                    isSub
                                    label="Third Party (Basic)"
                                    value={formatCurrency(pricing.insuranceTP)}
                                />
                                <DossierRow isSub label="Own Damage (OD)" value={formatCurrency(pricing.insuranceOD)} />
                                {insuranceAddons.length > 0 &&
                                    insuranceAddons.map((addon: any, idx: number) => (
                                        <DossierRow
                                            key={addon.id || idx}
                                            isSub
                                            label={addon.name || addon.label}
                                            value={formatCurrency(
                                                toNumber(addon.discountPrice ?? addon.price ?? addon.amount, 0)
                                            )}
                                        />
                                    ))}
                                {insuranceRequired.length > 0 &&
                                    insuranceRequired.map((addon: any, idx: number) => (
                                        <DossierRow
                                            key={`req-${addon.id || idx}`}
                                            isSub
                                            label={addon.name || addon.label}
                                            value={formatCurrency(
                                                toNumber(addon.discountPrice ?? addon.price ?? addon.amount, 0)
                                            )}
                                        />
                                    ))}
                            </DossierGroup>

                            <DossierGroup
                                quote={quote}
                                title="AUTHORIZED ACCESSORIES"
                                icon={Settings2}
                                total={pricing.accessoriesTotal}
                            >
                                {accessories.length > 0 ? (
                                    accessories.map((item: any, idx: number) => (
                                        <DossierRow
                                            key={item.id || idx}
                                            isSub
                                            label={item.name}
                                            value={formatCurrency(
                                                toNumber(item.discountPrice ?? item.price ?? item.amount, 0)
                                            )}
                                        />
                                    ))
                                ) : (
                                    <div className="px-8 py-4 text-zinc-400 text-[10px] uppercase italic text-center">
                                        No accessories selected
                                    </div>
                                )}
                            </DossierGroup>

                            <DossierGroup
                                quote={quote}
                                title="SERVICES & WARRANTIES"
                                icon={Sparkles}
                                total={pricing.servicesTotal}
                            >
                                {services.length > 0 ? (
                                    services.map((item: any, idx: number) => (
                                        <DossierRow
                                            key={item.id || idx}
                                            isSub
                                            label={item.name}
                                            value={formatCurrency(
                                                toNumber(item.discountPrice ?? item.price ?? item.amount, 0)
                                            )}
                                        />
                                    ))
                                ) : (
                                    <div className="px-8 py-4 text-zinc-400 text-[10px] uppercase italic text-center">
                                        Standard service plan active
                                    </div>
                                )}
                            </DossierGroup>

                            <div className="py-6 px-8 bg-amber-500/[0.05] rounded-[1.5rem] border border-amber-200/40">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-black text-amber-600 uppercase tracking-tight">
                                            Manager Discretionary
                                        </span>
                                        <span className="text-[9px] text-amber-500/70 font-medium">
                                            Applied for special commercial sessions
                                        </span>
                                    </div>
                                    <div className="text-sm font-black text-amber-700">
                                        {formatCurrency(pricing.managerDiscount || 0)}
                                    </div>
                                </div>
                                {quote.pricing?.managerDiscountNote && (
                                    <div className="mt-3 text-[10px] uppercase tracking-widest text-amber-600/70">
                                        Note: {quote.pricing.managerDiscountNote}
                                    </div>
                                )}
                            </div>

                            <div className="px-8 py-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Share2 size={14} className="text-slate-400" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">
                                            Configuration Locked
                                        </span>
                                        <span className="text-[9px] text-slate-500">
                                            Modify vehicle, color, or addons on Marketplace
                                        </span>
                                    </div>
                                </div>
                                <ArrowRight size={16} className="text-slate-300" />
                            </div>

                            <div className="bg-slate-900 rounded-[2rem] p-8 text-white flex items-center justify-between">
                                <div>
                                    <div className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">
                                        Net Payable Amount
                                    </div>
                                    <div className="text-4xl font-black tracking-tighter">
                                        {formatCurrency(pricing.finalTotal || 0)}
                                    </div>
                                    <div className="flex items-center gap-2 mt-2 text-[9px] font-bold text-white/40 uppercase">
                                        <CheckCircle2 size={10} className="text-emerald-400" /> On-Road Total
                                        <span className="w-1 h-1 rounded-full bg-white/20" /> 24h Validity
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-white/40">
                                        On-Road
                                    </div>
                                    <div className="text-xl font-black">{formatCurrency(pricing.onRoadTotal || 0)}</div>
                                </div>
                            </div>

                            {quote.financeMode === 'LOAN' && quote.finance && (
                                <div className="p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100 flex items-center justify-between">
                                    <div>
                                        <div className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                                            Estimated Finance Summary
                                        </div>
                                        <div className="text-sm font-black text-slate-900">
                                            {quote.finance.bank || 'Standard Finance Scheme'}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <div className="text-[8px] font-bold text-slate-400 uppercase">
                                                Monthly EMI
                                            </div>
                                            <div className="text-lg font-black text-slate-900">
                                                ₹{quote.finance.emi?.toLocaleString() || '0'}/mo
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[8px] font-bold text-slate-400 uppercase">
                                                Down Payment
                                            </div>
                                            <div className="text-lg font-black text-slate-900">
                                                ₹{quote.finance.downPayment?.toLocaleString() || '0'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>{' '}
                    <div className="a4-footer">
                        <div className="text-[10px] uppercase tracking-widest text-zinc-400">Page 2 of 13</div>
                        <div className="text-[10px] uppercase tracking-widest text-zinc-400">Pricing Breakup</div>
                    </div>
                </div>
            </section>

            {/* Page 3 - Finance Scheme */}
            <section className="a4-page relative overflow-hidden flex flex-col bg-white">
                <div
                    className="absolute left-0 top-0 bottom-0 w-2"
                    style={{ backgroundColor: quote?.vehicle?.hexCode || '#0b0d10' }}
                />
                <div className="a4-grid flex-1 relative z-10 border-l border-zinc-200">
                    <div className="a4-header">
                        <PageHeader
                            title="Finance Scheme"
                            subtitle="Finance tab application details from CRM."
                            accentColor={quote?.vehicle?.hexCode}
                        />
                        <div className="text-right text-sm text-zinc-500">
                            Quote: {formatDisplayId(quote.display_id)}
                        </div>
                    </div>
                    <div className="a4-body">
                        {quote.finance ? (
                            <div className="space-y-6">
                                <DossierGroup quote={quote} title="Terms & Performance" icon={Activity}>
                                    <DossierRow
                                        label="Financier"
                                        value={quote.finance.bankName || quote.finance.bank || '—'}
                                    />
                                    <DossierRow label="Selection Logic" value={quote.finance.selectionLogic || '—'} />
                                    <DossierRow label="Source" value={quote.finance.source || 'MARKETPLACE'} />
                                    <DossierRow
                                        label="Status"
                                        value={(quote.finance.status || 'IN_PROCESS').toUpperCase()}
                                    />
                                    <DossierRow
                                        label="Scheme Name"
                                        value={
                                            quote.finance.schemeName ||
                                            quote.finance.schemeCode ||
                                            quote.finance.scheme ||
                                            '—'
                                        }
                                    />
                                    <DossierRow
                                        label="Tenure"
                                        value={quote.finance.tenureMonths || quote.finance.tenure || '—'}
                                        isSub
                                    />
                                    <DossierRow
                                        label="Monthly EMI"
                                        value={formatCurrency(toNumber(quote.finance.emi, 0))}
                                        isBold
                                    />
                                    <DossierRow
                                        label="Rate of Interest"
                                        value={
                                            quote.finance.roi !== null && quote.finance.roi !== undefined
                                                ? `${quote.finance.roi}%`
                                                : '—'
                                        }
                                        isSub
                                    />
                                </DossierGroup>

                                <DossierGroup quote={quote} title="Asset Settlement" icon={Target}>
                                    <DossierRow
                                        label="Asset Cost (Net SOT)"
                                        value={formatCurrency(toNumber(pricing.finalTotal, 0))}
                                    />
                                    <DossierRow
                                        label="Offer Discount"
                                        value={formatCurrency(toNumber(pricing.offersDelta, 0))}
                                        isSub
                                    />
                                    <DossierRow
                                        label="Total Payable"
                                        value={formatCurrency(
                                            toNumber(pricing.finalTotal, 0) + toNumber(pricing.offersDelta, 0)
                                        )}
                                        isBold
                                    />
                                </DossierGroup>

                                <DossierGroup quote={quote} title="Finance Pillars" icon={TrendingUp}>
                                    {(() => {
                                        const netLoan =
                                            quote.finance.loanAmount ??
                                            toNumber(pricing.finalTotal, 0) - toNumber(quote.finance.downPayment, 0);
                                        const addOns = quote.finance.loanAddons ?? quote.finance.fundedAddons ?? 0;
                                        const grossLoan = toNumber(netLoan, 0) + toNumber(addOns, 0);
                                        return (
                                            <>
                                                <DossierRow
                                                    label="Net Loan Amount"
                                                    value={formatCurrency(toNumber(netLoan, 0))}
                                                />
                                                <DossierRow
                                                    label="Loan Add-ons"
                                                    value={formatCurrency(toNumber(addOns, 0))}
                                                    isSub
                                                />
                                                <DossierRow
                                                    label="Gross Loan Amount"
                                                    value={formatCurrency(toNumber(grossLoan, 0))}
                                                    isBold
                                                />
                                            </>
                                        );
                                    })()}
                                </DossierGroup>

                                <DossierGroup quote={quote} title="Upfront Obligations" icon={Clock}>
                                    <DossierRow
                                        label="Total Upfront Charges"
                                        value={formatCurrency(
                                            toNumber(quote.finance.upfrontCharges ?? quote.finance.processingFee, 0)
                                        )}
                                    />
                                    {Array.isArray(quote.finance.chargesBreakup) &&
                                    quote.finance.chargesBreakup.length > 0 ? (
                                        quote.finance.chargesBreakup.map((c: any, idx: number) => (
                                            <DossierRow
                                                key={idx}
                                                label={c.label || c.name || 'Charge'}
                                                value={formatCurrency(toNumber(c.amount, 0))}
                                                isSub
                                            />
                                        ))
                                    ) : (
                                        <div className="px-8 py-4 text-zinc-400 text-[10px] uppercase italic text-center">
                                            No upfront breakup available
                                        </div>
                                    )}
                                    <DossierRow
                                        label="Down Payment"
                                        value={formatCurrency(toNumber(quote.finance.downPayment, 0))}
                                        isBold
                                    />
                                </DossierGroup>
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center border-4 border-dashed border-slate-100 rounded-[3rem]">
                                <div className="text-center">
                                    <CreditCard size={48} className="mx-auto text-slate-200 mb-4" />
                                    <div className="text-sm font-black text-slate-400 uppercase tracking-widest">
                                        Direct Liquid Purchase
                                    </div>
                                    <div className="text-[10px] text-slate-300 uppercase tracking-widest mt-2">
                                        No Finance Linked
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>{' '}
                    <div className="a4-footer">
                        <div className="text-[10px] uppercase tracking-widest text-zinc-400">Page 3 of 13</div>
                        <div className="text-[10px] uppercase tracking-widest text-zinc-400">Finance Scheme</div>
                    </div>
                </div>
            </section>

            {/* Page 4 - Product Details */}
            <section className="a4-page relative overflow-hidden flex flex-col bg-white">
                <div
                    className="absolute left-0 top-0 bottom-0 w-2"
                    style={{ backgroundColor: quote?.vehicle?.hexCode || '#0b0d10' }}
                />
                <div className="a4-grid flex-1 relative z-10 border-l border-zinc-200">
                    <div className="a4-header flex justify-between items-end mb-12">
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-2">
                                Technical Portfolio
                            </div>
                            <h3 className="text-4xl font-black text-zinc-900 uppercase">Product Details</h3>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-[#F4B000] mb-1">
                                {quote?.vehicle?.brand}
                            </div>
                            <h4 className="text-2xl font-black text-zinc-900 uppercase tracking-tighter">
                                {quote?.vehicle?.model}
                            </h4>
                            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                                {quote?.vehicle?.variant}
                            </div>
                        </div>
                    </div>
                    <div className="a4-body">
                        <div className="space-y-3 text-sm text-zinc-700">
                            <div className="text-[9px] font-black uppercase tracking-widest text-zinc-400 pt-2">
                                Specification Summary
                            </div>
                            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                                <span className="font-medium flex items-center gap-2">
                                    <Zap size={12} className="text-[#F4B000]" />
                                    Cubic Capacity
                                </span>
                                <span>{quote.vehicle?.engine_cc ? `${quote.vehicle.engine_cc} cc` : '—'}</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                                <span className="font-medium flex items-center gap-2">
                                    <Info size={12} className="text-[#F4B000]" />
                                    Fuel Type
                                </span>
                                <span>{quote.vehicle?.fuel_type || 'Petrol'}</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                                <span className="font-medium flex items-center gap-2">
                                    <Weight size={12} className="text-[#F4B000]" />
                                    Kerb Weight
                                </span>
                                <span>{quote.vehicle?.kerb_weight ? `${quote.vehicle.kerb_weight} kg` : '—'}</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                                <span className="font-medium flex items-center gap-2">
                                    <ShieldCheck size={12} className="text-[#F4B000]" />
                                    Braking Setup
                                </span>
                                <span>{quote.vehicle?.front_brake || 'Disc Brakes'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="a4-footer">
                        <div className="text-[10px] uppercase tracking-widest text-zinc-400">Page 4 of 13</div>
                        <div className="text-[10px] uppercase tracking-widest text-zinc-400">Product Details</div>
                    </div>
                </div>
            </section>

            {/* Page 5 - Accessories */}
            <section className="a4-page relative overflow-hidden flex flex-col bg-white">
                <div
                    className="absolute left-0 top-0 bottom-0 w-2"
                    style={{ backgroundColor: quote?.vehicle?.hexCode || '#0b0d10' }}
                />
                <div className="a4-grid flex-1 relative z-10 border-l border-zinc-200">
                    <div className="a4-header">
                        <PageHeader
                            title="Authorized Accessories"
                            subtitle="Genuine enhancements and protection."
                            accentColor={quote?.vehicle?.hexCode}
                        />
                        <div className="text-right text-sm text-zinc-500">
                            Quote: {formatDisplayId(quote.display_id)}
                        </div>
                    </div>
                    <div className="a4-body">
                        {accessories.length > 0 ? (
                            <DossierGroup
                                quote={quote}
                                title="Selection"
                                icon={Settings2}
                                total={pricing.accessoriesTotal}
                            >
                                {accessories.map((item: any, idx: number) => (
                                    <DossierRow
                                        key={item.id || idx}
                                        isSub
                                        label={item.name}
                                        value={formatCurrency(
                                            toNumber(item.discountPrice ?? item.price ?? item.amount, 0)
                                        )}
                                    />
                                ))}
                            </DossierGroup>
                        ) : (
                            <div className="h-full flex items-center justify-center border-4 border-dashed border-slate-100 rounded-[3rem]">
                                <span className="text-slate-300 uppercase text-[10px] font-black tracking-widest">
                                    No Accessories Selected
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="a4-footer">
                        <div className="text-[10px] uppercase tracking-widest text-zinc-400">Page 5 of 13</div>
                        <div className="text-[10px] uppercase tracking-widest text-zinc-400">Accessories</div>
                    </div>
                </div>
            </section>

            {/* Page 6 - Insurance */}
            <section className="a4-page relative overflow-hidden flex flex-col bg-white">
                <div
                    className="absolute left-0 top-0 bottom-0 w-2"
                    style={{ backgroundColor: quote?.vehicle?.hexCode || '#0b0d10' }}
                />
                <div className="a4-grid flex-1 relative z-10 border-l border-zinc-200">
                    <div className="a4-header">
                        <PageHeader
                            title="Insurance"
                            subtitle="Comprehensive protection for your ride."
                            accentColor={quote?.vehicle?.hexCode}
                        />
                        <div className="text-right text-sm text-zinc-500">
                            Quote: {formatDisplayId(quote.display_id)}
                        </div>
                    </div>
                    <div className="a4-body">
                        <div className="space-y-4">
                            <DossierGroup
                                quote={quote}
                                title="Primary Covers"
                                icon={ShieldCheck}
                                total={pricing.insuranceTotal}
                            >
                                <DossierRow
                                    isSub
                                    label="Third Party Liability"
                                    value={formatCurrency(pricing.insuranceTP)}
                                />
                                <DossierRow isSub label="Own Damage" value={formatCurrency(pricing.insuranceOD)} />
                            </DossierGroup>
                            {insuranceAddons.length > 0 && (
                                <DossierGroup quote={quote} title="Add-ons" icon={Sparkles}>
                                    {insuranceAddons.map((addon: any, idx: number) => (
                                        <DossierRow
                                            key={addon.id || idx}
                                            isSub
                                            label={addon.name || addon.label}
                                            value={formatCurrency(
                                                toNumber(addon.discountPrice ?? addon.price ?? addon.amount, 0)
                                            )}
                                        />
                                    ))}
                                </DossierGroup>
                            )}
                        </div>
                    </div>
                    <div className="a4-footer">
                        <div className="text-[10px] uppercase tracking-widest text-zinc-400">Page 6 of 13</div>
                        <div className="text-[10px] uppercase tracking-widest text-zinc-400">Insurance</div>
                    </div>
                </div>
            </section>

            {/* Page 7 - Registration (RTO) */}
            <section className="a4-page relative overflow-hidden flex flex-col bg-white">
                <div
                    className="absolute left-0 top-0 bottom-0 w-2"
                    style={{ backgroundColor: quote?.vehicle?.hexCode || '#0b0d10' }}
                />
                <div className="a4-grid flex-1 relative z-10 border-l border-zinc-200">
                    <div className="a4-header">
                        <PageHeader
                            title="Registration"
                            subtitle="Statutory levies and RTO documentation."
                            accentColor={quote?.vehicle?.hexCode}
                        />
                        <div className="text-right text-sm text-zinc-500">
                            Quote: {formatDisplayId(quote.display_id)}
                        </div>
                    </div>
                    <div className="a4-body">
                        <DossierGroup quote={quote} title="RTO Breakdown" icon={Milestone} total={pricing.rtoTotal}>
                            {pricing.rtoBreakdown && pricing.rtoBreakdown.length > 0 ? (
                                pricing.rtoBreakdown.map((item: any, idx: number) => (
                                    <DossierRow
                                        key={idx}
                                        isSub
                                        label={item.label || item.name}
                                        value={formatCurrency(item.amount || item.price || 0)}
                                    />
                                ))
                            ) : (
                                <DossierRow
                                    isSub
                                    label="Standard Registration"
                                    value={formatCurrency(pricing.rtoTotal)}
                                />
                            )}
                        </DossierGroup>
                    </div>
                    <div className="a4-footer">
                        <div className="text-[10px] uppercase tracking-widest text-zinc-400">Page 7 of 13</div>
                        <div className="text-[10px] uppercase tracking-widest text-zinc-400">Registration</div>
                    </div>
                </div>
            </section>

            {/* Page 8 - Service & Warranty */}
            <section className="a4-page relative overflow-hidden flex flex-col bg-white">
                <div
                    className="absolute left-0 top-0 bottom-0 w-2"
                    style={{ backgroundColor: quote?.vehicle?.hexCode || '#0b0d10' }}
                />
                <div className="a4-grid flex-1 relative z-10 border-l border-zinc-200">
                    <div className="a4-header">
                        <PageHeader
                            title="Service & Warranty"
                            subtitle="Maintenance and extended security."
                            accentColor={quote?.vehicle?.hexCode}
                        />
                        <div className="text-right text-sm text-zinc-500">
                            Quote: {formatDisplayId(quote.display_id)}
                        </div>
                    </div>
                    <div className="a4-body">
                        <div className="space-y-4">
                            <DossierGroup
                                quote={quote}
                                title="Service Selection"
                                icon={Settings2}
                                total={pricing.servicesTotal}
                            >
                                {(services || []).length > 0 ? (
                                    services.map((svc: any, idx: number) => (
                                        <DossierRow
                                            key={idx}
                                            isSub
                                            label={svc.name}
                                            value={formatCurrency(toNumber(svc.discountPrice ?? svc.price, 0))}
                                        />
                                    ))
                                ) : (
                                    <div className="px-8 py-4 text-zinc-400 text-[10px] uppercase italic text-center">
                                        Manufacturer standard service active
                                    </div>
                                )}
                            </DossierGroup>
                            <DossierGroup quote={quote} title="Warranty Plan" icon={ShieldCheck}>
                                {(warrantyItems || []).length > 0 ? (
                                    warrantyItems.map((w: any, idx: number) => (
                                        <DossierRow
                                            key={idx}
                                            isSub
                                            label={w.name || w.label || 'Extended Warranty'}
                                            value="Included"
                                        />
                                    ))
                                ) : (
                                    <div className="px-8 py-4 text-zinc-400 text-[10px] uppercase italic text-center">
                                        Standard Warranty Active
                                    </div>
                                )}
                            </DossierGroup>
                        </div>
                    </div>
                    <div className="a4-footer">
                        <div className="text-[10px] uppercase tracking-widest text-zinc-400">Page 8 of 13</div>
                        <div className="text-[10px] uppercase tracking-widest text-zinc-400">Service & Warranty</div>
                    </div>
                </div>
            </section>

            {/* Page 9 - Engine & Performance */}
            <section className="a4-page relative overflow-hidden flex flex-col bg-white">
                <div
                    className="absolute left-0 top-0 bottom-0 w-2"
                    style={{ backgroundColor: quote?.vehicle?.hexCode || '#0b0d10' }}
                />
                <div className="a4-grid flex-1 relative z-10 border-l border-zinc-200">
                    <div className="a4-header">
                        <PageHeader
                            title="Engine & Performance"
                            subtitle="The heart of the machine."
                            accentColor={quote?.vehicle?.hexCode}
                        />
                        <div className="text-right text-sm text-zinc-500">
                            Quote: {formatDisplayId(quote.display_id)}
                        </div>
                    </div>
                    <div className="a4-body">
                        <DossierGroup quote={quote} title="Performance Metrics" icon={Zap}>
                            <DossierRow
                                label="Cubic Capacity"
                                value={quote.vehicle?.specs?.engine?.displacement || '—'}
                                isSub
                            />
                            <DossierRow label="Max Power" value={quote.vehicle?.specs?.engine?.power || '—'} isSub />
                            <DossierRow label="Max Torque" value={quote.vehicle?.specs?.engine?.torque || '—'} isSub />
                            <DossierRow
                                label="Transmission"
                                value={quote.vehicle?.specs?.transmission?.type || '—'}
                                isSub
                            />
                            <DossierRow
                                label="Top Speed"
                                value={quote.vehicle?.specs?.performance?.topSpeed || '—'}
                                isSub
                            />
                            <DossierRow
                                label="Acceleration"
                                value={quote.vehicle?.specs?.performance?.acceleration || '—'}
                                isSub
                            />
                        </DossierGroup>
                    </div>
                    <div className="a4-footer">
                        <div className="text-[10px] uppercase tracking-widest text-zinc-400">Page 9 of 13</div>
                        <div className="text-[10px] uppercase tracking-widest text-zinc-400">Engine</div>
                    </div>
                </div>
            </section>

            {/* Page 10 - Dimension & Chassis */}
            <section className="a4-page relative overflow-hidden flex flex-col bg-white">
                <div
                    className="absolute left-0 top-0 bottom-0 w-2"
                    style={{ backgroundColor: quote?.vehicle?.hexCode || '#0b0d10' }}
                />
                <div className="a4-grid flex-1 relative z-10 border-l border-zinc-200">
                    <div className="a4-header">
                        <PageHeader
                            title="Dimension & Chassis"
                            subtitle="Structural integrity and footprint."
                            accentColor={quote?.vehicle?.hexCode}
                        />
                        <div className="text-right text-sm text-zinc-500">
                            Quote: {formatDisplayId(quote.display_id)}
                        </div>
                    </div>
                    <div className="a4-body">
                        <DossierGroup quote={quote} title="Chassis Architecture" icon={Activity}>
                            <DossierRow
                                label="Kerb Weight"
                                value={quote.vehicle?.specs?.dimensions?.weight || '—'}
                                isSub
                            />
                            <DossierRow
                                label="Seat Height"
                                value={quote.vehicle?.specs?.dimensions?.seatHeight || '—'}
                                isSub
                            />
                            <DossierRow
                                label="Ground Clearance"
                                value={quote.vehicle?.specs?.dimensions?.groundClearance || '—'}
                                isSub
                            />
                            <DossierRow
                                label="Wheelbase"
                                value={quote.vehicle?.specs?.dimensions?.wheelbase || '—'}
                                isSub
                            />
                            <DossierRow
                                label="Fuel Capacity"
                                value={quote.vehicle?.specs?.dimensions?.fuelCapacity || '—'}
                                isSub
                            />
                        </DossierGroup>
                    </div>
                    <div className="a4-footer">
                        <div className="text-[10px] uppercase tracking-widest text-zinc-400">Page 10 of 13</div>
                        <div className="text-[10px] uppercase tracking-widest text-zinc-400">Dimensions</div>
                    </div>
                </div>
            </section>

            {/* Page 11 - Brakes & Safety */}
            <section className="a4-page relative overflow-hidden flex flex-col bg-white">
                <div
                    className="absolute left-0 top-0 bottom-0 w-2"
                    style={{ backgroundColor: quote?.vehicle?.hexCode || '#0b0d10' }}
                />
                <div className="a4-grid flex-1 relative z-10 border-l border-zinc-200">
                    <div className="a4-header">
                        <PageHeader
                            title="Brakes & Safety"
                            subtitle="Protective systems and stopping power."
                            accentColor={quote?.vehicle?.hexCode}
                        />
                        <div className="text-right text-sm text-zinc-500">
                            Quote: {formatDisplayId(quote.display_id)}
                        </div>
                    </div>
                    <div className="a4-body">
                        <DossierGroup quote={quote} title="Safety Grid" icon={ShieldCheck}>
                            <DossierRow label="Braking" value={quote.vehicle?.specs?.brakes?.front || '—'} isSub />
                            <DossierRow label="ABS Variant" value={quote.vehicle?.specs?.brakes?.abs || '—'} isSub />
                            <DossierRow
                                label="Front Suspension"
                                value={quote.vehicle?.specs?.chassis?.suspensionFront || '—'}
                                isSub
                            />
                            <DossierRow
                                label="Rear Suspension"
                                value={quote.vehicle?.specs?.chassis?.suspensionRear || '—'}
                                isSub
                            />
                        </DossierGroup>
                    </div>
                    <div className="a4-footer">
                        <div className="text-[10px] uppercase tracking-widest text-zinc-400">Page 11 of 13</div>
                        <div className="text-[10px] uppercase tracking-widest text-zinc-400">Safety</div>
                    </div>
                </div>
            </section>

            {/* Page 12 - Features & Tech + Final Summary */}
            <section className="a4-page relative overflow-hidden flex flex-col bg-white">
                <div
                    className="absolute left-0 top-0 bottom-0 w-2"
                    style={{ backgroundColor: quote?.vehicle?.hexCode || '#0b0d10' }}
                />
                <div className="a4-grid flex-1 relative z-10 border-l border-zinc-200">
                    <div className="a4-header">
                        <PageHeader
                            title="Features & Tech"
                            subtitle="Digital ecosystem and connectivity."
                            accentColor={quote?.vehicle?.hexCode}
                        />
                        <div className="text-right text-sm text-zinc-500">
                            Quote: {formatDisplayId(quote.display_id)}
                        </div>
                    </div>
                    <div className="a4-body">
                        <DossierGroup quote={quote} title="Smart Features" icon={Zap}>
                            <div className="grid grid-cols-2 gap-2 p-2">
                                {(quote.vehicle?.features || []).slice(0, 10).map((f: string, i: number) => (
                                    <div
                                        key={i}
                                        className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2"
                                    >
                                        <div className="w-1 h-1 rounded-full bg-slate-300" /> {f}
                                    </div>
                                ))}
                                {(quote.vehicle?.features || []).length === 0 && (
                                    <div className="col-span-2 text-center text-zinc-300 uppercase text-[9px] py-4">
                                        Standard Smart Interface Included
                                    </div>
                                )}
                            </div>
                        </DossierGroup>

                        {/* Final Summary Component in Page 12 */}
                        <div className="pt-12 border-t-2 border-slate-900 mt-auto">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
                                        Final Conclusion
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <CheckCircle2 size={24} className="text-emerald-500" />
                                        <div className="text-6xl font-black text-slate-900 uppercase tracking-tighter italic">
                                            On-Road
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-7xl font-black text-slate-900 tracking-tighter">
                                        {formatCurrency(pricing.finalTotal)}
                                    </div>
                                    <div className="text-[10px] font-black text-[#F4B000] uppercase tracking-widest mt-2 flex items-center justify-end gap-2">
                                        <Sparkles size={12} /> Verified Best-Market Pricing
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="a4-footer">
                        <div className="text-[10px] uppercase tracking-widest text-zinc-400">Page 12 of 13</div>
                        <div className="text-[10px] uppercase tracking-widest text-zinc-400">Final Summary</div>
                    </div>
                </div>
            </section>

            {/* Page 13 - Marketplace Footer */}
            <section className="a4-page relative overflow-hidden flex flex-col bg-white">
                <div
                    className="absolute left-0 top-0 bottom-0 w-2"
                    style={{ backgroundColor: quote?.vehicle?.hexCode || '#0b0d10' }}
                />
                <div className="a4-grid flex-1 relative z-10 border-l border-zinc-200">
                    <div className="a4-header">
                        <PageHeader
                            title="Marketplace & Sharing"
                            subtitle="Stay connected with BookMyBike across platforms."
                            accentColor={quote?.vehicle?.hexCode}
                        />
                        <div className="text-right text-sm text-zinc-500">
                            Quote: {formatDisplayId(quote.display_id)}
                        </div>
                    </div>
                    <div className="a4-body">
                        <div className="grid grid-cols-2 gap-6">
                            <DossierGroup quote={quote} title="Share This Quote" icon={Share2}>
                                <div className="px-6 py-4 space-y-3">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        Share Link
                                    </div>
                                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-[11px] font-mono text-slate-700 break-all">
                                        {shareUrl || `https://bookmy.bike/q/${formatDisplayId(quote.display_id)}`}
                                    </div>
                                    <div className="flex items-center gap-3 pt-2 text-slate-500">
                                        <Newspaper size={16} />
                                        <Instagram size={16} />
                                        <Twitter size={16} />
                                        <Linkedin size={16} />
                                        <Facebook size={16} />
                                    </div>
                                </div>
                            </DossierGroup>

                            <DossierGroup quote={quote} title="Download Our App" icon={Globe}>
                                <div className="px-6 py-6 space-y-4">
                                    <div className="text-sm font-black text-slate-900 uppercase tracking-tight">
                                        BookMyBike App
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="px-4 py-2 rounded-full border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-600">
                                            iOS App
                                        </div>
                                        <div className="px-4 py-2 rounded-full border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-600">
                                            Android App
                                        </div>
                                    </div>
                                    <div className="text-[10px] text-slate-400 uppercase tracking-widest">
                                        Search “BookMyBike” on your app store
                                    </div>
                                </div>
                            </DossierGroup>
                        </div>

                        <div className="grid grid-cols-2 gap-6 mt-6">
                            <DossierGroup quote={quote} title="Connect With Us" icon={Instagram}>
                                <div className="px-6 py-4 space-y-2 text-[11px] font-bold text-slate-600">
                                    <div className="flex items-center gap-2">
                                        <Newspaper size={14} /> /blog
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Instagram size={14} /> @bookmybike
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Twitter size={14} /> @bookmybike
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Linkedin size={14} /> /company/bookmybike
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Facebook size={14} /> /bookmybike
                                    </div>
                                </div>
                            </DossierGroup>

                            <DossierGroup quote={quote} title="Studio & Support" icon={Phone}>
                                <div className="px-6 py-4 space-y-2 text-[11px] font-bold text-slate-600">
                                    <div className="flex items-center gap-2">
                                        <MapPin size={14} />{' '}
                                        {quote?.pricing?.dealer?.dealer_name ||
                                            quote?.pricing?.dealer?.name ||
                                            'BookMyBike Studio'}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone size={14} /> {quote?.pricing?.dealer?.phone || '+91 00000 00000'}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Mail size={14} /> {quote?.pricing?.dealer?.email || 'support@bookmy.bike'}
                                    </div>
                                </div>
                            </DossierGroup>
                        </div>
                    </div>
                    <div className="a4-footer">
                        <div className="text-[10px] uppercase tracking-widest text-zinc-400">Page 13 of 13</div>
                        <div className="text-[10px] uppercase tracking-widest text-zinc-400">Marketplace</div>
                    </div>
                </div>
            </section>
        </div>
    );
}
