'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    ExternalLink,
    Save,
    Send,
    CheckCircle2,
    Clock,
    User,
    MapPin,
    Phone,
    Mail,
    Calendar,
    Truck,
    Info,
    ChevronRight,
    Edit3,
    Plus,
    Minus,
    Package,
    Shield,
    Car,
    Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export interface QuoteData {
    id: string;
    displayId: string;
    status: 'DRAFT' | 'PENDING_REVIEW' | 'REVIEWED' | 'SENT' | 'ACCEPTED' | 'CONFIRMED' | 'DELIVERED';
    createdAt: string;
    updatedAt: string;
    validUntil: string | null;
    reviewedBy?: string | null;
    reviewedAt?: string | null;
    expectedDelivery?: string | null;
    studioId: string | null;
    studioName?: string | null;

    // Customer
    customer: {
        name: string;
        phone: string;
        email?: string | null;
        leadSource?: string | null;
    };

    // Vehicle
    vehicle: {
        brand: string;
        model: string;
        variant: string;
        color: string;
        colorHex: string;
        imageUrl?: string | null;
        skuId: string;
    };

    // Pricing
    pricing: {
        exShowroom: number;
        rtoType: 'STATE' | 'BH' | 'COMPANY';
        rtoBreakdown: { label: string; amount: number }[];
        rtoTotal: number;
        insuranceOD: number;
        insuranceTP: number;
        insuranceAddons: { id: string; name: string; amount: number; selected: boolean }[];
        insuranceGST: number;
        insuranceTotal: number;
        accessories: { id: string; name: string; price: number; selected: boolean }[];
        accessoriesTotal: number;
        dealerDiscount: number;
        managerDiscount: number;
        managerDiscountNote?: string | null;
        onRoadTotal: number;
        finalTotal: number;
    };

    // Timeline
    timeline: {
        event: string;
        timestamp: string;
        actor?: string | null;
    }[];
}

