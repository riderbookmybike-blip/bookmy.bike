'use client';

import React from 'react';
import { Logo } from '@/components/brand/Logo';
import { getProxiedUrl } from '@/lib/utils/urlHelper';
import { formatDisplayId } from '@/utils/displayId';
import {
    ShieldCheck,
    MapPin,
    Phone,
    Mail,
    Globe,
    Info,
    Zap,
    Sparkles,
    CreditCard,
    ChevronRight,
    Milestone,
    AlertCircle,
    Gauge,
    Weight,
    Ruler,
    Bike,
    Check,
    Droplets,
    Wind,
    Flame,
    Package,
    CheckCircle2,
    Settings2,
    Truck,
    Activity,
    LayoutDashboard,
    Share2,
    Instagram,
    Facebook,
    Twitter,
    Linkedin,
    Newspaper,
} from 'lucide-react';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount);
};

const getContrastColor = (hex: string) => {
    if (!hex || hex === 'transparent') return '#000000';
    const cleanHex = hex.replace('#', '');
    if (cleanHex.length !== 6) return '#000000';
    const r = parseInt(cleanHex.substr(0, 2), 16);
    const g = parseInt(cleanHex.substr(2, 2), 16);
    const b = parseInt(cleanHex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6 ? '#000000' : '#FFFFFF';
};

const toNumber = (val: any, fallback = 0) => {
    const n = Number(val);
    return Number.isFinite(n) ? n : fallback;
};

const PDFRow = ({ label, value, isSub = false, isBold = false, isSaving = false }: any) => (
    <div
        className={`flex items-start justify-between py-2 border-b border-zinc-100 ${isSub ? 'bg-zinc-50/40 px-6' : 'px-0'} ${isBold ? 'bg-zinc-50/60' : ''}`}
    >
        <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex items-center gap-2">
                {isSub && <span className="text-zinc-300 select-none text-[8px]">└</span>}
                <div
                    className={`text-[8px] font-black uppercase tracking-[0.15em] ${isBold ? 'text-zinc-900' : 'text-zinc-500'}`}
                >
                    {label}
                </div>
            </div>
        </div>
        <div className={`text-[10px] tabular-nums ${isBold ? 'font-black text-zinc-900' : 'font-bold text-zinc-700'}`}>
            {value}
        </div>
    </div>
);

const PDFGroup = ({ title, icon: Icon, total, quote, children }: any) => (
    <div className="rounded-[2.5rem] border border-zinc-200 bg-white overflow-hidden mb-5 shadow-sm">
        <div className="flex items-center justify-between py-3 px-6 border-b border-zinc-100 bg-white">
            <div className="flex items-center gap-3">
                {Icon && (
                    <div
                        className="w-7 h-7 rounded-xl flex items-center justify-center shadow-sm border border-zinc-100"
                        style={{ backgroundColor: 'white', color: '#71717a' }}
                    >
                        <Icon size={14} />
                    </div>
                )}
                <div className="text-[9px] font-black uppercase tracking-[0.15em] text-zinc-900">{title}</div>
            </div>
            {total !== undefined && <div className="text-xs font-black text-zinc-900 tabular-nums">{total}</div>}
        </div>
        <div>{children}</div>
    </div>
);

interface PremiumQuoteTemplateProps {
    quote: any;
    dealerInfo?: {
        name: string;
        address: string;
        phone: string;
        email: string;
        studioId: string;
    } | null;
    qrCodes: {
        bookNow: string;
        viewQuote: string;
    };
    alternativeBikes?: {
        id: string;
        name: string;
        brand: string;
        price: number;
        image: string;
    }[];
}

const A4_WIDTH = '210mm';
const A4_HEIGHT = '297mm';

export const PremiumQuoteTemplate: React.FC<PremiumQuoteTemplateProps> = ({
    quote,
    dealerInfo,
    qrCodes,
    alternativeBikes,
}) => {
    const savingsTotal =
        Math.abs(quote?.pricing?.offersDelta || 0) +
        Math.abs(quote?.pricing?.dealerDiscount || 0) +
        Math.abs(quote?.pricing?.managerDiscount || 0) +
        Math.abs(quote?.pricing?.referralBonus || 0);

    const standardValuation = (quote?.pricing?.finalTotal || 0) + savingsTotal;
    const accessories = (quote?.pricing?.accessories || []).filter((a: any) => a?.selected);
    const services = (quote?.pricing?.services || []).filter((s: any) => s?.selected);
    const insuranceAddons = (quote?.pricing?.insuranceAddons || []).filter((a: any) => a?.selected);
    const insuranceRequired = quote?.pricing?.insuranceRequired || [];
    const warrantyItems = quote?.pricing?.warrantyItems || [];
    const features = quote?.vehicle?.features || [];
    const specs = quote?.vehicle?.specs || {};

    return (
        <div className="flex flex-col bg-zinc-100 overflow-hidden print:bg-white">
            <div
                id="pdf-page-1"
                className="bg-white relative overflow-hidden flex flex-col"
                style={{
                    width: A4_WIDTH,
                    height: A4_HEIGHT,
                    minWidth: A4_WIDTH,
                    minHeight: A4_HEIGHT,
                    backgroundColor: '#FAFAFA',
                }}
            >
                {/* Visual Depth Layers (Catalog-card parity, 30% opacity) */}
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundColor: quote?.vehicle?.hexCode ? `${quote.vehicle.hexCode}4D` : 'transparent',
                    }}
                />

                {/* High-Fidelity Glow */}
                <div
                    className="absolute inset-0"
                    style={{
                        background: quote?.vehicle?.hexCode
                            ? `radial-gradient(circle at 70% 30%, ${quote.vehicle.hexCode}4D, transparent 70%)`
                            : 'transparent',
                    }}
                />

                <div className="relative z-10 p-16 flex flex-col h-full">
                    {/* Texture Overlay (Grain) */}
                    <div
                        className="absolute inset-0 opacity-[0.03] pointer-events-none"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                        }}
                    />

                    {/* Top Branding Bar */}
                    <div className="flex justify-between items-center mb-20 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                            <Logo size={42} variant="full" />
                            <div className="h-6 w-px bg-slate-200 mx-2" />
                            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">
                                Official Quotation
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">
                                Generated On
                            </div>
                            <div className="text-xs font-bold text-slate-900">
                                {new Date().toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric',
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Greeting & Sub-header */}
                    <div className="mb-12">
                        <div className="flex items-center gap-3 mb-4">
                            <div
                                className="h-px w-12"
                                style={{ backgroundColor: quote?.vehicle?.hexCode || '#FFD700' }}
                            />
                            <span
                                className="text-[11px] font-black uppercase tracking-[0.3em]"
                                style={{ color: quote?.vehicle?.hexCode || '#FFD700' }}
                            >
                                Welcome to Elite Ownership
                            </span>
                        </div>
                        <h1 className="text-6xl font-black text-slate-900 mb-4 leading-tight">
                            नमस्ते {quote?.customer?.name?.split(' ')[0] || 'Customer'}!
                        </h1>
                        <p className="text-2xl text-slate-500 font-medium max-w-lg">
                            Your journey towards the <span className="text-slate-900">perfect ride</span> begins right
                            here.
                        </p>
                    </div>

                    {/* Hero Cinematic Section */}
                    <div className="flex-1 flex flex-col items-center justify-center relative">
                        {/* Dramatic Glow behind bike */}
                        <div
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] aspect-square blur-[100px] rounded-full pointer-events-none"
                            style={{ backgroundColor: `${quote?.vehicle?.hexCode || '#FFD700'}26` }}
                        />

                        <div className="w-full max-w-2xl relative z-10">
                            {(quote?.vehicle?.imageUrl || quote?.vehicle?.brand) && (
                                <img
                                    src={getProxiedUrl(
                                        quote.vehicle.imageUrl ||
                                            `/media/${(quote.vehicle.brand || '').toLowerCase()}/${(quote.vehicle.model || '').toLowerCase()}/product/primary.jpg`
                                    )}
                                    alt={quote.vehicle?.model || 'Vehicle'}
                                    className="w-full h-auto object-contain drop-shadow-[0_35px_80px_rgba(0,0,0,0.6)]"
                                />
                            )}
                        </div>

                        <div className="mt-12 text-center z-10 w-full">
                            <h2 className="text-6xl font-black text-slate-900 uppercase tracking-tighter mb-2 italic">
                                {quote?.vehicle?.brand} {quote?.vehicle?.model}
                            </h2>
                            <div className="flex items-center justify-center gap-4">
                                <span className="px-4 py-1.5 bg-white/60 backdrop-blur-sm border border-slate-200 rounded-full text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                    {quote?.vehicle?.variant}
                                </span>
                                <div
                                    className="h-1 w-1 rounded-full"
                                    style={{ backgroundColor: quote?.vehicle?.hexCode || '#FFD700' }}
                                />
                                <span
                                    className="text-[10px] font-black uppercase tracking-widest"
                                    style={{ color: quote?.vehicle?.hexCode || '#FFD700' }}
                                >
                                    {quote?.vehicle?.color || 'Premium Selection'}
                                </span>
                            </div>

                            {/* Unified Premium Ribbon for PDF */}
                            <div className="mt-10 max-w-2xl mx-auto">
                                <div
                                    className="bg-white/80 rounded-[2.5rem] border-2 shadow-sm flex items-stretch overflow-hidden"
                                    style={{
                                        borderColor: quote?.vehicle?.hexCode ? `${quote.vehicle.hexCode}26` : '#E2E8F0',
                                    }}
                                >
                                    {/* On-Road Section */}
                                    <div className="flex-1 px-6 py-5 flex flex-col items-center justify-center text-center">
                                        <div className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">
                                            On-Road
                                        </div>
                                        <div className="text-xs font-black text-slate-900">
                                            {formatCurrency(quote?.pricing?.onRoadPrice || 0)}
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div className="w-px my-4 bg-slate-100" />

                                    {/* Our Offer Section */}
                                    <div className="flex-1 px-6 py-5 flex flex-col items-center justify-center text-center">
                                        <div className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">
                                            Our Offer
                                        </div>
                                        <div
                                            className="text-2xl font-black italic tracking-tighter"
                                            style={{ color: quote?.vehicle?.hexCode || '#F4B000' }}
                                        >
                                            {formatCurrency(quote?.pricing?.finalTotal || 0)}
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div className="w-px my-4 bg-slate-100" />

                                    {/* Savings Section */}
                                    <div className="flex-1 px-6 py-5 flex flex-col items-center justify-center text-center">
                                        <div className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">
                                            Savings
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Sparkles
                                                size={10}
                                                style={{ color: quote?.vehicle?.hexCode || '#10B981' }}
                                            />
                                            <div
                                                className="text-xs font-black"
                                                style={{ color: quote?.vehicle?.hexCode || '#64748B' }}
                                            >
                                                -{formatCurrency(savingsTotal)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer / Confidential Marks */}
                    <div className="mt-auto pt-10 flex justify-between items-end border-t border-slate-100">
                        <div className="max-w-xs">
                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-loose">
                                Certified Document • Non-Transferable
                                <br />
                                Authorized by BookMyBike Digital Network
                            </p>
                        </div>
                        <div className="flex flex-col items-end">
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                                Page 1 of 13
                            </div>
                            <div className="font-mono text-xs text-slate-900/60 tracking-wider">
                                BMB-{formatDisplayId(quote.displayId || quote.display_id)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* PDF Page 2: PRICING LEDGER */}
            <div
                id="pdf-page-2"
                className="bg-white relative overflow-hidden flex flex-col"
                style={{ width: A4_WIDTH, height: A4_HEIGHT, minWidth: A4_WIDTH, minHeight: A4_HEIGHT }}
            >
                {/* Decorative Side Accents (Left side for Page 2 - now Pricing) */}
                <div
                    className="absolute left-0 top-0 bottom-0 w-2"
                    style={{ backgroundColor: quote?.vehicle?.hexCode || '#0b0d10' }}
                />

                <div className="p-16 flex flex-col h-full relative z-10 border-l border-zinc-200">
                    <div className="flex justify-between items-end mb-12">
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-2">
                                Commercial Overview
                            </div>
                            <h3 className="text-4xl font-black text-zinc-900 uppercase">Pricing Ledger</h3>
                        </div>
                        <div className="text-right">
                            <div className="text-[9px] font-black text-zinc-300 uppercase tracking-widest mb-1.5">
                                Quote Status
                            </div>
                            <div className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100 italic">
                                Official & Verified
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Ex-Showroom Group */}
                        <PDFGroup
                            quote={quote}
                            title="EX-SHOWROOM PRICE"
                            icon={Package}
                            total={formatCurrency(quote?.pricing?.exShowroom || 0)}
                        >
                            {(() => {
                                const exShowroom = quote?.pricing?.exShowroom || 0;
                                const gstRate = quote?.pricing?.exShowroomGstRate || (exShowroom > 100000 ? 28 : 18);

                                // Use values directly from SOT if available, else fallback to calculation
                                const basePrice =
                                    quote?.pricing?.exShowroomBasePrice ?? Math.round(exShowroom / (1 + gstRate / 100));
                                const gstAmount = quote?.pricing?.exShowroomGstAmount ?? exShowroom - basePrice;

                                return (
                                    <>
                                        <PDFRow isSub label="Base Price" value={formatCurrency(basePrice)} />
                                        <PDFRow isSub label={`GST (${gstRate}%)`} value={formatCurrency(gstAmount)} />
                                        {quote?.pricing?.colorDelta !== undefined &&
                                            quote?.pricing?.colorDelta !== 0 && (
                                                <PDFRow
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
                        </PDFGroup>

                        {/* Registration Group */}
                        <PDFGroup
                            quote={quote}
                            title="REGISTRATION (RTO)"
                            icon={MapPin}
                            total={formatCurrency(quote?.pricing?.rtoTotal || 0)}
                        >
                            {quote?.pricing?.rtoBreakdown && quote.pricing.rtoBreakdown.length > 0 ? (
                                quote.pricing.rtoBreakdown.map((item: any, idx: number) => (
                                    <PDFRow
                                        key={idx}
                                        isSub
                                        label={item.label || item.name}
                                        value={formatCurrency(item.amount || item.price || 0)}
                                    />
                                ))
                            ) : (
                                <div className="px-8 py-4 text-zinc-400 text-[9px] uppercase italic text-center">
                                    Standard regional levies applied
                                </div>
                            )}
                        </PDFGroup>

                        {/* Insurance Group */}
                        <PDFGroup
                            quote={quote}
                            title="INSURANCE PACKAGE"
                            icon={ShieldCheck}
                            total={formatCurrency(quote?.pricing?.insuranceTotal || 0)}
                        >
                            <PDFRow
                                isSub
                                label="Third Party (Basic)"
                                value={formatCurrency(quote?.pricing?.insuranceTP || 0)}
                            />
                            <PDFRow
                                isSub
                                label="Own Damage (OD)"
                                value={formatCurrency(quote?.pricing?.insuranceOD || 0)}
                            />
                            {(quote?.pricing?.insuranceAddons?.filter((a: any) => a.selected) || []).length > 0
                                ? (quote?.pricing?.insuranceAddons || [])
                                      .filter((a: any) => a.selected)
                                      .map((item: any, idx: number) => (
                                          <PDFRow
                                              key={idx}
                                              isSub
                                              label={item.name || item.label}
                                              value={formatCurrency(
                                                  item.discountPrice ?? item.price ?? item.amount ?? 0
                                              )}
                                          />
                                      ))
                                : null}
                        </PDFGroup>

                        {/* Accessories Group */}
                        {quote?.pricing?.accessoriesTotal > 0 && (
                            <PDFGroup
                                quote={quote}
                                title="AUTHORIZED ACCESSORIES"
                                icon={Settings2}
                                total={formatCurrency(quote?.pricing?.accessoriesTotal || 0)}
                            >
                                {(quote?.pricing?.accessories?.filter((a: any) => a.selected) || []).map(
                                    (item: any, idx: number) => (
                                        <PDFRow
                                            key={idx}
                                            isSub
                                            label={item.name}
                                            value={formatCurrency(item.discountPrice ?? item.price ?? item.amount ?? 0)}
                                        />
                                    )
                                )}
                            </PDFGroup>
                        )}

                        {/* Services Group */}
                        {quote?.pricing?.servicesTotal > 0 && (
                            <PDFGroup
                                quote={quote}
                                title="SERVICES & WARRANTIES"
                                icon={Sparkles}
                                total={formatCurrency(quote?.pricing?.servicesTotal || 0)}
                            >
                                {(quote?.pricing?.services?.filter((s: any) => s.selected) || []).map(
                                    (item: any, idx: number) => (
                                        <PDFRow
                                            key={idx}
                                            isSub
                                            label={item.name}
                                            value={formatCurrency(item.discountPrice ?? item.price ?? item.amount ?? 0)}
                                        />
                                    )
                                )}
                            </PDFGroup>
                        )}

                        <PDFGroup quote={quote} title="DISCOUNTS & ADJUSTMENTS" icon={AlertCircle}>
                            {quote?.pricing?.dealerDiscount ? (
                                <PDFRow
                                    isSub
                                    isSaving={quote.pricing.dealerDiscount < 0}
                                    label="Dealer Discount"
                                    value={formatCurrency(quote.pricing.dealerDiscount)}
                                />
                            ) : null}
                            {quote?.pricing?.offersDelta ? (
                                <PDFRow
                                    isSub
                                    isSaving={quote.pricing.offersDelta < 0}
                                    label="Offers Delta"
                                    value={formatCurrency(quote.pricing.offersDelta)}
                                />
                            ) : null}
                            {quote?.pricing?.colorDelta ? (
                                <PDFRow
                                    isSub
                                    isSaving={quote.pricing.colorDelta < 0}
                                    label="Color Delta"
                                    value={formatCurrency(quote.pricing.colorDelta)}
                                />
                            ) : null}
                            {quote?.pricing?.managerDiscount ? (
                                <PDFRow
                                    isSub
                                    isSaving={quote.pricing.managerDiscount < 0}
                                    label="Manager Discount"
                                    value={formatCurrency(quote.pricing.managerDiscount)}
                                />
                            ) : (
                                <div className="px-8 py-3 text-zinc-400 text-[9px] uppercase italic text-center">
                                    No manager discount
                                </div>
                            )}
                            {quote?.pricing?.managerDiscountNote && (
                                <div className="px-8 pb-4 text-[9px] uppercase tracking-widest text-zinc-400">
                                    Manager Note: {quote.pricing.managerDiscountNote}
                                </div>
                            )}
                        </PDFGroup>

                        <PDFGroup quote={quote} title="TOTALS" icon={CheckCircle2}>
                            <PDFRow
                                label="On-Road Total"
                                value={formatCurrency(quote?.pricing?.onRoadTotal || 0)}
                                isBold
                            />
                            <PDFRow
                                label="Final Total"
                                value={formatCurrency(quote?.pricing?.finalTotal || 0)}
                                isBold
                            />
                        </PDFGroup>
                    </div>

                    <div className="mt-auto flex items-center gap-8 pt-8">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-zinc-100 rounded-lg">
                                <Info size={12} className="text-zinc-400" />
                            </div>
                            <p className="text-[8px] text-zinc-400 italic font-medium leading-relaxed max-w-sm">
                                Standard pricing logic applied. Final value depends on RTO discretion at registration.
                            </p>
                        </div>
                        <div className="h-px flex-1 bg-zinc-100" />
                        <div className="flex flex-col items-end">
                            <div className="text-[9px] font-black text-zinc-300 uppercase tracking-widest mb-1.5">
                                Page 2 of 13
                            </div>
                            <div className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">
                                Pricing Breakup
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* PDF Page 3: FINANCE SCHEME */}
            <div
                id="pdf-page-3"
                className="bg-white relative overflow-hidden flex flex-col"
                style={{ width: A4_WIDTH, height: A4_HEIGHT, minWidth: A4_WIDTH, minHeight: A4_HEIGHT }}
            >
                <div
                    className="absolute left-0 top-0 bottom-0 w-2"
                    style={{ backgroundColor: quote?.vehicle?.hexCode || '#0b0d10' }}
                />
                <div className="p-16 flex flex-col h-full border-l border-zinc-200 relative z-10">
                    <div className="flex justify-between items-end mb-12">
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-2">
                                Finance Architecture
                            </div>
                            <h3 className="text-4xl font-black text-zinc-900 uppercase">Finance Scheme</h3>
                        </div>
                        <div className="text-right">
                            <div className="text-[9px] font-black text-zinc-300 uppercase tracking-widest mb-1.5">
                                Quote
                            </div>
                            <div className="text-xs font-bold text-zinc-900">
                                {formatDisplayId(quote.displayId || quote.display_id)}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1">
                        {quote?.finance ? (
                            <div className="space-y-6">
                                <PDFGroup title="Primary Application" icon={CreditCard}>
                                    <div className="px-6 py-6">
                                        <div className="text-xl font-black text-zinc-900 uppercase italic">
                                            {quote.finance.bank || quote.finance.scheme || 'Standard Finance'}
                                        </div>
                                        <div className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-2">
                                            {quote.finance.scheme || 'Approved Scheme'}
                                        </div>
                                        <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mt-2">
                                            Mode: {quote.finance.mode || 'CASH'}
                                        </div>
                                    </div>
                                </PDFGroup>
                                <div className="grid grid-cols-2 gap-6">
                                    <PDFGroup title="Terms" icon={Activity}>
                                        <PDFRow isSub label="ROI" value={`${quote.finance.roi ?? '—'}%`} />
                                        <PDFRow
                                            isSub
                                            label="LTV"
                                            value={
                                                quote.finance.ltv !== null && quote.finance.ltv !== undefined
                                                    ? `${quote.finance.ltv}%`
                                                    : '—'
                                            }
                                        />
                                        <PDFRow isSub label="Tenure" value={`${quote.finance.tenure ?? '—'} Months`} />
                                        <PDFRow
                                            isSub
                                            label="EMI"
                                            value={formatCurrency(toNumber(quote.finance.emi, 0))}
                                            isBold
                                        />
                                    </PDFGroup>
                                    <PDFGroup title="Amounts" icon={LayoutDashboard}>
                                        <PDFRow
                                            isSub
                                            label="Down Payment"
                                            value={formatCurrency(toNumber(quote.finance.downPayment, 0))}
                                        />
                                        <PDFRow
                                            isSub
                                            label="Loan Amount"
                                            value={formatCurrency(toNumber(quote.finance.loanAmount, 0))}
                                        />
                                        <PDFRow
                                            isSub
                                            label="Upfront Charges"
                                            value={formatCurrency(toNumber(quote.finance.upfrontCharges, 0))}
                                        />
                                        <PDFRow
                                            isSub
                                            label="Funded Add-ons"
                                            value={formatCurrency(toNumber(quote.finance.fundedAddons, 0))}
                                        />
                                        <PDFRow
                                            isSub
                                            label="On-Road"
                                            value={formatCurrency(toNumber(quote?.pricing?.finalTotal, 0))}
                                            isBold
                                        />
                                    </PDFGroup>
                                </div>

                                <PDFGroup title="Charges Breakup" icon={Info}>
                                    {Array.isArray(quote.finance.chargesBreakup) &&
                                    quote.finance.chargesBreakup.length > 0 ? (
                                        quote.finance.chargesBreakup.map((c: any, idx: number) => (
                                            <PDFRow
                                                key={idx}
                                                isSub
                                                label={c.label || c.name || 'Charge'}
                                                value={formatCurrency(toNumber(c.amount, 0))}
                                            />
                                        ))
                                    ) : (
                                        <div className="px-8 py-4 text-zinc-400 text-[9px] uppercase italic text-center">
                                            No charges breakup available
                                        </div>
                                    )}
                                </PDFGroup>
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center border-4 border-dashed border-zinc-100 rounded-[3rem]">
                                <div className="text-center">
                                    <CreditCard size={48} className="mx-auto text-zinc-200 mb-4" />
                                    <div className="text-sm font-black text-zinc-400 uppercase tracking-widest">
                                        Direct Liquid Purchase
                                    </div>
                                    <div className="text-[9px] text-zinc-300 uppercase tracking-widest mt-2">
                                        No Finance Linked
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-auto pt-8 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-zinc-300">
                        <span>Finance</span>
                        <span>Page 3 of 13</span>
                    </div>
                </div>
            </div>

            {/* PDF Page 4: ACCESSORIES */}
            <div
                id="pdf-page-4"
                className="bg-white relative overflow-hidden flex flex-col"
                style={{ width: A4_WIDTH, height: A4_HEIGHT, minWidth: A4_WIDTH, minHeight: A4_HEIGHT }}
            >
                <div
                    className="absolute left-0 top-0 bottom-0 w-2"
                    style={{ backgroundColor: quote?.vehicle?.hexCode || '#0b0d10' }}
                />
                <div className="p-16 flex flex-col h-full relative z-10 border-l border-zinc-200">
                    <div className="flex justify-between items-end mb-12">
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-2">
                                Accessory Suite
                            </div>
                            <h3 className="text-4xl font-black text-zinc-900 uppercase">Accessories</h3>
                        </div>
                        <div className="text-right text-[9px] font-black text-zinc-300 uppercase tracking-widest">
                            Quote {formatDisplayId(quote.displayId || quote.display_id)}
                        </div>
                    </div>

                    <div className="flex-1">
                        {accessories.length > 0 ? (
                            <PDFGroup
                                title="Authorized Accessories"
                                icon={Settings2}
                                total={formatCurrency(toNumber(quote?.pricing?.accessoriesTotal, 0))}
                            >
                                {accessories.map((item: any, idx: number) => (
                                    <PDFRow
                                        key={item.id || idx}
                                        isSub
                                        label={item.name}
                                        value={formatCurrency(
                                            toNumber(item.discountPrice ?? item.price ?? item.amount, 0)
                                        )}
                                    />
                                ))}
                            </PDFGroup>
                        ) : (
                            <div className="h-full flex items-center justify-center border-4 border-dashed border-zinc-100 rounded-[3rem]">
                                <span className="text-zinc-300 uppercase text-[9px] font-black tracking-widest">
                                    No Accessories Selected
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="mt-auto pt-8 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-zinc-300">
                        <span>Accessories</span>
                        <span>Page 4 of 13</span>
                    </div>
                </div>
            </div>

            {/* PDF Page 5: INSURANCE */}
            <div
                id="pdf-page-5"
                className="bg-white relative overflow-hidden flex flex-col"
                style={{ width: A4_WIDTH, height: A4_HEIGHT, minWidth: A4_WIDTH, minHeight: A4_HEIGHT }}
            >
                <div
                    className="absolute left-0 top-0 bottom-0 w-2"
                    style={{ backgroundColor: quote?.vehicle?.hexCode || '#0b0d10' }}
                />
                <div className="p-16 flex flex-col h-full relative z-10 border-l border-zinc-200">
                    <div className="flex justify-between items-end mb-12">
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-2">
                                Protection Stack
                            </div>
                            <h3 className="text-4xl font-black text-zinc-900 uppercase">Insurance</h3>
                        </div>
                        <div className="text-right text-[9px] font-black text-zinc-300 uppercase tracking-widest">
                            Quote {formatDisplayId(quote.displayId || quote.display_id)}
                        </div>
                    </div>

                    <div className="space-y-5">
                        <PDFGroup
                            title="Primary Covers"
                            icon={ShieldCheck}
                            total={formatCurrency(toNumber(quote?.pricing?.insuranceTotal, 0))}
                        >
                            <PDFRow
                                isSub
                                label="Third Party Liability"
                                value={formatCurrency(toNumber(quote?.pricing?.insuranceTP, 0))}
                            />
                            <PDFRow
                                isSub
                                label="Own Damage"
                                value={formatCurrency(toNumber(quote?.pricing?.insuranceOD, 0))}
                            />
                        </PDFGroup>
                        {(insuranceRequired.length > 0 || insuranceAddons.length > 0) && (
                            <PDFGroup title="Add-ons" icon={Sparkles}>
                                {[...insuranceRequired, ...insuranceAddons].map((addon: any, idx: number) => (
                                    <PDFRow
                                        key={addon.id || idx}
                                        isSub
                                        label={addon.name || addon.label}
                                        value={formatCurrency(
                                            toNumber(addon.discountPrice ?? addon.price ?? addon.amount, 0)
                                        )}
                                    />
                                ))}
                            </PDFGroup>
                        )}
                    </div>

                    <div className="mt-auto pt-8 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-zinc-300">
                        <span>Insurance</span>
                        <span>Page 5 of 13</span>
                    </div>
                </div>
            </div>

            {/* PDF Page 6: REGISTRATION */}
            <div
                id="pdf-page-6"
                className="bg-white relative overflow-hidden flex flex-col"
                style={{ width: A4_WIDTH, height: A4_HEIGHT, minWidth: A4_WIDTH, minHeight: A4_HEIGHT }}
            >
                <div
                    className="absolute left-0 top-0 bottom-0 w-2"
                    style={{ backgroundColor: quote?.vehicle?.hexCode || '#0b0d10' }}
                />
                <div className="p-16 flex flex-col h-full relative z-10 border-l border-zinc-200">
                    <div className="flex justify-between items-end mb-12">
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-2">
                                Statutory
                            </div>
                            <h3 className="text-4xl font-black text-zinc-900 uppercase">Registration</h3>
                        </div>
                        <div className="text-right text-[9px] font-black text-zinc-300 uppercase tracking-widest">
                            Quote {formatDisplayId(quote.displayId || quote.display_id)}
                        </div>
                    </div>

                    <PDFGroup
                        title="RTO Breakdown"
                        icon={Milestone}
                        total={formatCurrency(toNumber(quote?.pricing?.rtoTotal, 0))}
                    >
                        {(quote?.pricing?.rtoBreakdown || []).length > 0 ? (
                            (quote?.pricing?.rtoBreakdown || []).map((item: any, idx: number) => (
                                <PDFRow
                                    key={idx}
                                    isSub
                                    label={item.label || item.name}
                                    value={formatCurrency(toNumber(item.amount ?? item.price, 0))}
                                />
                            ))
                        ) : (
                            <PDFRow
                                isSub
                                label="Standard Registration"
                                value={formatCurrency(toNumber(quote?.pricing?.rtoTotal, 0))}
                            />
                        )}
                    </PDFGroup>

                    <div className="mt-auto pt-8 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-zinc-300">
                        <span>Registration</span>
                        <span>Page 6 of 13</span>
                    </div>
                </div>
            </div>

            {/* PDF Page 7: SERVICE */}
            <div
                id="pdf-page-7"
                className="bg-white relative overflow-hidden flex flex-col"
                style={{ width: A4_WIDTH, height: A4_HEIGHT, minWidth: A4_WIDTH, minHeight: A4_HEIGHT }}
            >
                <div
                    className="absolute left-0 top-0 bottom-0 w-2"
                    style={{ backgroundColor: quote?.vehicle?.hexCode || '#0b0d10' }}
                />
                <div className="p-16 flex flex-col h-full relative z-10 border-l border-zinc-200">
                    <div className="flex justify-between items-end mb-12">
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-2">
                                Maintenance
                            </div>
                            <h3 className="text-4xl font-black text-zinc-900 uppercase">Service Packages</h3>
                        </div>
                        <div className="text-right text-[9px] font-black text-zinc-300 uppercase tracking-widest">
                            Quote {formatDisplayId(quote.displayId || quote.display_id)}
                        </div>
                    </div>

                    <PDFGroup
                        title="Service Selection"
                        icon={Settings2}
                        total={formatCurrency(toNumber(quote?.pricing?.servicesTotal, 0))}
                    >
                        {services.length > 0 ? (
                            services.map((svc: any, idx: number) => (
                                <PDFRow
                                    key={svc.id || idx}
                                    isSub
                                    label={svc.name}
                                    value={formatCurrency(toNumber(svc.discountPrice ?? svc.price, 0))}
                                />
                            ))
                        ) : (
                            <div className="px-8 py-4 text-zinc-400 text-[9px] uppercase italic text-center">
                                Standard service plan active
                            </div>
                        )}
                    </PDFGroup>

                    <div className="mt-auto pt-8 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-zinc-300">
                        <span>Service</span>
                        <span>Page 7 of 13</span>
                    </div>
                </div>
            </div>

            {/* PDF Page 8: WARRANTY */}
            <div
                id="pdf-page-8"
                className="bg-white relative overflow-hidden flex flex-col"
                style={{ width: A4_WIDTH, height: A4_HEIGHT, minWidth: A4_WIDTH, minHeight: A4_HEIGHT }}
            >
                <div
                    className="absolute left-0 top-0 bottom-0 w-2"
                    style={{ backgroundColor: quote?.vehicle?.hexCode || '#0b0d10' }}
                />
                <div className="p-16 flex flex-col h-full relative z-10 border-l border-zinc-200">
                    <div className="flex justify-between items-end mb-12">
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-2">
                                Protection
                            </div>
                            <h3 className="text-4xl font-black text-zinc-900 uppercase">Warranty</h3>
                        </div>
                        <div className="text-right text-[9px] font-black text-zinc-300 uppercase tracking-widest">
                            Quote {formatDisplayId(quote.displayId || quote.display_id)}
                        </div>
                    </div>

                    <PDFGroup title="Warranty Coverage" icon={ShieldCheck}>
                        {warrantyItems.length > 0 ? (
                            warrantyItems.map((w: any, idx: number) => (
                                <PDFRow
                                    key={w.id || idx}
                                    isSub
                                    label={w.name || w.label || 'Extended Warranty'}
                                    value="Included"
                                />
                            ))
                        ) : (
                            <div className="px-8 py-4 text-zinc-400 text-[9px] uppercase italic text-center">
                                Standard warranty active
                            </div>
                        )}
                    </PDFGroup>

                    <div className="mt-auto pt-8 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-zinc-300">
                        <span>Warranty</span>
                        <span>Page 8 of 13</span>
                    </div>
                </div>
            </div>

            {/* PDF Page 9: ENGINE & PERFORMANCE */}
            <div
                id="pdf-page-9"
                className="bg-white relative overflow-hidden flex flex-col"
                style={{ width: A4_WIDTH, height: A4_HEIGHT, minWidth: A4_WIDTH, minHeight: A4_HEIGHT }}
            >
                <div
                    className="absolute left-0 top-0 bottom-0 w-2"
                    style={{ backgroundColor: quote?.vehicle?.hexCode || '#0b0d10' }}
                />
                <div className="p-16 flex flex-col h-full relative z-10 border-l border-zinc-200">
                    <div className="flex justify-between items-end mb-12">
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-2">
                                Technical
                            </div>
                            <h3 className="text-4xl font-black text-zinc-900 uppercase">Engine & Performance</h3>
                        </div>
                        <div className="text-right text-[9px] font-black text-zinc-300 uppercase tracking-widest">
                            Quote {formatDisplayId(quote.displayId || quote.display_id)}
                        </div>
                    </div>

                    <PDFGroup title="Performance Metrics" icon={Zap}>
                        <PDFRow isSub label="Displacement" value={specs?.engine?.displacement || '—'} />
                        <PDFRow isSub label="Max Power" value={specs?.engine?.power || '—'} />
                        <PDFRow isSub label="Max Torque" value={specs?.engine?.torque || '—'} />
                        <PDFRow isSub label="Transmission" value={specs?.transmission?.type || '—'} />
                        <PDFRow isSub label="Top Speed" value={specs?.performance?.topSpeed || '—'} />
                        <PDFRow isSub label="Acceleration" value={specs?.performance?.acceleration || '—'} />
                    </PDFGroup>

                    <div className="mt-auto pt-8 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-zinc-300">
                        <span>Engine</span>
                        <span>Page 9 of 13</span>
                    </div>
                </div>
            </div>

            {/* PDF Page 10: DIMENSION & CHASSIS */}
            <div
                id="pdf-page-10"
                className="bg-white relative overflow-hidden flex flex-col"
                style={{ width: A4_WIDTH, height: A4_HEIGHT, minWidth: A4_WIDTH, minHeight: A4_HEIGHT }}
            >
                <div
                    className="absolute left-0 top-0 bottom-0 w-2"
                    style={{ backgroundColor: quote?.vehicle?.hexCode || '#0b0d10' }}
                />
                <div className="p-16 flex flex-col h-full relative z-10 border-l border-zinc-200">
                    <div className="flex justify-between items-end mb-12">
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-2">
                                Technical
                            </div>
                            <h3 className="text-4xl font-black text-zinc-900 uppercase">Dimension & Chassis</h3>
                        </div>
                        <div className="text-right text-[9px] font-black text-zinc-300 uppercase tracking-widest">
                            Quote {formatDisplayId(quote.displayId || quote.display_id)}
                        </div>
                    </div>

                    <PDFGroup title="Chassis Architecture" icon={Activity}>
                        <PDFRow isSub label="Kerb Weight" value={specs?.dimensions?.weight || '—'} />
                        <PDFRow isSub label="Seat Height" value={specs?.dimensions?.seatHeight || '—'} />
                        <PDFRow isSub label="Ground Clearance" value={specs?.dimensions?.groundClearance || '—'} />
                        <PDFRow isSub label="Wheelbase" value={specs?.dimensions?.wheelbase || '—'} />
                        <PDFRow isSub label="Fuel Capacity" value={specs?.dimensions?.fuelCapacity || '—'} />
                    </PDFGroup>

                    <div className="mt-auto pt-8 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-zinc-300">
                        <span>Dimensions</span>
                        <span>Page 10 of 13</span>
                    </div>
                </div>
            </div>

            {/* PDF Page 11: BRAKES & SAFETY */}
            <div
                id="pdf-page-11"
                className="bg-white relative overflow-hidden flex flex-col"
                style={{ width: A4_WIDTH, height: A4_HEIGHT, minWidth: A4_WIDTH, minHeight: A4_HEIGHT }}
            >
                <div
                    className="absolute left-0 top-0 bottom-0 w-2"
                    style={{ backgroundColor: quote?.vehicle?.hexCode || '#0b0d10' }}
                />
                <div className="p-16 flex flex-col h-full relative z-10 border-l border-zinc-200">
                    <div className="flex justify-between items-end mb-12">
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-2">
                                Technical
                            </div>
                            <h3 className="text-4xl font-black text-zinc-900 uppercase">Brakes & Safety</h3>
                        </div>
                        <div className="text-right text-[9px] font-black text-zinc-300 uppercase tracking-widest">
                            Quote {formatDisplayId(quote.displayId || quote.display_id)}
                        </div>
                    </div>

                    <PDFGroup title="Safety Grid" icon={ShieldCheck}>
                        <PDFRow isSub label="Front Brake" value={specs?.brakes?.front || '—'} />
                        <PDFRow isSub label="Rear Brake" value={specs?.brakes?.rear || '—'} />
                        <PDFRow isSub label="ABS Variant" value={specs?.brakes?.abs || '—'} />
                        <PDFRow isSub label="Front Suspension" value={specs?.chassis?.suspensionFront || '—'} />
                        <PDFRow isSub label="Rear Suspension" value={specs?.chassis?.suspensionRear || '—'} />
                    </PDFGroup>

                    <div className="mt-auto pt-8 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-zinc-300">
                        <span>Safety</span>
                        <span>Page 11 of 13</span>
                    </div>
                </div>
            </div>

            {/* PDF Page 12: FEATURES & TECH */}
            <div
                id="pdf-page-12"
                className="bg-white relative overflow-hidden flex flex-col"
                style={{ width: A4_WIDTH, height: A4_HEIGHT, minWidth: A4_WIDTH, minHeight: A4_HEIGHT }}
            >
                <div
                    className="absolute left-0 top-0 bottom-0 w-2"
                    style={{ backgroundColor: quote?.vehicle?.hexCode || '#0b0d10' }}
                />
                <div className="p-16 flex flex-col h-full relative z-10 border-l border-zinc-200">
                    <div className="flex justify-between items-end mb-12">
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-2">
                                Technical
                            </div>
                            <h3 className="text-4xl font-black text-zinc-900 uppercase">Features & Tech</h3>
                        </div>
                        <div className="text-right text-[9px] font-black text-zinc-300 uppercase tracking-widest">
                            Quote {formatDisplayId(quote.displayId || quote.display_id)}
                        </div>
                    </div>

                    <PDFGroup title="Smart Features" icon={Zap}>
                        <div className="grid grid-cols-2 gap-2 p-4">
                            {(features || []).slice(0, 12).map((f: string, i: number) => (
                                <div
                                    key={i}
                                    className="text-[9px] font-black uppercase text-zinc-500 flex items-center gap-2"
                                >
                                    <div className="w-1 h-1 rounded-full bg-zinc-300" /> {f}
                                </div>
                            ))}
                            {(features || []).length === 0 && (
                                <div className="col-span-2 text-center text-zinc-300 uppercase text-[9px] py-4">
                                    Standard smart interface included
                                </div>
                            )}
                        </div>
                    </PDFGroup>

                    <div className="mt-auto pt-8 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-zinc-300">
                        <span>Features</span>
                        <span>Page 12 of 13</span>
                    </div>
                </div>
            </div>
            {/* PDF Page 13: MARKETPLACE FOOTER */}
            <div
                id="pdf-page-13"
                className="bg-white relative overflow-hidden flex flex-col"
                style={{ width: A4_WIDTH, height: A4_HEIGHT, minWidth: A4_WIDTH, minHeight: A4_HEIGHT }}
            >
                <div
                    className="absolute left-0 top-0 bottom-0 w-2"
                    style={{ backgroundColor: quote?.vehicle?.hexCode || '#0b0d10' }}
                />
                <div className="p-16 flex flex-col h-full relative z-10 border-l border-zinc-200">
                    <div className="flex justify-between items-end mb-12">
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-2">
                                Marketplace
                            </div>
                            <h3 className="text-4xl font-black text-zinc-900 uppercase">Stay Connected</h3>
                        </div>
                        <div className="text-right text-[9px] font-black text-zinc-300 uppercase tracking-widest">
                            Quote {formatDisplayId(quote.displayId || quote.display_id)}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        <PDFGroup title="Share This Quote" icon={Share2}>
                            <div className="px-6 py-4 space-y-3">
                                <div className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                                    Share Link
                                </div>
                                <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 text-[10px] font-mono text-zinc-700 break-all">
                                    {`https://bookmy.bike/q/${formatDisplayId(quote.displayId || quote.display_id)}`}
                                </div>
                                <div className="flex items-center gap-3 text-zinc-500">
                                    <Newspaper size={14} />
                                    <Instagram size={14} />
                                    <Twitter size={14} />
                                    <Linkedin size={14} />
                                    <Facebook size={14} />
                                </div>
                            </div>
                        </PDFGroup>

                        <PDFGroup title="Download Our App" icon={Globe}>
                            <div className="px-6 py-6 space-y-4">
                                <div className="text-sm font-black text-zinc-900 uppercase tracking-tight">
                                    BookMyBike App
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="px-4 py-2 rounded-full border border-zinc-200 text-[9px] font-black uppercase tracking-widest text-zinc-600">
                                        iOS App
                                    </div>
                                    <div className="px-4 py-2 rounded-full border border-zinc-200 text-[9px] font-black uppercase tracking-widest text-zinc-600">
                                        Android App
                                    </div>
                                </div>
                                <div className="text-[9px] text-zinc-400 uppercase tracking-widest">
                                    Search “BookMyBike” on your app store
                                </div>
                            </div>
                        </PDFGroup>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mt-8">
                        <PDFGroup title="Connect With Us" icon={Instagram}>
                            <div className="px-6 py-4 space-y-2 text-[10px] font-bold text-zinc-600">
                                <div className="flex items-center gap-2">
                                    <Newspaper size={12} /> /blog
                                </div>
                                <div className="flex items-center gap-2">
                                    <Instagram size={12} /> @bookmybike
                                </div>
                                <div className="flex items-center gap-2">
                                    <Twitter size={12} /> @bookmybike
                                </div>
                                <div className="flex items-center gap-2">
                                    <Linkedin size={12} /> /company/bookmybike
                                </div>
                                <div className="flex items-center gap-2">
                                    <Facebook size={12} /> /bookmybike
                                </div>
                            </div>
                        </PDFGroup>

                        <PDFGroup title="Studio & Support" icon={Phone}>
                            <div className="px-6 py-4 space-y-2 text-[10px] font-bold text-zinc-600">
                                <div className="flex items-center gap-2">
                                    <MapPin size={12} />{' '}
                                    {quote?.pricing?.dealer?.dealer_name ||
                                        quote?.pricing?.dealer?.name ||
                                        'BookMyBike Studio'}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone size={12} /> {quote?.pricing?.dealer?.phone || '+91 00000 00000'}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail size={12} /> {quote?.pricing?.dealer?.email || 'support@bookmy.bike'}
                                </div>
                            </div>
                        </PDFGroup>
                    </div>

                    <div className="mt-auto pt-8 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-zinc-300">
                        <span>Marketplace</span>
                        <span>Page 13 of 13</span>
                    </div>
                </div>
            </div>
            <style jsx>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #pdf-page-1,
                    #pdf-page-2,
                    #pdf-page-3,
                    #pdf-page-4,
                    #pdf-page-5,
                    #pdf-page-6,
                    #pdf-page-7,
                    #pdf-page-8,
                    #pdf-page-9,
                    #pdf-page-10,
                    #pdf-page-11,
                    #pdf-page-12,
                    #pdf-page-13 {
                        visibility: visible;
                    }
                }
                * {
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                    font-family: 'Inter', sans-serif;
                }
                .tabular-nums {
                    font-variant-numeric: tabular-nums;
                }
            `}</style>
        </div>
    );
};
