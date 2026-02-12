'use client';

import React, { useCallback, useState } from 'react';
import { Logo } from '@/components/brand/Logo';
import { generatePremiumPDF } from '@/utils/pdfGenerator';
import { getProxiedUrl } from '@/lib/utils/urlHelper';
import {
    ShieldCheck,
    Zap,
    Sparkles,
    CreditCard,
    MapPin,
    Phone,
    Mail,
    Globe,
    Activity,
    Clock,
    CheckCircle2,
    Package,
    Settings2,
    Milestone,
    Target,
    TrendingUp,
    Ruler,
    AlertCircle,
    Instagram,
    Facebook,
    Twitter,
    Linkedin,
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
            'group flex items-start justify-between py-2 px-6 border-b border-slate-100',
            isSub && 'bg-slate-50/30',
            isBold && 'bg-slate-50/50'
        )}
    >
        <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex items-center gap-2">
                <div
                    className={cn(
                        isBold ? 'text-[12px] font-black text-slate-900' : 'text-[11px] font-medium text-slate-600',
                        isSub && 'text-[11px] pl-3'
                    )}
                >
                    {label}
                </div>
                {extra}
            </div>
            {description && <div className="pl-3 text-[10px] text-slate-400">{description}</div>}
        </div>
        <div className="flex items-center gap-3 shrink-0">
            <span
                className={cn(
                    'tabular-nums',
                    isBold ? 'text-[12px] font-black text-slate-900' : 'text-[11px] font-bold text-slate-700',
                    isSub && 'text-[11px]'
                )}
            >
                {value}
            </span>
        </div>
    </div>
);

const OptionRow = ({
    label,
    price,
    selected,
    description,
    isMandatory,
    breakdown,
}: {
    label: React.ReactNode;
    price?: number | null;
    selected: boolean;
    description?: React.ReactNode;
    isMandatory?: boolean;
    breakdown?: { label: string; amount: number }[];
}) => (
    <div className="border border-slate-100 rounded-xl overflow-hidden bg-white">
        <div className="flex items-start justify-between gap-3 px-4 py-2.5">
            <div className="flex items-start gap-2 min-w-0">
                <div
                    className={cn(
                        'mt-0.5 w-4 h-4 rounded-full flex items-center justify-center border',
                        selected
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                            : 'bg-slate-50 border-slate-200 text-slate-300'
                    )}
                >
                    {selected ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">{label}</span>

                        {selected && (
                            <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                                Included
                            </span>
                        )}
                        {!selected && (
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-200">
                                Not Included
                            </span>
                        )}
                    </div>
                    {description && String(description).toLowerCase() !== 'mandatory' && (
                        <div className="text-[9px] text-slate-400 mt-0.5">{description}</div>
                    )}
                </div>
            </div>
            <div className="shrink-0 text-right">
                <div className="text-[10px] font-black text-slate-900 tabular-nums">
                    {price !== undefined && price !== null ? formatCurrency(price) : '—'}
                </div>
            </div>
        </div>
        {breakdown && breakdown.length > 0 && (
            <div className="px-6 pb-2 space-y-1">
                {breakdown.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[9px] text-slate-400">
                        <span>{item.label}</span>
                        <span className="tabular-nums">{formatCurrency(Number(item.amount || 0))}</span>
                    </div>
                ))}
            </div>
        )}
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
    children?: React.ReactNode;
    quote: any;
}) => (
    <div className="border-b border-slate-100 last:border-0 bg-white">
        <div className="w-full flex items-center justify-between py-3 px-6 relative overflow-hidden bg-white">
            <div className="flex items-center gap-3">
                <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm border"
                    style={{
                        backgroundColor: quote?.vehicle?.hexCode ? `${quote.vehicle.hexCode}1A` : '#f8fafc',
                        borderColor: quote?.vehicle?.hexCode ? `${quote.vehicle.hexCode}33` : '#e2e8f0',
                        color: quote?.vehicle?.hexCode || '#64748B',
                    }}
                >
                    <Icon size={16} />
                </div>
                <span className="text-xs font-bold text-slate-900 uppercase tracking-tight">{title}</span>
            </div>
            {total !== undefined && (
                <div className="flex items-center gap-4">
                    <span className="text-xs font-black text-slate-900 tabular-nums font-mono">
                        {typeof total === 'number' ? formatCurrency(total) : total}
                    </span>
                </div>
            )}
        </div>
        <div className="bg-slate-50/20">{children}</div>
    </div>
);

const PageHeader = ({
    title,
    subtitle,
    accentColor,
    icon: Icon,
}: {
    title: string;
    subtitle?: string;
    accentColor?: string;
    icon?: any;
}) => {
    const badgeBg = accentColor ? `${accentColor}1A` : 'rgba(244, 176, 0, 0.12)';
    const badgeBorder = accentColor ? `${accentColor}33` : 'rgba(244, 176, 0, 0.35)';
    const badgeColor = accentColor || '#F4B000';
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-3">
                {Icon && (
                    <div
                        className="w-9 h-9 rounded-2xl flex items-center justify-center border shadow-sm"
                        style={{ backgroundColor: badgeBg, borderColor: badgeBorder, color: badgeColor }}
                    >
                        <Icon size={16} />
                    </div>
                )}
                <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-900 leading-none italic">
                    {title}
                </h1>
            </div>
            {subtitle && <p className="text-xs font-medium text-slate-400 max-w-xl">{subtitle}</p>}
        </div>
    );
};