interface QuoteEditorTableProps {
    quote: QuoteData;
    onSave: (data: Partial<QuoteData>) => Promise<void>;
    onSendToCustomer: () => Promise<void>;
    onConfirmBooking: () => Promise<void>;
    isEditable?: boolean;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
    DRAFT: { color: 'text-slate-600', bg: 'bg-slate-100 dark:bg-slate-800', label: 'Draft' },
    PENDING_REVIEW: { color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30', label: 'Pending Review' },
    REVIEWED: { color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30', label: 'Reviewed' },
    SENT: { color: 'text-indigo-600', bg: 'bg-indigo-100 dark:bg-indigo-900/30', label: 'Sent to Customer' },
    ACCEPTED: { color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30', label: 'Accepted' },
    CONFIRMED: { color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30', label: 'Confirmed' },
    DELIVERED: { color: 'text-teal-600', bg: 'bg-teal-100 dark:bg-teal-900/30', label: 'Delivered' },
};

export default function QuoteEditorTable({
    quote,
    onSave,
    onSendToCustomer,
    onConfirmBooking,
    isEditable = true,
}: QuoteEditorTableProps) {
    const [localPricing, setLocalPricing] = useState(quote.pricing);
    const [managerDiscountInput, setManagerDiscountInput] = useState(quote.pricing.managerDiscount.toString());
    const [managerNote, setManagerNote] = useState(quote.pricing.managerDiscountNote || '');
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    const statusConfig = STATUS_CONFIG[quote.status] || STATUS_CONFIG.DRAFT;

    // Calculate totals whenever pricing changes
    useEffect(() => {
        const accessoriesTotal = localPricing.accessories.filter(a => a.selected).reduce((sum, a) => sum + a.price, 0);

        const insuranceAddonsTotal = localPricing.insuranceAddons
            .filter(a => a.selected)
            .reduce((sum, a) => sum + a.amount, 0);

        const insuranceBase = localPricing.insuranceOD + localPricing.insuranceTP + insuranceAddonsTotal;
        const insuranceGST = Math.round(insuranceBase * 0.18);
        const insuranceTotal = insuranceBase + insuranceGST;

        const onRoadTotal =
            localPricing.exShowroom +
            localPricing.rtoTotal +
            insuranceTotal +
            accessoriesTotal +
            localPricing.dealerDiscount;

        const managerDiscount = parseFloat(managerDiscountInput) || 0;
        const finalTotal = onRoadTotal + managerDiscount;

        setLocalPricing(prev => ({
            ...prev,
            accessoriesTotal,
            insuranceGST,
            insuranceTotal,
            onRoadTotal,
            managerDiscount,
            finalTotal,
        }));
    }, [
        localPricing.exShowroom,
        localPricing.rtoTotal,
        localPricing.insuranceOD,
        localPricing.insuranceTP,
        localPricing.insuranceAddons,
        localPricing.accessories,
        localPricing.dealerDiscount,
        managerDiscountInput,
    ]);

    const toggleAccessory = (id: string) => {
        if (!isEditable) return;
        setLocalPricing(prev => ({
            ...prev,
            accessories: prev.accessories.map(a => (a.id === id ? { ...a, selected: !a.selected } : a)),
        }));
        setHasChanges(true);
    };

    const toggleInsuranceAddon = (id: string) => {
        if (!isEditable) return;
        setLocalPricing(prev => ({
            ...prev,
            insuranceAddons: prev.insuranceAddons.map(a => (a.id === id ? { ...a, selected: !a.selected } : a)),
        }));
        setHasChanges(true);
    };

    const setRtoType = (type: 'STATE' | 'BH' | 'COMPANY') => {
        if (!isEditable) return;
        setLocalPricing(prev => ({ ...prev, rtoType: type }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave({
                pricing: {
                    ...localPricing,
                    managerDiscountNote: managerNote,
                },
            });
            setHasChanges(false);
            toast.success('Quote saved successfully');
        } catch (error) {
            toast.error('Failed to save quote');
        } finally {
            setIsSaving(false);
        }
    };

    const buildMarketplaceUrl = () => {
        const base = `/store/${quote.vehicle.brand.toLowerCase()}/${quote.vehicle.model.toLowerCase().replace(/\s+/g, '-')}/${quote.vehicle.variant.toLowerCase().replace(/\s+/g, '-')}`;
        const params = new URLSearchParams({
            quoteId: quote.id,
            color: quote.vehicle.color.toLowerCase().replace(/\s+/g, '-'),
            studioId: quote.studioId || '',
        });
        return `${base}?${params.toString()}`;
    };

    const formatCurrency = (amount: number) => {
        const formatted = Math.abs(amount).toLocaleString('en-IN');
        if (amount < 0) return `-₹${formatted}`;
        return `₹${formatted}`;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        Quote <span className="text-brand-primary">#{quote.displayId}</span>
                    </h1>
                    <span
                        className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${statusConfig.bg} ${statusConfig.color}`}
                    >
                        {statusConfig.label}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    {hasChanges && <span className="text-xs text-amber-400 font-medium">Unsaved changes</span>}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSave}
                        disabled={!hasChanges || isSaving}
                        className="gap-2 bg-white/5 border-slate-200 dark:border-white/10 text-white hover:bg-white/10"
                    >
                        <Save size={14} />
                        Save Draft
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onSendToCustomer}
                        className="gap-2 bg-indigo-600/20 border-indigo-500/30 text-indigo-400 hover:bg-indigo-600/30"
                    >
                        <Send size={14} />
                        Send to Customer
                    </Button>
                    <Button
                        size="sm"
                        onClick={onConfirmBooking}
                        className="gap-2 bg-green-600 hover:bg-green-700 text-slate-900 dark:text-white"
                    >
                        <CheckCircle2 size={14} />
                        Confirm Booking
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* Left Column: Customer + Vehicle */}
                <div className="col-span-3 space-y-4">
                    {/* Customer Card */}
                    <div className="bg-white dark:bg-white/[0.03] backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-5">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40 mb-4">
                            Customer Details
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                                    <User size={14} className="text-indigo-400" />
                                </div>
                                <div>
                                    <p className="text-[9px] text-slate-500 dark:text-white/40 uppercase tracking-wider">
                                        Name
                                    </p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                                        {quote.customer.name}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                                    <Phone size={14} className="text-green-400" />
                                </div>
                                <div>
                                    <p className="text-[9px] text-slate-500 dark:text-white/40 uppercase tracking-wider">
                                        Phone
                                    </p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                                        {quote.customer.phone}
                                    </p>
                                </div>
                            </div>
                            {quote.customer.email && (
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                        <Mail size={14} className="text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-slate-500 dark:text-white/40 uppercase tracking-wider">
                                            Email
                                        </p>
                                        <p className="text-sm font-bold text-white truncate">{quote.customer.email}</p>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                                    <Sparkles size={14} className="text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-[9px] text-slate-500 dark:text-white/40 uppercase tracking-wider">
                                        Lead Source
                                    </p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                                        {quote.customer.leadSource || 'Website'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Vehicle Card */}
                    <div className="bg-white dark:bg-white/[0.03] backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-5">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40 mb-4">
                            Vehicle Details
                        </h3>
                        {quote.vehicle.imageUrl && (
                            <div className="mb-4 relative aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900">
                                <img
                                    src={quote.vehicle.imageUrl}
                                    alt={quote.vehicle.model}
                                    className="object-contain w-full h-full"
                                />
                            </div>
                        )}
                        <h4 className="text-lg font-black text-white mb-1">
                            {quote.vehicle.brand} {quote.vehicle.model}
                        </h4>
                        <p className="text-sm text-white/60 mb-3">Variant: {quote.vehicle.variant}</p>
                        <div className="flex items-center gap-2">
                            <div
                                className="w-5 h-5 rounded-full border-2 border-white/20"
                                style={{ backgroundColor: quote.vehicle.colorHex }}
                            />
                            <span className="text-sm text-white/80">{quote.vehicle.color}</span>
                        </div>

                        <a
                            href={buildMarketplaceUrl()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 bg-brand-primary/20 border border-brand-primary/30 text-brand-primary rounded-xl text-xs font-bold hover:bg-brand-primary/30 transition-colors"
                        >
                            <ExternalLink size={12} />
                            Edit in Store
                        </a>
                    </div>
                </div>

                {/* Center Column: Pricing Table */}
                <div className="col-span-6">
                    <div className="bg-white dark:bg-white/[0.03] backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden">
                        {/* Table Header */}
                        <div className="grid grid-cols-4 gap-4 p-4 bg-white/[0.02] border-b border-slate-200 dark:border-white/10">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">
                                Component
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40 text-right">
                                Base
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40 text-center">
                                Adjustment
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40 text-right">
                                Final
                            </span>
                        </div>

                        {/* Ex-Showroom Row */}
                        <div className="grid grid-cols-4 gap-4 p-4 border-b border-white/5 items-center">
                            <span className="text-sm font-medium text-slate-900 dark:text-white">Ex-Showroom</span>
                            <span className="text-sm font-bold text-white text-right">
                                {formatCurrency(localPricing.exShowroom)}
                            </span>
                            <span className="text-center text-white/30">—</span>
                            <span className="text-sm font-bold text-white text-right">
                                {formatCurrency(localPricing.exShowroom)}
                            </span>
                        </div>

                        {/* RTO Row */}
                        <div className="grid grid-cols-4 gap-4 p-4 border-b border-white/5 items-center">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-slate-900 dark:text-white">RTO</span>
                                <div className="group relative">
                                    <Info size={12} className="text-white/30 cursor-help" />
                                    <div className="absolute left-0 bottom-full mb-2 w-48 p-3 bg-slate-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 text-xs">
                                        {localPricing.rtoBreakdown.map((item, i) => (
                                            <div key={i} className="flex justify-between text-white/80 mb-1">
                                                <span>{item.label}</span>
                                                <span>{formatCurrency(item.amount)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <span className="text-sm font-bold text-white text-right">
                                {formatCurrency(localPricing.rtoTotal)}
                            </span>
                            <div className="flex justify-center gap-1">
                                {['STATE', 'BH'].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setRtoType(type as 'STATE' | 'BH')}
                                        className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                                            localPricing.rtoType === type
                                                ? 'bg-brand-primary text-black'
                                                : 'bg-white/10 text-white/60 hover:bg-white/20'
                                        }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                            <span className="text-sm font-bold text-white text-right">
                                {formatCurrency(localPricing.rtoTotal)}
                            </span>
                        </div>

                        {/* Insurance Row */}
                        <div className="grid grid-cols-4 gap-4 p-4 border-b border-white/5 items-start">
                            <div>
                                <span className="text-sm font-medium text-slate-900 dark:text-white">Insurance</span>
                                <div className="mt-2 space-y-1 text-xs text-white/50">
                                    <div className="flex justify-between">
                                        <span>OD</span>
                                        <span>{formatCurrency(localPricing.insuranceOD)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>TP</span>
                                        <span>{formatCurrency(localPricing.insuranceTP)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>GST (18%)</span>
                                        <span>{formatCurrency(localPricing.insuranceGST)}</span>
                                    </div>
                                </div>
                            </div>
                            <span className="text-sm font-bold text-white text-right pt-1">
                                {formatCurrency(localPricing.insuranceOD + localPricing.insuranceTP)}
                            </span>
                            <div className="flex flex-wrap gap-1 justify-center">
                                {localPricing.insuranceAddons.map(addon => (
                                    <button
                                        key={addon.id}
                                        onClick={() => toggleInsuranceAddon(addon.id)}
                                        className={`px-2 py-1 rounded-full text-[9px] font-bold transition-colors flex items-center gap-1 ${
                                            addon.selected
                                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                : 'bg-white/10 text-slate-500 dark:text-white/40 border border-slate-200 dark:border-white/10'
                                        }`}
                                    >
                                        {addon.selected ? <CheckCircle2 size={10} /> : <Plus size={10} />}
                                        {addon.name}
                                    </button>
                                ))}
                            </div>
                            <span className="text-sm font-bold text-white text-right pt-1">
                                {formatCurrency(localPricing.insuranceTotal)}
                            </span>
                        </div>

                        {/* Accessories Row */}
                        <div className="grid grid-cols-4 gap-4 p-4 border-b border-white/5 items-start">
                            <span className="text-sm font-medium text-slate-900 dark:text-white">Accessories</span>
                            <span className="text-sm font-bold text-white text-right">
                                {formatCurrency(localPricing.accessories.reduce((sum, a) => sum + a.price, 0))}
                            </span>
                            <div className="flex flex-wrap gap-1 justify-center">
                                {localPricing.accessories.map(acc => (
                                    <button
                                        key={acc.id}
                                        onClick={() => toggleAccessory(acc.id)}
                                        className={`px-2 py-1 rounded-full text-[9px] font-bold transition-colors flex items-center gap-1 ${
                                            acc.selected
                                                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                                                : 'bg-white/10 text-slate-500 dark:text-white/40 border border-slate-200 dark:border-white/10'
                                        }`}
                                    >
                                        {acc.selected ? <CheckCircle2 size={10} /> : <Plus size={10} />}
                                        {acc.name}
                                    </button>
                                ))}
                            </div>
                            <span className="text-sm font-bold text-white text-right">
                                {formatCurrency(localPricing.accessoriesTotal)}
                            </span>
                        </div>

                        {/* Dealer Discount Row */}
                        <div className="grid grid-cols-4 gap-4 p-4 border-b border-white/5 items-center bg-green-500/5">
                            <span className="text-sm font-medium text-green-400">Dealer Discount</span>
                            <span className="text-center text-white/30">—</span>
                            <span className="text-center">
                                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-bold">
                                    {formatCurrency(localPricing.dealerDiscount)}
                                </span>
                            </span>
                            <span className="text-sm font-bold text-green-400 text-right">
                                {formatCurrency(localPricing.dealerDiscount)}
                            </span>
                        </div>

                        {/* Manager Discount Row */}
                        <div className="grid grid-cols-4 gap-4 p-4 border-b border-white/5 items-center bg-amber-500/5">
                            <div>
                                <span className="text-sm font-medium text-amber-400">Manager Discount</span>
                                <p className="text-[9px] text-white/30 mt-0.5">Additional adjustment</p>
                            </div>
                            <span className="text-center text-white/30">—</span>
                            <div className="flex justify-center">
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400 font-bold">
                                        ₹
                                    </span>
                                    <input
                                        type="number"
                                        value={managerDiscountInput}
                                        onChange={e => {
                                            setManagerDiscountInput(e.target.value);
                                            setHasChanges(true);
                                        }}
                                        disabled={!isEditable}
                                        className="w-28 pl-7 pr-3 py-1.5 bg-amber-500/20 border border-amber-500/30 rounded-lg text-amber-400 text-sm font-bold text-right focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <span className="text-sm font-bold text-amber-400 text-right">
                                {formatCurrency(parseFloat(managerDiscountInput) || 0)}
                            </span>
                        </div>

                        {/* Total Row */}
                        <div className="grid grid-cols-4 gap-4 p-6 bg-brand-primary/10 items-center">
                            <span className="text-lg font-black text-slate-900 dark:text-white">Total On-Road</span>
                            <span className="col-span-2"></span>
                            <span className="text-2xl font-black text-brand-primary text-right">
                                {formatCurrency(localPricing.finalTotal)}
                            </span>
                        </div>
                    </div>

                    {/* Manager Note */}
                    {isEditable && (
                        <div className="mt-4 bg-white dark:bg-white/[0.03] backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40 mb-2 block">
                                Manager Note (Internal)
                            </label>
                            <textarea
                                value={managerNote}
                                onChange={e => {
                                    setManagerNote(e.target.value);
                                    setHasChanges(true);
                                }}
                                rows={2}
                                className="w-full bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg p-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 resize-none"
                                placeholder="Add a note about this discount..."
                            />
                        </div>
                    )}
                </div>

                {/* Right Column: Timeline */}
                <div className="col-span-3">
                    <div className="bg-white dark:bg-white/[0.03] backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-5">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40 mb-4">
                            Quote Timeline
                        </h3>
                        <div className="space-y-4">
                            {quote.timeline.map((event, index) => (
                                <div key={index} className="flex gap-3">
                                    <div className="flex flex-col items-center">
                                        <div className="w-2 h-2 rounded-full bg-brand-primary" />
                                        {index < quote.timeline.length - 1 && (
                                            <div className="w-px flex-1 bg-white/10 mt-1" />
                                        )}
                                    </div>
                                    <div className="flex-1 pb-4">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                                            {event.event}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-white/40">
                                            {formatDate(event.timestamp)}
                                        </p>
                                        {event.actor && (
                                            <p className="text-xs text-white/30 mt-0.5">by {event.actor}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Studio Info */}
                    <div className="mt-4 bg-white dark:bg-white/[0.03] backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-5">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40 mb-3">
                            Dealership
                        </h3>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                <MapPin size={18} className="text-slate-900 dark:text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">
                                    {quote.studioName || 'Studio'}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-white/40">
                                    ID: {quote.studioId?.slice(0, 8) || 'N/A'}...
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Expected Delivery */}
                    {quote.expectedDelivery && (
                        <div className="mt-4 bg-white dark:bg-white/[0.03] backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-5">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40 mb-3">
                                Expected Delivery
                            </h3>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                                    <Truck size={18} className="text-slate-900 dark:text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                                        {new Date(quote.expectedDelivery).toLocaleDateString('en-IN', {
                                            weekday: 'long',
                                            day: 'numeric',
                                            month: 'long',
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
