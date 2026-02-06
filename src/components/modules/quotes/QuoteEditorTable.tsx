'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import {
    Save,
    Send,
    CheckCircle2,
    Clock,
    User,
    Phone,
    ChevronDown,
    ChevronRight,
    Plus,
    X,
    Building2,
    MapPin,
    Bike,
    Mail,
    Calendar,
    ArrowRight,
    Search,
    History,
    FileText,
    MoreHorizontal,
    Download,
    Share2,
    Edit2,
    Upload,
    Eye,
    Trash2,
    Loader2,
    FileText as FileIcon,
    Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
    updateTaskStatus,
    updateMemberProfile,
    getQuotePdpUrl,
    setQuoteFinanceMode,
    updateQuoteFinanceStatus,
    createQuoteFinanceAttempt,
} from '@/actions/crm';
import MemberMediaManager from './MemberMediaManager';
import { createClient } from '@/lib/supabase/client';
import { formatDisplayId } from '@/utils/displayId';

/**
 * Utility for conditional class names
 */
function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}

// ============================================================================
// TYPES
// ============================================================================

export interface QuoteData {
    id: string;
    displayId: string;
    status: 'DRAFT' | 'PENDING_REVIEW' | 'REVIEWED' | 'SENT' | 'ACCEPTED' | 'CONFIRMED' | 'DELIVERED';
    createdAt: string;
    updatedAt: string;
    validUntil: string | null;
    leadId?: string | null;
    reviewedBy?: string | null;
    reviewedAt?: string | null;
    expectedDelivery?: string | null;
    studioId: string | null;
    studioName?: string | null;
    district?: string | null;
    financeMode?: 'CASH' | 'LOAN';
    customerProfile?: {
        memberId?: string | null;
        fullName?: string | null;
        primaryPhone?: string | null;
        whatsapp?: string | null;
        primaryEmail?: string | null;
        email?: string | null;
        currentAddress?: string | null;
        currentAddress1?: string | null;
        currentAddress2?: string | null;
        currentAddress3?: string | null;
        aadhaarAddress?: string | null;
        workAddress?: string | null;
        workCompany?: string | null;
        workDesignation?: string | null;
        workIndustry?: string | null;
        workProfile?: string | null;
        workPincode?: string | null;
        workTaluka?: string | null;
        workDistrict?: string | null;
        workState?: string | null;
        ownershipType?: string | null;
        taluka?: string | null;
        district?: string | null;
        state?: string | null;
        pincode?: string | null;
        dob?: string | null;
    } | null;
    referral?: {
        referredByName?: string | null;
        referredById?: string | null;
        referralData?: any;
    } | null;
    finance?: {
        id?: string | null;
        status?: 'IN_PROCESS' | 'UNDERWRITING' | 'DOC_PENDING' | 'APPROVED' | 'REJECTED';
        bankId?: string | null;
        bankName?: string | null;
        schemeId?: string | null;
        schemeCode?: string | null;
        ltv?: number | null;
        roi?: number | null;
        tenureMonths?: number | null;
        downPayment?: number | null;
        loanAmount?: number | null;
        loanAddons?: number | null;
        processingFee?: number | null;
        chargesBreakup?: any[] | null;
        emi?: number | null;
    };

    customer: {
        name: string;
        phone: string;
        email?: string | null;
        leadSource?: string | null;
    };

    vehicle: {
        brand: string;
        model: string;
        variant: string;
        color: string;
        colorHex: string;
        imageUrl?: string | null;
        skuId: string;
    };

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
    timeline: {
        event: string;
        timestamp: string;
        actor?: string | null;
        actorType?: 'customer' | 'team';
        source?: string | null;
        reason?: string | null;
    }[];
}

interface QuoteEditorTableProps {
    quote: QuoteData;
    tasks?: any[];
    onSave: (data: Partial<QuoteData>) => Promise<void>;
    onSendToCustomer: () => Promise<void>;
    onConfirmBooking: () => Promise<void>;
    isEditable?: boolean;
}