const normalizeFeatureList = (val: any): string[] => {
    if (Array.isArray(val)) {
        return val.filter(Boolean);
    }
    if (typeof val === 'string') {
        return val
            .split(',')
            .map(v => v.trim())
            .filter(Boolean);
    }
    return [];
};

const formatSpecValue = (val: any, suffix?: string) => {
    if (val === null || val === undefined || val === '') return '—';
    const text = String(val);
    if (suffix) {
        const lower = text.toLowerCase();
        if (!lower.includes(suffix.toLowerCase())) {
            return `${text} ${suffix}`;
        }
    }
    return text;
};

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
    const pdpOptions = quote.pdpOptions || {};
    const accessories = pricing.accessories || [];
    const services = pricing.services || [];
    const insuranceAddons = pricing.insuranceAddons || [];
    const insuranceRequired = pricing.insuranceRequired || [];
    const optionAccessories = pdpOptions.accessories || [];
    const optionServices = pdpOptions.services || [];
    const optionInsuranceAddons = pdpOptions.insuranceAddons || [];
    const optionInsuranceRequired = pdpOptions.insuranceRequiredItems || [];
    const optionRtoList = pdpOptions.rtoOptions || pricing.rtoOptions || [];
    const optionWarrantyItems = pdpOptions.warrantyItems || quote.vehicle?.specs?.warranty || [];
    const warrantyItems = pricing.warrantyItems || [];
    const rtoOptions = pricing.rtoOptions || [];
    const shareUrl = `https://bookmy.bike/q/${formatDisplayId(quote.display_id)}`;
    const specs = quote.vehicle?.specs || {};
    const specEngine = specs.engine || {};
    const specPerformance = specs.performance || {};
    const specTransmission = specs.transmission || {};
    const specDimensions = specs.dimensions || specs.dimension || {};
    const specBrakes = specs.brakes || {};
    const specChassis = specs.chassis || {};
    const featureList = normalizeFeatureList(
        quote.vehicle?.features ?? specs.features ?? specs.key_features ?? specs.feature_list ?? specs.features_list
    );

    const accessoriesBase = calcItemsTotal(accessories, false);
    const accessoriesOffer = calcItemsTotal(accessories, true);
    const servicesBase = calcItemsTotal(services, false);
    const servicesOffer = calcItemsTotal(services, true);
    const platformDiscount = Math.max(0, toNumber(pricing.totalSavings, 0));
    const studioSurge = Math.max(0, toNumber(pricing.totalSurge, 0));

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

    const extractIds = (items: any[]) =>
        (items || [])
            .map(i =>
                typeof i === 'string' || typeof i === 'number' ? String(i) : i?.id || i?.name || i?.label || i?.title
            )
            .filter(Boolean);
    const selectedAccessoryIds = new Set(extractIds(accessories));
    const selectedServiceIds = new Set(extractIds(services));
    const selectedInsuranceAddonIds = new Set(extractIds(insuranceAddons));
    const selectedWarrantyIds = new Set(extractIds(warrantyItems));
    const warrantyHasSelection = selectedWarrantyIds.size > 0;
    const selectedRtoType = pricing.rtoType || pricing.rto_type || 'STATE';
    const warrantyOptions = optionWarrantyItems.length > 0 ? optionWarrantyItems : warrantyItems;

    const createdDate = quote.created_at ? new Date(quote.created_at) : null;
    const validDate = quote.valid_until ? new Date(quote.valid_until) : null;

    const [isPdfGenerating, setIsPdfGenerating] = useState(false);

    const handlePrint = useCallback(async () => {
        setIsPdfGenerating(true);
        try {
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
            const pageIds = Array.from({ length: 13 }, (_, i) => `dossier-page-${i + 1}`);
            const fileName = `BookMyBike_Dossier_${formatDisplayId(quote.display_id)}.pdf`;
            await generatePremiumPDF(pageIds, fileName);
        } catch (err) {
            console.error('[Dossier] PDF generation failed:', err);
            // Fallback to browser print
            window.print();
        } finally {
            setIsPdfGenerating(false);
        }
    }, [quote.vehicle?.imageUrl, quote.display_id]);

    return (
        <div className="dossier-stage">
            {/* Page 1 - Welcome */}
            <section
                id="dossier-page-1"
                className="a4-page relative overflow-hidden"
                style={{
                    backgroundColor: '#FAFAFA',
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
                                disabled={isPdfGenerating}
                                className="no-print px-6 py-2 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/20 active:scale-95 transition-transform disabled:opacity-50"
                            >
                                {isPdfGenerating ? 'Generating...' : 'Download PDF'}
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Page 2 - Pricing */}
            <section id="dossier-page-2" className="a4-page relative overflow-hidden bg-white">
                <div
                    className="absolute left-0 top-0 bottom-0 w-2"
                    style={{ backgroundColor: quote?.vehicle?.hexCode || '#0b0d10' }}
                />
                <div
                    className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none z-0"
                    style={{
                        background: `linear-gradient(to top, ${quote?.vehicle?.hexCode || '#F4B000'}33, transparent)`,
                    }}
                />
                <div className="a4-grid flex-1 relative z-10 border-l border-zinc-200">
                    <div className="a4-header">
                        <PageHeader
                            title="Pricing"
                            subtitle="Transparent breakup as seen on PDP and CRM."
                            accentColor={quote?.vehicle?.hexCode}
                            icon={CreditCard}
                        />
                        <div className="text-right text-[10px] font-black uppercase tracking-widest text-slate-300">
                            Quote: {formatDisplayId(quote.display_id)}
                        </div>
                    </div>
                    <div className="a4-body">
                        <div className="space-y-4">
                            <DossierGroup
                                quote={quote}
                                title="EX-SHOWROOM PRICE"
                                icon={Package}
                                total={pricing.exShowroom}
                            ></DossierGroup>

                            <DossierGroup
                                quote={quote}
                                title="REGISTRATION (RTO)"
                                icon={Milestone}
                                total={pricing.rtoTotal}
                            ></DossierGroup>

                            <DossierGroup
                                quote={quote}
                                title="INSURANCE PACKAGE"
                                icon={ShieldCheck}
                                total={pricing.insuranceTotal}
                            ></DossierGroup>

                            <DossierGroup
                                quote={quote}
                                title="ACCESSORIES"
                                icon={Settings2}
                                total={pricing.accessoriesTotal}
                            ></DossierGroup>

                            <DossierGroup
                                quote={quote}
                                title="SERVICES"
                                icon={Sparkles}
                                total={pricing.servicesTotal}
                            ></DossierGroup>

                            <DossierGroup quote={quote} title="WARRANTY" icon={ShieldCheck} total={0}></DossierGroup>

                            <DossierGroup
                                quote={quote}
                                title="PLATFORM DISCOUNT"
                                icon={Zap}
                                total={platformDiscount}
                            ></DossierGroup>

                            <DossierGroup
                                quote={quote}
                                title="STUDIO SURGE CHARGES"
                                icon={AlertCircle}
                                total={studioSurge}
                            ></DossierGroup>

                            <DossierGroup
                                quote={quote}
                                title="DEALERSHIP DISCOUNT"
                                icon={AlertCircle}
                                total={pricing.managerDiscount || 0}
                            ></DossierGroup>

                            <div className="border border-slate-100 rounded-xl overflow-hidden bg-white">
                                <div className="flex items-center justify-between px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 size={14} className="text-emerald-500" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                            Net Payable Amount
                                        </span>
                                    </div>
                                    <div className="text-sm font-black text-slate-900 tabular-nums">
                                        {formatCurrency(pricing.finalTotal || 0)}
                                    </div>
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
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase tracking-widest text-slate-400">Page 2 of 13</span>
                            <div
                                className="w-1 h-1 rounded-full"
                                style={{ backgroundColor: quote?.vehicle?.hexCode || '#F4B000' }}
                            />
                            <span className="text-[10px] uppercase tracking-widest text-slate-400">
                                Pricing Breakup
                            </span>
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                            {formatDisplayId(quote.display_id)}
                        </div>
                    </div>
                </div>
            </section>

            {/* Page 3 - Finance Scheme */}
            <section id="dossier-page-3" className="a4-page relative overflow-hidden bg-white">
                <div
                    className="absolute left-0 top-0 bottom-0 w-2"
                    style={{ backgroundColor: quote?.vehicle?.hexCode || '#0b0d10' }}
                />
                <div
                    className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none z-0"
                    style={{
                        background: `linear-gradient(to top, ${quote?.vehicle?.hexCode || '#F4B000'}33, transparent)`,
                    }}
                />
                <div className="a4-grid flex-1 relative z-10 border-l border-zinc-200">
                    <div className="a4-header">
                        <PageHeader
                            title="Finance Scheme"
                            subtitle="Finance tab application details from CRM."
                            accentColor={quote?.vehicle?.hexCode}
                            icon={TrendingUp}
                        />
                        <div className="text-right text-[10px] font-black uppercase tracking-widest text-slate-300">
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
                                    <DossierRow label="Asset Cost (Net SOT)" value={formatCurrency(baseOnRoad)} />
                                    <DossierRow label="Offer Discount" value={formatCurrency(totalSavings)} isSub />
                                    <DossierRow label="Total Payable" value={formatCurrency(offerOnRoad)} isBold />
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
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase tracking-widest text-slate-400">Page 3 of 13</span>
                            <div
                                className="w-1 h-1 rounded-full"
                                style={{ backgroundColor: quote?.vehicle?.hexCode || '#F4B000' }}
                            />
                            <span className="text-[10px] uppercase tracking-widest text-slate-400">Finance Scheme</span>
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                            {formatDisplayId(quote.display_id)}
                        </div>
                    </div>
                </div>
            </section>

            {/* Page 4 - Accessories */}
            <section id="dossier-page-4" className="a4-page relative overflow-hidden bg-white">
                <div
                    className="absolute left-0 top-0 bottom-0 w-2"
                    style={{ backgroundColor: quote?.vehicle?.hexCode || '#0b0d10' }}
                />
                <div
                    className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none z-0"
                    style={{
                        background: `linear-gradient(to top, ${quote?.vehicle?.hexCode || '#F4B000'}33, transparent)`,
                    }}
                />
                <div className="a4-grid flex-1 relative z-10 border-l border-zinc-200">
                    <div className="a4-header">
                        <PageHeader
                            title="Accessories"
                            subtitle="Genuine enhancements and protection."
                            accentColor={quote?.vehicle?.hexCode}
                            icon={Settings2}
                        />
                        <div className="text-right text-[10px] font-black uppercase tracking-widest text-slate-300">
                            Quote: {formatDisplayId(quote.display_id)}
                        </div>
                    </div>
                    <div className="a4-body">
                        <div className="space-y-2">
                            {(optionAccessories.length > 0 ? optionAccessories : accessories).length > 0 ? (
                                <div className="space-y-2 p-2">
                                    {(optionAccessories.length > 0 ? optionAccessories : accessories).map(
                                        (item: any, idx: number) => (
                                            <OptionRow
                                                key={item.id || idx}
                                                label={item.description || item.displayName || item.name}
                                                price={toNumber(item.discountPrice ?? item.price ?? item.amount, 0)}
                                                selected={selectedAccessoryIds.has(String(item.id))}
                                                description={item.brand ? `Brand: ${item.brand}` : undefined}
                                                isMandatory={item.isMandatory || item.inclusionType === 'MANDATORY'}
                                            />
                                        )
                                    )}
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center border-4 border-dashed border-slate-100 rounded-[3rem]">
                                    <span className="text-slate-300 uppercase text-[10px] font-black tracking-widest">
                                        No Accessories Available
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="a4-footer">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase tracking-widest text-slate-400">Page 4 of 13</span>
                            <div
                                className="w-1 h-1 rounded-full"
                                style={{ backgroundColor: quote?.vehicle?.hexCode || '#F4B000' }}
                            />
                            <span className="text-[10px] uppercase tracking-widest text-slate-400">Accessories</span>
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                            {formatDisplayId(quote.display_id)}
                        </div>
                    </div>
                </div>
            </section>

            {/* Page 5 - Insurance */}
            <section id="dossier-page-5" className="a4-page relative overflow-hidden bg-white">
                <div
                    className="absolute left-0 top-0 bottom-0 w-2"
                    style={{ backgroundColor: quote?.vehicle?.hexCode || '#0b0d10' }}
                />
                <div
                    className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none z-0"
                    style={{
                        background: `linear-gradient(to top, ${quote?.vehicle?.hexCode || '#F4B000'}33, transparent)`,
                    }}
                />
                <div className="a4-grid flex-1 relative z-10 border-l border-zinc-200">
                    <div className="a4-header">
                        <PageHeader
                            title="Insurance"
                            subtitle="Comprehensive protection for your ride."
                            accentColor={quote?.vehicle?.hexCode}
                            icon={ShieldCheck}
                        />
                        <div className="text-right text-[10px] font-black uppercase tracking-widest text-slate-300">
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
                                <div className="space-y-2 p-2">
                                    {(optionInsuranceRequired.length > 0 ? optionInsuranceRequired : insuranceRequired)
                                        .length > 0 ? (
                                        (optionInsuranceRequired.length > 0
                                            ? optionInsuranceRequired
                                            : insuranceRequired
                                        ).map((item: any, idx: number) => (
                                            <OptionRow
                                                key={item.id || idx}
                                                label={item.name || item.label}
                                                price={toNumber(item.price ?? item.amount, 0)}
                                                selected
                                                description={item.description}
                                                isMandatory
                                                breakdown={item.breakdown}
                                            />
                                        ))
                                    ) : (
                                        <div className="text-center text-[9px] text-slate-300 uppercase py-2">
                                            No insurance covers available
                                        </div>
                                    )}
                                </div>
                            </DossierGroup>

                            <DossierGroup quote={quote} title="Add-ons" icon={Sparkles}>
                                <div className="space-y-2 p-2">
                                    {(optionInsuranceAddons.length > 0 ? optionInsuranceAddons : insuranceAddons)
                                        .length > 0 ? (
                                        (optionInsuranceAddons.length > 0
                                            ? optionInsuranceAddons
                                            : insuranceAddons
                                        ).map((addon: any, idx: number) => (
                                            <OptionRow
                                                key={addon.id || idx}
                                                label={addon.name || addon.label}
                                                price={toNumber(addon.discountPrice ?? addon.price ?? addon.amount, 0)}
                                                selected={
                                                    selectedInsuranceAddonIds.has(String(addon.id)) || addon.selected
                                                }
                                                description={addon.description}
                                                isMandatory={addon.isMandatory || addon.inclusionType === 'BUNDLE'}
                                                breakdown={addon.breakdown}
                                            />
                                        ))
                                    ) : (
                                        <div className="text-center text-[9px] text-slate-300 uppercase py-2">
                                            No insurance add-ons available
                                        </div>
                                    )}
                                </div>
                            </DossierGroup>
                        </div>
                    </div>
                    <div className="a4-footer">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase tracking-widest text-slate-400">Page 5 of 13</span>
                            <div
                                className="w-1 h-1 rounded-full"
                                style={{ backgroundColor: quote?.vehicle?.hexCode || '#F4B000' }}
                            />
                            <span className="text-[10px] uppercase tracking-widest text-slate-400">Insurance</span>
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                            {formatDisplayId(quote.display_id)}
                        </div>
                    </div>
                </div>
            </section>

            {/* Page 6 - Registration (RTO) */}
            <section id="dossier-page-6" className="a4-page relative overflow-hidden bg-white">
                <div
                    className="absolute left-0 top-0 bottom-0 w-2"
                    style={{ backgroundColor: quote?.vehicle?.hexCode || '#0b0d10' }}
                />
                <div
                    className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none z-0"
                    style={{
                        background: `linear-gradient(to top, ${quote?.vehicle?.hexCode || '#F4B000'}33, transparent)`,
                    }}
                />
                <div className="a4-grid flex-1 relative z-10 border-l border-zinc-200">
                    <div className="a4-header">
                        <PageHeader
                            title="Registration"
                            subtitle="Statutory levies and RTO documentation."
                            accentColor={quote?.vehicle?.hexCode}
                            icon={Milestone}
                        />
                        <div className="text-right text-[10px] font-black uppercase tracking-widest text-slate-300">
                            Quote: {formatDisplayId(quote.display_id)}
                        </div>
                    </div>
                    <div className="a4-body">
                        <div className="space-y-2 p-2">
                            {(optionRtoList.length > 0 ? optionRtoList : rtoOptions).length > 0 ? (
                                (optionRtoList.length > 0 ? optionRtoList : rtoOptions).map(
                                    (item: any, idx: number) => (
                                        <OptionRow
                                            key={item.id || idx}
                                            label={item.name || item.label || item.type || 'Registration'}
                                            price={toNumber(item.price ?? item.amount ?? item.total, 0)}
                                            selected={
                                                String(selectedRtoType || '').toUpperCase() ===
                                                String(item.id || item.type || '').toUpperCase()
                                            }
                                            description={item.description}
                                            breakdown={item.breakdown}
                                        />
                                    )
                                )
                            ) : (
                                <div className="text-center text-[9px] text-slate-300 uppercase py-2">
                                    No registration options available
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="a4-footer">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase tracking-widest text-slate-400">Page 6 of 13</span>
                            <div
                                className="w-1 h-1 rounded-full"
                                style={{ backgroundColor: quote?.vehicle?.hexCode || '#F4B000' }}
                            />
                            <span className="text-[10px] uppercase tracking-widest text-slate-400">Registration</span>
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                            {formatDisplayId(quote.display_id)}
                        </div>
                    </div>
                </div>
            </section>

            {/* Page 7 - Service Packages */}
            <section id="dossier-page-7" className="a4-page relative overflow-hidden bg-white">
                <div
                    className="absolute left-0 top-0 bottom-0 w-2"
                    style={{ backgroundColor: quote?.vehicle?.hexCode || '#0b0d10' }}
                />
                <div
                    className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none z-0"
                    style={{
                        background: `linear-gradient(to top, ${quote?.vehicle?.hexCode || '#F4B000'}33, transparent)`,
                    }}
                />
                <div className="a4-grid flex-1 relative z-10 border-l border-zinc-200">
                    <div className="a4-header">
                        <PageHeader
                            title="Service Packages"
                            subtitle="Maintenance architecture and protocols."
                            accentColor={quote?.vehicle?.hexCode}
                            icon={Settings2}
                        />
                        <div className="text-right text-[10px] font-black uppercase tracking-widest text-slate-300">
                            Quote: {formatDisplayId(quote.display_id)}
                        </div>
                    </div>
                    <div className="a4-body">
                        <div className="space-y-2 p-2">
                            {(optionServices.length > 0 ? optionServices : services).length > 0 ? (
                                (optionServices.length > 0 ? optionServices : services).map((svc: any, idx: number) => (
                                    <OptionRow
                                        key={svc.id || idx}
                                        label={svc.name}
                                        price={toNumber(svc.discountPrice ?? svc.price, 0)}
                                        selected={selectedServiceIds.has(String(svc.id))}
                                        description={svc.description}
                                        isMandatory={svc.isMandatory}
                                    />
                                ))
                            ) : (
                                <div className="px-8 py-4 text-zinc-300 text-[10px] uppercase italic text-center">
                                    No services available
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="a4-footer">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase tracking-widest text-slate-400">Page 7 of 13</span>
                            <div
                                className="w-1 h-1 rounded-full"
                                style={{ backgroundColor: quote?.vehicle?.hexCode || '#F4B000' }}
                            />
                            <span className="text-[10px] uppercase tracking-widest text-slate-400">Service</span>
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                            {formatDisplayId(quote.display_id)}
                        </div>
                    </div>
                </div>
            </section>

            {/* Page 8 - Warranty */}
            <section id="dossier-page-8" className="a4-page relative overflow-hidden bg-white">
                <div
                    className="absolute left-0 top-0 bottom-0 w-2"
                    style={{ backgroundColor: quote?.vehicle?.hexCode || '#0b0d10' }}
                />
                <div
                    className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none z-0"
                    style={{
                        background: `linear-gradient(to top, ${quote?.vehicle?.hexCode || '#F4B000'}33, transparent)`,
                    }}
                />
                <div className="a4-grid flex-1 relative z-10 border-l border-zinc-200">
                    <div className="a4-header">
                        <PageHeader
                            title="Warranty"
                            subtitle="Extended protection and asset security."
                            accentColor={quote?.vehicle?.hexCode}
                            icon={CheckCircle2}
                        />
                        <div className="text-right text-[10px] font-black uppercase tracking-widest text-slate-300">
                            Quote: {formatDisplayId(quote.display_id)}
                        </div>
                    </div>
                    <div className="a4-body">
                        <div className="space-y-2 p-2">
                            {warrantyOptions.length > 0 ? (
                                warrantyOptions.map((w: any, idx: number) => (
                                    <OptionRow
                                        key={w.id || idx}
                                        label={w.name || w.label || 'Extended Warranty'}
                                        price={toNumber(w.discountPrice ?? w.price ?? w.amount, 0)}
                                        selected={
                                            warrantyHasSelection
                                                ? selectedWarrantyIds.has(String(w.id || w.name || w.label || ''))
                                                : true
                                        }
                                        description={w.description}
                                        isMandatory
                                        breakdown={w.breakdown}
                                    />
                                ))
                            ) : (
                                <div className="px-8 py-4 text-zinc-400 text-[10px] uppercase italic text-center">
                                    Standard Warranty Active
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="a4-footer">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase tracking-widest text-slate-400">Page 8 of 13</span>
                            <div
                                className="w-1 h-1 rounded-full"
                                style={{ backgroundColor: quote?.vehicle?.hexCode || '#F4B000' }}
                            />
                            <span className="text-[10px] uppercase tracking-widest text-slate-400">Warranty</span>
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                            {formatDisplayId(quote.display_id)}
                        </div>
                    </div>
                </div>
            </section>

            {/* Page 9 - Engine & Performance */}
            <section id="dossier-page-9" className="a4-page relative overflow-hidden bg-white">
                <div
                    className="absolute left-0 top-0 bottom-0 w-2"
                    style={{ backgroundColor: quote?.vehicle?.hexCode || '#0b0d10' }}
                />
                <div
                    className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none z-0"
                    style={{
                        background: `linear-gradient(to top, ${quote?.vehicle?.hexCode || '#F4B000'}33, transparent)`,
                    }}
                />
                <div className="a4-grid flex-1 relative z-10 border-l border-zinc-200">
                    <div className="a4-header">
                        <PageHeader
                            title="Engine & Performance"
                            subtitle="The heart of the machine."
                            accentColor={quote?.vehicle?.hexCode}
                            icon={Zap}
                        />
                        <div className="text-right text-[10px] font-black uppercase tracking-widest text-slate-300">
                            Quote: {formatDisplayId(quote.display_id)}
                        </div>
                    </div>
                    <div className="a4-body">
                        <div>
                            <DossierRow
                                label="Cubic Capacity"
                                value={formatSpecValue(
                                    specEngine.displacement ?? specs.engine_cc ?? specs.displacement ?? specs.cc,
                                    'cc'
                                )}
                                isSub
                            />
                            <DossierRow
                                label="Max Power"
                                value={formatSpecValue(specEngine.power ?? specs.power)}
                                isSub
                            />
                            <DossierRow
                                label="Max Torque"
                                value={formatSpecValue(specEngine.torque ?? specs.torque)}
                                isSub
                            />
                            <DossierRow
                                label="Transmission"
                                value={formatSpecValue(
                                    specTransmission.type ?? specs.transmission ?? specs.gearbox ?? specs.gear_box
                                )}
                                isSub
                            />
                            <DossierRow
                                label="Top Speed"
                                value={formatSpecValue(specPerformance.topSpeed ?? specs.top_speed, 'km/h')}
                                isSub
                            />
                            <DossierRow
                                label="Acceleration"
                                value={formatSpecValue(specPerformance.acceleration ?? specs.acceleration)}
                                isSub
                            />
                        </div>
                    </div>
                    <div className="a4-footer">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase tracking-widest text-slate-400">Page 9 of 13</span>
                            <div
                                className="w-1 h-1 rounded-full"
                                style={{ backgroundColor: quote?.vehicle?.hexCode || '#F4B000' }}
                            />
                            <span className="text-[10px] uppercase tracking-widest text-slate-400">Engine</span>
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                            {formatDisplayId(quote.display_id)}
                        </div>
                    </div>
                </div>
            </section>

            {/* Page 10 - Dimension & Chassis */}
            <section id="dossier-page-10" className="a4-page relative overflow-hidden bg-white">
                <div
                    className="absolute left-0 top-0 bottom-0 w-2"
                    style={{ backgroundColor: quote?.vehicle?.hexCode || '#0b0d10' }}
                />
                <div
                    className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none z-0"
                    style={{
                        background: `linear-gradient(to top, ${quote?.vehicle?.hexCode || '#F4B000'}33, transparent)`,
                    }}
                />
                <div className="a4-grid flex-1 relative z-10 border-l border-zinc-200">
                    <div className="a4-header">
                        <PageHeader
                            title="Dimension & Chassis"
                            subtitle="Structural integrity and footprint."
                            accentColor={quote?.vehicle?.hexCode}
                            icon={Ruler}
                        />
                        <div className="text-right text-[10px] font-black uppercase tracking-widest text-slate-300">
                            Quote: {formatDisplayId(quote.display_id)}
                        </div>
                    </div>
                    <div className="a4-body">
                        <div>
                            <DossierRow
                                label="Kerb Weight"
                                value={formatSpecValue(
                                    specDimensions.weight ?? specs.kerb_weight ?? specs.weight,
                                    'kg'
                                )}
                                isSub
                            />
                            <DossierRow
                                label="Seat Height"
                                value={formatSpecValue(
                                    specDimensions.seatHeight ?? specs.seat_height ?? specs.seatHeight,
                                    'mm'
                                )}
                                isSub
                            />
                            <DossierRow
                                label="Ground Clearance"
                                value={formatSpecValue(
                                    specDimensions.groundClearance ?? specs.ground_clearance ?? specs.groundClearance,
                                    'mm'
                                )}
                                isSub
                            />
                            <DossierRow
                                label="Wheelbase"
                                value={formatSpecValue(specDimensions.wheelbase ?? specs.wheelbase, 'mm')}
                                isSub
                            />
                            <DossierRow
                                label="Fuel Capacity"
                                value={formatSpecValue(
                                    specDimensions.fuelCapacity ??
                                        specs.fuel_tank_capacity ??
                                        specs.fuel_capacity ??
                                        specs.fuelCapacity,
                                    'L'
                                )}
                                isSub
                            />
                        </div>
                    </div>
                    <div className="a4-footer">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase tracking-widest text-slate-400">Page 10 of 13</span>
                            <div
                                className="w-1 h-1 rounded-full"
                                style={{ backgroundColor: quote?.vehicle?.hexCode || '#F4B000' }}
                            />
                            <span className="text-[10px] uppercase tracking-widest text-slate-400">Dimensions</span>
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                            {formatDisplayId(quote.display_id)}
                        </div>
                    </div>
                </div>
            </section>

            {/* Page 11 - Brakes & Safety */}
            <section id="dossier-page-11" className="a4-page relative overflow-hidden bg-white">
                <div
                    className="absolute left-0 top-0 bottom-0 w-2"
                    style={{ backgroundColor: quote?.vehicle?.hexCode || '#0b0d10' }}
                />
                <div
                    className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none z-0"
                    style={{
                        background: `linear-gradient(to top, ${quote?.vehicle?.hexCode || '#F4B000'}33, transparent)`,
                    }}
                />
                <div className="a4-grid flex-1 relative z-10 border-l border-zinc-200">
                    <div className="a4-header">
                        <PageHeader
                            title="Brakes & Safety"
                            subtitle="Protective systems and stopping power."
                            accentColor={quote?.vehicle?.hexCode}
                            icon={ShieldCheck}
                        />
                        <div className="text-right text-[10px] font-black uppercase tracking-widest text-slate-300">
                            Quote: {formatDisplayId(quote.display_id)}
                        </div>
                    </div>
                    <div className="a4-body">
                        <div>
                            <DossierRow
                                label="Braking"
                                value={formatSpecValue(specBrakes.front ?? specs.front_brake_type ?? specs.front_brake)}
                                isSub
                            />
                            <DossierRow
                                label="ABS Variant"
                                value={formatSpecValue(specBrakes.abs ?? specs.abs ?? specs.abs_type)}
                                isSub
                            />
                            <DossierRow
                                label="Front Suspension"
                                value={formatSpecValue(
                                    specChassis.suspensionFront ?? specs.front_suspension ?? specs.suspension_front
                                )}
                                isSub
                            />
                            <DossierRow
                                label="Rear Suspension"
                                value={formatSpecValue(
                                    specChassis.suspensionRear ?? specs.rear_suspension ?? specs.suspension_rear
                                )}
                                isSub
                            />
                        </div>
                    </div>
                    <div className="a4-footer">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase tracking-widest text-slate-400">Page 11 of 13</span>
                            <div
                                className="w-1 h-1 rounded-full"
                                style={{ backgroundColor: quote?.vehicle?.hexCode || '#F4B000' }}
                            />
                            <span className="text-[10px] uppercase tracking-widest text-slate-400">Safety</span>
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                            {formatDisplayId(quote.display_id)}
                        </div>
                    </div>
                </div>
            </section>

            {/* Page 12 - Features & Tech */}
            <section id="dossier-page-12" className="a4-page relative overflow-hidden bg-white">
                <div
                    className="absolute left-0 top-0 bottom-0 w-2"
                    style={{ backgroundColor: quote?.vehicle?.hexCode || '#0b0d10' }}
                />
                <div
                    className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none z-0"
                    style={{
                        background: `linear-gradient(to top, ${quote?.vehicle?.hexCode || '#F4B000'}33, transparent)`,
                    }}
                />
                <div className="a4-grid flex-1 relative z-10 border-l border-zinc-200">
                    <div className="a4-header">
                        <PageHeader
                            title="Features & Tech"
                            subtitle="Digital ecosystem and connectivity."
                            accentColor={quote?.vehicle?.hexCode}
                            icon={Sparkles}
                        />
                        <div className="text-right text-[10px] font-black uppercase tracking-widest text-slate-300">
                            Quote: {formatDisplayId(quote.display_id)}
                        </div>
                    </div>
                    <div className="a4-body">
                        <div className="grid grid-cols-2 gap-2 p-2">
                            {featureList.slice(0, 10).map((f: string, i: number) => (
                                <div
                                    key={i}
                                    className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2"
                                >
                                    <div className="w-1 h-1 rounded-full bg-slate-300" /> {f}
                                </div>
                            ))}
                            {featureList.length === 0 && (
                                <div className="col-span-2 text-center text-zinc-300 uppercase text-[9px] py-4">
                                    Standard Smart Interface Included
                                </div>
                            )}
                        </div>

                        {/* Final Summary removed */}
                    </div>
                    <div className="a4-footer">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase tracking-widest text-slate-400">Page 12 of 13</span>
                            <div
                                className="w-1 h-1 rounded-full"
                                style={{ backgroundColor: quote?.vehicle?.hexCode || '#F4B000' }}
                            />
                            <span className="text-[10px] uppercase tracking-widest text-slate-400">Features</span>
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                            {formatDisplayId(quote.display_id)}
                        </div>
                    </div>
                </div>
            </section>

            {/* Page 13 - Reach Us */}

            {/* Page 13 - Reach Us */}
            <section
                id="dossier-page-13"
                className="a4-page relative overflow-hidden"
                style={{ backgroundColor: '#FAFAFA' }}
            >
                <div
                    className="absolute inset-0 z-0"
                    style={{
                        backgroundColor: quote?.vehicle?.hexCode ? `${quote.vehicle.hexCode}4D` : 'transparent',
                    }}
                />
                <div className="a4-grid flex-1 relative z-10">
                    <div className="flex items-center justify-between">
                        <Logo size={42} variant="full" />
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {formatDisplayId(quote.display_id)}
                        </div>
                    </div>
                    <div className="flex flex-col items-center justify-center text-center gap-12">
                        <div className="space-y-6">
                            <div
                                className="h-px w-24 mx-auto"
                                style={{ backgroundColor: quote?.vehicle?.hexCode || '#F4B000' }}
                            />
                            <div className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">
                                Find Us Online
                            </div>
                            <h2 className="text-5xl font-black text-slate-900 tracking-tight">www.bookmy.bike</h2>
                            <div
                                className="h-px w-24 mx-auto"
                                style={{ backgroundColor: quote?.vehicle?.hexCode || '#F4B000' }}
                            />
                        </div>
                        <div className="flex flex-col items-center gap-6">
                            <div className="bg-white rounded-3xl p-6 shadow-xl shadow-black/10 border border-slate-100">
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareUrl)}&bgcolor=FFFFFF&color=1e293b&format=svg`}
                                    alt="Quote QR Code"
                                    className="w-[180px] h-[180px]"
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
                                    Scan to View & Edit Quote
                                </div>
                                <div className="text-[11px] font-mono text-slate-400 break-all max-w-xs">
                                    {shareUrl}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-8">
                            {[
                                { Icon: Instagram, label: '@bookmybike' },
                                { Icon: Facebook, label: '/bookmybike' },
                                { Icon: Twitter, label: '@bookmybike' },
                                { Icon: Linkedin, label: '/bookmybike' },
                            ].map(({ Icon, label }, idx) => (
                                <div key={`${label}-${idx}`} className="flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center border border-slate-200 bg-white/60">
                                        <Icon size={20} className="text-slate-600" />
                                    </div>
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                                        {label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                        <div className="flex items-center gap-3">
                            <ShieldCheck size={14} className="text-slate-300" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Official & Verified
                            </span>
                        </div>
                        <div className="text-[10px] uppercase tracking-widest text-slate-400">Page 13 of 13</div>
                    </div>
                </div>
            </section>
        </div>
    );
}