// ============================================================================
// STATUS CONFIG
// ============================================================================

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string; icon: any }> = {
    DRAFT: { color: 'text-slate-600', bg: 'bg-slate-100 dark:bg-slate-800', label: 'Draft', icon: FileText },
    PENDING_REVIEW: {
        color: 'text-amber-600',
        bg: 'bg-amber-100 dark:bg-amber-900/30',
        label: 'In Review',
        icon: Clock,
    },
    REVIEWED: { color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30', label: 'Reviewed', icon: CheckCircle2 },
    SENT: { color: 'text-indigo-600', bg: 'bg-indigo-100 dark:bg-indigo-900/30', label: 'Sent', icon: Send },
    ACCEPTED: {
        color: 'text-green-600',
        bg: 'bg-green-100 dark:bg-green-900/30',
        label: 'Accepted',
        icon: CheckCircle2,
    },
    CONFIRMED: {
        color: 'text-emerald-600',
        bg: 'bg-emerald-100 dark:bg-emerald-900/30',
        label: 'Confirmed',
        icon: CheckCircle2,
    },
    DELIVERED: { color: 'text-teal-600', bg: 'bg-teal-100 dark:bg-teal-900/30', label: 'Delivered', icon: Bike },
};

// ============================================================================
// REDESIGNED COMPONENTS
// ============================================================================

/**
 * Clean table-like row for pricing data
 */
function PricingRow({
    label,
    value,
    description,
    isSub = false,
    isBold = false,
    isSaving = false,
    extra,
}: {
    label: string;
    value: React.ReactNode;
    description?: React.ReactNode;
    isSub?: boolean;
    isBold?: boolean;
    isSaving?: boolean;
    extra?: React.ReactNode;
}) {
    return (
        <div
            className={cn(
                'group flex items-start justify-between py-3 px-6 border-b border-slate-100 dark:border-white/5',
                isSub && 'bg-slate-50/30 dark:bg-white/[0.01]',
                isBold && 'bg-slate-50/50 dark:bg-white/[0.02]'
            )}
        >
            <div className="flex flex-col gap-0.5 min-w-0">
                <div className="flex items-center gap-2">
                    {isSub && <span className="text-slate-300 dark:text-white/20 select-none">└</span>}
                    <span
                        className={cn(
                            'text-sm font-medium',
                            isBold ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-white/70',
                            isSub && 'text-xs'
                        )}
                    >
                        {label}
                    </span>
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
}

/**
 * Collapsible group for Insurance/Accessories
 */
function PricingGroup({
    title,
    icon: Icon,
    total,
    isExpanded,
    onToggle,
    children,
}: {
    title: string;
    icon: any;
    total: string;
    isExpanded: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}) {
    return (
        <div className="border-b border-slate-100 dark:border-white/5 last:border-0">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between py-4 px-6 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-white/40">
                        <Icon size={16} />
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                        {title}
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums">{total}</span>
                    {isExpanded ? (
                        <ChevronDown size={18} className="text-slate-300" />
                    ) : (
                        <ChevronRight size={18} className="text-slate-300" />
                    )}
                </div>
            </button>
            {isExpanded && <div className="bg-slate-50/20 dark:bg-white/[0.005]">{children}</div>}
        </div>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function QuoteEditorTable({
    quote,
    tasks = [],
    onSave,
    onSendToCustomer,
    onConfirmBooking,
    isEditable = true,
}: QuoteEditorTableProps) {
    const [localPricing, setLocalPricing] = useState(quote.pricing);
    const [managerDiscountInput, setManagerDiscountInput] = useState(
        Math.abs(quote.pricing.managerDiscount).toString()
    );
    const [managerNote, setManagerNote] = useState(quote.pricing.managerDiscountNote || '');
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [activeTab, setActiveTab] = useState<
        'DYNAMIC' | 'MEMBER' | 'TASKS' | 'DOCUMENTS' | 'EVENTS' | 'NOTES' | 'TRANSACTIONS'
    >('DYNAMIC');
    const [financeMode, setFinanceMode] = useState<'CASH' | 'LOAN'>(quote.financeMode || 'CASH');

    // Profile Editing State
    const [isEditingProfile, setIsEditingProfile] = useState<string | null>(null);
    const [profileDraft, setProfileDraft] = useState<any>({
        ...quote.customerProfile,
        fullName: quote.customer?.name || quote.customerProfile?.fullName,
    });
    const [isResolvingPincode, setIsResolvingPincode] = useState(false);

    const supabase = createClient();
    const params = useParams();
    const slug = typeof params?.slug === 'string' ? params.slug : Array.isArray(params?.slug) ? params.slug[0] : '';
    const dynamicTabLabel = 'QUOTE';

    const fetchDocuments = () => {
        // This is now handled within MemberMediaManager
        // But we keep the function name if needed for re-fetching or just leave it empty
    };

    const handlePincodeLookup = async (pincode: string, prefix: 'current' | 'work' = 'current') => {
        if (pincode.length !== 6) return;

        setIsResolvingPincode(true);
        try {
            const { checkServiceability } = await import('@/actions/serviceArea');
            const res = await checkServiceability(pincode);

            if (res.location || res.district) {
                if (prefix === 'current') {
                    setProfileDraft((prev: any) => ({
                        ...prev,
                        pincode,
                        taluka: res.taluka || res.area || '--',
                        district: res.district,
                        state: res.state,
                    }));
                } else {
                    setProfileDraft((prev: any) => ({
                        ...prev,
                        workPincode: pincode,
                        workTaluka: res.taluka || res.area || '--',
                        workDistrict: res.district,
                        workState: res.state,
                    }));
                }
            }
        } catch (error) {
            console.error('Pincode lookup failed:', error);
        } finally {
            setIsResolvingPincode(false);
        }
    };

    const handleProfileUpdate = async (section: string) => {
        if (!quote.customerProfile?.memberId) return;
        setIsSaving(true);
        const res = await updateMemberProfile(quote.customerProfile.memberId, {
            fullName: profileDraft.fullName,
            primaryPhone: profileDraft.primaryPhone,
            whatsapp: profileDraft.whatsapp,
            primaryEmail: profileDraft.primaryEmail,
            dob: profileDraft.dob,
            pincode: profileDraft.pincode,
            taluka: profileDraft.taluka,
            district: profileDraft.district,
            state: profileDraft.state,
            currentAddress1: profileDraft.currentAddress1,
            currentAddress2: profileDraft.currentAddress2,
            currentAddress3: profileDraft.currentAddress3,
            workCompany: profileDraft.workCompany,
            workDesignation: profileDraft.workDesignation,
            // We can add more fields here if updateMemberProfile is updated to handle them
        });
        if (res.success) {
            toast.success('Profile updated');
            setIsEditingProfile(null);
        } else {
            toast.error(res.error || 'Update failed');
        }
        setIsSaving(false);
    };
    const handleShare = async () => {
        try {
            const result = await getQuotePdpUrl(quote.id);
            if (!result.success || !result.url) {
                toast.error(result.error || 'Failed to generate quote link');
                return;
            }
            const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${result.url}` : result.url;
            if (navigator.share) {
                await navigator.share({ title: `Quote ${quote.displayId}`, url: fullUrl });
            } else {
                await navigator.clipboard.writeText(fullUrl);
                toast.success('Marketplace quote link copied');
            }
        } catch (error) {
            console.error('Share quote error:', error);
            toast.error('Failed to share quote link');
        }
    };

    const handleFinanceModeChange = async (mode: 'CASH' | 'LOAN') => {
        setFinanceMode(mode);
        const result = await setQuoteFinanceMode(quote.id, mode);
        if (!result.success) {
            toast.error(result.error || 'Failed to update finance mode');
        } else {
            toast.success(`Finance mode set to ${mode}`);
        }
    };

    const handleFinanceStatusUpdate = async (
        status: 'IN_PROCESS' | 'UNDERWRITING' | 'DOC_PENDING' | 'APPROVED' | 'REJECTED'
    ) => {
        if (!quote.finance?.id) {
            toast.error('No active finance attempt found');
            return;
        }
        const result = await updateQuoteFinanceStatus(quote.finance.id, status);
        if (!result.success) {
            toast.error(result.error || 'Failed to update finance status');
        } else {
            toast.success(`Finance status updated to ${status}`);
        }
    };

    const handleAddNewFinance = async () => {
        const finance = quote.finance;
        if (!finance) {
            toast.error('Finance details not available from PDP');
            return;
        }
        const result = await createQuoteFinanceAttempt(quote.id, {
            bankId: finance.bankId || null,
            bankName: finance.bankName || null,
            schemeId: finance.schemeId || null,
            schemeCode: finance.schemeCode || null,
            ltv: finance.ltv || null,
            roi: finance.roi || null,
            tenureMonths: finance.tenureMonths || null,
            downPayment: finance.downPayment || null,
            loanAmount: finance.loanAmount || null,
            loanAddons: finance.loanAddons || null,
            processingFee: finance.processingFee || null,
            chargesBreakup: finance.chargesBreakup || [],
            emi: finance.emi || null,
        });
        if (!result.success) {
            toast.error(result.error || 'Failed to add finance attempt');
        } else {
            toast.success('New finance attempt created');
        }
    };

    const handleTaskStatus = async (taskId: string, status: 'OPEN' | 'IN_PROGRESS' | 'DONE') => {
        const result = await updateTaskStatus(taskId, status);
        if (!result.success) {
            toast.error(result.error || 'Failed to update task');
        } else {
            toast.success('Task updated');
        }
    };

    const transactions = [
        {
            key: 'LEAD',
            label: 'Lead',
            id: quote.leadId,
            status: quote.leadId ? 'CREATED' : 'PENDING',
            href: slug ? `/app/${slug}/leads` : null,
        },
        { key: 'QUOTE', label: 'Quote', id: quote.id, status: quote.status, href: null },
        {
            key: 'FINANCE',
            label: 'Finance',
            id: quote.finance?.id || null,
            status: quote.finance?.status || 'PENDING',
            href: null,
        },
        { key: 'BOOKING', label: 'Booking', id: null, status: 'PENDING', href: null },
        { key: 'PAYMENT', label: 'Payment (Refund)', id: null, status: 'PENDING', href: null },
        { key: 'ALLOTMENT', label: 'Allotment', id: null, status: 'PENDING', href: null },
        { key: 'PDI', label: 'Pre Delivery Inspection', id: null, status: 'PENDING', href: null },
        { key: 'INVOICE', label: 'Invoice', id: null, status: 'PENDING', href: null },
        { key: 'INSURANCE', label: 'Insurance', id: null, status: 'PENDING', href: null },
        { key: 'REGISTRATION', label: 'Registration', id: null, status: 'PENDING', href: null },
        { key: 'DELIVERY', label: 'Delivery', id: null, status: 'PENDING', href: null },
        { key: 'HSRP', label: 'HSRP', id: null, status: 'PENDING', href: null },
        { key: 'SERVICE', label: 'Service', id: null, status: 'PENDING', href: null },
        { key: 'FEEDBACK', label: 'Feedback', id: null, status: 'PENDING', href: null },
        { key: 'TICKETS', label: 'Tickets', id: null, status: 'PENDING', href: null },
    ];
    const [groups, setGroups] = useState({
        insurance: false,
        accessories: false,
        pricing: true, // New Toggle for Line-Item Breakdown
        finance: true, // New Toggle for Finance Section
    });
    const [expandedTransaction, setExpandedTransaction] = useState<string>('QUOTE');

    // --- TRACK QUOTE OPENED ---
    // TODO: Task List for Quote Editor Table Refactor
    // - [x] Implement "Quote Opened" logging logic.
    // - [ ] Phase 10: Live Finance Integration
    //     - [ ] Update `buildCommercials` in `ProductClient.tsx` to include finance scheme details.
    //     - [ ] Update `QuoteEditorData` interface in `crm.ts`.
    //     - [ ] Update `getQuoteById` in `crm.ts` to map finance data.
    //     - [ ] Update `QuoteEditorTable.tsx` to display live finance data.
    //     - [ ] Verify persistence and display of finance data across PDP and Quote Editor.
    useEffect(() => {
        if (quote.id) {
            import('@/actions/crm').then(({ logQuoteEvent }) => {
                logQuoteEvent(quote.id, 'Quote Viewed in Editor', 'Team Member', 'team');
            });
        }
    }, [quote.id]);

    // Handle price recalculation when inputs change
    const statusConfig = STATUS_CONFIG[quote.status] || STATUS_CONFIG.DRAFT;

    // Recalculation engine
    useEffect(() => {
        const accessoriesTotal = localPricing.accessories.filter(a => a.selected).reduce((sum, a) => sum + a.price, 0);
        const insuranceAddonsTotal = localPricing.insuranceAddons
            .filter(a => a.selected)
            .reduce((sum, a) => sum + a.amount, 0);
        const insuranceBase = localPricing.insuranceOD + localPricing.insuranceTP + insuranceAddonsTotal;
        const insuranceGST = Math.round(insuranceBase * 0.18);
        const insuranceTotal = insuranceBase + insuranceGST;

        const subtotal = localPricing.exShowroom + localPricing.rtoTotal + insuranceTotal + accessoriesTotal;
        const managerDiscount = parseFloat(managerDiscountInput) || 0;
        const finalTotal = subtotal - Math.abs(localPricing.dealerDiscount) - managerDiscount;

        setLocalPricing(prev => ({
            ...prev,
            accessoriesTotal,
            insuranceGST,
            insuranceTotal,
            onRoadTotal: subtotal,
            managerDiscount: -Math.abs(managerDiscount),
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

    const formatCurrency = (amount: number) => {
        const formatted = Math.abs(amount).toLocaleString('en-IN');
        return amount < 0 ? `-₹${formatted}` : `₹${formatted}`;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleSaveLocal = async () => {
        setIsSaving(true);
        try {
            await onSave({ pricing: { ...localPricing, managerDiscountNote: managerNote } });
            setHasChanges(false);
            toast.success('Quote updated');
        } catch {
            toast.error('Failed to update');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="w-full flex flex-col h-full bg-slate-50 dark:bg-[#08090b] overflow-hidden antialiased">
            {/* MODULE HEADER LABEL - Above main container */}
            <div className="px-8 pt-4 pb-2 bg-slate-50 dark:bg-[#08090b]">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.4em]">
                        Quote
                    </span>
                </div>
            </div>

            {/* STICKY HEADER - MAIN CONTAINER */}
            <div className="sticky top-0 z-20 flex items-center justify-between px-8 py-5 bg-white/80 dark:bg-[#0b0d10]/80 backdrop-blur-md border-b border-slate-100 dark:border-white/5 shadow-sm">
                <div className="flex items-center gap-12">
                    {/* Snapshot Grid */}
                    <div className="flex items-center gap-8">
                        {/* ID Section */}
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest">
                                Identifier
                            </span>
                            <div className="flex items-center gap-2">
                                <h1 className="text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase italic tracking-tight">
                                    {formatDisplayId(quote.displayId)}
                                </h1>
                            </div>
                        </div>

                        <div className="w-px h-6 bg-slate-100 dark:bg-white/5" />

                        {/* Creation Section */}
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest">
                                Generation Node
                            </span>
                            <span className="text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                                {formatDate(quote.createdAt)}
                            </span>
                        </div>

                        <div className="w-px h-6 bg-slate-100 dark:bg-white/5" />

                        {/* Status Section */}
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest">
                                Status Lifecycle
                            </span>
                            <div
                                className={cn(
                                    'flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider w-fit',
                                    statusConfig.bg,
                                    statusConfig.color
                                )}
                            >
                                <statusConfig.icon size={10} />
                                {statusConfig.label}
                            </div>
                        </div>

                        <div className="w-px h-6 bg-slate-100 dark:bg-white/5" />

                        {/* Modified Section */}
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest">
                                Last Telemetry
                            </span>
                            <span className="text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                                {formatDate(quote.updatedAt)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {hasChanges && (
                        <Button
                            onClick={handleSaveLocal}
                            disabled={isSaving}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 h-10 text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
                        >
                            <Save size={16} className="mr-2" />
                            {isSaving ? 'Updating...' : 'Save'}
                        </Button>
                    )}

                    <div className="flex items-center bg-slate-100 dark:bg-white/5 rounded-xl p-1 gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 rounded-lg text-slate-500 hover:text-slate-900"
                        >
                            <Download size={14} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleShare}
                            className="h-8 rounded-lg text-slate-500 hover:text-slate-900"
                        >
                            <Share2 size={14} />
                        </Button>
                        <div className="w-px h-4 bg-slate-200 dark:bg-white/10 mx-1" />
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 rounded-lg text-slate-500 hover:text-slate-900"
                        >
                            <MoreHorizontal size={14} />
                        </Button>
                    </div>

                    {(quote.status === 'DRAFT' || quote.status === 'REVIEWED') && (
                        <Button
                            onClick={onSendToCustomer}
                            className="bg-slate-900 dark:bg-white text-white dark:text-black hover:opacity-90 rounded-xl px-6 h-10 text-xs font-black uppercase tracking-widest transition-all active:scale-95 ml-2"
                        >
                            <Send size={16} className="mr-2" />
                            Send to Customer
                        </Button>
                    )}
                </div>
            </div>

            {/* MAIN CONTENT AREA - GRID SPLIT */}
            <div className="flex-1 flex min-h-0 overflow-hidden">
                {/* LEFT: PRICING EDITOR (flex-1) */}
                <div className="flex-1 overflow-y-auto no-scrollbar pb-24 border-r border-slate-100 dark:border-white/5">
                    {/* 1. INFORMATIONAL GRID (Customer & Vehicle) */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-px bg-slate-100 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                        {/* Customer Info */}
                        <div className="bg-white dark:bg-[#0b0d10] p-6 flex items-center gap-4 group hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                                <User size={20} />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[9px] font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.2em] mb-0.5">
                                    Customer Selection
                                </span>
                                <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tighter truncate">
                                    {quote.customer.name}
                                </h2>
                                <div className="flex items-center gap-3 mt-1">
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                                        <Phone size={10} className="text-indigo-500/60" />
                                        {quote.customer.phone}
                                    </div>
                                    <div className="w-0.5 h-0.5 rounded-full bg-slate-200 dark:bg-white/10" />
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                                        <History size={10} className="text-amber-500/60" />
                                        {quote.customer.leadSource || 'Direct'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Vehicle Info */}
                        <div className="bg-white dark:bg-[#0b0d10] p-6 flex items-center gap-4 group hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors border-t xl:border-t-0 xl:border-l border-slate-100 dark:border-white/5">
                            <div className="relative w-20 h-12 bg-slate-50 dark:bg-white/5 rounded-xl overflow-hidden shadow-inner group-hover:scale-105 transition-transform">
                                {quote.vehicle.imageUrl ? (
                                    <img
                                        src={quote.vehicle.imageUrl}
                                        className="w-full h-full object-contain p-1"
                                        alt=""
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <Bike size={20} />
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[9px] font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.2em] mb-0.5">
                                    Vehicle Specification
                                </span>
                                <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tighter truncate leading-tight">
                                    {quote.vehicle.brand} {quote.vehicle.model}
                                </h2>
                                <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest opacity-80">
                                    {quote.vehicle.variant}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="w-full bg-white dark:bg-[#0b0d10] border-y border-slate-100 dark:border-white/10">
                        <div className="grid grid-cols-7 text-[9px] font-black uppercase tracking-widest w-full">
                            {(
                                [
                                    { key: 'DYNAMIC', label: dynamicTabLabel },
                                    { key: 'MEMBER', label: 'MEMBER' },
                                    { key: 'TASKS', label: 'TASKS' },
                                    { key: 'DOCUMENTS', label: 'DOCUMENTS' },
                                    { key: 'EVENTS', label: 'EVENTS' },
                                    { key: 'NOTES', label: 'NOTES' },
                                    { key: 'TRANSACTIONS', label: 'TRANSACTIONS' },
                                ] as const
                            ).map((tab, idx) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key as any)}
                                    className={cn(
                                        'w-full py-3 text-center transition-all',
                                        idx < 6 ? 'border-r border-slate-100 dark:border-white/10' : '',
                                        activeTab === tab.key
                                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                            : 'bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-slate-600'
                                    )}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {activeTab === 'MEMBER' && (
                        <div className="p-6">
                            <div className="bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/10 rounded-[2rem] p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="text-xs font-black uppercase tracking-widest text-slate-500">
                                        Member Profile
                                    </div>
                                    <div className="text-[10px] font-bold text-indigo-500 bg-indigo-500/10 px-3 py-1 rounded-full uppercase tracking-widest cursor-default">
                                        Member ID: {quote.customerProfile?.memberId || 'Missing'}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Communication Section */}
                                    <div className="relative group/section bg-slate-50 dark:bg-white/[0.02] p-6 rounded-[1.5rem] border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                Communication
                                            </div>
                                            <button
                                                onClick={() =>
                                                    setIsEditingProfile(
                                                        isEditingProfile === 'communication' ? null : 'communication'
                                                    )
                                                }
                                                className="opacity-0 group-hover/section:opacity-100 p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-all"
                                            >
                                                <Edit2 size={12} className="text-slate-400" />
                                            </button>
                                        </div>

                                        {isEditingProfile === 'communication' ? (
                                            <div className="space-y-4">
                                                <div className="space-y-1">
                                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">
                                                        Primary Phone
                                                    </label>
                                                    <input
                                                        className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                                                        value={profileDraft.primaryPhone || ''}
                                                        onChange={e =>
                                                            setProfileDraft({
                                                                ...profileDraft,
                                                                primaryPhone: e.target.value,
                                                            })
                                                        }
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">
                                                        WhatsApp
                                                    </label>
                                                    <input
                                                        className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                                                        value={profileDraft.whatsapp || ''}
                                                        onChange={e =>
                                                            setProfileDraft({
                                                                ...profileDraft,
                                                                whatsapp: e.target.value,
                                                            })
                                                        }
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">
                                                        Primary Email
                                                    </label>
                                                    <input
                                                        className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                                                        value={profileDraft.primaryEmail || ''}
                                                        onChange={e =>
                                                            setProfileDraft({
                                                                ...profileDraft,
                                                                primaryEmail: e.target.value,
                                                            })
                                                        }
                                                    />
                                                </div>
                                                <Button
                                                    onClick={() => handleProfileUpdate('communication')}
                                                    disabled={isSaving}
                                                    size="sm"
                                                    className="w-full mt-2 h-10 rounded-xl bg-slate-900 dark:bg-white dark:text-slate-900 border-none"
                                                >
                                                    {isSaving ? 'Archiving...' : 'Save Communication'}
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-tight mb-1">
                                                        Primary Phone
                                                    </span>
                                                    <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">
                                                        {quote.customerProfile?.primaryPhone ||
                                                            quote.customer.phone ||
                                                            'N/A'}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-tight mb-1">
                                                        WhatsApp
                                                    </span>
                                                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300 tabular-nums">
                                                        {quote.customerProfile?.whatsapp || 'N/A'}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-tight mb-1">
                                                        Email Address
                                                    </span>
                                                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300 lowercase italic">
                                                        {quote.customerProfile?.primaryEmail ||
                                                            quote.customerProfile?.email ||
                                                            'N/A'}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Personal Info Section */}
                                    <div className="relative group/section bg-slate-50 dark:bg-white/[0.02] p-6 rounded-[1.5rem] border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                Personal Data
                                            </div>
                                            <button
                                                onClick={() =>
                                                    setIsEditingProfile(
                                                        isEditingProfile === 'personal' ? null : 'personal'
                                                    )
                                                }
                                                className="opacity-0 group-hover/section:opacity-100 p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-all"
                                            >
                                                <Edit2 size={12} className="text-slate-400" />
                                            </button>
                                        </div>

                                        {isEditingProfile === 'personal' ? (
                                            <div className="space-y-4">
                                                <div className="space-y-1">
                                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">
                                                        Full Name
                                                    </label>
                                                    <input
                                                        className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                                                        value={profileDraft.fullName || ''}
                                                        onChange={e =>
                                                            setProfileDraft({
                                                                ...profileDraft,
                                                                fullName: e.target.value,
                                                            })
                                                        }
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">
                                                        Date of Birth
                                                    </label>
                                                    <input
                                                        type="date"
                                                        className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                                                        value={profileDraft.dob || ''}
                                                        onChange={e =>
                                                            setProfileDraft({ ...profileDraft, dob: e.target.value })
                                                        }
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">
                                                            Pincode
                                                        </label>
                                                        <input
                                                            className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm tabular-nums outline-none focus:ring-1 focus:ring-indigo-500"
                                                            value={profileDraft.pincode || ''}
                                                            onChange={e =>
                                                                setProfileDraft({
                                                                    ...profileDraft,
                                                                    pincode: e.target.value,
                                                                })
                                                            }
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">
                                                            Taluka
                                                        </label>
                                                        <input
                                                            className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                                                            value={profileDraft.taluka || ''}
                                                            onChange={e =>
                                                                setProfileDraft({
                                                                    ...profileDraft,
                                                                    taluka: e.target.value,
                                                                })
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                                <Button
                                                    onClick={() => handleProfileUpdate('personal')}
                                                    disabled={isSaving}
                                                    size="sm"
                                                    className="w-full mt-2 h-10 rounded-xl bg-slate-900 dark:bg-white dark:text-slate-900 border-none"
                                                >
                                                    {isSaving ? 'Archiving...' : 'Save Personal Data'}
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-tight mb-1">
                                                        Legal Name
                                                    </span>
                                                    <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                                        {quote.customer.name}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-tight mb-1">
                                                        Date of Birth
                                                    </span>
                                                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300 tabular-nums">
                                                        {quote.customerProfile?.dob || 'N/A'}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-tight mb-1">
                                                        Location Details
                                                    </span>
                                                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-tight">
                                                        {quote.customerProfile?.taluka || 'N/A'} •{' '}
                                                        {quote.customerProfile?.district || 'N/A'}
                                                        <br />
                                                        {quote.customerProfile?.state || 'N/A'} •{' '}
                                                        {quote.customerProfile?.pincode || 'N/A'}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Address Section */}
                                    <div className="relative group/section bg-slate-50 dark:bg-white/[0.02] p-6 rounded-[1.5rem] border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                Identity Addresses
                                            </div>
                                            <button
                                                onClick={() =>
                                                    setIsEditingProfile(
                                                        isEditingProfile === 'address' ? null : 'address'
                                                    )
                                                }
                                                className="opacity-0 group-hover/section:opacity-100 p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-all"
                                            >
                                                <Edit2 size={12} className="text-slate-400" />
                                            </button>
                                        </div>

                                        {isEditingProfile === 'address' ? (
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">
                                                            Pincode
                                                        </label>
                                                        <input
                                                            className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                                                            value={profileDraft.pincode || ''}
                                                            maxLength={6}
                                                            onChange={e => {
                                                                const val = e.target.value.replace(/\D/g, '');
                                                                setProfileDraft({ ...profileDraft, pincode: val });
                                                                if (val.length === 6)
                                                                    handlePincodeLookup(val, 'current');
                                                            }}
                                                            placeholder="Format: 400001"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">
                                                            Ownership
                                                        </label>
                                                        <select
                                                            className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
                                                            value={profileDraft.ownershipType || 'OWNED'}
                                                            onChange={e =>
                                                                setProfileDraft({
                                                                    ...profileDraft,
                                                                    ownershipType: e.target.value,
                                                                })
                                                            }
                                                        >
                                                            <option value="OWNED">Owned</option>
                                                            <option value="RENTED">Rented</option>
                                                            <option value="PARENTAL">Parental</option>
                                                            <option value="COMPANY">Company Provided</option>
                                                            <option value="OTHERS">Others</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3 opacity-80 pointer-events-none grayscale-[0.5]">
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">
                                                            Taluka / Area
                                                        </label>
                                                        <div className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl px-3 py-2 text-xs font-bold uppercase truncate flex items-center justify-between">
                                                            <span>{profileDraft.taluka || '--'}</span>
                                                            {isResolvingPincode && (
                                                                <Loader2
                                                                    size={10}
                                                                    className="animate-spin text-indigo-500"
                                                                />
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">
                                                            District / State
                                                        </label>
                                                        <div className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl px-3 py-2 text-xs font-bold uppercase truncate">
                                                            {profileDraft.district
                                                                ? `${profileDraft.district}, ${profileDraft.state}`
                                                                : '--'}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">
                                                            Address Line 1 (Building/Street)
                                                        </label>
                                                        <input
                                                            className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                                                            value={profileDraft.currentAddress1 || ''}
                                                            onChange={e =>
                                                                setProfileDraft({
                                                                    ...profileDraft,
                                                                    currentAddress1: e.target.value,
                                                                })
                                                            }
                                                            placeholder="A-101, Galaxy Tower..."
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">
                                                            Line 2 (Landmark)
                                                        </label>
                                                        <input
                                                            className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                                                            value={profileDraft.currentAddress2 || ''}
                                                            onChange={e =>
                                                                setProfileDraft({
                                                                    ...profileDraft,
                                                                    currentAddress2: e.target.value,
                                                                })
                                                            }
                                                            placeholder="Near Railway Station..."
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">
                                                            Line 3 (Area/Road)
                                                        </label>
                                                        <input
                                                            className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                                                            value={profileDraft.currentAddress3 || ''}
                                                            onChange={e =>
                                                                setProfileDraft({
                                                                    ...profileDraft,
                                                                    currentAddress3: e.target.value,
                                                                })
                                                            }
                                                            placeholder="Main Road, Sector 5..."
                                                        />
                                                    </div>
                                                </div>

                                                <Button
                                                    onClick={() => handleProfileUpdate('address')}
                                                    disabled={isSaving}
                                                    size="sm"
                                                    className="w-full mt-2 h-10 rounded-xl bg-slate-900 dark:bg-white dark:text-slate-900 border-none"
                                                >
                                                    {isSaving ? 'Archiving...' : 'Sync Residence'}
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-1">
                                                        {profileDraft.ownershipType || 'CURRENT'} RESIDENCE
                                                    </span>
                                                    <div className="space-y-0.5">
                                                        <span className="block text-[11px] font-black text-slate-900 dark:text-white uppercase leading-tight">
                                                            {quote.customerProfile?.currentAddress1 ||
                                                                'No address line 1'}
                                                        </span>
                                                        {(quote.customerProfile?.currentAddress2 ||
                                                            quote.customerProfile?.currentAddress3) && (
                                                            <span className="block text-[10px] font-bold text-slate-500 uppercase leading-snug">
                                                                {[
                                                                    quote.customerProfile.currentAddress2,
                                                                    quote.customerProfile.currentAddress3,
                                                                ]
                                                                    .filter(Boolean)
                                                                    .join(', ')}
                                                            </span>
                                                        )}
                                                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                                            {quote.customerProfile?.taluka
                                                                ? `${quote.customerProfile.taluka}, `
                                                                : ''}
                                                            {quote.customerProfile?.district
                                                                ? `${quote.customerProfile.district}, `
                                                                : ''}
                                                            {quote.customerProfile?.state
                                                                ? `${quote.customerProfile.state} - `
                                                                : ''}
                                                            {quote.customerProfile?.pincode || ''}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="pt-3 border-t border-slate-100 dark:border-white/5">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-tight mb-1">
                                                        Aadhaar Static
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase leading-relaxed max-w-[280px] italic line-clamp-2">
                                                        {quote.customerProfile?.aadhaarAddress || 'Not Captured'}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Work Section */}
                                    <div className="relative group/section bg-slate-50 dark:bg-white/[0.02] p-6 rounded-[1.5rem] border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                Professional Dossier
                                            </div>
                                            <button
                                                onClick={() =>
                                                    setIsEditingProfile(isEditingProfile === 'work' ? null : 'work')
                                                }
                                                className="opacity-0 group-hover/section:opacity-100 p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-all"
                                            >
                                                <Edit2 size={12} className="text-slate-400" />
                                            </button>
                                        </div>

                                        {isEditingProfile === 'work' ? (
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">
                                                            Employer / Company
                                                        </label>
                                                        <input
                                                            className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                                                            value={profileDraft.workCompany || ''}
                                                            onChange={e =>
                                                                setProfileDraft({
                                                                    ...profileDraft,
                                                                    workCompany: e.target.value,
                                                                })
                                                            }
                                                            placeholder="TATA Motors, Infosys..."
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">
                                                            Designation
                                                        </label>
                                                        <input
                                                            className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                                                            value={profileDraft.workDesignation || ''}
                                                            onChange={e =>
                                                                setProfileDraft({
                                                                    ...profileDraft,
                                                                    workDesignation: e.target.value,
                                                                })
                                                            }
                                                            placeholder="Software Engineer, Manager..."
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">
                                                            Industry
                                                        </label>
                                                        <select
                                                            className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
                                                            value={profileDraft.workIndustry || 'IT'}
                                                            onChange={e =>
                                                                setProfileDraft({
                                                                    ...profileDraft,
                                                                    workIndustry: e.target.value,
                                                                })
                                                            }
                                                        >
                                                            <option value="IT">Information Technology</option>
                                                            <option value="MANUFACTURING">Manufacturing</option>
                                                            <option value="FINANCE">Finance / Banking</option>
                                                            <option value="HEALTHCARE">Healthcare</option>
                                                            <option value="RETAIL">Retail</option>
                                                            <option value="GOVERNMENT">Government</option>
                                                            <option value="OTHERS">Others</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">
                                                            Work Profile / Type
                                                        </label>
                                                        <select
                                                            className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
                                                            value={profileDraft.workProfile || 'SALARIED'}
                                                            onChange={e =>
                                                                setProfileDraft({
                                                                    ...profileDraft,
                                                                    workProfile: e.target.value,
                                                                })
                                                            }
                                                        >
                                                            <option value="SALARIED">Salaried</option>
                                                            <option value="SELF_EMPLOYED">Self Employed</option>
                                                            <option value="BUSINESS">Business Owner</option>
                                                            <option value="FREELANCE">Freelancer</option>
                                                            <option value="OTHERS">Others</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">
                                                        Office Pincode
                                                    </label>
                                                    <input
                                                        className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                                                        value={profileDraft.workPincode || ''}
                                                        maxLength={6}
                                                        onChange={e => {
                                                            const val = e.target.value.replace(/\D/g, '');
                                                            setProfileDraft({ ...profileDraft, workPincode: val });
                                                            if (val.length === 6) handlePincodeLookup(val, 'work');
                                                        }}
                                                        placeholder="Office location pin..."
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-3 opacity-80 pointer-events-none grayscale-[0.5]">
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">
                                                            Work Taluka / Area
                                                        </label>
                                                        <div className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl px-3 py-2 text-xs font-bold uppercase truncate flex items-center justify-between">
                                                            <span>{profileDraft.workTaluka || '--'}</span>
                                                            {isResolvingPincode && (
                                                                <Loader2
                                                                    size={10}
                                                                    className="animate-spin text-indigo-500"
                                                                />
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">
                                                            Work District / State
                                                        </label>
                                                        <div className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl px-3 py-2 text-xs font-bold uppercase truncate">
                                                            {profileDraft.workDistrict
                                                                ? `${profileDraft.workDistrict}, ${profileDraft.workState}`
                                                                : '--'}
                                                        </div>
                                                    </div>
                                                </div>

                                                <Button
                                                    onClick={() => handleProfileUpdate('work')}
                                                    disabled={isSaving}
                                                    size="sm"
                                                    className="w-full mt-2 h-10 rounded-xl bg-slate-900 dark:bg-white dark:text-slate-900 border-none"
                                                >
                                                    {isSaving ? 'Archiving...' : 'Update Dossier'}
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-tight mb-1">
                                                        Work Occupation
                                                    </span>
                                                    <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                                        {quote.customerProfile?.workDesignation || 'Unspecified'}
                                                    </span>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-[0.2em]">
                                                            @ {quote.customerProfile?.workCompany || 'N/A'}
                                                        </span>
                                                        <span className="text-[8px] font-black text-slate-400 bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded uppercase">
                                                            {quote.customerProfile?.workIndustry || 'General'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="pt-3 border-t border-slate-100 dark:border-white/5">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-tight mb-1">
                                                        Work Location
                                                    </span>
                                                    <span className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase leading-relaxed">
                                                        {quote.customerProfile?.workAddress || 'N/A'}
                                                    </span>
                                                    {quote.customerProfile?.workPincode && (
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                                            PIN: {quote.customerProfile.workPincode}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Identity Vault (Documents) */}
                                {quote.customerProfile?.memberId && (
                                    <div className="mt-8 bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/10 rounded-[3rem] p-10 shadow-sm">
                                        <div className="mb-8 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
                                                    <ImageIcon size={24} />
                                                </div>
                                                <div>
                                                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                                        Identity <span className="text-indigo-600 italic">Vault</span>
                                                    </h2>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                        Media Manager & Document Studio
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="px-4 py-2 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/10">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                        Active Member
                                                    </span>
                                                    <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                                        {quote.customerProfile.fullName}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <MemberMediaManager
                                            memberId={quote.customerProfile.memberId}
                                            quoteId={quote.id}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'DYNAMIC' && (
                        <>
                            {/* 2. QUOTATION DETAILS PANEL (COLLAPSIBLE) */}
                            <div className="w-full px-4 pt-6">
                                <div className="bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/10 rounded-[2.5rem] shadow-2xl dark:shadow-none overflow-hidden mb-6">
                                    {/* Section Header - Collapsible Trigger */}
                                    <button
                                        onClick={() => setGroups(g => ({ ...g, pricing: !g.pricing }))}
                                        className="w-full px-8 py-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] flex items-center justify-between hover:bg-slate-100/50 dark:hover:bg-white/[0.02] transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
                                                <FileText size={16} />
                                            </div>
                                            <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                                                Line-Item <span className="opacity-50">Breakdown</span>
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-white/5 rounded-full border border-slate-100 dark:border-white/10 shadow-sm">
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                                <span className="text-[8px] font-black text-slate-500 dark:text-white/40 uppercase tracking-widest">
                                                    Active session
                                                </span>
                                            </div>
                                            {groups.pricing ? (
                                                <ChevronDown size={18} className="text-slate-400" />
                                            ) : (
                                                <ChevronRight size={18} className="text-slate-400" />
                                            )}
                                        </div>
                                    </button>

                                    {/* Line Items - Conditional Rendering */}
                                    {groups.pricing && (
                                        <div className="flex flex-col animate-in fade-in slide-in-from-top-2 duration-300">
                                            {/* Base Pricing Section */}
                                            <PricingRow
                                                isBold
                                                label="Ex-Showroom Price"
                                                value={formatCurrency(localPricing.exShowroom)}
                                            />
                                            <PricingRow
                                                isSub
                                                label="Registration (RTO)"
                                                value={formatCurrency(localPricing.rtoTotal)}
                                                description={
                                                    <div className="flex flex-col gap-3 mt-3">
                                                        <div className="flex gap-1.5">
                                                            {(['STATE', 'BH', 'COMPANY'] as const).map(type => (
                                                                <div
                                                                    key={type}
                                                                    className={cn(
                                                                        'px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all opacity-60 cursor-not-allowed',
                                                                        localPricing.rtoType === type
                                                                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                                                                            : 'bg-slate-100 dark:bg-white/5 text-slate-400'
                                                                    )}
                                                                >
                                                                    {type}
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-white/[0.02] rounded-xl border border-dashed border-slate-200 dark:border-white/10">
                                                            <Clock size={10} className="text-slate-400" />
                                                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">
                                                                Locked. Edit on Marketplace to change RTO type.
                                                            </span>
                                                        </div>
                                                    </div>
                                                }
                                            />

                                            {/* Insurance Group */}
                                            <PricingGroup
                                                title="Insurance Package"
                                                icon={CheckCircle2}
                                                total={formatCurrency(localPricing.insuranceTotal)}
                                                isExpanded={groups.insurance}
                                                onToggle={() => setGroups(g => ({ ...g, insurance: !g.insurance }))}
                                            >
                                                <PricingRow
                                                    isSub
                                                    label="Third Party (Basic)"
                                                    value={formatCurrency(localPricing.insuranceTP)}
                                                />
                                                <PricingRow
                                                    isSub
                                                    label="Own Damage (OD)"
                                                    value={formatCurrency(localPricing.insuranceOD)}
                                                />
                                                {localPricing.insuranceAddons.map(addon => (
                                                    <PricingRow
                                                        key={addon.id}
                                                        isSub
                                                        label={addon.name}
                                                        value={
                                                            addon.selected
                                                                ? formatCurrency(addon.amount)
                                                                : 'Not Selected'
                                                        }
                                                        extra={
                                                            <div className="flex items-center gap-2">
                                                                {addon.selected ? (
                                                                    <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded text-[8px] font-black uppercase tracking-widest">
                                                                        <CheckCircle2 size={10} /> Active
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-[8px] font-bold text-slate-400 uppercase">
                                                                        None
                                                                    </div>
                                                                )}
                                                            </div>
                                                        }
                                                    />
                                                ))}
                                                <PricingRow
                                                    isSub
                                                    label="GST (i18n Tax • 18%)"
                                                    value={formatCurrency(localPricing.insuranceGST)}
                                                />
                                            </PricingGroup>

                                            {/* Accessories Group */}
                                            <PricingGroup
                                                title="Authorized Accessories"
                                                icon={Bike}
                                                total={formatCurrency(localPricing.accessoriesTotal)}
                                                isExpanded={groups.accessories}
                                                onToggle={() => setGroups(g => ({ ...g, accessories: !g.accessories }))}
                                            >
                                                {localPricing.accessories.map(acc => (
                                                    <PricingRow
                                                        key={acc.id}
                                                        isSub
                                                        label={acc.name}
                                                        value={acc.selected ? formatCurrency(acc.price) : 'Excluded'}
                                                        extra={
                                                            <div className="flex items-center gap-2">
                                                                {acc.selected ? (
                                                                    <div className="flex items-center gap-1 px-2 py-0.5 bg-indigo-500/10 text-indigo-500 rounded text-[8px] font-black uppercase tracking-widest">
                                                                        <CheckCircle2 size={10} /> Selected
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-[8px] font-bold text-slate-400 uppercase">
                                                                        Excluded
                                                                    </div>
                                                                )}
                                                            </div>
                                                        }
                                                    />
                                                ))}
                                            </PricingGroup>

                                            {/* Discount Section */}
                                            <div className="bg-emerald-500/[0.03] dark:bg-emerald-500/[0.01]">
                                                <PricingRow
                                                    label="Dealer Discount"
                                                    value={formatCurrency(localPricing.dealerDiscount)}
                                                />
                                                <div className="py-6 px-8 bg-amber-500/[0.05] dark:bg-amber-500/[0.02]">
                                                    <div className="flex items-center justify-between group">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-tight">
                                                                Manager Discretionary
                                                            </span>
                                                            <span className="text-[9px] text-amber-500/60 font-medium">
                                                                Applied for special commercial sessions
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 bg-white dark:bg-white/5 rounded-xl border border-amber-200/50 dark:border-amber-500/20 p-2 shadow-sm transition-all focus-within:ring-2 focus-within:ring-amber-500/30">
                                                            <span className="text-xs font-black text-amber-600">
                                                                -₹
                                                            </span>
                                                            <input
                                                                type="number"
                                                                value={managerDiscountInput}
                                                                onChange={e => {
                                                                    setManagerDiscountInput(e.target.value);
                                                                    setHasChanges(true);
                                                                }}
                                                                className="w-24 bg-transparent text-right font-black text-amber-700 dark:text-amber-400 focus:outline-none placeholder-amber-200 text-sm"
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* MARKETPLACE REDIRECT (Instructional) */}
                                            <div
                                                className="px-8 py-6 bg-slate-50 dark:bg-white/[0.01] border-t border-slate-100 dark:border-white/5 flex items-center justify-between group cursor-pointer hover:bg-slate-100 dark:hover:bg-white/[0.02] transition-all"
                                                onClick={async () => {
                                                    const { getQuoteMarketplaceUrl } = await import('@/actions/crm');
                                                    const res = await getQuoteMarketplaceUrl(quote.id);
                                                    if (res.success && res.url) {
                                                        window.open(res.url, '_blank');
                                                    } else {
                                                        toast.error('Could not resolve marketplace link');
                                                    }
                                                }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
                                                        <Share2 size={14} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                                            Configuration Locked
                                                        </span>
                                                        <span className="text-[9px] text-slate-500 font-medium tracking-tight">
                                                            Click to modify vehicle, color, or addons on Marketplace
                                                        </span>
                                                    </div>
                                                </div>
                                                <ArrowRight
                                                    size={16}
                                                    className="text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-all transform group-hover:translate-x-1"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* FINAL TOTAL BAR (Only show if pricing or finance is expanded for context) */}
                                    {(groups.pricing || groups.finance) && (
                                        <div className="bg-slate-900 flex flex-col sm:flex-row items-center justify-between p-10 gap-8">
                                            <div className="flex flex-col gap-1 text-center sm:text-left">
                                                <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">
                                                    Net Payable Amount
                                                </span>
                                                <div className="text-4xl font-black text-white tracking-tighter tabular-nums">
                                                    {formatCurrency(localPricing.finalTotal)}
                                                </div>
                                                <div className="flex items-center gap-3 mt-1 justify-center sm:justify-start">
                                                    <div className="flex items-center gap-1 text-[9px] font-bold text-white/40 uppercase">
                                                        <CheckCircle2 size={10} className="text-emerald-500" /> On-Road
                                                        Total
                                                    </div>
                                                    <div className="w-1 h-1 rounded-full bg-white/10" />
                                                    <div className="flex items-center gap-1 text-[9px] font-bold text-white/40 uppercase">
                                                        <Clock size={10} className="text-indigo-500" /> 24h Validity
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                onClick={onSendToCustomer}
                                                className="bg-white hover:bg-slate-100 text-black rounded-xl px-8 h-12 text-xs font-black uppercase tracking-widest transition-all active:scale-95 whitespace-nowrap"
                                            >
                                                <Send size={16} className="mr-2" />
                                                Release Quote
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'TASKS' && (
                        <div className="p-6">
                            <div className="bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/10 rounded-[2rem] p-6">
                                <div className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">
                                    Tasks
                                </div>
                                {tasks.length === 0 ? (
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        No tasks yet
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {tasks.map(task => (
                                            <div
                                                key={task.id}
                                                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-white/10"
                                            >
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                        {task.title}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 uppercase tracking-widest">
                                                        {task.status}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {(['OPEN', 'IN_PROGRESS', 'DONE'] as const).map(status => (
                                                        <button
                                                            key={status}
                                                            onClick={() => handleTaskStatus(task.id, status)}
                                                            className="px-2 py-1 rounded-lg bg-slate-50 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900"
                                                        >
                                                            {status}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {activeTab === 'DOCUMENTS' && (
                        <div className="p-6">
                            <div className="bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/10 rounded-[2rem] p-6">
                                <MemberMediaManager
                                    memberId={quote.customer?.memberId || quote.customerProfile?.memberId || ''}
                                    tenantId={quote.tenantId}
                                    onUpdate={fetchDocuments}
                                    allowUpload={true}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'NOTES' && (
                        <div className="p-6">
                            <div className="bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/10 rounded-[2rem] p-6">
                                <div className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">
                                    Internal Notes
                                </div>
                                <textarea
                                    value={managerNote}
                                    onChange={e => {
                                        setManagerNote(e.target.value);
                                        setHasChanges(true);
                                    }}
                                    rows={6}
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                                    placeholder="Add internal notes..."
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'EVENTS' && (
                        <div className="p-6">
                            <div className="bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/10 rounded-[2rem] p-6">
                                <div className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6">
                                    Events
                                </div>
                                {quote.timeline.length === 0 ? (
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        No events
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {quote.timeline.map((event, idx) => (
                                            <div key={idx} className="flex items-start gap-3">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2" />
                                                <div>
                                                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                                                        {event.event}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400">
                                                        {formatDate(event.timestamp)}
                                                    </div>
                                                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                                                        <span>Who: {event.actor || 'System'}</span>
                                                        <span>What: {event.actorType || 'team'}</span>
                                                        {event.source && <span>From: {event.source}</span>}
                                                        {event.reason && <span>Why: {event.reason}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'TRANSACTIONS' && (
                        <div className="p-6">
                            <div className="bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/10 rounded-[2rem] p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="text-xs font-black uppercase tracking-widest text-slate-500">
                                        Transactions Timeline
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        Sequence View
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {transactions.map((item, index) => (
                                        <div
                                            key={item.key}
                                            className="rounded-2xl border border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] overflow-hidden"
                                        >
                                            <button
                                                onClick={() => setExpandedTransaction(item.key)}
                                                className={cn(
                                                    'w-full flex items-center justify-between px-5 py-4 transition-all',
                                                    expandedTransaction === item.key
                                                        ? 'bg-indigo-500/5'
                                                        : 'hover:bg-slate-100/60 dark:hover:bg-white/[0.03]'
                                                )}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                                            {item.label}
                                                        </div>
                                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                            {item.id ? item.id : 'Not Created Yet'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span
                                                        className={cn(
                                                            'px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest',
                                                            item.status === 'PENDING'
                                                                ? 'bg-slate-200 text-slate-500 dark:bg-white/10 dark:text-white/40'
                                                                : item.key === 'QUOTE'
                                                                  ? 'bg-emerald-500/10 text-emerald-600'
                                                                  : 'bg-indigo-500/10 text-indigo-600'
                                                        )}
                                                    >
                                                        {item.status}
                                                    </span>
                                                    <div
                                                        className={cn(
                                                            'text-[10px] font-black uppercase tracking-widest transition-transform',
                                                            expandedTransaction === item.key
                                                                ? 'text-indigo-600 rotate-90'
                                                                : 'text-slate-300'
                                                        )}
                                                    >
                                                        <ChevronRight size={12} />
                                                    </div>
                                                </div>
                                            </button>
                                            {expandedTransaction === item.key && (
                                                <div className="px-5 pb-4 pt-2 bg-white dark:bg-[#0b0d10] border-t border-slate-100 dark:border-white/10">
                                                    <div className="flex items-center justify-between">
                                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                            Details
                                                        </div>
                                                        {item.href ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    window.location.href = item.href as string;
                                                                }}
                                                                className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700"
                                                            >
                                                                Open {item.label}
                                                            </button>
                                                        ) : (
                                                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                                                                No Link
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                                        <div className="bg-slate-50 dark:bg-white/[0.03] rounded-xl px-3 py-2">
                                                            Stage: {item.label}
                                                        </div>
                                                        <div className="bg-slate-50 dark:bg-white/[0.03] rounded-xl px-3 py-2">
                                                            Status: {item.status}
                                                        </div>
                                                    </div>
                                                    {item.key === 'FINANCE' && (
                                                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-[10px] font-bold uppercase tracking-widest text-slate-600">
                                                            <div className="bg-slate-50 dark:bg-white/[0.03] rounded-xl px-3 py-2">
                                                                Bank: {quote.finance?.bankName || 'N/A'}
                                                            </div>
                                                            <div className="bg-slate-50 dark:bg-white/[0.03] rounded-xl px-3 py-2">
                                                                Scheme: {quote.finance?.schemeCode || 'N/A'}
                                                            </div>
                                                            <div className="bg-slate-50 dark:bg-white/[0.03] rounded-xl px-3 py-2">
                                                                Loan Amount:{' '}
                                                                {quote.finance?.loanAmount
                                                                    ? formatCurrency(quote.finance.loanAmount)
                                                                    : 'N/A'}
                                                            </div>
                                                            <div className="bg-slate-50 dark:bg-white/[0.03] rounded-xl px-3 py-2">
                                                                Down Payment:{' '}
                                                                {quote.finance?.downPayment
                                                                    ? formatCurrency(quote.finance.downPayment)
                                                                    : 'N/A'}
                                                            </div>
                                                            <div className="bg-slate-50 dark:bg-white/[0.03] rounded-xl px-3 py-2">
                                                                Tenure:{' '}
                                                                {quote.finance?.tenureMonths
                                                                    ? `${quote.finance.tenureMonths}M`
                                                                    : 'N/A'}
                                                            </div>
                                                            <div className="bg-slate-50 dark:bg-white/[0.03] rounded-xl px-3 py-2">
                                                                ROI:{' '}
                                                                {quote.finance?.roi ? `${quote.finance.roi}%` : 'N/A'}
                                                            </div>
                                                            <div className="bg-slate-50 dark:bg-white/[0.03] rounded-xl px-3 py-2">
                                                                EMI:{' '}
                                                                {quote.finance?.emi
                                                                    ? formatCurrency(quote.finance.emi)
                                                                    : 'N/A'}
                                                            </div>
                                                            <div className="bg-slate-50 dark:bg-white/[0.03] rounded-xl px-3 py-2">
                                                                Status Date:{' '}
                                                                {quote.updatedAt ? formatDate(quote.updatedAt) : 'N/A'}
                                                            </div>
                                                            <div className="bg-slate-50 dark:bg-white/[0.03] rounded-xl px-3 py-2">
                                                                Loan Status: {quote.finance?.status || 'PENDING'}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
