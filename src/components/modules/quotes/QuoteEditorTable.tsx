'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { SchemeCharge, BankScheme } from '@/types/bankPartner';
import { getBankSchemes } from '@/actions/crm';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { motion, AnimatePresence } from 'framer-motion';
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
    Wrench,
    BarChart3,
    Camera,
    Wallet,
    Check,
    Target,
    TrendingUp,
    XCircle,
    PlusCircle,
    ShieldCheck,
    Receipt,
    ShoppingBag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { updateTaskStatus, createTask, getTasksForEntity, getTeamMembersForTenant } from '@/actions/crm';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    updateMemberProfile,
    updateMemberAvatar,
    setQuoteFinanceMode,
    createQuoteFinanceAttempt,
    updateQuoteFinanceAttempt,
    setQuoteActiveFinanceAttempt,
    updateQuoteFinanceStatus,
    getDealershipInfo,
    getAlternativeRecommendations,
    getDealerships,
    reassignQuoteDealership,
    updateReceipt,
    reconcileReceipt,
} from '@/actions/crm';
import { updateFinanceStatus } from '@/actions/finance';
import { PremiumQuoteTemplate } from './PremiumQuoteTemplate';
import MemberMediaManager from './MemberMediaManager';
import { createClient } from '@/lib/supabase/client';
import { getProxiedUrl } from '@/lib/utils/urlHelper';
import { formatDisplayId } from '@/utils/displayId';
import jsPDF from 'jspdf';

/**
 * Utility for conditional class names
 */
function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}

const formatDate = (value?: string | null) => {
    if (!value) return '—';
    try {
        return new Date(value).toLocaleDateString();
    } catch {
        return value;
    }
};

const formatMoney = (value?: number | null) => {
    if (value === null || value === undefined) return '—';
    return `₹${Number(value).toLocaleString('en-IN')}`;
};

// ============================================================================
// TYPES
// ============================================================================

export interface QuoteData {
    id: string;
    displayId: string;
    status:
        | 'DRAFT'
        | 'IN_REVIEW'
        | 'APPROVED'
        | 'DENIED'
        | 'SENT'
        | 'CONFIRMED'
        | 'REJECTED'
        | 'CANCELED'
        | 'DELIVERED'
        | 'SUPERSEDED';
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
    tenantId?: string | null;
    financeMode?: 'CASH' | 'LOAN';
    delivery?: {
        serviceable?: boolean | null;
        pincode?: string | null;
        taluka?: string | null;
        district?: string | null;
        stateCode?: string | null;
        delivery_tat_days?: number | null;
        checked_at?: string | null;
    } | null;
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
        avatarUrl?: string | null;
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
        selection_logic?: string | null;
        scheme_interest_rate?: number | null;
        scheme_interest_type?: string | null;
        ltv?: number | null;
        roi?: number | null;
        tenureMonths?: number | null;
        downPayment?: number | null;
        loanAmount?: number | null;
        loanAddons?: number | null;
        processingFee?: number | null;
        chargesBreakup?: { label: string; amount: number; impact?: 'UPFRONT' | 'FUNDED' }[] | null;
        addonsBreakup?: { label: string; amount: number }[] | null;
        emi?: number | null;
        approvedAmount?: number | null;
        requiredAmount?: number | null;
        financeExecutive?: string | null;
        approvedTenure?: number | null;
        approvedEmi?: number | null;
        approvedScheme?: string | null;
        approvedProcessingFee?: number | null;
        approvedAddOns?: number | null;
        approvedDownPayment?: number | null;
        approvedMarginMoney?: number | null;
        approvedGrossLoan?: number | null;
        approvedIrr?: number | null;
        approvedChargesBreakup?: { label: string; amount: number; impact?: 'UPFRONT' | 'FUNDED' }[] | null;
        approvedAddonsBreakup?: { label: string; amount: number; impact?: 'UPFRONT' | 'FUNDED' }[] | null;
        bankLogo?: string | null;
        companyName?: string | null;
        branchName?: string | null;
        executiveName?: string | null;
        executivePhone?: string | null;
        creditScore?: string | number | null;
    };
    financeAttempts?: {
        id: string;
        status: 'IN_PROCESS' | 'UNDERWRITING' | 'DOC_PENDING' | 'APPROVED' | 'REJECTED';
        bankId?: string | null;
        bankName?: string | null;
        schemeId?: string | null;
        schemeCode?: string | null;
        roi?: number | null;
        tenureMonths?: number | null;
        downPayment?: number | null;
        loanAmount?: number | null;
        loanAddons?: number | null;
        processingFee?: number | null;
        chargesBreakup?: { label: string; amount: number; impact?: 'UPFRONT' | 'FUNDED' }[] | null;
        emi?: number | null;
        createdAt?: string | null;
    }[];

    customer: {
        name: string;
        phone: string;
        email?: string | null;
        memberId?: string | null;
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
        exShowroomGstRate?: number;
        rtoType: 'STATE' | 'BH' | 'COMPANY';
        rtoBreakdown: { label: string; amount: number }[];
        rtoTotal: number;
        insuranceOD: number;
        insuranceTP: number;
        insuranceAddons: {
            id: string;
            name: string;
            amount: number;
            basePrice?: number;
            discountPrice?: number | null;
            selected: boolean;
            breakdown?: any;
        }[];
        insuranceGST: number;
        insuranceTotal: number;
        insuranceProvider?: string | null;
        insuranceGstRate: number;
        accessories: {
            id: string;
            name: string;
            price: number;
            basePrice?: number;
            discountPrice?: number | null;
            qty?: number;
            selected: boolean;
        }[];
        accessoriesTotal: number;
        services: {
            id: string;
            name: string;
            price: number;
            basePrice?: number;
            discountPrice?: number | null;
            qty?: number;
            selected: boolean;
        }[];
        servicesTotal: number;
        dealerDiscount: number;
        colorDelta?: number;
        offersDelta?: number;
        managerDiscount: number;
        managerDiscountNote?: string | null;
        onRoadTotal: number;
        finalTotal: number;
        rtoOptions?: any[];
        insuranceRequiredItems?: any[];
        offersItems?: any[];
        warrantyItems?: any[];
        referralApplied?: boolean;
        referralBonus?: number;
    };
    timeline: {
        event: string;
        timestamp: string;
        actor?: string | null;
        actorType?: 'customer' | 'team';
        actorOrg?: string | null;
        actorDesignation?: string | null;
        source?: string | null;
        reason?: string | null;
    }[];
}

interface QuoteEditorTableProps {
    quote: QuoteData;
    tasks?: any[];
    relatedQuotes?: {
        id: string;
        displayId: string;
        status?: string | null;
        createdAt?: string | null;
        onRoadPrice?: string | number | null;
        createdBy?: string | null;
        vehicleName?: string | null;
        vehicleColor?: string | null;
    }[];
    bookings?: any[];
    payments?: any[];
    onSave: (data: Partial<QuoteData>) => Promise<void>;
    onSendToCustomer: () => Promise<void>;
    onConfirmBooking: () => Promise<void>;
    onRefresh?: () => void;
    isEditable?: boolean;
    mode?: 'quote' | 'booking' | 'receipt';
    dynamicTabLabel?: string;
    defaultTab?: 'DYNAMIC' | 'FINANCE' | 'MEMBER' | 'TASKS' | 'DOCUMENTS' | 'TIMELINE' | 'NOTES' | 'HISTORY';
    booking?: {
        id?: string | null;
        status?: string | null;
        payment_status?: string | null;
        finance_status?: string | null;
        delivery_status?: string | null;
        registration_number?: string | null;
        booking_amount_received?: number | null;
        current_stage?: string | null;
        created_at?: string | null;
        updated_at?: string | null;
        allotment_status?: string | null;
        pdi_status?: string | null;
        insurance_status?: string | null;
        registration_status?: string | null;
    } | null;
    bookingFinanceApps?: any[];
    receipt?: {
        id?: string | null;
        booking_id?: string | null;
        lead_id?: string | null;
        member_id?: string | null;
        tenant_id?: string | null;
        amount?: number | null;
        currency?: string | null;
        method?: string | null;
        status?: string | null;
        transaction_id?: string | null;
        provider_data?: any;
        is_reconciled?: boolean | null;
        reconciled_at?: string | null;
    } | null;
    resolvedRoute?: {
        strategy: string;
        partnerId: string | null;
        partnerName: string | null;
        scheme: any | null;
        allSchemes: any[];
        reason: string;
    } | null;
}

type QuoteChange = {
    key: string;
    label: string;
    oldValue: string;
    newValue: string;
    isManagerOnly?: boolean;
};

// ============================================================================
// STATUS CONFIG
// ============================================================================

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string; icon: any }> = {
    DRAFT: { color: 'text-slate-600', bg: 'bg-slate-100 dark:bg-slate-800', label: 'Draft', icon: FileText },
    IN_REVIEW: {
        color: 'text-amber-600',
        bg: 'bg-amber-100 dark:bg-amber-900/30',
        label: 'In Review',
        icon: Clock,
    },
    SENT: { color: 'text-indigo-600', bg: 'bg-indigo-100 dark:bg-indigo-900/30', label: 'Sent', icon: Send },
    APPROVED: {
        color: 'text-green-600',
        bg: 'bg-green-100 dark:bg-green-900/30',
        label: 'Approved',
        icon: CheckCircle2,
    },
    DENIED: { color: 'text-rose-600', bg: 'bg-rose-100 dark:bg-rose-900/30', label: 'Denied', icon: X },
    CONFIRMED: {
        color: 'text-emerald-600',
        bg: 'bg-emerald-100 dark:bg-emerald-900/30',
        label: 'Confirmed',
        icon: CheckCircle2,
    },
    REJECTED: { color: 'text-rose-600', bg: 'bg-rose-100 dark:bg-rose-900/30', label: 'Rejected', icon: X },
    CANCELED: { color: 'text-rose-600', bg: 'bg-rose-100 dark:bg-rose-900/30', label: 'Canceled', icon: X },
    DELIVERED: { color: 'text-teal-600', bg: 'bg-teal-100 dark:bg-teal-900/30', label: 'Delivered', icon: Bike },
    SUPERSEDED: {
        color: 'text-slate-500',
        bg: 'bg-slate-100 dark:bg-slate-800',
        label: 'Superseded',
        icon: X,
    },
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
    label: React.ReactNode;
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
    title: React.ReactNode;
    icon: any;
    total: React.ReactNode;
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

const TransactionSection = ({
    title,
    count,
    expanded,
    onToggle,
    children,
}: {
    title: string;
    count: number;
    expanded: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}) => (
    <div className="border-b border-slate-100 dark:border-white/5 last:border-b-0">
        <div
            className={cn(
                'flex items-center justify-between px-4 sm:px-6 py-2.5 transition-colors',
                expanded
                    ? 'bg-slate-50 dark:bg-white/[0.04] border-b border-slate-100 dark:border-white/5'
                    : 'hover:bg-slate-50/50 dark:hover:bg-white/[0.02]'
            )}
        >
            <button key="toggle-btn" onClick={onToggle} className="flex items-center gap-3">
                <div className={cn('transition-transform duration-200', expanded ? 'rotate-90' : 'rotate-0')}>
                    <ChevronRight size={14} className="text-slate-400 group-hover:text-slate-600" />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">
                        {title}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-[8px] font-black text-slate-500">
                        {count}
                    </span>
                </div>
            </button>
            <div className="flex items-center gap-4">
                <button
                    key="new-btn"
                    className="text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 px-3 py-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                >
                    <Plus size={10} /> New
                </button>
            </div>
        </div>
        <AnimatePresence>
            {expanded && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                >
                    <div className="px-6 pb-6 pt-4">{children}</div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
);

const AlternativeBikesSection = ({ recommendations }: { recommendations: any[] }) => {
    if (!recommendations || recommendations.length === 0) return null;

    return (
        <div className="mx-8 mb-8 p-8 bg-slate-50 dark:bg-white/[0.02] rounded-[2.5rem] border border-slate-100 dark:border-white/10">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                    <Target size={16} />
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                        Smart Recommendations
                    </span>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white italic uppercase tracking-tight">
                        Alternative <span className="opacity-50">Configurations</span>
                    </h3>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recommendations.map(bike => (
                    <div
                        key={bike.id}
                        className="bg-white dark:bg-[#0b0d10] p-4 rounded-3xl border border-slate-100 dark:border-white/5 hover:border-indigo-500/30 transition-all group cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1"
                    >
                        <div className="aspect-[4/3] rounded-2xl bg-slate-50 dark:bg-white/5 mb-4 overflow-hidden relative">
                            {bike.image ? (
                                <img
                                    src={getProxiedUrl(bike.image)}
                                    alt={bike.name}
                                    className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-200">
                                    <Bike size={32} />
                                </div>
                            )}
                            <div className="absolute top-2 right-2 px-2 py-1 bg-white/90 dark:bg-black/50 backdrop-blur-md rounded-lg text-[9px] font-black text-slate-900 dark:text-white">
                                ₹{bike.price?.toLocaleString()}
                            </div>
                        </div>
                        <h4 className="text-xs font-black text-slate-900 dark:text-white truncate uppercase tracking-tight">
                            {bike.brand} {bike.name}
                        </h4>
                        <div className="mt-3 flex items-center justify-between">
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                Compare now
                            </span>
                            <div className="w-6 h-6 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                <ArrowRight size={10} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Helper for bank initials
const getBankInitials = (name: string) => {
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function QuoteEditorTable({
    quote,
    tasks = [],
    relatedQuotes = [],
    bookings = [],
    payments = [],
    onSave,
    onSendToCustomer,
    onConfirmBooking,
    onRefresh,
    isEditable = true,
    mode = 'quote',
    dynamicTabLabel: dynamicTabLabelProp,
    defaultTab = 'DYNAMIC',
    booking = null,
    bookingFinanceApps = [],
    receipt = null,
    resolvedRoute = null,
}: QuoteEditorTableProps) {
    const [localPricing, setLocalPricing] = useState(quote.pricing);
    const [managerDiscountInput, setManagerDiscountInput] = useState(
        Math.abs(quote.pricing.managerDiscount).toString()
    );
    const [managerNote, setManagerNote] = useState(quote.pricing.managerDiscountNote || '');
    const [isSaving, setIsSaving] = useState(false);
    const [dealerInfo, setDealerInfo] = useState<any>(null);
    const [alternativeBikes, setAlternativeBikes] = useState<any[]>([]);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [qrCodes, setQrCodes] = useState({ bookNow: '', viewQuote: '' });

    // Pre-fetch dealer and alternatives
    useEffect(() => {
        if (quote.tenantId) {
            getDealershipInfo(quote.tenantId).then(setDealerInfo);
        }
        if (quote.vehicle?.skuId) {
            getAlternativeRecommendations(quote.vehicle.skuId).then(setAlternativeBikes);
        }
    }, [quote.tenantId, quote.vehicle?.skuId]);

    // Dealer reassignment
    const [dealerList, setDealerList] = useState<
        { id: string; name: string; location: string; studioId: string | null }[]
    >([]);
    const [dealerDropdownOpen, setDealerDropdownOpen] = useState(false);
    const [dealerSearchQuery, setDealerSearchQuery] = useState('');
    const [isReassigningDealer, setIsReassigningDealer] = useState(false);

    useEffect(() => {
        getDealerships().then(setDealerList);
    }, []);
    const [hasChanges, setHasChanges] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const [groups, setGroups] = useState({
        exShowroom: true,
        registration: true,
        insurance: false,
        accessories: false,
        services: false,
        pricing: true, // New Toggle for Line-Item Breakdown
        finance: true, // New Toggle for Finance Section
        transactionQuotes: true,
        transactionBookings: false,
        transactionPayments: false,
    });

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

    // Recalculation engine
    useEffect(() => {
        const accessoriesTotal = localPricing.accessories
            .filter(a => a.selected)
            .reduce((sum, a) => sum + a.price * (a.qty || 1), 0);
        const servicesTotal = (localPricing.services || [])
            .filter((s: any) => s.selected)
            .reduce((sum: number, s: any) => sum + s.price * (s.qty || 1), 0);
        const insuranceAddonsTotal = localPricing.insuranceAddons
            .filter(a => a.selected)
            .reduce((sum, a) => sum + a.amount, 0);
        const gstRate = localPricing.insuranceGstRate || 18;
        const insuranceBase = localPricing.insuranceOD + localPricing.insuranceTP + insuranceAddonsTotal;
        const insuranceGST = Math.round(insuranceBase * (gstRate / 100));
        const insuranceTotal = insuranceBase + insuranceGST;

        const subtotal =
            localPricing.exShowroom + localPricing.rtoTotal + insuranceTotal + accessoriesTotal + servicesTotal;
        const colorDelta = Number(localPricing.colorDelta || 0);
        const offersDelta = Number(localPricing.offersDelta || 0);
        const dealerDiscount = Number(localPricing.dealerDiscount || 0);
        const managerDiscount = parseFloat(managerDiscountInput) || 0;
        const finalTotal = subtotal + colorDelta + offersDelta + dealerDiscount - Math.abs(managerDiscount);

        setLocalPricing(prev => ({
            ...prev,
            accessoriesTotal,
            servicesTotal,
            insuranceGST,
            insuranceTotal,
            onRoadTotal: subtotal + colorDelta + offersDelta + dealerDiscount,
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
        localPricing.services,
        localPricing.colorDelta,
        localPricing.offersDelta,
        localPricing.dealerDiscount,
        managerDiscountInput,
    ]);

    const [pendingChanges, setPendingChanges] = useState<QuoteChange[]>([]);
    const [pendingPayload, setPendingPayload] = useState<Partial<QuoteData> | null>(null);
    const [activeTab, setActiveTab] = useState<
        'DYNAMIC' | 'FINANCE' | 'MEMBER' | 'TASKS' | 'DOCUMENTS' | 'TIMELINE' | 'NOTES' | 'HISTORY'
    >(defaultTab);
    const [financeMode, setFinanceMode] = useState<'CASH' | 'LOAN'>(quote.financeMode || 'CASH');
    const [docCount, setDocCount] = useState(0);

    useEffect(() => {
        setActiveTab(defaultTab);
    }, [defaultTab]);

    const [receiptDraft, setReceiptDraft] = useState<any | null>(null);
    const [receiptSaving, setReceiptSaving] = useState(false);

    useEffect(() => {
        if (receipt) {
            setReceiptDraft({
                amount: receipt.amount ?? 0,
                currency: receipt.currency || 'INR',
                method: receipt.method || '',
                status: receipt.status || '',
                transaction_id: receipt.transaction_id || '',
            });
        }
    }, [receipt?.id]);

    const activeBookingFinance = useMemo(() => {
        if (!bookingFinanceApps || bookingFinanceApps.length === 0) return null;
        return bookingFinanceApps.find((a: any) => a.is_active_closing) || bookingFinanceApps[0] || null;
    }, [bookingFinanceApps]);

    const [bookingFinanceState, setBookingFinanceState] = useState<any | null>(null);

    useEffect(() => {
        setBookingFinanceState(activeBookingFinance);
    }, [activeBookingFinance?.id]);

    const handleFinanceOpToggle = async (field: string) => {
        if (!activeBookingFinance?.id) {
            toast.error('No active finance application');
            return;
        }
        const nextValue = bookingFinanceState?.[field] ? null : new Date().toISOString();
        try {
            await updateFinanceStatus(activeBookingFinance.id, { [field]: nextValue } as any);
            setBookingFinanceState((prev: any) => ({
                ...(prev || {}),
                [field]: nextValue,
            }));
            toast.success('Finance milestone updated');
        } catch (err: any) {
            toast.error(err?.message || 'Failed to update');
        }
    };

    const handleReceiptSave = async () => {
        if (!receipt?.id || !receiptDraft) return;
        if (receipt?.is_reconciled) {
            toast.error('Receipt is reconciled');
            return;
        }
        setReceiptSaving(true);
        const res = await updateReceipt(receipt.id, {
            amount: Number(receiptDraft.amount || 0),
            currency: receiptDraft.currency || 'INR',
            method: receiptDraft.method || null,
            status: receiptDraft.status || null,
            transaction_id: receiptDraft.transaction_id || null,
        });
        setReceiptSaving(false);
        if (res.success) {
            toast.success('Receipt updated');
        } else {
            toast.error(res.error || 'Failed');
        }
    };

    const handleReceiptReconcile = async () => {
        if (!receipt?.id) return;
        const res = await reconcileReceipt(receipt.id);
        if (res.success) {
            toast.success('Receipt reconciled');
            onRefresh?.();
        } else {
            toast.error(res.error || 'Failed');
        }
    };

    // Local task state for live refresh
    const [localTasks, setLocalTasks] = useState<any[]>(tasks);
    const [teamMembers, setTeamMembers] = useState<{ id: string; name: string; role: string }[]>([]);
    const [selectedAssignee, setSelectedAssignee] = useState<string>('');
    const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);

    const handleShareDossier = async () => {
        if (!quote) return;
        const baseUrl = window.location.origin;
        const dossierUrl = `${baseUrl}/q/${quote.displayId || formatDisplayId(quote.id)}`;

        try {
            await navigator.clipboard.writeText(dossierUrl);
            toast.success('Dossier link copied to clipboard');
            window.open(dossierUrl, '_blank');
        } catch (err) {
            console.error('Failed to copy link:', err);
            toast.error('Failed to copy link');
        }
    };
    const handleDownload = async () => {
        if (!quote) return;
        setPdfLoading(true);
        try {
            const baseUrl = window.location.origin;
            const dossierUrl = `${baseUrl}/q/${quote.displayId || formatDisplayId(quote.id)}`;
            window.open(dossierUrl, '_blank');
            toast.success('Opened dossier');
        } catch (error) {
            console.error('Open dossier error:', error);
            toast.error('Failed to open dossier');
        } finally {
            setPdfLoading(false);
        }
    };

    const refreshTasks = async () => {
        const fresh = await getTasksForEntity('QUOTE', quote.id);
        setLocalTasks(fresh || []);
    };

    useEffect(() => {
        setLocalTasks(tasks);
    }, [tasks]);

    useEffect(() => {
        if (quote.tenantId) {
            getTeamMembersForTenant(quote.tenantId).then(members => {
                setTeamMembers(members as any[]);
            });
        }
    }, [quote.tenantId]);

    // Profile Editing State
    const [isEditingProfile, setIsEditingProfile] = useState<string | null>(null);
    const [profileDraft, setProfileDraft] = useState<any>({
        ...quote.customerProfile,
        fullName: quote.customer?.name || quote.customerProfile?.fullName,
    });
    const [isResolvingPincode, setIsResolvingPincode] = useState(false);

    // Finance Editing State
    const [isPrimaryFinanceExpanded, setIsPrimaryFinanceExpanded] = useState(false);
    const [creditScore, setCreditScore] = useState<string>(
        quote.finance?.creditScore ? String(quote.finance.creditScore) : '-1'
    );
    const [financeEntries, setFinanceEntries] = useState<
        {
            id: string;
            bankName: string;
            bankId: string;
            loanAmount: string;
            downPayment: string;
            tenure: string;
            roi: string;
            emi: string;
            processingFee: string;
            status: string;
            executiveName: string;
            assetCost: string;
            accessoriesCharges: string;
            offerDiscount: string;
            totalPayable: string;
            finalAmountPayable: string;
            loanAddOns: string;
            grossLoanAmount: string;
            marginMoney: string;
            schemeName: string;
            schemeId: string;
            isExpanded: boolean;
            locked: boolean;
            upfrontCharges: SchemeCharge[];
            fundedAddons: SchemeCharge[];
            selectedScheme: BankScheme | null;
            persisted: boolean;
        }[]
    >([]);
    const [newEntryExpandedMap, setNewEntryExpandedMap] = useState<Record<string, boolean>>({});
    const [availableBanks, setAvailableBanks] = useState<{ id: string; name: string }[]>([]);
    const [bankSchemesCache, setBankSchemesCache] = useState<Record<string, BankScheme[]>>({});
    const [bankTeamCache, setBankTeamCache] = useState<Record<string, { id: string; name: string; role: string }[]>>(
        {}
    );

    useEffect(() => {
        const attempts = quote.financeAttempts || [];
        const primaryId = quote.finance?.id || null;
        const mapped = attempts.map(a => ({
            id: a.id,
            bankName: a.bankName || '',
            bankId: a.bankId || '',
            loanAmount: String(a.loanAmount ?? ''),
            downPayment: String(a.downPayment ?? ''),
            tenure: String(a.tenureMonths ?? ''),
            roi: String(a.roi ?? ''),
            emi: String(a.emi ?? ''),
            processingFee: String(a.processingFee ?? ''),
            status: a.status || 'IN_PROCESS',
            executiveName: '',
            assetCost: String(localPricing.finalTotal || 0),
            accessoriesCharges: '0',
            offerDiscount: '0',
            totalPayable: String(localPricing.finalTotal || 0),
            finalAmountPayable: String(localPricing.finalTotal || 0),
            loanAddOns: String(a.loanAddons ?? ''),
            grossLoanAmount: '0',
            marginMoney: String(a.downPayment ?? ''),
            schemeName: a.schemeCode || '',
            schemeId: a.schemeId || '',
            isExpanded: true,
            locked: true,
            upfrontCharges: [],
            fundedAddons: [],
            selectedScheme: null,
            persisted: true,
        }));

        setFinanceEntries(prev => {
            const drafts = prev.filter(e => !e.persisted);
            return [...mapped, ...drafts].filter(e => e.id !== primaryId);
        });
    }, [quote.financeAttempts, quote.finance?.id, localPricing.finalTotal]);

    // Fetch team members for a selected bank (financier)
    const fetchBankTeam = async (bankId: string) => {
        if (!bankId || bankTeamCache[bankId]) return;
        const members = await getTeamMembersForTenant(bankId);
        setBankTeamCache(prev => ({ ...prev, [bankId]: (members as any[]) || [] }));
    };

    const getBankTeam = (bankId: string) => bankTeamCache[bankId] || [];

    // Fetch available financiers/banks
    useEffect(() => {
        const fetchBanks = async () => {
            const supabase = createClient();
            const { data } = await supabase
                .from('id_tenants')
                .select('id, name')
                .eq('type', 'BANK')
                .order('name', { ascending: true });
            if (data) setAvailableBanks(data);
        };
        fetchBanks();
    }, []);
    const [isEditingFinance, setIsEditingFinance] = useState(false);
    const [financeDraft, setFinanceDraft] = useState<Partial<NonNullable<QuoteData['finance']>>>({
        ...quote.finance,
        approvedAmount: quote.finance?.approvedAmount || 0,
        requiredAmount:
            quote.finance?.requiredAmount ||
            localPricing.finalTotal - (quote.finance?.downPayment || 0) + (quote.finance?.processingFee || 0),
        financeExecutive: quote.finance?.financeExecutive || '',
        approvedTenure: quote.finance?.approvedTenure || quote.finance?.tenureMonths || 0,
        approvedEmi: quote.finance?.approvedEmi || quote.finance?.emi || 0,
        approvedScheme: quote.finance?.approvedScheme || quote.finance?.schemeCode || '',
        approvedProcessingFee: quote.finance?.approvedProcessingFee || quote.finance?.processingFee || 0,
        approvedAddOns: quote.finance?.approvedAddOns || quote.finance?.loanAddons || 0,
        approvedDownPayment: quote.finance?.approvedDownPayment || quote.finance?.downPayment || 0,
        approvedMarginMoney: quote.finance?.approvedMarginMoney || 0,
        approvedGrossLoan:
            quote.finance?.approvedGrossLoan ||
            (quote.finance?.approvedAmount || 0) + (quote.finance?.approvedAddOns || 0),
        approvedIrr: quote.finance?.approvedIrr || quote.finance?.roi || 0,
        approvedChargesBreakup: quote.finance?.approvedChargesBreakup || quote.finance?.chargesBreakup || [],
        approvedAddonsBreakup: quote.finance?.approvedAddonsBreakup || quote.finance?.addonsBreakup || [],
    });

    const calculateRequired = (dp: number, fee: number) => {
        return localPricing.finalTotal - dp + fee;
    };

    // Avatar State
    const [memberAvatarUrl, setMemberAvatarUrl] = useState<string | null>(quote.customerProfile?.avatarUrl || null);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    const supabase = createClient();
    const params = useParams();
    const router = useRouter();
    const slug = typeof params?.slug === 'string' ? params.slug : Array.isArray(params?.slug) ? params.slug[0] : '';
    const { device } = useBreakpoint();
    const isPhone = device === 'phone';
    const dynamicTabLabel = dynamicTabLabelProp || (mode === 'booking' ? 'BOOKING DETAILS' : 'QUOTE');

    // Avatar Upload Handler
    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        const memberId = quote.customerProfile?.memberId;
        if (!file || !memberId) {
            toast.error('No member linked to this quote');
            return;
        }
        try {
            setAvatarUploading(true);
            const fileExt = file.name.split('.').pop();
            const filePath = `${memberId}/avatar_${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage.from('users').upload(filePath, file);
            if (uploadError) throw uploadError;

            const {
                data: { publicUrl },
            } = supabase.storage.from('users').getPublicUrl(filePath);

            // Sync to both id_members and auth
            const res = await updateMemberAvatar(memberId, publicUrl);
            if (res.success) {
                setMemberAvatarUrl(publicUrl);
                toast.success('Member photo updated');
            } else {
                toast.error('Failed to update avatar');
            }
        } catch (err) {
            console.error('Avatar upload error:', err);
            toast.error('Upload failed');
        } finally {
            setAvatarUploading(false);
            if (avatarInputRef.current) avatarInputRef.current.value = '';
        }
    };

    const statusConfig = STATUS_CONFIG[quote.status] || STATUS_CONFIG.DRAFT;

    const formatDate = (value?: string | null) => {
        if (!value) return '—';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return '—';
        return d.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    };
    const customerName = quote.customer?.name || 'Customer';
    const primaryPhone =
        quote.customerProfile?.primaryPhone || quote.customer?.phone || quote.customerProfile?.whatsapp || '';
    const phoneDigits = primaryPhone ? primaryPhone.replace(/\D/g, '') : '';
    const waPhone = phoneDigits ? (phoneDigits.startsWith('91') ? phoneDigits : `91${phoneDigits}`) : '';

    const PhoneSection = ({
        title,
        defaultOpen = false,
        count,
        children,
    }: {
        title: string;
        defaultOpen?: boolean;
        count?: number;
        children: React.ReactNode;
    }) => {
        const [open, setOpen] = useState(defaultOpen);
        return (
            <div className="border-b border-slate-100 dark:border-white/5">
                <button
                    onClick={() => setOpen(!open)}
                    data-crm-allow
                    className="w-full flex items-center justify-between px-3 py-3 active:bg-slate-50 dark:active:bg-white/5 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <ChevronRight
                            size={14}
                            className={cn('text-slate-400 transition-transform duration-200', open && 'rotate-90')}
                        />
                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-700 dark:text-slate-200">
                            {title}
                        </span>
                        {count !== undefined && count > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-[8px] font-black text-indigo-600">
                                {count}
                            </span>
                        )}
                    </div>
                    <ChevronDown
                        size={14}
                        className={cn('text-slate-300 transition-transform duration-200', open && 'rotate-180')}
                    />
                </button>
                <AnimatePresence>
                    {open && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="px-3 pb-3">{children}</div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    if (isPhone) {
        const transactionCount = relatedQuotes.length + bookings.length + payments.length;
        const financeCount = financeEntries.length;
        return (
            <div className="h-full flex flex-col bg-white dark:bg-[#0b0d10]">
                <div className="px-3 pt-1 pb-3 space-y-2.5">
                    <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-base font-black shadow-lg shrink-0">
                            {customerName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white truncate">
                                    {customerName}
                                </h1>
                                <span
                                    className={cn(
                                        'px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest shrink-0',
                                        statusConfig.color
                                    )}
                                >
                                    {statusConfig.label}
                                </span>
                            </div>
                            {primaryPhone && (
                                <div className="flex items-center gap-1.5 mt-0.5 text-indigo-600">
                                    <Phone size={11} />
                                    <span className="text-[11px] font-black tracking-wide">{primaryPhone}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 mt-0.5 text-[9px] text-slate-400 font-bold flex-wrap">
                                <span className="font-black uppercase tracking-widest">
                                    {formatDisplayId(quote.displayId || quote.id)}
                                </span>
                                <span>•</span>
                                <span>{formatDate(quote.createdAt)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-black italic uppercase tracking-tighter text-slate-900 dark:text-white whitespace-nowrap">
                            ₹{Number(localPricing.finalTotal || 0).toLocaleString('en-IN')}
                        </span>
                        <div className="flex items-center gap-1 h-7 px-2 rounded-lg text-[8px] font-black uppercase tracking-wider bg-slate-900 text-white">
                            <statusConfig.icon size={12} />
                            {statusConfig.label}
                        </div>
                    </div>

                    <div className="flex gap-1.5">
                        {phoneDigits && (
                            <a
                                href={`tel:${phoneDigits}`}
                                className="flex-1 flex items-center justify-center gap-1 py-2 bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest active:scale-95 transition-transform"
                            >
                                <Phone size={13} /> Call
                            </a>
                        )}
                        {waPhone && (
                            <a
                                href={`https://wa.me/${waPhone}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-1 py-2 bg-[#25D366] text-white rounded-lg text-[9px] font-black uppercase tracking-widest active:scale-95 transition-transform"
                            >
                                💬 WhatsApp
                            </a>
                        )}
                        <button
                            onClick={handleShareDossier}
                            className="flex-1 flex items-center justify-center gap-1 py-2 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest active:scale-95 transition-transform"
                        >
                            <FileText size={13} /> Dossier
                        </button>
                    </div>
                </div>

                <div
                    className="flex-1 overflow-y-auto no-scrollbar bg-slate-50/80 dark:bg-slate-950 border-t border-slate-200 dark:border-white/5"
                    style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
                >
                    <PhoneSection title="Quote" defaultOpen={mode !== 'receipt'}>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-14 h-10 bg-slate-100 dark:bg-white/5 rounded-lg overflow-hidden flex items-center justify-center text-[10px] font-black text-slate-400">
                                    {quote.vehicle?.imageUrl ? (
                                        <img
                                            src={quote.vehicle.imageUrl}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        'VEHICLE'
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="text-[11px] font-black uppercase tracking-tight text-slate-900 dark:text-white truncate">
                                        {quote.vehicle?.brand} {quote.vehicle?.model}
                                    </div>
                                    <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider truncate">
                                        {quote.vehicle?.variant} • {quote.vehicle?.color}
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-lg p-2.5">
                                    <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                                        Final Price
                                    </div>
                                    <div className="text-[11px] font-black text-slate-900 dark:text-white">
                                        ₹{Number(localPricing.finalTotal || 0).toLocaleString('en-IN')}
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-lg p-2.5">
                                    <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                                        Ex-Showroom
                                    </div>
                                    <div className="text-[11px] font-black text-slate-900 dark:text-white">
                                        ₹{Number(localPricing.exShowroom || 0).toLocaleString('en-IN')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </PhoneSection>

                    {mode === 'receipt' && receipt && (
                        <PhoneSection title="Receipt Details" defaultOpen>
                            <div className="space-y-4 pt-2">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                            Amount
                                        </div>
                                        <div className="text-[13px] font-black text-emerald-600 italic">
                                            ₹{(receiptDraft?.amount || receipt.amount || 0).toLocaleString('en-IN')}
                                        </div>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                            Status
                                        </div>
                                        <div>
                                            <span
                                                className={cn(
                                                    'px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border',
                                                    (receiptDraft?.status || receipt.status) === 'success' ||
                                                        (receiptDraft?.status || receipt.status) === 'captured'
                                                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                                        : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                                )}
                                            >
                                                {receiptDraft?.status || receipt.status || 'PENDING'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3 pt-3 border-t border-slate-50 dark:border-white/5">
                                    <div className="flex items-center justify-between">
                                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                            Method
                                        </div>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">
                                            {receiptDraft?.method || receipt.method || '—'}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                            Trans. ID
                                        </div>
                                        <div className="text-[10px] font-mono font-bold text-slate-500 truncate max-w-[140px]">
                                            {receiptDraft?.transaction_id || receipt.transaction_id || '—'}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                            Reconciled
                                        </div>
                                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-900 dark:text-white">
                                            {receipt.is_reconciled ? 'YES' : 'NO'}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2 flex gap-2">
                                    <button
                                        onClick={handleReceiptSave}
                                        disabled={receiptSaving || !!receipt.is_reconciled}
                                        className="flex-1 h-9 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-black/10 disabled:opacity-50"
                                    >
                                        {receiptSaving ? 'Saving...' : 'Save'}
                                    </button>
                                    <button
                                        onClick={handleReceiptReconcile}
                                        disabled={!!receipt.is_reconciled}
                                        className="flex-1 h-9 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                                    >
                                        Reconcile
                                    </button>
                                </div>
                            </div>
                        </PhoneSection>
                    )}

                    <PhoneSection title="Finance" count={financeCount}>
                        {financeEntries.length === 0 ? (
                            <div className="text-[10px] text-slate-400 font-bold py-2">No finance entries</div>
                        ) : (
                            <div className="space-y-2">
                                {financeEntries.map(entry => (
                                    <div
                                        key={entry.id}
                                        className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-lg p-2"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">
                                                {entry.bankName || 'Finance'}
                                            </span>
                                            <span className="text-[8px] font-black uppercase tracking-widest text-amber-600">
                                                {entry.status || 'IN_PROCESS'}
                                            </span>
                                        </div>
                                        <div className="text-[9px] text-slate-500 font-bold">
                                            EMI: ₹{Number(entry.emi || 0).toLocaleString('en-IN')} • Tenure:{' '}
                                            {entry.tenure || 0}M
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </PhoneSection>

                    <PhoneSection title="Transactions" count={transactionCount}>
                        {transactionCount === 0 ? (
                            <div className="text-[10px] text-slate-400 font-bold py-2">No linked activity</div>
                        ) : (
                            <div className="space-y-2">
                                {relatedQuotes.map(q => (
                                    <div
                                        key={q.id}
                                        className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl p-3 flex items-center justify-between active:scale-[0.98] transition-all"
                                        onClick={() => slug && router.push(`/app/${slug}/quotes/${q.id}`)}
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white mb-0.5">
                                                Quote {formatDisplayId(q.displayId || q.id)}
                                            </div>
                                            <div className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                                                {q.status || 'DRAFT'}
                                            </div>
                                        </div>
                                        <ChevronRight size={14} className="text-slate-300" />
                                    </div>
                                ))}
                                {bookings.map(b => (
                                    <div
                                        key={b.id}
                                        className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl p-3 flex items-center justify-between active:scale-[0.98] transition-all"
                                        onClick={() => slug && router.push(`/app/${slug}/sales-orders/${b.id}`)}
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white mb-0.5">
                                                Order {formatDisplayId(b.displayId || b.id)}
                                            </div>
                                            <div className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                                                {b.status || 'CONFIRMED'}
                                            </div>
                                        </div>
                                        <ChevronRight size={14} className="text-slate-300" />
                                    </div>
                                ))}
                                {payments.map(p => (
                                    <div
                                        key={p.id}
                                        className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl p-3 flex items-center justify-between active:scale-[0.98] transition-all"
                                        onClick={() => slug && router.push(`/app/${slug}/receipts/${p.id}`)}
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white mb-0.5">
                                                Receipt {formatDisplayId(p.display_id || p.id)}
                                            </div>
                                            <div className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                                                {p.method} • {p.status}
                                            </div>
                                        </div>
                                        <div className="text-[10px] font-black text-emerald-600">
                                            +{formatMoney(p.amount)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </PhoneSection>

                    <PhoneSection title="Tasks" count={localTasks.length}>
                        {localTasks.length === 0 ? (
                            <div className="text-[10px] text-slate-400 font-bold py-2">No tasks yet</div>
                        ) : (
                            <div className="space-y-2">
                                {localTasks.map(task => (
                                    <div
                                        key={task.id}
                                        className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-lg p-2"
                                    >
                                        <div className="text-[10px] font-black text-slate-900 dark:text-white">
                                            {task.title}
                                        </div>
                                        <div className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                                            {task.status}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </PhoneSection>

                    <PhoneSection title="Notes">
                        <textarea
                            value={managerNote}
                            onChange={e => {
                                setManagerNote(e.target.value);
                                setHasChanges(true);
                            }}
                            rows={5}
                            className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                            placeholder="Add internal notes..."
                        />
                    </PhoneSection>

                    <PhoneSection title="Documents" count={docCount}>
                        <div className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-lg p-2 text-[10px] text-slate-500">
                            Open Documents tab on desktop to manage files.
                        </div>
                    </PhoneSection>

                    <PhoneSection title="Member">
                        <div className="space-y-2">
                            <div className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-lg p-2">
                                <div className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                                    Phone
                                </div>
                                <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200">
                                    {primaryPhone || '—'}
                                </div>
                            </div>
                            <div className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-lg p-2">
                                <div className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                                    Email
                                </div>
                                <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200">
                                    {quote.customerProfile?.primaryEmail || quote.customerProfile?.email || '—'}
                                </div>
                            </div>
                        </div>
                    </PhoneSection>

                    <PhoneSection title="Timeline" count={quote.timeline?.length || 0}>
                        {(quote.timeline || []).length === 0 ? (
                            <div className="text-[10px] text-slate-400 font-bold py-2">No events yet</div>
                        ) : (
                            <div className="space-y-2">
                                {quote.timeline.slice(0, 8).map((ev, idx) => (
                                    <div
                                        key={idx}
                                        className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-lg p-2"
                                    >
                                        <div className="text-[10px] font-bold text-slate-900 dark:text-white">
                                            {ev.event || 'Event'}
                                        </div>
                                        <div className="text-[9px] text-slate-400">{formatDate(ev.timestamp)}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </PhoneSection>
                </div>
            </div>
        );
    }

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

    // Helper: Get schemes for a selected bank
    const fetchSchemesForBank = async (bankId: string) => {
        if (!bankId || bankSchemesCache[bankId]) return;
        const schemes = await getBankSchemes(bankId);
        setBankSchemesCache(prev => ({ ...prev, [bankId]: schemes as BankScheme[] }));
    };

    const getSchemesForBank = (bankId: string): BankScheme[] => {
        return bankSchemesCache[bankId] || [];
    };

    const handleAddNewFinance = () => {
        // Local-only — does NOT call createQuoteFinanceAttempt
        // This preserves the primary card's active_finance_id
        const newId = crypto.randomUUID();
        const finalPayable = String(localPricing.finalTotal || 0);
        setFinanceEntries(prev => [
            ...prev,
            {
                id: newId,
                bankName: '',
                bankId: '',
                loanAmount: '',
                downPayment: '',
                tenure: '',
                roi: '',
                emi: '',
                processingFee: '',
                status: 'IN_PROCESS',
                executiveName: '',
                assetCost: finalPayable,
                accessoriesCharges: '0',
                offerDiscount: '0',
                totalPayable: finalPayable,
                finalAmountPayable: finalPayable,
                loanAddOns: '0',
                grossLoanAmount: '0',
                marginMoney: '0',
                schemeName: '',
                schemeId: '',
                isExpanded: true,
                locked: false,
                upfrontCharges: [],
                fundedAddons: [],
                selectedScheme: null,
                persisted: false,
            },
        ]);
        // Collapse primary and all existing entries, only expand the new one
        setIsPrimaryFinanceExpanded(false);
        setNewEntryExpandedMap(prev => {
            const collapsed: Record<string, boolean> = {};
            Object.keys(prev).forEach(k => {
                collapsed[k] = false;
            });
            collapsed[newId] = true;
            return collapsed;
        });
        toast.success('New finance entry added — select Financier & Executive to begin');
    };

    const handleSaveFinanceEntry = async (entryId: string) => {
        const entry = financeEntries.find(e => e.id === entryId);
        if (!entry) return;

        if (!entry.bankName || !entry.bankId) {
            toast.error('Select a financier before saving');
            return;
        }

        setIsSaving(true);
        try {
            const allCharges = [
                ...(entry.upfrontCharges || []).map(c => ({ ...c, impact: 'UPFRONT' })),
                ...(entry.fundedAddons || []).map(c => ({ ...c, impact: 'FUNDED' })),
            ];

            const result = entry.persisted
                ? await updateQuoteFinanceAttempt(entry.id, {
                      bankId: entry.bankId,
                      bankName: entry.bankName,
                      schemeId: entry.schemeId || null,
                      schemeCode: entry.schemeName || null,
                      roi: parseFloat(entry.roi) || null,
                      tenureMonths: parseInt(entry.tenure) || null,
                      downPayment: parseInt(entry.marginMoney) || null,
                      loanAmount: parseInt(entry.loanAmount) || null,
                      loanAddons: parseInt(entry.loanAddOns) || null,
                      processingFee: parseInt(entry.processingFee) || null,
                      chargesBreakup: allCharges,
                      emi: parseInt(entry.emi) || null,
                  })
                : await createQuoteFinanceAttempt(quote.id, {
                      bankId: entry.bankId,
                      bankName: entry.bankName,
                      schemeId: entry.schemeId || null,
                      schemeCode: entry.schemeName || null,
                      roi: parseFloat(entry.roi) || null,
                      tenureMonths: parseInt(entry.tenure) || null,
                      downPayment: parseInt(entry.marginMoney) || null,
                      loanAmount: parseInt(entry.loanAmount) || null,
                      loanAddons: parseInt(entry.loanAddOns) || null,
                      processingFee: parseInt(entry.processingFee) || null,
                      chargesBreakup: allCharges,
                      emi: parseInt(entry.emi) || null,
                  });

            if (result.success) {
                toast.success(entry.persisted ? 'Finance entry updated' : 'Finance entry saved');
                if (!entry.persisted) {
                    setFinanceEntries(prev => prev.filter(e => e.id !== entryId));
                }
                onRefresh?.();
            } else {
                toast.error(result.error || 'Failed to save');
            }
        } catch (err: any) {
            toast.error(err.message || 'Save failed');
        } finally {
            setIsSaving(false);
        }
    };

    const handleTaskStatus = async (taskId: string, status: 'OPEN' | 'IN_PROGRESS' | 'DONE') => {
        const result = await updateTaskStatus(taskId, status);
        if (!result.success) {
            toast.error(result.error || 'Failed to update task');
        } else {
            toast.success('Task updated');
            refreshTasks();
        }
    };

    const formatCurrency = (amount: number) => {
        const formatted = Math.abs(amount).toLocaleString('en-IN');
        return amount < 0 ? `-₹${formatted}` : `₹${formatted}`;
    };

    const formatList = (items: string[]) => (items.length > 0 ? items.join(', ') : 'None');

    const getSelectedItems = (items?: { selected: boolean; name?: string; id?: string }[]) =>
        (items || []).filter(item => item.selected).map(item => item.name || item.id || 'Item');

    const buildChangeSet = (): QuoteChange[] => {
        const changes: QuoteChange[] = [];
        const nextPricing = {
            ...localPricing,
            managerDiscountNote: managerNote || '',
        };

        if (quote.pricing.rtoType !== nextPricing.rtoType) {
            changes.push({
                key: 'rtoType',
                label: 'Registration Type',
                oldValue: quote.pricing.rtoType,
                newValue: nextPricing.rtoType,
            });
        }

        const oldAccessories = getSelectedItems(quote.pricing.accessories);
        const newAccessories = getSelectedItems(nextPricing.accessories);
        if (oldAccessories.join('|') !== newAccessories.join('|')) {
            changes.push({
                key: 'accessories',
                label: 'Accessories',
                oldValue: formatList(oldAccessories),
                newValue: formatList(newAccessories),
            });
        }

        const oldInsuranceAddons = getSelectedItems(quote.pricing.insuranceAddons);
        const newInsuranceAddons = getSelectedItems(nextPricing.insuranceAddons);
        if (oldInsuranceAddons.join('|') !== newInsuranceAddons.join('|')) {
            changes.push({
                key: 'insuranceAddons',
                label: 'Insurance Add-ons',
                oldValue: formatList(oldInsuranceAddons),
                newValue: formatList(newInsuranceAddons),
            });
        }

        if (quote.pricing.insuranceTotal !== nextPricing.insuranceTotal) {
            changes.push({
                key: 'insuranceTotal',
                label: 'Insurance Total',
                oldValue: formatCurrency(quote.pricing.insuranceTotal),
                newValue: formatCurrency(nextPricing.insuranceTotal),
            });
        }

        if (quote.pricing.accessoriesTotal !== nextPricing.accessoriesTotal) {
            changes.push({
                key: 'accessoriesTotal',
                label: 'Accessories Total',
                oldValue: formatCurrency(quote.pricing.accessoriesTotal),
                newValue: formatCurrency(nextPricing.accessoriesTotal),
            });
        }

        const oldServices = getSelectedItems(quote.pricing.services);
        const newServices = getSelectedItems(nextPricing.services);
        if (oldServices.join('|') !== newServices.join('|')) {
            changes.push({
                key: 'services',
                label: 'Services',
                oldValue: formatList(oldServices),
                newValue: formatList(newServices),
            });
        }

        if ((quote.pricing.servicesTotal || 0) !== (nextPricing.servicesTotal || 0)) {
            changes.push({
                key: 'servicesTotal',
                label: 'Services Total',
                oldValue: formatCurrency(quote.pricing.servicesTotal || 0),
                newValue: formatCurrency(nextPricing.servicesTotal || 0),
            });
        }

        if (quote.pricing.onRoadTotal !== nextPricing.onRoadTotal) {
            changes.push({
                key: 'onRoadTotal',
                label: 'On-road Total',
                oldValue: formatCurrency(quote.pricing.onRoadTotal),
                newValue: formatCurrency(nextPricing.onRoadTotal),
            });
        }

        if (quote.pricing.finalTotal !== nextPricing.finalTotal) {
            changes.push({
                key: 'finalTotal',
                label: 'Final Total',
                oldValue: formatCurrency(quote.pricing.finalTotal),
                newValue: formatCurrency(nextPricing.finalTotal),
            });
        }

        if (quote.pricing.managerDiscount !== nextPricing.managerDiscount) {
            changes.push({
                key: 'managerDiscount',
                label: 'Manager Discount',
                oldValue: formatCurrency(quote.pricing.managerDiscount),
                newValue: formatCurrency(nextPricing.managerDiscount),
                isManagerOnly: true,
            });
        }

        if ((quote.pricing.managerDiscountNote || '') !== (nextPricing.managerDiscountNote || '')) {
            changes.push({
                key: 'managerDiscountNote',
                label: 'Manager Note',
                oldValue: quote.pricing.managerDiscountNote || 'None',
                newValue: nextPricing.managerDiscountNote || 'None',
                isManagerOnly: true,
            });
        }

        return changes;
    };

    const handleConfirmSave = async () => {
        if (!pendingPayload) return;
        setIsSaving(true);
        try {
            await onSave(pendingPayload);
            setHasChanges(false);
            toast.success('New quote created');
        } catch {
            toast.error('Failed to update');
        } finally {
            setIsSaving(false);
            setConfirmOpen(false);
            setPendingChanges([]);
            setPendingPayload(null);
        }
    };

    const handleSaveLocal = async () => {
        const payload = { pricing: { ...localPricing, managerDiscountNote: managerNote } };
        const changes = buildChangeSet();
        const nonManagerChanges = changes.filter(change => !change.isManagerOnly);

        if (changes.length === 0) {
            toast.info('No changes to save');
            return;
        }

        if (nonManagerChanges.length > 0) {
            setPendingChanges(changes);
            setPendingPayload(payload);
            setConfirmOpen(true);
            return;
        }

        setIsSaving(true);
        try {
            await onSave(payload);
            setHasChanges(false);
            toast.success('Quote updated');
        } catch {
            toast.error('Failed to update');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="w-full flex flex-col h-full bg-slate-50 dark:bg-[#0b0d10] overflow-hidden antialiased">
            {/* Hidden PDF Template for capturing - rendered off-screen but visible to capture engine */}
            <div
                id="premium-quote-capture-area"
                className="fixed left-0 top-0 pointer-events-none opacity-0"
                style={{ zIndex: -100, transform: 'translateY(-1000%)' }}
            >
                <PremiumQuoteTemplate
                    quote={{ ...quote, pricing: localPricing }}
                    dealerInfo={dealerInfo}
                    qrCodes={qrCodes}
                    alternativeBikes={alternativeBikes}
                />
            </div>

            {confirmOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
                    <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-[#0b0d10] border border-slate-200 dark:border-white/10 shadow-2xl p-6 space-y-6">
                        <div className="space-y-1">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">Confirm Quote Changes</h3>
                            <p className="text-xs text-slate-500 dark:text-white/60">
                                A new quote will be created and the previous quote for this SKU will be voided.
                            </p>
                        </div>
                        <div className="max-h-[50vh] overflow-y-auto rounded-xl border border-slate-100 dark:border-white/5">
                            {pendingChanges.map(change => (
                                <div
                                    key={change.key}
                                    className="flex flex-col gap-2 px-4 py-3 border-b border-slate-100 dark:border-white/5 last:border-b-0"
                                >
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/40">
                                        {change.label}
                                    </span>
                                    <div className="flex flex-wrap items-center gap-2 text-xs">
                                        <span className="text-rose-600 dark:text-rose-400 font-semibold">
                                            {change.oldValue}
                                        </span>
                                        <span className="text-slate-400 dark:text-white/40">→</span>
                                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                            {change.newValue}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={() => {
                                    setConfirmOpen(false);
                                    setPendingChanges([]);
                                    setPendingPayload(null);
                                }}
                                className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/5"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmSave}
                                disabled={isSaving}
                                className="px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
                            >
                                Confirm & Create New Quote
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* STICKY HEADER - MAIN CONTAINER */}
            <div
                className={cn(
                    'sticky top-0 z-20 bg-white/80 dark:bg-[#0b0d10]/80 backdrop-blur-md shadow-sm rounded-2xl border border-slate-100 dark:border-white/5',
                    isPhone ? 'mx-2 mt-2 px-4 py-3' : 'mx-4 mt-4 px-8 py-5'
                )}
            >
                {isPhone ? (
                    /* ── PHONE: stacked header ── */
                    <div className="flex flex-col gap-2">
                        {/* Row 1: Avatar + Name (truncated to 2 lines) */}
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="relative shrink-0 group/avatar">
                                <div
                                    className="w-8 h-8 rounded-full bg-indigo-600 dark:bg-white flex items-center justify-center text-white dark:text-black text-xs font-black uppercase shadow-lg overflow-hidden"
                                    onClick={() => avatarInputRef.current?.click()}
                                >
                                    {memberAvatarUrl ? (
                                        <img src={memberAvatarUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        quote.customer.name
                                            ?.split(' ')
                                            .map(w => w[0])
                                            .join('')
                                            .slice(0, 2)
                                    )}
                                </div>
                                <input
                                    type="file"
                                    ref={avatarInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleAvatarUpload}
                                />
                            </div>
                            <h1 className="text-base font-black italic uppercase tracking-tighter text-slate-900 dark:text-white leading-tight line-clamp-2 min-w-0">
                                {quote.customer.name}
                            </h1>
                        </div>
                        {/* Row 2: ID + Price + Status (always visible) */}
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-black italic uppercase tracking-tighter text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                                {formatDisplayId(quote.displayId)}
                            </span>
                            <span className="text-sm font-black italic uppercase tracking-tighter text-slate-900 dark:text-white whitespace-nowrap">
                                ₹{Number(localPricing.finalTotal || 0).toLocaleString('en-IN')}
                            </span>
                            <div
                                className={cn(
                                    'flex items-center gap-1 h-7 px-2 rounded-lg text-[8px] font-black uppercase tracking-wider',
                                    statusConfig.color
                                )}
                            >
                                <statusConfig.icon size={12} />
                                {statusConfig.label}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ── DESKTOP: original header ── */
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                            {/* Member Avatar with Upload */}
                            <div className="relative shrink-0 group/avatar">
                                <div
                                    className="w-10 h-10 rounded-full bg-indigo-600 dark:bg-white flex items-center justify-center text-white dark:text-black text-sm font-black uppercase shadow-lg shadow-indigo-600/20 dark:shadow-white/10 overflow-hidden cursor-pointer"
                                    onClick={() => avatarInputRef.current?.click()}
                                >
                                    {memberAvatarUrl ? (
                                        <img src={memberAvatarUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        quote.customer.name
                                            ?.split(' ')
                                            .map(w => w[0])
                                            .join('')
                                            .slice(0, 2)
                                    )}
                                    {/* Camera Overlay */}
                                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                                        {avatarUploading ? (
                                            <Loader2 size={14} className="animate-spin text-white" />
                                        ) : (
                                            <Camera size={14} className="text-white" />
                                        )}
                                    </div>
                                </div>
                                <input
                                    type="file"
                                    ref={avatarInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleAvatarUpload}
                                />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <h1 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white truncate leading-tight">
                                    {quote.customer.name}
                                </h1>

                                {/* Customer Age/DOB Section */}
                                {quote.customerProfile?.dob && (
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[10px] font-bold text-slate-400 tabular-nums">
                                            {new Date(quote.customerProfile.dob).toLocaleDateString('en-IN', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                        </span>
                                        {(() => {
                                            const dob = new Date(quote.customerProfile.dob);
                                            const today = new Date();
                                            let age = today.getFullYear() - dob.getFullYear();
                                            const m = today.getMonth() - dob.getMonth();
                                            if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;

                                            const color =
                                                age < 18
                                                    ? 'bg-red-500 text-white'
                                                    : age < 21
                                                      ? 'bg-orange-500 text-white'
                                                      : 'bg-emerald-500 text-white';

                                            return (
                                                <div
                                                    className={cn(
                                                        'px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter shadow-sm',
                                                        color
                                                    )}
                                                >
                                                    AGE: {age}Y
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col items-center">
                            <span className="text-xl font-black italic uppercase tracking-tighter text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                                {formatDisplayId(quote.displayId)}
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white whitespace-nowrap">
                                ₹{Number(localPricing.finalTotal || 0).toLocaleString('en-IN')}
                            </span>
                            {isEditable && hasChanges && (
                                <Button
                                    onClick={handleSaveLocal}
                                    disabled={isSaving}
                                    className="bg-indigo-600 hover:bg-indigo-700 dark:bg-white dark:text-black dark:hover:bg-slate-200 text-white rounded-xl px-6 h-10 text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 dark:shadow-white/10 transition-all active:scale-95"
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
                                    onClick={handleDownload}
                                    disabled={pdfLoading}
                                >
                                    {pdfLoading ? (
                                        <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                        <Download size={14} />
                                    )}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 rounded-lg text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                                    onClick={handleShareDossier}
                                    title="Share Digital Dossier"
                                >
                                    <Share2 size={14} />
                                </Button>
                                {isEditable && (quote.status === 'DRAFT' || quote.status === 'IN_REVIEW') && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={onSendToCustomer}
                                        className="h-8 rounded-lg text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400"
                                        title="Send to Customer"
                                    >
                                        <Send size={14} />
                                    </Button>
                                )}
                                <div className="w-px h-4 bg-slate-200 dark:bg-white/10 mx-1" />
                                <div
                                    className={cn(
                                        'flex items-center gap-1 h-8 px-2 rounded-lg text-[9px] font-black uppercase tracking-wider',
                                        statusConfig.color
                                    )}
                                    title={`Status: ${statusConfig.label}`}
                                >
                                    <statusConfig.icon size={14} />
                                </div>
                                <div className="w-px h-4 bg-slate-200 dark:bg-white/10 mx-1" />
                                {(() => {
                                    const days = Math.floor(
                                        (Date.now() - new Date(quote.createdAt).getTime()) / (1000 * 60 * 60 * 24)
                                    );
                                    const color =
                                        days <= 3
                                            ? 'text-emerald-600 bg-emerald-500/10'
                                            : days <= 7
                                              ? 'text-amber-600 bg-amber-500/10'
                                              : 'text-red-600 bg-red-500/10';
                                    return (
                                        <div
                                            className={cn(
                                                'flex items-center gap-1 h-8 px-2.5 rounded-lg text-[9px] font-black uppercase tracking-wider',
                                                color
                                            )}
                                            title={`Quote created ${days} day${days !== 1 ? 's' : ''} ago`}
                                        >
                                            <Clock size={12} />
                                            {days}D
                                        </div>
                                    );
                                })()}
                                <div className="w-px h-4 bg-slate-200 dark:bg-white/10 mx-1" />

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 rounded-lg text-slate-500 hover:text-slate-900 data-[state=open]:bg-slate-200 dark:data-[state=open]:bg-white/10"
                                        >
                                            <MoreHorizontal size={14} />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56 p-1">
                                        <DropdownMenuLabel className="text-xs font-black text-slate-400 uppercase tracking-widest px-2 py-1.5">
                                            Actions
                                        </DropdownMenuLabel>

                                        {(mode === 'quote' || mode === 'booking') && (
                                            <DropdownMenuItem onSelect={onConfirmBooking}>
                                                <CheckCircle2 size={14} className="mr-2" />
                                                {mode === 'booking' ? 'Confirm Sales Order' : 'Convert to Sales Order'}
                                            </DropdownMenuItem>
                                        )}

                                        <DropdownMenuItem
                                            onSelect={() => toast.info('Receive Payment feature coming soon!')}
                                        >
                                            <Wallet size={14} className="mr-2" />
                                            Receive Payment
                                        </DropdownMenuItem>

                                        <DropdownMenuSeparator />

                                        <DropdownMenuItem className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-900/20">
                                            <Trash2 size={14} className="mr-2" />
                                            Archive Quote
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* MAIN CONTENT AREA - FULL WIDTH */}
            <div className="flex-1 flex min-h-0 overflow-hidden">
                {/* CONTENT (full width) */}
                <div className="flex-1 overflow-y-auto no-scrollbar pb-24 bg-slate-50 dark:bg-slate-950">
                    {/* Tabs - Sticky */}
                    <div
                        className={cn(
                            'sticky top-0 z-10 bg-white/20 dark:bg-white/[0.03] backdrop-blur-xl rounded-2xl overflow-hidden border border-white/20 dark:border-white/5 shadow-sm',
                            isPhone ? 'mx-2 mt-2' : 'mx-4 mt-4'
                        )}
                        style={isPhone ? undefined : { width: 'calc(100% - 2rem)' }}
                    >
                        <div
                            className={cn(
                                'text-[9px] font-black uppercase tracking-widest w-full',
                                isPhone ? 'flex overflow-x-auto no-scrollbar' : 'grid grid-cols-8'
                            )}
                        >
                            {(
                                [
                                    { key: 'DYNAMIC', label: dynamicTabLabel, count: 0 },
                                    { key: 'FINANCE', label: 'FINANCE', count: 0 },
                                    {
                                        key: 'HISTORY',
                                        label: 'HISTORY',
                                        count: relatedQuotes.length + bookings.length + payments.length,
                                    },
                                    { key: 'TASKS', label: 'TASKS', count: localTasks.length },
                                    { key: 'NOTES', label: 'NOTES', count: 0 },
                                    { key: 'DOCUMENTS', label: 'DOCUMENTS', count: docCount },
                                    { key: 'MEMBER', label: 'MEMBER', count: 0 },
                                    { key: 'TIMELINE', label: 'TIMELINE', count: quote.timeline?.length || 0 },
                                ] as { key: string; label: string; count: number }[]
                            ).map((tab, idx) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key as any)}
                                    className={cn(
                                        'py-3 text-center transition-all relative whitespace-nowrap',
                                        isPhone ? 'min-w-[80px] shrink-0 px-3' : 'w-full',
                                        idx < 7 ? 'border-r border-slate-100 dark:border-white/10' : '',
                                        activeTab === tab.key
                                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                            : 'bg-transparent text-slate-400 hover:text-slate-600 hover:bg-white/30 dark:hover:bg-white/10'
                                    )}
                                >
                                    {tab.label}
                                    {tab.count > 0 && (
                                        <span
                                            className={cn(
                                                'ml-1 inline-flex items-center justify-center min-w-[14px] h-[14px] px-1 rounded-full text-[7px] font-black',
                                                activeTab === tab.key
                                                    ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                                                    : 'bg-indigo-500/10 text-indigo-600 dark:bg-white/10 dark:text-white/60'
                                            )}
                                        >
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 1. INFORMATIONAL GRID (Vehicle & Finance) */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-px bg-slate-100 dark:bg-white/5 mx-4 mt-4 rounded-2xl overflow-hidden border border-slate-100 dark:border-white/5">
                        {/* Vehicle / SKU Details */}
                        <div className="bg-white dark:bg-[#0b0d10] p-6 flex items-center gap-4 group hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors">
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
                                <div className="flex flex-col gap-1 mt-1">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full shadow-sm border border-slate-200 dark:border-white/10"
                                            style={{ backgroundColor: quote.vehicle.colorHex || '#000' }}
                                        />
                                        <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                                            {quote.vehicle.variant} • {quote.vehicle.color}
                                        </p>
                                    </div>

                                    <div className="relative">
                                        <button
                                            onClick={() => setDealerDropdownOpen(!dealerDropdownOpen)}
                                            className={`flex items-center gap-1.5 mt-1 pt-1 border-t border-slate-100 dark:border-white/5 cursor-pointer hover:opacity-80 transition-opacity ${
                                                !quote.studioName ? 'animate-pulse' : ''
                                            }`}
                                        >
                                            <Building2
                                                size={10}
                                                className={
                                                    quote.studioName
                                                        ? 'text-indigo-500 dark:text-white'
                                                        : 'text-amber-500'
                                                }
                                            />
                                            <span
                                                className={`text-[9px] font-bold uppercase tracking-tight ${
                                                    quote.studioName
                                                        ? 'text-indigo-600 dark:text-white'
                                                        : 'text-amber-600 dark:text-amber-400'
                                                }`}
                                            >
                                                {quote.studioName || 'SELECT DEALERSHIP'}
                                                {quote.studioId && (
                                                    <span className="opacity-50 ml-1">
                                                        #{quote.studioId.slice(0, 6)}
                                                    </span>
                                                )}
                                            </span>
                                            <ChevronDown size={10} className="text-slate-400" />
                                        </button>
                                        {dealerDropdownOpen && (
                                            <div className="absolute top-full left-0 mt-1 w-72 bg-white dark:bg-[#1a1d23] border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                                                <div className="p-2 border-b border-slate-100 dark:border-white/5">
                                                    <input
                                                        type="text"
                                                        placeholder="Search dealerships..."
                                                        value={dealerSearchQuery}
                                                        onChange={e => setDealerSearchQuery(e.target.value)}
                                                        className="w-full text-[11px] px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-white placeholder:text-slate-400"
                                                        autoFocus
                                                    />
                                                </div>
                                                <div className="max-h-48 overflow-y-auto">
                                                    {dealerList
                                                        .filter(
                                                            d =>
                                                                !dealerSearchQuery ||
                                                                d.name
                                                                    .toLowerCase()
                                                                    .includes(dealerSearchQuery.toLowerCase()) ||
                                                                (d.location &&
                                                                    d.location
                                                                        .toLowerCase()
                                                                        .includes(dealerSearchQuery.toLowerCase()))
                                                        )
                                                        .map(d => (
                                                            <button
                                                                key={d.id}
                                                                disabled={isReassigningDealer}
                                                                onClick={async () => {
                                                                    setIsReassigningDealer(true);
                                                                    const result = await reassignQuoteDealership(
                                                                        quote.id,
                                                                        d.id
                                                                    );
                                                                    setIsReassigningDealer(false);
                                                                    setDealerDropdownOpen(false);
                                                                    setDealerSearchQuery('');
                                                                    if (result.success) {
                                                                        toast.success(
                                                                            `Dealership changed to ${d.name}`
                                                                        );
                                                                        onRefresh?.();
                                                                    } else {
                                                                        toast.error(
                                                                            result.error || 'Failed to reassign'
                                                                        );
                                                                    }
                                                                }}
                                                                className={`w-full text-left px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border-b border-slate-50 dark:border-white/5 last:border-0 ${
                                                                    d.id === quote.tenantId
                                                                        ? 'bg-indigo-50 dark:bg-indigo-500/10'
                                                                        : ''
                                                                }`}
                                                            >
                                                                <p className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-wider">
                                                                    {d.name}
                                                                </p>
                                                                {d.location && (
                                                                    <p className="text-[9px] text-slate-400 mt-0.5">
                                                                        {d.location}
                                                                    </p>
                                                                )}
                                                            </button>
                                                        ))}
                                                    {dealerList.length === 0 && (
                                                        <p className="text-[10px] text-slate-400 text-center py-4">
                                                            No dealerships found
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Finance Details */}
                        <div className="bg-white dark:bg-[#0b0d10] p-6 flex items-center gap-4 group hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors border-t xl:border-t-0 xl:border-l border-slate-100 dark:border-white/5">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-white/5 flex items-center justify-center text-emerald-600 dark:text-white shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                                <BarChart3 size={20} />
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-[9px] font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.2em] mb-0.5">
                                    Finance Mode
                                </span>
                                <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tighter truncate">
                                    {quote.financeMode === 'LOAN' ? 'Loan Finance' : 'Cash Purchase'}
                                </h2>
                                <div className="flex items-center gap-3 mt-1 flex-wrap">
                                    {quote.finance?.bankName && (
                                        <>
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                                                <Building2 size={10} className="text-emerald-500/60" />
                                                {quote.finance.bankName}
                                            </div>
                                            <div className="w-0.5 h-0.5 rounded-full bg-slate-200 dark:bg-white/10" />
                                        </>
                                    )}
                                    {quote.finance?.status && (
                                        <div
                                            className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                                                quote.finance.status === 'APPROVED'
                                                    ? 'bg-emerald-500/10 text-emerald-600'
                                                    : quote.finance.status === 'REJECTED'
                                                      ? 'bg-red-500/10 text-red-600'
                                                      : 'bg-amber-500/10 text-amber-600'
                                            }`}
                                        >
                                            {quote.finance.status}
                                        </div>
                                    )}
                                    {quote.finance?.emi && (
                                        <div className="text-[10px] font-bold text-slate-500">
                                            EMI: ₹{quote.finance?.emi?.toLocaleString() || '0'}/mo
                                        </div>
                                    )}
                                    {quote.finance?.downPayment && (
                                        <div className="text-[10px] font-bold text-slate-500">
                                            DP: ₹{quote.finance?.downPayment?.toLocaleString() || '0'}
                                        </div>
                                    )}
                                    {quote.finance?.tenureMonths && (
                                        <div className="text-[10px] font-bold text-slate-500">
                                            {quote.finance.tenureMonths} months
                                        </div>
                                    )}
                                    {!quote.finance?.bankName && !quote.finance?.status && (
                                        <span className="text-[10px] font-bold text-slate-400">
                                            {quote.financeMode === 'LOAN'
                                                ? 'Bank selection pending'
                                                : 'Full payment at delivery'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {activeTab === 'MEMBER' && (
                        <div className="p-6">
                            <div className="bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/10 rounded-[2rem] p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="text-xs font-black uppercase tracking-widest text-slate-500">
                                        Member Profile
                                    </div>
                                    <div className="text-[10px] font-bold text-indigo-500 dark:text-white bg-indigo-500/10 dark:bg-white/10 px-3 py-1 rounded-full uppercase tracking-widest cursor-default">
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
                                                        className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-white/20"
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
                                                        className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-white/20"
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
                                                            className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm tabular-nums outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-white/20"
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
                                                            className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-white/20"
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
                                                            className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-white/20"
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
                                                            className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-white/20 appearance-none"
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
                                                                    className="animate-spin text-indigo-500 dark:text-white"
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
                                                            className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-white/20"
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
                                                            className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-white/20"
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
                                                            className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-white/20"
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
                                                    <span className="text-[8px] font-black text-indigo-500 dark:text-white uppercase tracking-[0.2em] mb-1">
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
                                                            className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-white/20"
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
                                                            className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-white/20"
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
                                                            className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-white/20 appearance-none"
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
                                                            className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-white/20 appearance-none"
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
                                                        className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-white/20"
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
                                                                    className="animate-spin text-indigo-500 dark:text-white"
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
                                                        <span className="text-[9px] font-bold text-indigo-500 dark:text-white uppercase tracking-[0.2em]">
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
                            </div>
                        </div>
                    )}

                    {activeTab === 'DYNAMIC' && (
                        <>
                            {mode === 'receipt' && receipt && (
                                <div className={cn('w-full pt-6', isPhone ? 'px-0' : 'px-4')}>
                                    <div
                                        className={cn(
                                            'bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/10 shadow-2xl dark:shadow-none overflow-hidden mb-6',
                                            isPhone ? 'rounded-none' : 'rounded-[2.5rem]'
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                'py-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] flex items-center justify-between',
                                                isPhone ? 'px-4' : 'px-8'
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-indigo-600 dark:bg-white flex items-center justify-center text-white dark:text-black shadow-lg shadow-indigo-600/30 dark:shadow-white/10">
                                                    <Receipt size={16} />
                                                </div>
                                                <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                                                    Receipt Details
                                                </h3>
                                            </div>
                                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                {receipt.is_reconciled ? 'Reconciled' : 'Open'}
                                            </div>
                                        </div>

                                        <div
                                            className={cn(
                                                'grid grid-cols-1 md:grid-cols-3 gap-4',
                                                isPhone ? 'p-4' : 'p-6'
                                            )}
                                        >
                                            <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-2xl p-4">
                                                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                    Amount
                                                </div>
                                                <input
                                                    type="number"
                                                    disabled={!!receipt.is_reconciled}
                                                    value={receiptDraft?.amount ?? 0}
                                                    onChange={e =>
                                                        setReceiptDraft((prev: any) => ({
                                                            ...(prev || {}),
                                                            amount: e.target.value,
                                                        }))
                                                    }
                                                    className="mt-2 w-full bg-transparent border-b border-slate-200 dark:border-white/10 text-sm font-black text-slate-900 dark:text-white outline-none"
                                                />
                                            </div>
                                            <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-2xl p-4">
                                                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                    Method
                                                </div>
                                                <input
                                                    type="text"
                                                    disabled={!!receipt.is_reconciled}
                                                    value={receiptDraft?.method ?? ''}
                                                    onChange={e =>
                                                        setReceiptDraft((prev: any) => ({
                                                            ...(prev || {}),
                                                            method: e.target.value,
                                                        }))
                                                    }
                                                    className="mt-2 w-full bg-transparent border-b border-slate-200 dark:border-white/10 text-sm font-black text-slate-900 dark:text-white outline-none"
                                                    placeholder="CASH / CARD / UPI / COIN"
                                                />
                                            </div>
                                            <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-2xl p-4">
                                                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                    Status
                                                </div>
                                                <input
                                                    type="text"
                                                    disabled={!!receipt.is_reconciled}
                                                    value={receiptDraft?.status ?? ''}
                                                    onChange={e =>
                                                        setReceiptDraft((prev: any) => ({
                                                            ...(prev || {}),
                                                            status: e.target.value,
                                                        }))
                                                    }
                                                    className="mt-2 w-full bg-transparent border-b border-slate-200 dark:border-white/10 text-sm font-black text-slate-900 dark:text-white outline-none"
                                                    placeholder="RECEIVED / PENDING / FAILED"
                                                />
                                            </div>
                                            <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-2xl p-4">
                                                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                    Transaction ID
                                                </div>
                                                <input
                                                    type="text"
                                                    disabled={!!receipt.is_reconciled}
                                                    value={receiptDraft?.transaction_id ?? ''}
                                                    onChange={e =>
                                                        setReceiptDraft((prev: any) => ({
                                                            ...(prev || {}),
                                                            transaction_id: e.target.value,
                                                        }))
                                                    }
                                                    className="mt-2 w-full bg-transparent border-b border-slate-200 dark:border-white/10 text-sm font-black text-slate-900 dark:text-white outline-none"
                                                />
                                            </div>
                                            <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-2xl p-4">
                                                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                    Currency
                                                </div>
                                                <input
                                                    type="text"
                                                    disabled={!!receipt.is_reconciled}
                                                    value={receiptDraft?.currency ?? 'INR'}
                                                    onChange={e =>
                                                        setReceiptDraft((prev: any) => ({
                                                            ...(prev || {}),
                                                            currency: e.target.value,
                                                        }))
                                                    }
                                                    className="mt-2 w-full bg-transparent border-b border-slate-200 dark:border-white/10 text-sm font-black text-slate-900 dark:text-white outline-none"
                                                />
                                            </div>
                                            <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-2xl p-4">
                                                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                    Reconciled
                                                </div>
                                                <div className="text-sm font-black text-slate-900 dark:text-white mt-2">
                                                    {receipt.is_reconciled ? 'YES' : 'NO'}
                                                </div>
                                            </div>
                                        </div>

                                        <div
                                            className={cn(
                                                'pb-6 flex items-center justify-between',
                                                isPhone ? 'px-4' : 'px-8'
                                            )}
                                        >
                                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                {receipt.reconciled_at
                                                    ? `Reconciled at ${formatDate(receipt.reconciled_at)}`
                                                    : 'Not reconciled'}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    onClick={handleReceiptSave}
                                                    disabled={receiptSaving || !!receipt.is_reconciled}
                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 h-9 text-[10px] font-black uppercase tracking-widest"
                                                >
                                                    {receiptSaving ? 'Saving...' : 'Save Receipt'}
                                                </Button>
                                                <Button
                                                    onClick={handleReceiptReconcile}
                                                    disabled={!!receipt.is_reconciled}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-5 h-9 text-[10px] font-black uppercase tracking-widest"
                                                >
                                                    Mark Reconciled
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {mode === 'booking' && booking && (
                                <div className={cn('w-full pt-6', isPhone ? 'px-0' : 'px-4')}>
                                    <div
                                        className={cn(
                                            'bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/10 shadow-2xl dark:shadow-none overflow-hidden mb-6',
                                            isPhone ? 'rounded-none' : 'rounded-[2.5rem]'
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                'py-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] flex items-center justify-between',
                                                isPhone ? 'px-4' : 'px-8'
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-emerald-600 dark:bg-white flex items-center justify-center text-white dark:text-black shadow-lg shadow-emerald-600/30 dark:shadow-white/10">
                                                    <ShoppingBag size={16} />
                                                </div>
                                                <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                                                    Booking Details
                                                </h3>
                                            </div>
                                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                Sales Order
                                            </div>
                                        </div>

                                        <div
                                            className={cn(
                                                'grid grid-cols-1 md:grid-cols-3 gap-4',
                                                isPhone ? 'p-4' : 'p-6'
                                            )}
                                        >
                                            <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-2xl p-4">
                                                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                    Status
                                                </div>
                                                <div className="text-sm font-black text-slate-900 dark:text-white mt-1">
                                                    {booking.status || '—'}
                                                </div>
                                            </div>
                                            <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-2xl p-4">
                                                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                    Payment
                                                </div>
                                                <div className="text-sm font-black text-slate-900 dark:text-white mt-1">
                                                    {booking.payment_status || '—'}
                                                </div>
                                            </div>
                                            <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-2xl p-4">
                                                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                    Finance
                                                </div>
                                                <div className="text-sm font-black text-slate-900 dark:text-white mt-1">
                                                    {booking.finance_status || '—'}
                                                </div>
                                            </div>
                                            <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-2xl p-4">
                                                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                    Delivery
                                                </div>
                                                <div className="text-sm font-black text-slate-900 dark:text-white mt-1">
                                                    {booking.delivery_status || '—'}
                                                </div>
                                            </div>
                                            <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-2xl p-4">
                                                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                    Registration
                                                </div>
                                                <div className="text-sm font-black text-slate-900 dark:text-white mt-1">
                                                    {booking.registration_number || '—'}
                                                </div>
                                            </div>
                                            <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-2xl p-4">
                                                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                    Booking Amount
                                                </div>
                                                <div className="text-sm font-black text-slate-900 dark:text-white mt-1">
                                                    ₹
                                                    {Number(booking.booking_amount_received || 0).toLocaleString(
                                                        'en-IN'
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 2. QUOTATION DETAILS PANEL (COLLAPSIBLE) */}
                            <div className={cn('w-full pt-6', isPhone ? 'px-0' : 'px-4')}>
                                <div
                                    className={cn(
                                        'bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/10 shadow-2xl dark:shadow-none overflow-hidden mb-6',
                                        isPhone ? 'rounded-none' : 'rounded-[2.5rem]'
                                    )}
                                >
                                    {/* Section Header - Collapsible Trigger */}
                                    <button
                                        onClick={() => setGroups(g => ({ ...g, pricing: !g.pricing }))}
                                        className={cn(
                                            'w-full py-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] flex items-center justify-between hover:bg-slate-100/50 dark:hover:bg-white/[0.02] transition-colors',
                                            isPhone ? 'px-4' : 'px-8'
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-indigo-600 dark:bg-white flex items-center justify-center text-white dark:text-black shadow-lg shadow-indigo-600/30 dark:shadow-white/10">
                                                <FileText size={16} />
                                            </div>
                                            <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                                                Line-Item <span className="opacity-50">Breakdown</span>
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-white/5 rounded-full border border-slate-100 dark:border-white/10 shadow-sm">
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-white animate-pulse" />
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
                                            {quote.delivery && (
                                                <div
                                                    className={cn(
                                                        'py-4 bg-slate-50/60 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5',
                                                        isPhone ? 'px-4' : 'px-8'
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                                Delivery & Serviceability
                                                            </div>
                                                            <div className="text-xs font-bold text-slate-700 dark:text-white mt-1">
                                                                {quote.delivery.serviceable === false
                                                                    ? 'Not Serviceable'
                                                                    : 'Serviceable'}
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                                Location
                                                            </div>
                                                            <div className="text-xs font-bold text-slate-700 dark:text-white">
                                                                {quote.delivery.district ||
                                                                    quote.delivery.taluka ||
                                                                    quote.delivery.pincode ||
                                                                    '—'}
                                                                {quote.delivery.pincode
                                                                    ? ` (${quote.delivery.pincode})`
                                                                    : ''}
                                                            </div>
                                                            {quote.delivery.delivery_tat_days ? (
                                                                <div className="text-[9px] font-bold text-slate-400 mt-1">
                                                                    TAT: {quote.delivery.delivery_tat_days} days
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {/* Ex-Showroom Group */}
                                            <PricingGroup
                                                title="Ex-Showroom Price"
                                                icon={Building2}
                                                total={formatCurrency(
                                                    localPricing.exShowroom +
                                                        (localPricing.colorDelta || 0) -
                                                        (localPricing.dealerDiscount || 0) +
                                                        (localPricing.offersDelta || 0)
                                                )}
                                                isExpanded={groups.exShowroom}
                                                onToggle={() => setGroups(g => ({ ...g, exShowroom: !g.exShowroom }))}
                                            >
                                                <PricingRow
                                                    isSub
                                                    label="Base Price"
                                                    value={formatCurrency(
                                                        Math.floor(
                                                            localPricing.exShowroom /
                                                                (1 + (localPricing.exShowroomGstRate || 28) / 100)
                                                        )
                                                    )}
                                                />
                                                <PricingRow
                                                    isSub
                                                    label={`GST (${localPricing.exShowroomGstRate || 28}%)`}
                                                    value={formatCurrency(
                                                        localPricing.exShowroom -
                                                            Math.floor(
                                                                localPricing.exShowroom /
                                                                    (1 + (localPricing.exShowroomGstRate || 28) / 100)
                                                            )
                                                    )}
                                                />
                                                {localPricing.colorDelta !== undefined &&
                                                    localPricing.colorDelta !== 0 && (
                                                        <PricingRow
                                                            isSub
                                                            isSaving={localPricing.colorDelta < 0}
                                                            label={
                                                                localPricing.colorDelta < 0
                                                                    ? 'Colour Discount'
                                                                    : 'Colour Surge'
                                                            }
                                                            value={formatCurrency(localPricing.colorDelta)}
                                                        />
                                                    )}
                                                {(localPricing.offersItems || []).length > 0 &&
                                                    (localPricing.offersItems || []).map((o: any, idx: number) => {
                                                        const base = Number(o.price || 0);
                                                        const effective =
                                                            o.discountPrice !== undefined && o.discountPrice !== null
                                                                ? Number(o.discountPrice)
                                                                : base;
                                                        const delta = effective - base;
                                                        if (delta === 0) return null;
                                                        return (
                                                            <PricingRow
                                                                key={`veh-offer-${o.id || idx}`}
                                                                isSub
                                                                isSaving
                                                                label={o.name}
                                                                value={formatCurrency(delta)}
                                                            />
                                                        );
                                                    })}
                                                {localPricing.dealerDiscount !== undefined &&
                                                    localPricing.dealerDiscount !== 0 && (
                                                        <PricingRow
                                                            isSub
                                                            isSaving
                                                            label="Dealer Discount"
                                                            value={formatCurrency(-localPricing.dealerDiscount)}
                                                        />
                                                    )}
                                            </PricingGroup>

                                            {/* Registration Group */}
                                            <PricingGroup
                                                title="Registration (RTO)"
                                                icon={MapPin}
                                                total={formatCurrency(localPricing.rtoTotal)}
                                                isExpanded={groups.registration}
                                                onToggle={() =>
                                                    setGroups(g => ({ ...g, registration: !g.registration }))
                                                }
                                            >
                                                {/* Fixed Charges */}
                                                {(localPricing.rtoBreakdown || [])
                                                    .filter(b =>
                                                        [
                                                            'Postal Charges',
                                                            'Smart Card Charges',
                                                            'Registration Charges',
                                                        ].includes(b.label)
                                                    )
                                                    .map((opt: any, idx: number) => (
                                                        <PricingRow
                                                            key={`${opt.label || idx}`}
                                                            isSub
                                                            label={opt.label || 'RTO Fee'}
                                                            value={formatCurrency(opt.amount || 0)}
                                                        />
                                                    ))}

                                                {/* Registration Type Selector (in the middle) */}
                                                <div className="px-6 py-4 bg-slate-50/50 dark:bg-white/[0.02] border-y border-slate-100 dark:border-white/5">
                                                    <div className="flex flex-col gap-3">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                                Registration Type
                                                            </span>
                                                            <div className="flex gap-1.5">
                                                                {(['STATE', 'BH', 'COMPANY'] as const).map(type => (
                                                                    <div
                                                                        key={type}
                                                                        className={cn(
                                                                            'px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all opacity-60 cursor-not-allowed',
                                                                            localPricing.rtoType === type
                                                                                ? 'bg-indigo-600 dark:bg-white text-white dark:text-black shadow-md shadow-indigo-600/20 dark:shadow-white/10'
                                                                                : 'bg-slate-100 dark:bg-white/5 text-slate-400'
                                                                        )}
                                                                    >
                                                                        {type}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-100/50 dark:bg-white/[0.02] rounded-xl border border-dashed border-slate-200 dark:border-white/10">
                                                            <Clock size={10} className="text-slate-400" />
                                                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">
                                                                Locked. Edit on Marketplace to change RTO type.
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Variable Taxes/Charges */}
                                                {(localPricing.rtoBreakdown || [])
                                                    .filter(b => ['Road Tax', 'Cess Amount'].includes(b.label))
                                                    .map((opt: any, idx: number) => (
                                                        <PricingRow
                                                            key={`${opt.label || idx}`}
                                                            isSub
                                                            label={opt.label || 'RTO Tax'}
                                                            value={formatCurrency(opt.amount || 0)}
                                                        />
                                                    ))}

                                                {/* Fallback for legacy quotes with no breakdown */}
                                                {(!localPricing.rtoBreakdown ||
                                                    localPricing.rtoBreakdown.length === 0) && (
                                                    <PricingRow
                                                        isSub
                                                        label="MV Tax & Cess"
                                                        value={formatCurrency(localPricing.rtoTotal)}
                                                    />
                                                )}
                                            </PricingGroup>

                                            {/* Insurance Group */}
                                            <PricingGroup
                                                title="Insurance Package"
                                                icon={CheckCircle2}
                                                total={formatCurrency(localPricing.insuranceTotal)}
                                                isExpanded={groups.insurance}
                                                onToggle={() => setGroups(g => ({ ...g, insurance: !g.insurance }))}
                                            >
                                                {(() => {
                                                    const tpItems = (localPricing.insuranceRequiredItems || []).filter(
                                                        item =>
                                                            (item.name || item.label || '')
                                                                .toLowerCase()
                                                                .includes('liability only')
                                                    );
                                                    const odItems = (localPricing.insuranceRequiredItems || []).filter(
                                                        item =>
                                                            (item.name || item.label || '')
                                                                .toLowerCase()
                                                                .includes('comprehensive')
                                                    );
                                                    const optionalRequired = (
                                                        localPricing.insuranceRequiredItems || []
                                                    ).filter(
                                                        item => !tpItems.includes(item) && !odItems.includes(item)
                                                    );
                                                    const allAddons = [
                                                        ...optionalRequired,
                                                        ...localPricing.insuranceAddons,
                                                    ];

                                                    return (
                                                        <>
                                                            {/* THIRD PARTY (BASIC) */}
                                                            <PricingRow
                                                                isSub
                                                                label="Third Party (Basic)"
                                                                value={
                                                                    isEditable ? (
                                                                        <div className="flex items-center gap-1">
                                                                            <span className="text-slate-400">₹</span>
                                                                            <input
                                                                                type="number"
                                                                                value={localPricing.insuranceTP}
                                                                                onChange={e =>
                                                                                    setLocalPricing(p => ({
                                                                                        ...p,
                                                                                        insuranceTP:
                                                                                            parseInt(e.target.value) ||
                                                                                            0,
                                                                                    }))
                                                                                }
                                                                                className="w-20 bg-transparent border-b border-slate-200 dark:border-white/10 focus:border-indigo-500 outline-none text-right font-black"
                                                                            />
                                                                        </div>
                                                                    ) : (
                                                                        formatCurrency(localPricing.insuranceTP)
                                                                    )
                                                                }
                                                            />
                                                            {tpItems.map((item, idx) => (
                                                                <PricingRow
                                                                    key={`tp-item-${item.id || idx}`}
                                                                    isSub
                                                                    label={
                                                                        <span className="text-[10px] opacity-70 italic">
                                                                            {item.name || item.label}
                                                                        </span>
                                                                    }
                                                                    value={formatCurrency(
                                                                        Number(item.price || item.amount || 0)
                                                                    )}
                                                                    description={
                                                                        item.breakdown &&
                                                                        Array.isArray(item.breakdown) && (
                                                                            <div className="flex flex-col gap-1">
                                                                                {item.breakdown.map(
                                                                                    (b: any, bIdx: number) => (
                                                                                        <span
                                                                                            key={`${item.id || idx}-b-${bIdx}`}
                                                                                            className="text-[8px] text-slate-400 uppercase font-bold tracking-widest"
                                                                                        >
                                                                                            {b.label}: ₹
                                                                                            {Number(
                                                                                                b.amount || 0
                                                                                            ).toLocaleString('en-IN')}
                                                                                        </span>
                                                                                    )
                                                                                )}
                                                                            </div>
                                                                        )
                                                                    }
                                                                />
                                                            ))}

                                                            {/* OWN DAMAGE (OD) */}
                                                            <PricingRow
                                                                isSub
                                                                label="Own Damage (OD)"
                                                                value={
                                                                    isEditable ? (
                                                                        <div className="flex items-center gap-1">
                                                                            <span className="text-slate-400">₹</span>
                                                                            <input
                                                                                type="number"
                                                                                value={localPricing.insuranceOD}
                                                                                onChange={e =>
                                                                                    setLocalPricing(p => ({
                                                                                        ...p,
                                                                                        insuranceOD:
                                                                                            parseInt(e.target.value) ||
                                                                                            0,
                                                                                    }))
                                                                                }
                                                                                className="w-20 bg-transparent border-b border-slate-200 dark:border-white/10 focus:border-indigo-500 outline-none text-right font-black"
                                                                            />
                                                                        </div>
                                                                    ) : (
                                                                        formatCurrency(localPricing.insuranceOD)
                                                                    )
                                                                }
                                                            />
                                                            {odItems.map((item, idx) => (
                                                                <PricingRow
                                                                    key={`od-item-${item.id || idx}`}
                                                                    isSub
                                                                    label={
                                                                        <span className="text-[10px] opacity-70 italic">
                                                                            {item.name || item.label}
                                                                        </span>
                                                                    }
                                                                    value={formatCurrency(
                                                                        Number(item.price || item.amount || 0)
                                                                    )}
                                                                    description={
                                                                        item.breakdown &&
                                                                        Array.isArray(item.breakdown) && (
                                                                            <div className="flex flex-col gap-1">
                                                                                {item.breakdown.map(
                                                                                    (b: any, bIdx: number) => (
                                                                                        <span
                                                                                            key={`${item.id || idx}-b-${bIdx}`}
                                                                                            className="text-[8px] text-slate-400 uppercase font-bold tracking-widest"
                                                                                        >
                                                                                            {b.label}: ₹
                                                                                            {Number(
                                                                                                b.amount || 0
                                                                                            ).toLocaleString('en-IN')}
                                                                                        </span>
                                                                                    )
                                                                                )}
                                                                            </div>
                                                                        )
                                                                    }
                                                                />
                                                            ))}

                                                            {/* OPTIONAL ADD-ONS */}
                                                            <div className="py-2 px-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                                                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                                                    Optional Add-ons
                                                                </div>
                                                            </div>
                                                            {allAddons.map((addon, idx) => (
                                                                <PricingRow
                                                                    key={addon.id || `addon-${idx}`}
                                                                    isSub
                                                                    label={addon.name || addon.label}
                                                                    value={
                                                                        addon.selected !== undefined
                                                                            ? addon.selected
                                                                                ? formatCurrency(
                                                                                      addon.amount || addon.price || 0
                                                                                  )
                                                                                : 'Not Selected'
                                                                            : formatCurrency(
                                                                                  addon.amount || addon.price || 0
                                                                              )
                                                                    }
                                                                    description={
                                                                        <div className="flex flex-col gap-1">
                                                                            {addon.breakdown &&
                                                                                Array.isArray(addon.breakdown) &&
                                                                                addon.breakdown.map(
                                                                                    (b: any, bIdx: number) => (
                                                                                        <span
                                                                                            key={`${addon.id || idx}-b-${bIdx}`}
                                                                                            className="text-[8px] text-slate-400 uppercase font-bold tracking-widest"
                                                                                        >
                                                                                            {b.label}: ₹
                                                                                            {Number(
                                                                                                b.amount || 0
                                                                                            ).toLocaleString('en-IN')}
                                                                                        </span>
                                                                                    )
                                                                                )}
                                                                            {addon.basePrice !== undefined && (
                                                                                <span className="text-[8px] text-slate-400 uppercase font-bold tracking-widest">
                                                                                    Base: ₹
                                                                                    {Number(
                                                                                        addon.basePrice || 0
                                                                                    ).toLocaleString('en-IN')}
                                                                                </span>
                                                                            )}
                                                                            {addon.discountPrice !== null &&
                                                                                addon.discountPrice !== undefined && (
                                                                                    <span className="text-[8px] text-emerald-500 uppercase font-bold tracking-widest">
                                                                                        Offer: ₹
                                                                                        {Number(
                                                                                            addon.discountPrice || 0
                                                                                        ).toLocaleString('en-IN')}
                                                                                    </span>
                                                                                )}
                                                                        </div>
                                                                    }
                                                                    extra={
                                                                        addon.selected !== undefined && (
                                                                            <div className="flex items-center gap-2">
                                                                                {addon.selected ? (
                                                                                    <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded text-[8px] font-black uppercase tracking-widest">
                                                                                        <CheckCircle2 size={10} />{' '}
                                                                                        Active
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="text-[8px] font-bold text-slate-400 uppercase">
                                                                                        None
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )
                                                                    }
                                                                />
                                                            ))}
                                                        </>
                                                    );
                                                })()}
                                                <PricingRow
                                                    isSub
                                                    isBold
                                                    label="Net Premium"
                                                    value={formatCurrency(
                                                        localPricing.insuranceOD +
                                                            localPricing.insuranceTP +
                                                            localPricing.insuranceAddons
                                                                .filter(a => a.selected)
                                                                .reduce((sum, a) => sum + a.amount, 0)
                                                    )}
                                                />
                                                <PricingRow
                                                    isSub
                                                    label="GST (18% GST)"
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
                                                        label={`${acc.name}${acc.qty && acc.qty > 1 ? ` ×${acc.qty}` : ''}`}
                                                        value={
                                                            acc.selected
                                                                ? formatCurrency((acc.price || 0) * (acc.qty || 1))
                                                                : 'Excluded'
                                                        }
                                                        description={
                                                            acc.selected &&
                                                            ((acc.basePrice || 0) > 0 || acc.discountPrice !== null) ? (
                                                                <div className="flex flex-col gap-1">
                                                                    <span className="text-[8px] text-slate-400 uppercase font-bold tracking-widest">
                                                                        Base: ₹
                                                                        {Number(
                                                                            acc.basePrice || acc.price || 0
                                                                        ).toLocaleString('en-IN')}
                                                                    </span>
                                                                    {acc.price === 0 && (acc.basePrice || 0) > 0 ? (
                                                                        <span className="text-[8px] text-emerald-500 uppercase font-bold tracking-widest">
                                                                            100% Discount (Bundle)
                                                                        </span>
                                                                    ) : (
                                                                        acc.discountPrice !== null &&
                                                                        acc.discountPrice !== undefined && (
                                                                            <span className="text-[8px] text-emerald-500 uppercase font-bold tracking-widest">
                                                                                Offer: ₹
                                                                                {Number(
                                                                                    acc.discountPrice || 0
                                                                                ).toLocaleString('en-IN')}
                                                                            </span>
                                                                        )
                                                                    )}
                                                                </div>
                                                            ) : undefined
                                                        }
                                                        extra={
                                                            <div className="flex items-center gap-2">
                                                                {acc.selected ? (
                                                                    <div className="flex items-center gap-1 px-2 py-0.5 bg-indigo-500/10 dark:bg-white/10 text-indigo-500 dark:text-white rounded text-[8px] font-black uppercase tracking-widest">
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

                                            {/* Services Group */}
                                            {(localPricing.services || []).length > 0 && (
                                                <PricingGroup
                                                    title="Services & Warranties"
                                                    icon={Wrench}
                                                    total={formatCurrency(localPricing.servicesTotal || 0)}
                                                    isExpanded={groups.services}
                                                    onToggle={() => setGroups(g => ({ ...g, services: !g.services }))}
                                                >
                                                    {(localPricing.services || []).map((svc: any) => (
                                                        <PricingRow
                                                            key={svc.id}
                                                            isSub
                                                            label={`${svc.name}${svc.qty && svc.qty > 1 ? ` ×${svc.qty}` : ''}`}
                                                            value={
                                                                svc.selected
                                                                    ? formatCurrency((svc.price || 0) * (svc.qty || 1))
                                                                    : 'Excluded'
                                                            }
                                                            description={
                                                                svc.selected && (svc.basePrice || svc.discountPrice) ? (
                                                                    <div className="flex flex-col gap-1">
                                                                        <span className="text-[8px] text-slate-400 uppercase font-bold tracking-widest">
                                                                            Base: ₹
                                                                            {Number(
                                                                                svc.basePrice || svc.price || 0
                                                                            ).toLocaleString('en-IN')}
                                                                        </span>
                                                                        {svc.discountPrice !== null &&
                                                                            svc.discountPrice !== undefined && (
                                                                                <span className="text-[8px] text-emerald-500 uppercase font-bold tracking-widest">
                                                                                    Offer: ₹
                                                                                    {Number(
                                                                                        svc.discountPrice || 0
                                                                                    ).toLocaleString('en-IN')}
                                                                                </span>
                                                                            )}
                                                                    </div>
                                                                ) : undefined
                                                            }
                                                            extra={
                                                                <div className="flex items-center gap-2">
                                                                    {svc.selected ? (
                                                                        <div className="flex items-center gap-1 px-2 py-0.5 bg-teal-500/10 dark:bg-white/10 text-teal-500 dark:text-white rounded text-[8px] font-black uppercase tracking-widest">
                                                                            <CheckCircle2 size={10} /> Active
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
                                            )}

                                            {(localPricing.warrantyItems || []).length > 0 && (
                                                <div className="border-b border-slate-100 dark:border-white/5 last:border-0">
                                                    <div className="w-full flex items-center justify-between py-4 px-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-white/40">
                                                                <ShieldCheck size={16} />
                                                            </div>
                                                            <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                                                                Warranty & Protection
                                                            </span>
                                                        </div>
                                                        <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums">
                                                            Included
                                                        </span>
                                                    </div>
                                                    <div className="bg-slate-50/20 dark:bg-white/[0.005]">
                                                        {(localPricing.warrantyItems || []).map(
                                                            (w: any, idx: number) => (
                                                                <PricingRow
                                                                    key={w.id || idx}
                                                                    isSub
                                                                    label={w.name || w.label || 'Warranty'}
                                                                    value={
                                                                        w.price
                                                                            ? formatCurrency(Number(w.price || 0))
                                                                            : 'Included'
                                                                    }
                                                                />
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Discount Section */}
                                            <div className="bg-emerald-500/[0.03] dark:bg-emerald-500/[0.01]">
                                                {localPricing.referralApplied && (
                                                    <PricingRow
                                                        label="Referral Bonus"
                                                        value={formatCurrency(-Number(localPricing.referralBonus || 0))}
                                                    />
                                                )}
                                            </div>
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
                                                        <span className="text-xs font-black text-amber-600">-₹</span>
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
                                                <div className="mt-4">
                                                    <input
                                                        type="text"
                                                        value={managerNote}
                                                        onChange={e => {
                                                            setManagerNote(e.target.value);
                                                            setHasChanges(true);
                                                        }}
                                                        className="w-full bg-white dark:bg-white/5 border border-amber-200/50 dark:border-amber-500/20 rounded-xl px-4 py-2.5 text-[10px] font-bold text-amber-900 dark:text-amber-400 placeholder:text-amber-500/30 focus:outline-none focus:ring-1 focus:ring-amber-500/30 shadow-sm"
                                                        placeholder="Note: Reason for discretionary discount..."
                                                    />
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
                                                        <Clock size={10} className="text-indigo-500 dark:text-white" />{' '}
                                                        24h Validity
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={onSendToCustomer}
                                                className="inline-flex items-center justify-center bg-white hover:bg-slate-100 text-slate-900 rounded-xl px-8 h-12 text-xs font-black uppercase tracking-widest transition-all active:scale-95 whitespace-nowrap shadow-lg"
                                            >
                                                <Send size={16} className="mr-2" />
                                                Release Quote
                                            </button>
                                        </div>
                                    )}

                                    {/* FINANCE SUMMARY (Always show at bottom if LOAN) */}
                                    {quote.financeMode === 'LOAN' && (
                                        <div className="mx-8 mb-8 p-6 bg-indigo-50 dark:bg-indigo-500/5 rounded-3xl border border-indigo-100 dark:border-indigo-500/10 flex flex-col md:flex-row items-center justify-between gap-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-white dark:bg-white/10 rounded-xl flex items-center justify-center text-indigo-600 dark:text-white shadow-sm">
                                                    <BarChart3 size={20} />
                                                </div>
                                                <div>
                                                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block mb-0.5">
                                                        Estimated Finance Summary
                                                    </span>
                                                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                                                        {quote.finance?.bankName || 'Standard Finance Scheme'}
                                                    </h3>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-8">
                                                <div className="text-center md:text-left">
                                                    <span className="text-[8px] font-bold text-slate-400 uppercase block mb-0.5">
                                                        Monthly EMI
                                                    </span>
                                                    <span className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
                                                        ₹{quote.finance?.emi?.toLocaleString() || '0'}/mo
                                                    </span>
                                                </div>
                                                <div className="text-center md:text-left">
                                                    <span className="text-[8px] font-bold text-slate-400 uppercase block mb-0.5">
                                                        Down Payment
                                                    </span>
                                                    <span className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
                                                        ₹{quote.finance?.downPayment?.toLocaleString() || '0'}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => setActiveTab('FINANCE')}
                                                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
                                                >
                                                    View Details
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    {/* ALTERNATIVE RECOMMENDATIONS */}
                                    <AlternativeBikesSection recommendations={alternativeBikes} />
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'FINANCE' && (
                        <div className={cn(isPhone ? 'p-0' : 'p-6')}>
                            {mode === 'booking' && (
                                <div
                                    className={cn(
                                        'mb-6 bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/10',
                                        isPhone ? 'rounded-none p-4' : 'rounded-[2rem] p-6'
                                    )}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                Finance Operations
                                            </div>
                                            <div className="text-lg font-black text-slate-900 dark:text-white">
                                                Disbursement Pipeline
                                            </div>
                                        </div>
                                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                            {activeBookingFinance?.display_id || activeBookingFinance?.id
                                                ? `APP ${activeBookingFinance.display_id || activeBookingFinance.id}`
                                                : 'No Application'}
                                        </div>
                                    </div>

                                    {!activeBookingFinance ? (
                                        <div className="text-sm text-slate-400">
                                            No finance application linked to this booking.
                                        </div>
                                    ) : (
                                        <div
                                            className={cn(
                                                'grid gap-3',
                                                isPhone ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'
                                            )}
                                        >
                                            {[
                                                { key: 'agreement_signed_at', label: 'Agreement Signed' },
                                                { key: 'enach_done_at', label: 'eNACH Done' },
                                                { key: 'insurance_requested_at', label: 'Insurance Requested' },
                                                { key: 'onboarding_initiated_at', label: 'Onboarding Initiated' },
                                                { key: 'disbursement_initiated_at', label: 'Disbursement Initiated' },
                                                { key: 'disbursement_completed_at', label: 'Disbursement Completed' },
                                            ].map(item => {
                                                const isDone = Boolean(bookingFinanceState?.[item.key]);
                                                return (
                                                    <button
                                                        key={item.key}
                                                        onClick={() => handleFinanceOpToggle(item.key)}
                                                        className={`flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all ${
                                                            isDone
                                                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-300'
                                                                : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-white/[0.02] dark:border-white/5 dark:text-slate-300'
                                                        }`}
                                                    >
                                                        <div className="text-[10px] font-black uppercase tracking-widest">
                                                            {item.label}
                                                        </div>
                                                        <div className="text-[9px] font-bold">
                                                            {isDone ? 'Done' : 'Pending'}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className={mode === 'booking' ? 'pointer-events-none opacity-75' : ''}>
                                {financeMode === 'CASH' ? (
                                    <div
                                        className={cn(
                                            'bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/10 text-center',
                                            isPhone ? 'rounded-none p-6' : 'rounded-[2rem] p-12'
                                        )}
                                    >
                                        <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <Wallet size={32} className="text-slate-400" />
                                        </div>
                                        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">
                                            Cash Purchase Mode
                                        </h3>
                                        <p className="text-xs text-slate-500 max-w-xs mx-auto font-bold">
                                            This quote is configured for full payment. No finance or loan tracking is
                                            active for this session.
                                        </p>
                                        <button
                                            onClick={() => handleFinanceModeChange('LOAN')}
                                            className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg active:scale-95"
                                        >
                                            Switch to Loan Finance
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* FINANCE SCHEME CARD */}
                                        <div
                                            className={cn(
                                                'bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/10 overflow-hidden shadow-2xl shadow-indigo-500/5 transition-all',
                                                isPhone ? 'rounded-none' : 'rounded-[2.5rem]'
                                            )}
                                        >
                                            {/* Card Header with Avatar — READ-ONLY, COLLAPSIBLE */}
                                            <div
                                                className={cn(
                                                    'pb-4 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-50 dark:border-white/5 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors',
                                                    isPhone ? 'p-4' : 'p-8'
                                                )}
                                                onClick={() => setIsPrimaryFinanceExpanded(prev => !prev)}
                                            >
                                                <div className="flex items-center gap-5">
                                                    <div className="relative group/avatar">
                                                        {quote.finance?.bankLogo ? (
                                                            <img
                                                                src={quote.finance.bankLogo}
                                                                alt={quote.finance.bankName || 'Bank'}
                                                                className="w-14 h-14 rounded-2xl object-contain bg-white dark:bg-white/5 p-2 border border-slate-100 dark:border-white/10 shadow-md group-hover/avatar:scale-110 transition-transform"
                                                            />
                                                        ) : (
                                                            <div className="w-14 h-14 bg-indigo-600 dark:bg-white text-white dark:text-black rounded-2xl flex items-center justify-center text-base font-black tracking-tighter shadow-xl shadow-indigo-500/20 group-hover/avatar:scale-110 transition-transform">
                                                                {getBankInitials(quote.finance?.bankName || 'BANK')}
                                                            </div>
                                                        )}
                                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-white dark:border-[#0b0d10] rounded-full shadow-lg" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-3">
                                                            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                                                {quote.finance?.bankName || 'Selecting Bank...'}
                                                            </h3>
                                                        </div>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <span className="bg-blue-500/10 text-blue-600 shadow-sm text-[10px] font-black uppercase tracking-[0.1em] px-2.5 py-1 rounded-lg">
                                                                APPLICATION
                                                            </span>
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                                •
                                                            </span>
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                                PRIMARY
                                                            </span>
                                                            {quote.finance?.approvedScheme ||
                                                            quote.finance?.schemeCode ? (
                                                                <>
                                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                                        •
                                                                    </span>
                                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                                        {quote.finance?.approvedScheme ||
                                                                            quote.finance?.schemeCode}
                                                                    </span>
                                                                </>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    {/* Credit Score Badge */}
                                                    <div
                                                        className="flex items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm transition-all hover:border-indigo-500/30 group/cibil"
                                                        onClick={e => e.stopPropagation()}
                                                    >
                                                        <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover/cibil:scale-110 transition-transform">
                                                            <TrendingUp size={12} />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                                                CIBIL
                                                            </span>
                                                            <input
                                                                type="text"
                                                                value={creditScore}
                                                                onChange={e => {
                                                                    setCreditScore(e.target.value);
                                                                    setHasChanges(true);
                                                                }}
                                                                placeholder="—"
                                                                className="w-10 bg-transparent p-0 text-xs font-black text-slate-900 dark:text-white outline-none placeholder-slate-300"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div
                                                        className={`transition-transform duration-300 ${isPrimaryFinanceExpanded ? 'rotate-180' : ''}`}
                                                    >
                                                        <ChevronDown size={20} className="text-slate-400" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Collapsible Card Content */}
                                            {isPrimaryFinanceExpanded && (
                                                <>
                                                    {/* Card content - Broken down by Logic Sections */}
                                                    <div className="p-8 space-y-10">
                                                        {/* SECTION D: TERMS & PERFORMANCE (moved to top) */}
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-3 mb-6">
                                                                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-white/5 flex items-center justify-center text-indigo-500">
                                                                    <Clock size={18} />
                                                                </div>
                                                                <h4 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.25em]">
                                                                    Terms & Performance
                                                                </h4>
                                                                <div className="flex-1 h-px bg-slate-100 dark:bg-white/5" />
                                                            </div>
                                                            <div className="bg-slate-50/50 dark:bg-white/[0.01] rounded-[2rem] border border-slate-100 dark:border-white/5 overflow-hidden">
                                                                <PricingRow
                                                                    label="Financier"
                                                                    value={quote.finance?.bankName || '—'}
                                                                />
                                                                {quote.finance?.selection_logic && (
                                                                    <PricingRow
                                                                        label="Selection Logic"
                                                                        value={
                                                                            <span className="text-[10px] font-mono text-slate-500">
                                                                                {quote.finance.selection_logic}
                                                                            </span>
                                                                        }
                                                                    />
                                                                )}
                                                                <PricingRow
                                                                    label="Source"
                                                                    value={
                                                                        <span className="text-[10px] font-bold text-indigo-600 uppercase">
                                                                            {(() => {
                                                                                const createdEvent =
                                                                                    quote.timeline?.find(
                                                                                        t => t.event === 'Quote Created'
                                                                                    );
                                                                                if (
                                                                                    createdEvent?.actorType ===
                                                                                    'customer'
                                                                                ) {
                                                                                    return `Created by ${quote.customer.name}`;
                                                                                }
                                                                                return (
                                                                                    createdEvent?.actor || 'MARKETPLACE'
                                                                                );
                                                                            })()}
                                                                        </span>
                                                                    }
                                                                />
                                                                <PricingRow
                                                                    label="Status"
                                                                    value={
                                                                        <span
                                                                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                                                                quote.finance?.status === 'APPROVED'
                                                                                    ? 'bg-emerald-500/10 text-emerald-600'
                                                                                    : quote.finance?.status ===
                                                                                        'REJECTED'
                                                                                      ? 'bg-red-500/10 text-red-600'
                                                                                      : 'bg-blue-500/10 text-blue-600'
                                                                            }`}
                                                                        >
                                                                            {quote.finance?.status || 'IN_PROCESS'}
                                                                        </span>
                                                                    }
                                                                />
                                                                <PricingRow
                                                                    label="Scheme Name"
                                                                    value={
                                                                        isEditingFinance ? (
                                                                            <input
                                                                                type="text"
                                                                                value={
                                                                                    financeDraft.approvedScheme || ''
                                                                                }
                                                                                onChange={e =>
                                                                                    setFinanceDraft(p => ({
                                                                                        ...p,
                                                                                        approvedScheme: e.target.value,
                                                                                    }))
                                                                                }
                                                                                className="w-48 bg-transparent border-b border-indigo-500/30 focus:border-indigo-500 outline-none text-right font-black text-sm p-0"
                                                                                placeholder="e.g. SPECIAL 2024"
                                                                            />
                                                                        ) : (
                                                                            financeDraft.approvedScheme ||
                                                                            quote.finance?.approvedScheme ||
                                                                            'STANDARD'
                                                                        )
                                                                    }
                                                                />
                                                                <PricingRow
                                                                    label="Tenure"
                                                                    value={
                                                                        isEditingFinance ? (
                                                                            <div className="flex items-center gap-2">
                                                                                <input
                                                                                    type="number"
                                                                                    value={
                                                                                        financeDraft.approvedTenure || 0
                                                                                    }
                                                                                    onChange={e =>
                                                                                        setFinanceDraft(p => ({
                                                                                            ...p,
                                                                                            approvedTenure:
                                                                                                parseInt(
                                                                                                    e.target.value
                                                                                                ) || 0,
                                                                                        }))
                                                                                    }
                                                                                    className="w-16 bg-transparent border-b border-indigo-500/30 focus:border-indigo-500 outline-none text-right font-black text-sm p-0"
                                                                                />
                                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                                                    Months
                                                                                </span>
                                                                            </div>
                                                                        ) : (
                                                                            `${quote.finance?.approvedTenure || 0} Months`
                                                                        )
                                                                    }
                                                                    description={
                                                                        <span className="text-[8px] text-slate-400 uppercase font-black tracking-widest italic">
                                                                            Applied: {quote.finance?.tenureMonths || 0}{' '}
                                                                            MO
                                                                        </span>
                                                                    }
                                                                />
                                                                <PricingRow
                                                                    isBold
                                                                    label="Monthly EMI"
                                                                    value={
                                                                        isEditingFinance ? (
                                                                            <div className="flex items-center gap-1">
                                                                                <span className="text-slate-400 text-xs font-bold">
                                                                                    ₹
                                                                                </span>
                                                                                <input
                                                                                    type="number"
                                                                                    value={
                                                                                        financeDraft.approvedEmi || 0
                                                                                    }
                                                                                    onChange={e =>
                                                                                        setFinanceDraft(p => ({
                                                                                            ...p,
                                                                                            approvedEmi:
                                                                                                parseInt(
                                                                                                    e.target.value
                                                                                                ) || 0,
                                                                                        }))
                                                                                    }
                                                                                    className="w-28 bg-transparent border-b border-indigo-500/30 focus:border-indigo-500 outline-none text-right font-black text-sm p-0"
                                                                                />
                                                                            </div>
                                                                        ) : (
                                                                            formatCurrency(
                                                                                quote.finance?.approvedEmi || 0
                                                                            )
                                                                        )
                                                                    }
                                                                    description={
                                                                        <span className="text-[8px] text-emerald-500 uppercase font-extrabold tracking-widest italic">
                                                                            Approved Repayment Amount
                                                                        </span>
                                                                    }
                                                                />
                                                                <PricingRow
                                                                    label="Rate of Interest (Flat/Reducing)"
                                                                    value={
                                                                        isEditingFinance ? (
                                                                            <div className="flex items-center gap-1">
                                                                                <input
                                                                                    type="number"
                                                                                    value={
                                                                                        financeDraft.approvedIrr || 0
                                                                                    }
                                                                                    step="0.01"
                                                                                    onChange={e =>
                                                                                        setFinanceDraft(p => ({
                                                                                            ...p,
                                                                                            approvedIrr:
                                                                                                parseFloat(
                                                                                                    e.target.value
                                                                                                ) || 0,
                                                                                        }))
                                                                                    }
                                                                                    className="w-16 bg-transparent border-b border-indigo-500/30 focus:border-indigo-500 outline-none text-right font-black text-sm p-0"
                                                                                />
                                                                                <span className="text-xs font-bold text-slate-400">
                                                                                    %
                                                                                </span>
                                                                            </div>
                                                                        ) : (
                                                                            `${quote.finance?.approvedIrr || 0}%`
                                                                        )
                                                                    }
                                                                    description={
                                                                        <span className="text-[8px] text-slate-400 uppercase font-black tracking-widest italic">
                                                                            Actual IRR (System):{' '}
                                                                            {quote.finance?.roi ?? 0}%
                                                                        </span>
                                                                    }
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* SECTION A: ASSET SETTLEMENT */}
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-3 mb-6">
                                                                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-white/5 flex items-center justify-center text-indigo-500">
                                                                    <Target size={18} />
                                                                </div>
                                                                <h4 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.25em]">
                                                                    Asset Settlement
                                                                </h4>
                                                                <div className="flex-1 h-px bg-slate-100 dark:bg-white/5" />
                                                            </div>
                                                            <div className="bg-slate-50/50 dark:bg-white/[0.01] rounded-[2rem] border border-slate-100 dark:border-white/5 overflow-hidden">
                                                                <PricingRow
                                                                    label="Asset Cost (Net SOT)"
                                                                    value={formatCurrency(localPricing.finalTotal)}
                                                                    description={
                                                                        <span className="text-[8px] text-slate-400 uppercase font-bold tracking-widest">
                                                                            Locked: Original Quote Value
                                                                        </span>
                                                                    }
                                                                />
                                                                <PricingRow
                                                                    label="Offer Discount"
                                                                    value={
                                                                        isEditingFinance ? (
                                                                            <div className="flex items-center gap-1">
                                                                                <span className="text-slate-400 text-xs font-bold">
                                                                                    ₹
                                                                                </span>
                                                                                <input
                                                                                    type="number"
                                                                                    value={
                                                                                        financeDraft.approvedMarginMoney ||
                                                                                        0
                                                                                    }
                                                                                    onChange={e =>
                                                                                        setFinanceDraft(p => ({
                                                                                            ...p,
                                                                                            approvedMarginMoney:
                                                                                                parseInt(
                                                                                                    e.target.value
                                                                                                ) || 0,
                                                                                        }))
                                                                                    }
                                                                                    className="w-24 bg-transparent border-b border-indigo-500/30 focus:border-indigo-500 outline-none text-right font-black text-sm p-0"
                                                                                />
                                                                            </div>
                                                                        ) : (
                                                                            formatCurrency(
                                                                                quote.finance?.approvedMarginMoney || 0
                                                                            )
                                                                        )
                                                                    }
                                                                    description={
                                                                        <span className="text-[8px] text-slate-400 uppercase font-black tracking-widest">
                                                                            Applied: ₹0
                                                                        </span>
                                                                    }
                                                                />
                                                                <PricingRow
                                                                    isBold
                                                                    label="Total Payable"
                                                                    value={formatCurrency(
                                                                        localPricing.finalTotal -
                                                                            (isEditingFinance
                                                                                ? financeDraft.approvedMarginMoney || 0
                                                                                : quote.finance?.approvedMarginMoney ||
                                                                                  0)
                                                                    )}
                                                                    description={
                                                                        <span className="text-[8px] text-emerald-500 uppercase font-extrabold tracking-widest italic">
                                                                            Asset Cost - Discount
                                                                        </span>
                                                                    }
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* SECTION B: FINANCE PILLARS */}
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-3 mb-6">
                                                                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-white/5 flex items-center justify-center text-indigo-500">
                                                                    <TrendingUp size={18} />
                                                                </div>
                                                                <h4 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.25em]">
                                                                    Finance Pillars
                                                                </h4>
                                                                <div className="flex-1 h-px bg-slate-100 dark:bg-white/5" />
                                                            </div>
                                                            <div className="bg-slate-50/50 dark:bg-white/[0.01] rounded-[2rem] border border-slate-100 dark:border-white/5 overflow-hidden">
                                                                <PricingRow
                                                                    label="Net Loan Amount"
                                                                    value={
                                                                        isEditingFinance ? (
                                                                            <div className="flex items-center gap-1">
                                                                                <span className="text-slate-400 text-xs font-bold">
                                                                                    ₹
                                                                                </span>
                                                                                <input
                                                                                    type="number"
                                                                                    value={
                                                                                        financeDraft.approvedAmount || 0
                                                                                    }
                                                                                    onChange={e =>
                                                                                        setFinanceDraft(p => ({
                                                                                            ...p,
                                                                                            approvedAmount:
                                                                                                parseInt(
                                                                                                    e.target.value
                                                                                                ) || 0,
                                                                                        }))
                                                                                    }
                                                                                    className="w-32 bg-transparent border-b border-indigo-500/30 focus:border-indigo-500 outline-none text-right font-black text-sm p-0"
                                                                                />
                                                                            </div>
                                                                        ) : (
                                                                            formatCurrency(
                                                                                quote.finance?.approvedAmount || 0
                                                                            )
                                                                        )
                                                                    }
                                                                    description={
                                                                        <span className="text-[8px] text-slate-400 uppercase font-black tracking-widest italic">
                                                                            Asset Cost − Down Payment
                                                                        </span>
                                                                    }
                                                                />
                                                                <PricingRow
                                                                    label="Loan Add-ons"
                                                                    value={formatCurrency(
                                                                        isEditingFinance
                                                                            ? financeDraft.approvedAddOns || 0
                                                                            : quote.finance?.approvedAddOns || 0
                                                                    )}
                                                                    description={
                                                                        <span className="text-[8px] text-slate-400 uppercase font-black tracking-widest italic">
                                                                            Financed extras included in loan
                                                                        </span>
                                                                    }
                                                                />
                                                                {/* Tree breakdown of loan add-ons */}
                                                                {(isEditingFinance
                                                                    ? financeDraft.approvedAddonsBreakup || []
                                                                    : quote.finance?.approvedAddonsBreakup || []
                                                                ).map((addon: any, idx: number) => (
                                                                    <PricingRow
                                                                        key={`addon-${idx}`}
                                                                        isSub
                                                                        label={
                                                                            isEditingFinance ? (
                                                                                <input
                                                                                    type="text"
                                                                                    value={addon.label}
                                                                                    onChange={e => {
                                                                                        const newBreakup = [
                                                                                            ...(financeDraft.approvedAddonsBreakup ||
                                                                                                []),
                                                                                        ];
                                                                                        newBreakup[idx] = {
                                                                                            ...newBreakup[idx],
                                                                                            label: e.target.value,
                                                                                        };
                                                                                        setFinanceDraft(d => ({
                                                                                            ...d,
                                                                                            approvedAddonsBreakup:
                                                                                                newBreakup,
                                                                                        }));
                                                                                    }}
                                                                                    className="bg-transparent border-b border-indigo-500/30 outline-none w-28 focus:border-indigo-500 font-bold"
                                                                                />
                                                                            ) : (
                                                                                addon.label
                                                                            )
                                                                        }
                                                                        value={
                                                                            isEditingFinance ? (
                                                                                <div className="flex items-center gap-1">
                                                                                    <span className="text-slate-400 font-bold">
                                                                                        ₹
                                                                                    </span>
                                                                                    <input
                                                                                        type="number"
                                                                                        value={addon.amount}
                                                                                        onChange={e => {
                                                                                            const val =
                                                                                                parseInt(
                                                                                                    e.target.value
                                                                                                ) || 0;
                                                                                            const newBreakup = [
                                                                                                ...(financeDraft.approvedAddonsBreakup ||
                                                                                                    []),
                                                                                            ];
                                                                                            newBreakup[idx] = {
                                                                                                ...newBreakup[idx],
                                                                                                amount: val,
                                                                                            };
                                                                                            const newTotal =
                                                                                                newBreakup.reduce(
                                                                                                    (
                                                                                                        sum: number,
                                                                                                        a: any
                                                                                                    ) => sum + a.amount,
                                                                                                    0
                                                                                                );
                                                                                            setFinanceDraft(d => ({
                                                                                                ...d,
                                                                                                approvedAddonsBreakup:
                                                                                                    newBreakup,
                                                                                                approvedAddOns:
                                                                                                    newTotal,
                                                                                            }));
                                                                                        }}
                                                                                        className="bg-transparent border-b border-indigo-500/30 outline-none w-20 text-right focus:border-indigo-500 font-black"
                                                                                    />
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            const newBreakup = (
                                                                                                financeDraft.approvedAddonsBreakup ||
                                                                                                []
                                                                                            ).filter(
                                                                                                (_: any, i: number) =>
                                                                                                    i !== idx
                                                                                            );
                                                                                            const newTotal =
                                                                                                newBreakup.reduce(
                                                                                                    (
                                                                                                        sum: number,
                                                                                                        a: any
                                                                                                    ) => sum + a.amount,
                                                                                                    0
                                                                                                );
                                                                                            setFinanceDraft(d => ({
                                                                                                ...d,
                                                                                                approvedAddonsBreakup:
                                                                                                    newBreakup,
                                                                                                approvedAddOns:
                                                                                                    newTotal,
                                                                                            }));
                                                                                        }}
                                                                                        className="text-red-500 ml-2 hover:bg-red-500/10 p-1 rounded"
                                                                                    >
                                                                                        <XCircle size={12} />
                                                                                    </button>
                                                                                </div>
                                                                            ) : (
                                                                                formatCurrency(addon.amount || 0)
                                                                            )
                                                                        }
                                                                    />
                                                                ))}
                                                                {isEditingFinance && (
                                                                    <div className="flex justify-start p-3 pl-12 border-b border-slate-100 dark:border-white/5">
                                                                        <button
                                                                            onClick={() => {
                                                                                const newBreakup = [
                                                                                    ...(financeDraft.approvedAddonsBreakup ||
                                                                                        []),
                                                                                    { label: 'New Add-on', amount: 0 },
                                                                                ];
                                                                                setFinanceDraft(d => ({
                                                                                    ...d,
                                                                                    approvedAddonsBreakup: newBreakup,
                                                                                }));
                                                                            }}
                                                                            className="flex items-center gap-1.5 text-[9px] font-black text-indigo-500 uppercase bg-indigo-500/10 px-3 py-1.5 rounded-xl hover:bg-indigo-500/20 active:scale-95 transition-all"
                                                                        >
                                                                            <PlusCircle size={12} /> Add Add-on
                                                                        </button>
                                                                    </div>
                                                                )}
                                                                <PricingRow
                                                                    isBold
                                                                    label="Gross Loan Amount"
                                                                    value={formatCurrency(
                                                                        (isEditingFinance
                                                                            ? financeDraft.approvedAmount || 0
                                                                            : quote.finance?.approvedAmount || 0) +
                                                                            (isEditingFinance
                                                                                ? financeDraft.approvedAddOns || 0
                                                                                : quote.finance?.approvedAddOns || 0)
                                                                    )}
                                                                    description={
                                                                        <span className="text-[8px] text-emerald-500 uppercase font-extrabold tracking-widest italic">
                                                                            Net Loan + Loan Add-ons
                                                                        </span>
                                                                    }
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* SECTION C-1: UPFRONT OBLIGATIONS */}
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-3 mb-6">
                                                                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-white/5 flex items-center justify-center text-indigo-500">
                                                                    <Wallet size={18} />
                                                                </div>
                                                                <h4 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.25em]">
                                                                    Upfront Obligations
                                                                </h4>
                                                                <div className="flex-1 h-px bg-slate-100 dark:bg-white/5" />
                                                            </div>
                                                            <div className="bg-slate-50/50 dark:bg-white/[0.01] rounded-[2rem] border border-slate-100 dark:border-white/5 overflow-hidden">
                                                                <PricingRow
                                                                    isBold
                                                                    label="Total Upfront Charges"
                                                                    value={formatCurrency(
                                                                        isEditingFinance
                                                                            ? financeDraft.approvedProcessingFee || 0
                                                                            : quote.finance?.approvedProcessingFee || 0
                                                                    )}
                                                                    description={
                                                                        <span className="text-[8px] text-emerald-500 uppercase font-extrabold tracking-widest italic">
                                                                            Payable to Finance Partner
                                                                        </span>
                                                                    }
                                                                />
                                                                {/* Tree breakdown of charges */}
                                                                {(isEditingFinance
                                                                    ? financeDraft.approvedChargesBreakup || []
                                                                    : quote.finance?.approvedChargesBreakup || []
                                                                ).map((charge, idx) => (
                                                                    <PricingRow
                                                                        key={idx}
                                                                        isSub
                                                                        label={
                                                                            isEditingFinance ? (
                                                                                <input
                                                                                    type="text"
                                                                                    value={charge.label}
                                                                                    onChange={e => {
                                                                                        const newBreakup = [
                                                                                            ...(financeDraft.approvedChargesBreakup ||
                                                                                                []),
                                                                                        ];
                                                                                        newBreakup[idx] = {
                                                                                            ...newBreakup[idx],
                                                                                            label: e.target.value,
                                                                                        };
                                                                                        setFinanceDraft(d => ({
                                                                                            ...d,
                                                                                            approvedChargesBreakup:
                                                                                                newBreakup,
                                                                                        }));
                                                                                    }}
                                                                                    className="bg-transparent border-b border-indigo-500/30 outline-none w-28 focus:border-indigo-500 font-bold"
                                                                                />
                                                                            ) : (
                                                                                charge.label
                                                                            )
                                                                        }
                                                                        value={
                                                                            isEditingFinance ? (
                                                                                <div className="flex items-center gap-1">
                                                                                    <span className="text-slate-400 font-bold">
                                                                                        ₹
                                                                                    </span>
                                                                                    <input
                                                                                        type="number"
                                                                                        value={charge.amount}
                                                                                        onChange={e => {
                                                                                            const val =
                                                                                                parseInt(
                                                                                                    e.target.value
                                                                                                ) || 0;
                                                                                            const newBreakup = [
                                                                                                ...(financeDraft.approvedChargesBreakup ||
                                                                                                    []),
                                                                                            ];
                                                                                            newBreakup[idx] = {
                                                                                                ...newBreakup[idx],
                                                                                                amount: val,
                                                                                            };
                                                                                            const newTotal =
                                                                                                newBreakup.reduce(
                                                                                                    (sum, c) =>
                                                                                                        sum + c.amount,
                                                                                                    0
                                                                                                );
                                                                                            setFinanceDraft(d => ({
                                                                                                ...d,
                                                                                                approvedChargesBreakup:
                                                                                                    newBreakup,
                                                                                                approvedProcessingFee:
                                                                                                    newTotal,
                                                                                            }));
                                                                                        }}
                                                                                        className="bg-transparent border-b border-indigo-500/30 outline-none w-20 text-right focus:border-indigo-500 font-black"
                                                                                    />
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            const newBreakup = (
                                                                                                financeDraft.approvedChargesBreakup ||
                                                                                                []
                                                                                            ).filter(
                                                                                                (_, i) => i !== idx
                                                                                            );
                                                                                            const newTotal =
                                                                                                newBreakup.reduce(
                                                                                                    (sum, c) =>
                                                                                                        sum + c.amount,
                                                                                                    0
                                                                                                );
                                                                                            setFinanceDraft(d => ({
                                                                                                ...d,
                                                                                                approvedChargesBreakup:
                                                                                                    newBreakup,
                                                                                                approvedProcessingFee:
                                                                                                    newTotal,
                                                                                            }));
                                                                                        }}
                                                                                        className="text-red-500 ml-2 hover:bg-red-500/10 p-1 rounded"
                                                                                    >
                                                                                        <XCircle size={12} />
                                                                                    </button>
                                                                                </div>
                                                                            ) : (
                                                                                formatCurrency(charge.amount || 0)
                                                                            )
                                                                        }
                                                                    />
                                                                ))}
                                                                {isEditingFinance && (
                                                                    <div className="flex justify-start p-3 pl-12 border-b border-slate-100 dark:border-white/5">
                                                                        <button
                                                                            onClick={() => {
                                                                                const newBreakup = [
                                                                                    ...(financeDraft.approvedChargesBreakup ||
                                                                                        []),
                                                                                    { label: 'New Charge', amount: 0 },
                                                                                ];
                                                                                setFinanceDraft(d => ({
                                                                                    ...d,
                                                                                    approvedChargesBreakup: newBreakup,
                                                                                }));
                                                                            }}
                                                                            className="flex items-center gap-1.5 text-[9px] font-black text-indigo-500 uppercase bg-indigo-500/10 px-3 py-1.5 rounded-xl hover:bg-indigo-500/20 active:scale-95 transition-all"
                                                                        >
                                                                            <PlusCircle size={12} /> Add Row
                                                                        </button>
                                                                    </div>
                                                                )}
                                                                {(() => {
                                                                    const upfrontCharges = isEditingFinance
                                                                        ? financeDraft.approvedProcessingFee || 0
                                                                        : quote.finance?.approvedProcessingFee || 0;
                                                                    const downPayment = isEditingFinance
                                                                        ? financeDraft.approvedDownPayment || 0
                                                                        : quote.finance?.approvedDownPayment || 0;
                                                                    const netLoan = isEditingFinance
                                                                        ? financeDraft.approvedAmount || 0
                                                                        : quote.finance?.approvedAmount || 0;
                                                                    const marginMoney = Math.max(
                                                                        0,
                                                                        localPricing.finalTotal +
                                                                            upfrontCharges -
                                                                            downPayment -
                                                                            netLoan
                                                                    );
                                                                    return (
                                                                        <PricingRow
                                                                            label="Margin Money"
                                                                            value={formatCurrency(marginMoney)}
                                                                            description={
                                                                                <span className="text-[8px] text-amber-500 uppercase font-extrabold tracking-widest italic">
                                                                                    Payable + Upfront − DP − Loan
                                                                                </span>
                                                                            }
                                                                        />
                                                                    );
                                                                })()}
                                                                <PricingRow
                                                                    isBold
                                                                    label="Down Payment"
                                                                    value={
                                                                        isEditingFinance ? (
                                                                            <div className="flex items-center gap-1">
                                                                                <span className="text-slate-400 text-xs font-bold">
                                                                                    ₹
                                                                                </span>
                                                                                <input
                                                                                    type="number"
                                                                                    value={
                                                                                        financeDraft.approvedDownPayment ||
                                                                                        0
                                                                                    }
                                                                                    onChange={e =>
                                                                                        setFinanceDraft(p => ({
                                                                                            ...p,
                                                                                            approvedDownPayment:
                                                                                                parseInt(
                                                                                                    e.target.value
                                                                                                ) || 0,
                                                                                        }))
                                                                                    }
                                                                                    className="w-32 bg-transparent border-b border-indigo-500/30 focus:border-indigo-500 outline-none text-right font-black text-sm p-0"
                                                                                />
                                                                            </div>
                                                                        ) : (
                                                                            formatCurrency(
                                                                                quote.finance?.approvedDownPayment || 0
                                                                            )
                                                                        )
                                                                    }
                                                                    description={
                                                                        <span className="text-[8px] text-emerald-500 uppercase font-extrabold tracking-widest italic">
                                                                            Margin Money + Upfront Charges
                                                                        </span>
                                                                    }
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Card Footer - Save/Cancel Actions */}
                                                    {isEditingFinance && (
                                                        <div className="p-8 bg-indigo-500/5 border-t border-indigo-500/10 flex justify-end gap-3 transition-all animate-in slide-in-from-bottom-2 duration-300">
                                                            <button
                                                                className="px-6 py-2 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-white/20 transition-all"
                                                                onClick={() => {
                                                                    setFinanceDraft({ ...quote.finance });
                                                                    setIsEditingFinance(false);
                                                                }}
                                                            >
                                                                Discard Changes
                                                            </button>
                                                            <button
                                                                className="px-8 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
                                                                onClick={async () => {
                                                                    const updatedFinance = {
                                                                        ...quote.finance,
                                                                        ...financeDraft,
                                                                    };
                                                                    setIsSaving(true);
                                                                    // Here we would call a server action, or just update local state if it's managed by Parent
                                                                    // For now, let's update the quote object locally and trigger onSave if needed
                                                                    // @ts-ignore
                                                                    quote.finance = updatedFinance;
                                                                    setIsEditingFinance(false);
                                                                    setHasChanges(true);
                                                                    toast.success('Finance Approved Terms updated');
                                                                    setIsSaving(false);
                                                                }}
                                                            >
                                                                Apply Approved Terms
                                                            </button>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        {/* FINANCE ENTRY CARDS — Exact Clone of Primary APPLICATION Card */}
                                        {financeEntries.map((entry, idx) => (
                                            <div
                                                key={entry.id}
                                                className="bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-indigo-500/5 transition-all"
                                            >
                                                {/* Card Header — Gated: Financier & Executive lock after selection */}
                                                <div
                                                    className="p-8 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-50 dark:border-white/5 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
                                                    onClick={() =>
                                                        entry.locked &&
                                                        setNewEntryExpandedMap(prev => ({
                                                            ...prev,
                                                            [entry.id]:
                                                                prev[entry.id] === undefined ? false : !prev[entry.id],
                                                        }))
                                                    }
                                                >
                                                    <div className="flex items-center gap-5">
                                                        <div className="relative group/avatar">
                                                            <div className="w-14 h-14 bg-indigo-600 dark:bg-white text-white dark:text-black rounded-2xl flex items-center justify-center text-base font-black tracking-tighter shadow-xl shadow-indigo-500/20 group-hover/avatar:scale-110 transition-transform">
                                                                {entry.bankName
                                                                    ? getBankInitials(entry.bankName)
                                                                    : (idx + 2).toString().padStart(2, '0')}
                                                            </div>
                                                            <div
                                                                className={`absolute -bottom-1 -right-1 w-5 h-5 border-4 border-white dark:border-[#0b0d10] rounded-full shadow-lg ${entry.locked ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                                            />
                                                        </div>
                                                        <div>
                                                            {entry.locked ? (
                                                                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                                                    {entry.bankName}
                                                                </h3>
                                                            ) : (
                                                                <select
                                                                    value={entry.bankName}
                                                                    onClick={e => e.stopPropagation()}
                                                                    onChange={e => {
                                                                        const val = e.target.value;
                                                                        const bankObj = availableBanks.find(
                                                                            b => b.name === val
                                                                        );
                                                                        // Fetch schemes for the selected bank
                                                                        if (bankObj?.id) {
                                                                            fetchSchemesForBank(bankObj.id);
                                                                            fetchBankTeam(bankObj.id);
                                                                        }
                                                                        setFinanceEntries(prev =>
                                                                            prev.map(en => {
                                                                                if (en.id !== entry.id) return en;
                                                                                const updated = {
                                                                                    ...en,
                                                                                    bankName: val,
                                                                                    bankId: bankObj?.id || '',
                                                                                    // Reset scheme selection on bank change
                                                                                    schemeId: '',
                                                                                    schemeName: '',
                                                                                    selectedScheme: null,
                                                                                    upfrontCharges: [],
                                                                                    fundedAddons: [],
                                                                                    status: val
                                                                                        ? 'APPLICATION'
                                                                                        : 'IN_PROCESS',
                                                                                };
                                                                                // Auto-lock if both fields are now filled
                                                                                if (
                                                                                    updated.bankName &&
                                                                                    updated.executiveName
                                                                                )
                                                                                    updated.locked = true;
                                                                                return updated;
                                                                            })
                                                                        );
                                                                    }}
                                                                    className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter bg-transparent border-b-2 border-dashed border-indigo-500/40 focus:border-indigo-500 outline-none w-64 cursor-pointer"
                                                                >
                                                                    <option value="">Select Financier...</option>
                                                                    {availableBanks.map(bank => (
                                                                        <option key={bank.id} value={bank.name}>
                                                                            {bank.name}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            )}
                                                            <div className="flex items-center gap-3 mt-1">
                                                                <span
                                                                    className={`shadow-sm text-[10px] font-black uppercase tracking-[0.1em] px-2.5 py-1 rounded-lg ${entry.locked ? 'bg-blue-500/10 text-blue-600' : 'bg-amber-500/10 text-amber-600'}`}
                                                                >
                                                                    {entry.locked ? 'APPLICATION' : 'SETUP'}
                                                                </span>
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                                    •
                                                                </span>
                                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                                    ATTEMPT #{idx + 2}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div
                                                            className="flex flex-col items-end gap-1"
                                                            onClick={e => e.stopPropagation()}
                                                        >
                                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                                                Executive
                                                            </span>
                                                            {entry.locked ? (
                                                                <span className="text-sm font-black text-slate-900 dark:text-white">
                                                                    {entry.executiveName}
                                                                </span>
                                                            ) : (
                                                                <select
                                                                    value={entry.executiveName}
                                                                    onChange={e => {
                                                                        const val = e.target.value;
                                                                        setFinanceEntries(prev =>
                                                                            prev.map(en => {
                                                                                if (en.id !== entry.id) return en;
                                                                                const updated = {
                                                                                    ...en,
                                                                                    executiveName: val,
                                                                                };
                                                                                if (
                                                                                    updated.bankName &&
                                                                                    updated.executiveName
                                                                                )
                                                                                    updated.locked = true;
                                                                                return updated;
                                                                            })
                                                                        );
                                                                    }}
                                                                    className="text-sm font-black text-slate-900 dark:text-white bg-transparent border-b-2 border-dashed border-indigo-500/40 focus:border-indigo-500 outline-none cursor-pointer min-w-[140px] text-right"
                                                                >
                                                                    <option value="">Select...</option>
                                                                    {(entry.bankId
                                                                        ? getBankTeam(entry.bankId)
                                                                        : teamMembers
                                                                    ).map(member => (
                                                                        <option key={member.id} value={member.name}>
                                                                            {member.name}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                if (entry.persisted) return;
                                                                setFinanceEntries(prev =>
                                                                    prev.filter(en => en.id !== entry.id)
                                                                );
                                                            }}
                                                            className="text-slate-400 hover:text-red-500 transition-colors"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                        {entry.persisted && (
                                                            <button
                                                                onClick={e => {
                                                                    e.stopPropagation();
                                                                    setFinanceEntries(prev =>
                                                                        prev.map(en =>
                                                                            en.id === entry.id
                                                                                ? { ...en, locked: !en.locked }
                                                                                : en
                                                                        )
                                                                    );
                                                                }}
                                                                className="text-[10px] font-black uppercase tracking-widest text-indigo-600"
                                                            >
                                                                {entry.locked ? 'Edit' : 'Lock'}
                                                            </button>
                                                        )}
                                                        {entry.persisted && (
                                                            <button
                                                                onClick={async e => {
                                                                    e.stopPropagation();
                                                                    const result = await setQuoteActiveFinanceAttempt(
                                                                        quote.id,
                                                                        entry.id
                                                                    );
                                                                    if (result.success) {
                                                                        toast.success('Set as primary finance');
                                                                        onRefresh?.();
                                                                    } else {
                                                                        toast.error(
                                                                            result.error || 'Failed to set primary'
                                                                        );
                                                                    }
                                                                }}
                                                                className="text-[10px] font-black uppercase tracking-widest text-emerald-600"
                                                            >
                                                                Make Primary
                                                            </button>
                                                        )}
                                                        {entry.locked && (
                                                            <div
                                                                className={`transition-transform duration-300 ${newEntryExpandedMap[entry.id] !== false ? 'rotate-180' : ''}`}
                                                            >
                                                                <ChevronDown size={20} className="text-slate-400" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Setup Gate: Show prompt if not locked yet */}
                                                {!entry.locked && (
                                                    <div className="p-8 text-center">
                                                        <div className="text-slate-400 text-sm font-bold">
                                                            Select both{' '}
                                                            <span className="text-indigo-500">Financier</span> and{' '}
                                                            <span className="text-indigo-500">Executive</span> above to
                                                            unlock the finance card
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Collapsible Card Content — Only when locked & expanded */}
                                                {entry.locked && newEntryExpandedMap[entry.id] !== false && (
                                                    <div className="p-8 space-y-10">
                                                        {/* SECTION A: ASSET SETTLEMENT */}
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-3 mb-6">
                                                                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-white/5 flex items-center justify-center text-indigo-500">
                                                                    <Target size={18} />
                                                                </div>
                                                                <h4 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.25em]">
                                                                    Asset Settlement
                                                                </h4>
                                                                <div className="flex-1 h-px bg-slate-100 dark:bg-white/5" />
                                                            </div>
                                                            <div className="bg-slate-50/50 dark:bg-white/[0.01] rounded-[2rem] border border-slate-100 dark:border-white/5 overflow-hidden">
                                                                <PricingRow
                                                                    label="Asset Cost"
                                                                    value={
                                                                        <div className="flex items-center gap-1">
                                                                            <span className="text-slate-400 text-xs font-bold">
                                                                                ₹
                                                                            </span>
                                                                            <input
                                                                                type="number"
                                                                                value={entry.assetCost || 0}
                                                                                onChange={e => {
                                                                                    const val = e.target.value;
                                                                                    setFinanceEntries(prev =>
                                                                                        prev.map(en =>
                                                                                            en.id === entry.id
                                                                                                ? {
                                                                                                      ...en,
                                                                                                      assetCost: val,
                                                                                                      offerDiscount:
                                                                                                          String(
                                                                                                              Math.max(
                                                                                                                  0,
                                                                                                                  (parseInt(
                                                                                                                      val
                                                                                                                  ) ||
                                                                                                                      0) +
                                                                                                                      (parseInt(
                                                                                                                          en.accessoriesCharges
                                                                                                                      ) ||
                                                                                                                          0) -
                                                                                                                      (parseInt(
                                                                                                                          en.finalAmountPayable
                                                                                                                      ) ||
                                                                                                                          0)
                                                                                                              )
                                                                                                          ),
                                                                                                  }
                                                                                                : en
                                                                                        )
                                                                                    );
                                                                                }}
                                                                                className="w-32 bg-transparent border-b border-indigo-500/30 focus:border-indigo-500 outline-none text-right font-black text-sm p-0"
                                                                            />
                                                                        </div>
                                                                    }
                                                                    description={
                                                                        <span className="text-[8px] text-slate-400 uppercase font-bold tracking-widest">
                                                                            Vehicle On-Road Price
                                                                        </span>
                                                                    }
                                                                />
                                                                <PricingRow
                                                                    label="Accessories Charges"
                                                                    value={
                                                                        <div className="flex items-center gap-1">
                                                                            <span className="text-slate-400 text-xs font-bold">
                                                                                ₹
                                                                            </span>
                                                                            <input
                                                                                type="number"
                                                                                value={entry.accessoriesCharges || 0}
                                                                                onChange={e => {
                                                                                    const val = e.target.value;
                                                                                    setFinanceEntries(prev =>
                                                                                        prev.map(en =>
                                                                                            en.id === entry.id
                                                                                                ? {
                                                                                                      ...en,
                                                                                                      accessoriesCharges:
                                                                                                          val,
                                                                                                      offerDiscount:
                                                                                                          String(
                                                                                                              Math.max(
                                                                                                                  0,
                                                                                                                  (parseInt(
                                                                                                                      en.assetCost
                                                                                                                  ) ||
                                                                                                                      0) +
                                                                                                                      (parseInt(
                                                                                                                          val
                                                                                                                      ) ||
                                                                                                                          0) -
                                                                                                                      (parseInt(
                                                                                                                          en.finalAmountPayable
                                                                                                                      ) ||
                                                                                                                          0)
                                                                                                              )
                                                                                                          ),
                                                                                                  }
                                                                                                : en
                                                                                        )
                                                                                    );
                                                                                }}
                                                                                className="w-28 bg-transparent border-b border-indigo-500/30 focus:border-indigo-500 outline-none text-right font-black text-sm p-0"
                                                                            />
                                                                        </div>
                                                                    }
                                                                    description={
                                                                        <span className="text-[8px] text-slate-400 uppercase font-bold tracking-widest">
                                                                            Add-on Accessories & Kits
                                                                        </span>
                                                                    }
                                                                />
                                                                <PricingRow
                                                                    label="Discount"
                                                                    value={formatCurrency(
                                                                        Math.max(
                                                                            0,
                                                                            (parseInt(entry.assetCost) || 0) +
                                                                                (parseInt(entry.accessoriesCharges) ||
                                                                                    0) -
                                                                                (parseInt(entry.finalAmountPayable) ||
                                                                                    0)
                                                                        )
                                                                    )}
                                                                    description={
                                                                        <span className="text-[8px] text-slate-400 uppercase font-black tracking-widest">
                                                                            Asset Cost + Accessories − Quote Amount
                                                                        </span>
                                                                    }
                                                                />
                                                                <PricingRow
                                                                    isBold
                                                                    label="Final Amount Payable"
                                                                    value={
                                                                        <div className="flex items-center gap-1">
                                                                            <span className="text-slate-400 text-xs font-bold">
                                                                                ₹
                                                                            </span>
                                                                            <input
                                                                                type="number"
                                                                                value={entry.finalAmountPayable || 0}
                                                                                onChange={e => {
                                                                                    const val = e.target.value;
                                                                                    setFinanceEntries(prev =>
                                                                                        prev.map(en =>
                                                                                            en.id === entry.id
                                                                                                ? {
                                                                                                      ...en,
                                                                                                      finalAmountPayable:
                                                                                                          val,
                                                                                                      offerDiscount:
                                                                                                          String(
                                                                                                              Math.max(
                                                                                                                  0,
                                                                                                                  (parseInt(
                                                                                                                      en.assetCost
                                                                                                                  ) ||
                                                                                                                      0) +
                                                                                                                      (parseInt(
                                                                                                                          en.accessoriesCharges
                                                                                                                      ) ||
                                                                                                                          0) -
                                                                                                                      (parseInt(
                                                                                                                          val
                                                                                                                      ) ||
                                                                                                                          0)
                                                                                                              )
                                                                                                          ),
                                                                                                  }
                                                                                                : en
                                                                                        )
                                                                                    );
                                                                                }}
                                                                                className="w-32 bg-transparent border-b border-indigo-500/30 focus:border-indigo-500 outline-none text-right font-black text-sm p-0"
                                                                            />
                                                                        </div>
                                                                    }
                                                                    description={
                                                                        <span className="text-[8px] text-emerald-500 uppercase font-extrabold tracking-widest italic">
                                                                            Quote Amount (Prefilled)
                                                                        </span>
                                                                    }
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* SECTION B: FINANCE PILLARS */}
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-3 mb-6">
                                                                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-white/5 flex items-center justify-center text-indigo-500">
                                                                    <TrendingUp size={18} />
                                                                </div>
                                                                <h4 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.25em]">
                                                                    Finance Pillars
                                                                </h4>
                                                                <div className="flex-1 h-px bg-slate-100 dark:bg-white/5" />
                                                            </div>
                                                            <div className="bg-slate-50/50 dark:bg-white/[0.01] rounded-[2rem] border border-slate-100 dark:border-white/5 overflow-hidden">
                                                                {/* Scheme Selector */}
                                                                <PricingRow
                                                                    label="Finance Scheme"
                                                                    value={
                                                                        <select
                                                                            value={entry.schemeId}
                                                                            onChange={e => {
                                                                                const schemeId = e.target.value;
                                                                                const schemes = getSchemesForBank(
                                                                                    entry.bankId
                                                                                );
                                                                                const scheme =
                                                                                    schemes.find(
                                                                                        s => s.id === schemeId
                                                                                    ) || null;
                                                                                const upfront =
                                                                                    scheme?.charges?.filter(
                                                                                        c => c.impact === 'UPFRONT'
                                                                                    ) || [];
                                                                                const funded =
                                                                                    scheme?.charges?.filter(
                                                                                        c => c.impact === 'FUNDED'
                                                                                    ) || [];
                                                                                setFinanceEntries(prev =>
                                                                                    prev.map(en =>
                                                                                        en.id === entry.id
                                                                                            ? {
                                                                                                  ...en,
                                                                                                  schemeId,
                                                                                                  schemeName:
                                                                                                      scheme?.name ||
                                                                                                      '',
                                                                                                  selectedScheme:
                                                                                                      scheme,
                                                                                                  roi: String(
                                                                                                      scheme?.interestRate ||
                                                                                                          0
                                                                                                  ),
                                                                                                  upfrontCharges:
                                                                                                      upfront.map(
                                                                                                          c => ({
                                                                                                              ...c,
                                                                                                          })
                                                                                                      ),
                                                                                                  fundedAddons:
                                                                                                      funded.map(c => ({
                                                                                                          ...c,
                                                                                                      })),
                                                                                              }
                                                                                            : en
                                                                                    )
                                                                                );
                                                                            }}
                                                                            className="w-56 bg-transparent border-b border-indigo-500/30 focus:border-indigo-500 outline-none text-right font-black text-sm p-0 cursor-pointer"
                                                                        >
                                                                            <option value="">Select Scheme...</option>
                                                                            {getSchemesForBank(entry.bankId).map(s => (
                                                                                <option key={s.id} value={s.id}>
                                                                                    {s.name}
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                    }
                                                                    description={
                                                                        <span className="text-[8px] text-slate-400 uppercase font-bold tracking-widest">
                                                                            Select from financier&apos;s active schemes
                                                                        </span>
                                                                    }
                                                                />
                                                                <PricingRow
                                                                    label="Net Loan Amount"
                                                                    value={
                                                                        <div className="flex items-center gap-1">
                                                                            <span className="text-slate-400 text-xs font-bold">
                                                                                ₹
                                                                            </span>
                                                                            <input
                                                                                type="number"
                                                                                value={entry.loanAmount || 0}
                                                                                onChange={e => {
                                                                                    const val = e.target.value;
                                                                                    setFinanceEntries(prev =>
                                                                                        prev.map(en =>
                                                                                            en.id === entry.id
                                                                                                ? {
                                                                                                      ...en,
                                                                                                      loanAmount: val,
                                                                                                  }
                                                                                                : en
                                                                                        )
                                                                                    );
                                                                                }}
                                                                                className="w-32 bg-transparent border-b border-indigo-500/30 focus:border-indigo-500 outline-none text-right font-black text-sm p-0"
                                                                            />
                                                                        </div>
                                                                    }
                                                                    description={
                                                                        <span className="text-[8px] text-slate-400 uppercase font-black tracking-widest italic">
                                                                            Asset Cost − Down Payment
                                                                        </span>
                                                                    }
                                                                />
                                                                <PricingRow
                                                                    isBold
                                                                    label="Gross Loan Amount"
                                                                    value={formatCurrency(
                                                                        (parseInt(entry.loanAmount) || 0) +
                                                                            (entry.fundedAddons?.reduce(
                                                                                (sum, c) =>
                                                                                    sum +
                                                                                    (c.type === 'FIXED' ? c.value : 0),
                                                                                0
                                                                            ) || 0)
                                                                    )}
                                                                    description={
                                                                        <span className="text-[8px] text-emerald-500 uppercase font-extrabold tracking-widest italic">
                                                                            Net Loan + Funded Add-ons
                                                                        </span>
                                                                    }
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* SECTION C: UPFRONT OBLIGATIONS (Dynamic +/−) */}
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-3 mb-6">
                                                                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-white/5 flex items-center justify-center text-indigo-500">
                                                                    <Wallet size={18} />
                                                                </div>
                                                                <h4 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.25em]">
                                                                    Upfront Obligations
                                                                </h4>
                                                                <div className="flex-1 h-px bg-slate-100 dark:bg-white/5" />
                                                            </div>
                                                            <div className="bg-slate-50/50 dark:bg-white/[0.01] rounded-[2rem] border border-slate-100 dark:border-white/5 overflow-hidden">
                                                                {entry.upfrontCharges.map((charge, ci) => (
                                                                    <div
                                                                        key={charge.id}
                                                                        className="flex items-center justify-between px-6 py-4 border-b border-slate-100/50 dark:border-white/5 last:border-b-0 group/charge"
                                                                    >
                                                                        <div>
                                                                            <span className="text-sm font-bold text-slate-700 dark:text-white">
                                                                                {charge.name}
                                                                            </span>
                                                                            <div className="text-[8px] text-slate-400 uppercase font-bold tracking-widest mt-0.5">
                                                                                {charge.type === 'FIXED'
                                                                                    ? 'Fixed'
                                                                                    : `${charge.value}% of ${charge.calculationBasis?.replace(/_/g, ' ')}`}
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-3">
                                                                            <span className="text-sm font-black text-slate-900 dark:text-white">
                                                                                {charge.type === 'FIXED'
                                                                                    ? formatCurrency(charge.value)
                                                                                    : `${charge.value}%`}
                                                                            </span>
                                                                            <button
                                                                                onClick={() => {
                                                                                    setFinanceEntries(prev =>
                                                                                        prev.map(en =>
                                                                                            en.id === entry.id
                                                                                                ? {
                                                                                                      ...en,
                                                                                                      upfrontCharges:
                                                                                                          en.upfrontCharges.filter(
                                                                                                              (_, i) =>
                                                                                                                  i !==
                                                                                                                  ci
                                                                                                          ),
                                                                                                  }
                                                                                                : en
                                                                                        )
                                                                                    );
                                                                                }}
                                                                                className="opacity-0 group-hover/charge:opacity-100 text-slate-300 hover:text-red-500 transition-all"
                                                                            >
                                                                                <X size={14} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                                {/* Add Charge Button */}
                                                                <button
                                                                    onClick={() => {
                                                                        const newCharge: SchemeCharge = {
                                                                            id: crypto.randomUUID(),
                                                                            name: 'New Charge',
                                                                            type: 'FIXED',
                                                                            value: 0,
                                                                            calculationBasis: 'FIXED',
                                                                            impact: 'UPFRONT',
                                                                            taxStatus: 'NOT_APPLICABLE',
                                                                        };
                                                                        setFinanceEntries(prev =>
                                                                            prev.map(en =>
                                                                                en.id === entry.id
                                                                                    ? {
                                                                                          ...en,
                                                                                          upfrontCharges: [
                                                                                              ...en.upfrontCharges,
                                                                                              newCharge,
                                                                                          ],
                                                                                      }
                                                                                    : en
                                                                            )
                                                                        );
                                                                    }}
                                                                    className="w-full px-6 py-3 flex items-center justify-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:bg-indigo-50/50 dark:hover:bg-white/[0.02] transition-colors"
                                                                >
                                                                    <PlusCircle size={14} /> Add Upfront Charge
                                                                </button>
                                                                {/* Upfront Total */}
                                                                <PricingRow
                                                                    isBold
                                                                    label="Total Upfront"
                                                                    value={formatCurrency(
                                                                        entry.upfrontCharges.reduce(
                                                                            (sum, c) =>
                                                                                sum +
                                                                                (c.type === 'FIXED' ? c.value : 0),
                                                                            0
                                                                        )
                                                                    )}
                                                                    description={
                                                                        <span className="text-[8px] text-emerald-500 uppercase font-extrabold tracking-widest italic">
                                                                            Sum of all upfront charges
                                                                        </span>
                                                                    }
                                                                />
                                                                <PricingRow
                                                                    isBold
                                                                    label="Down Payment"
                                                                    value={
                                                                        <div className="flex items-center gap-1">
                                                                            <span className="text-slate-400 text-xs font-bold">
                                                                                ₹
                                                                            </span>
                                                                            <input
                                                                                type="number"
                                                                                value={entry.downPayment || 0}
                                                                                onChange={e =>
                                                                                    setFinanceEntries(prev =>
                                                                                        prev.map(en =>
                                                                                            en.id === entry.id
                                                                                                ? {
                                                                                                      ...en,
                                                                                                      downPayment:
                                                                                                          e.target
                                                                                                              .value,
                                                                                                  }
                                                                                                : en
                                                                                        )
                                                                                    )
                                                                                }
                                                                                className="w-32 bg-transparent border-b border-indigo-500/30 focus:border-indigo-500 outline-none text-right font-black text-sm p-0"
                                                                            />
                                                                        </div>
                                                                    }
                                                                    description={
                                                                        <span className="text-[8px] text-emerald-500 uppercase font-extrabold tracking-widest italic">
                                                                            Margin Money + Upfront Charges
                                                                        </span>
                                                                    }
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* SECTION C2: FUNDED ADD-ONS (Dynamic +/−) */}
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-3 mb-6">
                                                                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-white/5 flex items-center justify-center text-indigo-500">
                                                                    <PlusCircle size={18} />
                                                                </div>
                                                                <h4 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.25em]">
                                                                    Loan Add-ons (Funded)
                                                                </h4>
                                                                <div className="flex-1 h-px bg-slate-100 dark:bg-white/5" />
                                                            </div>
                                                            <div className="bg-slate-50/50 dark:bg-white/[0.01] rounded-[2rem] border border-slate-100 dark:border-white/5 overflow-hidden">
                                                                {entry.fundedAddons.map((addon, ai) => (
                                                                    <div
                                                                        key={addon.id}
                                                                        className="flex items-center justify-between px-6 py-4 border-b border-slate-100/50 dark:border-white/5 last:border-b-0 group/addon"
                                                                    >
                                                                        <div>
                                                                            <span className="text-sm font-bold text-slate-700 dark:text-white">
                                                                                {addon.name}
                                                                            </span>
                                                                            <div className="text-[8px] text-slate-400 uppercase font-bold tracking-widest mt-0.5">
                                                                                Added to loan amount
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-3">
                                                                            <span className="text-sm font-black text-slate-900 dark:text-white">
                                                                                {addon.type === 'FIXED'
                                                                                    ? formatCurrency(addon.value)
                                                                                    : `${addon.value}%`}
                                                                            </span>
                                                                            <button
                                                                                onClick={() => {
                                                                                    setFinanceEntries(prev =>
                                                                                        prev.map(en =>
                                                                                            en.id === entry.id
                                                                                                ? {
                                                                                                      ...en,
                                                                                                      fundedAddons:
                                                                                                          en.fundedAddons.filter(
                                                                                                              (_, i) =>
                                                                                                                  i !==
                                                                                                                  ai
                                                                                                          ),
                                                                                                  }
                                                                                                : en
                                                                                        )
                                                                                    );
                                                                                }}
                                                                                className="opacity-0 group-hover/addon:opacity-100 text-slate-300 hover:text-red-500 transition-all"
                                                                            >
                                                                                <X size={14} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                                <button
                                                                    onClick={() => {
                                                                        const newAddon: SchemeCharge = {
                                                                            id: crypto.randomUUID(),
                                                                            name: 'New Add-on',
                                                                            type: 'FIXED',
                                                                            value: 0,
                                                                            calculationBasis: 'FIXED',
                                                                            impact: 'FUNDED',
                                                                            taxStatus: 'NOT_APPLICABLE',
                                                                        };
                                                                        setFinanceEntries(prev =>
                                                                            prev.map(en =>
                                                                                en.id === entry.id
                                                                                    ? {
                                                                                          ...en,
                                                                                          fundedAddons: [
                                                                                              ...en.fundedAddons,
                                                                                              newAddon,
                                                                                          ],
                                                                                      }
                                                                                    : en
                                                                            )
                                                                        );
                                                                    }}
                                                                    className="w-full px-6 py-3 flex items-center justify-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:bg-indigo-50/50 dark:hover:bg-white/[0.02] transition-colors"
                                                                >
                                                                    <PlusCircle size={14} /> Add Funded Add-on
                                                                </button>
                                                                <PricingRow
                                                                    isBold
                                                                    label="Total Funded Add-ons"
                                                                    value={formatCurrency(
                                                                        entry.fundedAddons.reduce(
                                                                            (sum, c) =>
                                                                                sum +
                                                                                (c.type === 'FIXED' ? c.value : 0),
                                                                            0
                                                                        )
                                                                    )}
                                                                    description={
                                                                        <span className="text-[8px] text-emerald-500 uppercase font-extrabold tracking-widest italic">
                                                                            Added to gross loan amount
                                                                        </span>
                                                                    }
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* SECTION D: TERMS & PERFORMANCE */}
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-3 mb-6">
                                                                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-white/5 flex items-center justify-center text-indigo-500">
                                                                    <Clock size={18} />
                                                                </div>
                                                                <h4 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.25em]">
                                                                    Terms & Performance
                                                                </h4>
                                                                <div className="flex-1 h-px bg-slate-100 dark:bg-white/5" />
                                                            </div>
                                                            <div className="bg-slate-50/50 dark:bg-white/[0.01] rounded-[2rem] border border-slate-100 dark:border-white/5 overflow-hidden">
                                                                <PricingRow
                                                                    label="Tenure"
                                                                    value={
                                                                        <div className="flex items-center gap-2">
                                                                            <input
                                                                                type="number"
                                                                                value={entry.tenure || 0}
                                                                                onChange={e =>
                                                                                    setFinanceEntries(prev =>
                                                                                        prev.map(en =>
                                                                                            en.id === entry.id
                                                                                                ? {
                                                                                                      ...en,
                                                                                                      tenure: e.target
                                                                                                          .value,
                                                                                                  }
                                                                                                : en
                                                                                        )
                                                                                    )
                                                                                }
                                                                                className="w-16 bg-transparent border-b border-indigo-500/30 focus:border-indigo-500 outline-none text-right font-black text-sm p-0"
                                                                            />
                                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                                                Months
                                                                            </span>
                                                                        </div>
                                                                    }
                                                                />
                                                                <PricingRow
                                                                    isBold
                                                                    label="Monthly EMI"
                                                                    value={
                                                                        <div className="flex items-center gap-1">
                                                                            <span className="text-slate-400 text-xs font-bold">
                                                                                ₹
                                                                            </span>
                                                                            <input
                                                                                type="number"
                                                                                value={entry.emi || 0}
                                                                                onChange={e =>
                                                                                    setFinanceEntries(prev =>
                                                                                        prev.map(en =>
                                                                                            en.id === entry.id
                                                                                                ? {
                                                                                                      ...en,
                                                                                                      emi: e.target
                                                                                                          .value,
                                                                                                  }
                                                                                                : en
                                                                                        )
                                                                                    )
                                                                                }
                                                                                className="w-28 bg-transparent border-b border-indigo-500/30 focus:border-indigo-500 outline-none text-right font-black text-sm p-0"
                                                                            />
                                                                        </div>
                                                                    }
                                                                    description={
                                                                        <span className="text-[8px] text-emerald-500 uppercase font-extrabold tracking-widest italic">
                                                                            Approved Repayment Amount
                                                                        </span>
                                                                    }
                                                                />
                                                                <PricingRow
                                                                    label="Rate of Interest (Flat/Reducing)"
                                                                    value={
                                                                        <div className="flex items-center gap-1">
                                                                            <input
                                                                                type="number"
                                                                                value={entry.roi || 0}
                                                                                step="0.01"
                                                                                onChange={e =>
                                                                                    setFinanceEntries(prev =>
                                                                                        prev.map(en =>
                                                                                            en.id === entry.id
                                                                                                ? {
                                                                                                      ...en,
                                                                                                      roi: e.target
                                                                                                          .value,
                                                                                                  }
                                                                                                : en
                                                                                        )
                                                                                    )
                                                                                }
                                                                                className="w-16 bg-transparent border-b border-indigo-500/30 focus:border-indigo-500 outline-none text-right font-black text-sm p-0"
                                                                            />
                                                                            <span className="text-xs font-bold text-slate-400">
                                                                                %
                                                                            </span>
                                                                        </div>
                                                                    }
                                                                    description={
                                                                        <span className="text-[8px] text-slate-400 uppercase font-black tracking-widest italic">
                                                                            Actual IRR (System): {entry.roi ?? 0}%
                                                                        </span>
                                                                    }
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Save Finance Entry Button */}
                                                        <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-white/5">
                                                            <button
                                                                onClick={() => handleSaveFinanceEntry(entry.id)}
                                                                disabled={isSaving}
                                                                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-60 flex items-center gap-2"
                                                            >
                                                                <Save size={14} />
                                                                {isSaving ? 'Saving...' : 'Save Finance Entry'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        {/* Action bar for adding new entry */}
                                        <div className="flex justify-center p-4">
                                            <button
                                                onClick={handleAddNewFinance}
                                                className="px-6 py-3 bg-slate-50 dark:bg-white/5 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:border-indigo-500/50 hover:text-indigo-500 transition-all group"
                                            >
                                                <Plus
                                                    size={14}
                                                    className="group-hover:rotate-90 transition-transform"
                                                />
                                                Add New Entry
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'TASKS' && (
                        <div className="p-6">
                            <div className="bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/10 rounded-[2rem] p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="text-xs font-black uppercase tracking-widest text-slate-500">
                                        Tasks
                                    </div>
                                    <button
                                        onClick={() => {
                                            const el = document.getElementById('new-task-input');
                                            if (el) {
                                                (el as HTMLInputElement).focus();
                                            }
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-white/10 dark:text-white text-[9px] font-black uppercase tracking-widest hover:bg-indigo-500/20 transition-colors"
                                    >
                                        <Plus size={12} />
                                        Add Task
                                    </button>
                                </div>

                                {/* Add Task Inline Form */}
                                <form
                                    className="space-y-3 mb-5 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-2xl p-4"
                                    onSubmit={async e => {
                                        e.preventDefault();
                                        const form = e.target as HTMLFormElement;
                                        const input = form.elements.namedItem('taskTitle') as HTMLInputElement;
                                        const title = input.value.trim();
                                        if (!title) return;
                                        input.disabled = true;
                                        const result = await createTask({
                                            tenantId: quote.tenantId || null,
                                            linkedType: 'QUOTE',
                                            linkedId: quote.id,
                                            title,
                                            primaryAssigneeId: selectedAssignee || null,
                                            assigneeIds: selectedAssignee ? [selectedAssignee] : [],
                                        });
                                        input.disabled = false;
                                        if (result.success) {
                                            toast.success('Task created');
                                            input.value = '';
                                            setSelectedAssignee('');
                                            refreshTasks();
                                        } else {
                                            toast.error(result.error || 'Failed to create task');
                                        }
                                    }}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1">
                                            <input
                                                id="new-task-input"
                                                name="taskTitle"
                                                type="text"
                                                placeholder="Type task title..."
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            className="shrink-0 h-10 px-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors active:scale-95"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>

                                    {/* Assignee Selector */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 shrink-0">
                                            Assign to:
                                        </span>
                                        <div className="relative flex-1">
                                            <button
                                                type="button"
                                                onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                                                className={cn(
                                                    'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all w-full text-left',
                                                    selectedAssignee
                                                        ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                                        : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-500'
                                                )}
                                            >
                                                {selectedAssignee
                                                    ? teamMembers.find(m => m.id === selectedAssignee)?.name ||
                                                      'Selected'
                                                    : 'Select team member (optional)'}
                                            </button>
                                            {showAssigneeDropdown && (
                                                <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-[#0f1115] border border-slate-100 dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden max-h-40 overflow-y-auto">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedAssignee('');
                                                            setShowAssigneeDropdown(false);
                                                        }}
                                                        className="w-full text-left px-4 py-2 text-[10px] font-bold text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5"
                                                    >
                                                        No assignee
                                                    </button>
                                                    {teamMembers.map(member => (
                                                        <button
                                                            key={member.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedAssignee(member.id);
                                                                setShowAssigneeDropdown(false);
                                                            }}
                                                            className={cn(
                                                                'w-full text-left px-4 py-2 text-[10px] font-bold transition-colors',
                                                                selectedAssignee === member.id
                                                                    ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
                                                            )}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <span>{member.name}</span>
                                                                <span className="text-[8px] text-slate-400 uppercase">
                                                                    {member.role}
                                                                </span>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </form>

                                {localTasks.length === 0 ? (
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest py-4 text-center">
                                        No tasks yet — create your first task above
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {localTasks.map(task => (
                                            <div
                                                key={task.id}
                                                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-white/10"
                                            >
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                        {task.title}
                                                    </span>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[10px] text-slate-400 uppercase tracking-widest">
                                                            {task.status}
                                                        </span>
                                                        {task.primary_assignee_id && (
                                                            <span className="text-[9px] font-bold text-indigo-500 bg-indigo-500/10 px-1.5 py-0.5 rounded uppercase">
                                                                {teamMembers.find(
                                                                    m => m.id === task.primary_assignee_id
                                                                )?.name || 'Assigned'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {(['OPEN', 'IN_PROGRESS', 'DONE'] as const).map(status => (
                                                        <button
                                                            key={status}
                                                            onClick={() => handleTaskStatus(task.id, status)}
                                                            className={cn(
                                                                'px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors',
                                                                task.status === status
                                                                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                                                    : 'bg-slate-50 dark:bg-white/5 text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                                            )}
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
                                    quoteId={quote.id}
                                    onDocCountChange={setDocCount}
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

                    {activeTab === 'TIMELINE' &&
                        (() => {
                            // Group events by day (Day 1, Day 2, etc.) - only days that have events
                            const sortedEvents = [...quote.timeline].sort(
                                (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                            );

                            // Get unique calendar dates (sorted newest first)
                            const dateMap = new Map<string, typeof sortedEvents>();
                            sortedEvents.forEach(ev => {
                                const dateKey = new Date(ev.timestamp).toLocaleDateString('en-IN', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                });
                                if (!dateMap.has(dateKey)) dateMap.set(dateKey, []);
                                dateMap.get(dateKey)!.push(ev);
                            });

                            // Convert to array of day groups, newest first, with sequential day numbering
                            const dayGroups = Array.from(dateMap.entries()).map(([dateKey, events], idx) => {
                                const totalDays = dateMap.size;
                                return {
                                    dayNum: totalDays - idx, // Day 1 is the oldest
                                    dateKey,
                                    dateLabel: new Date(events[0].timestamp).toLocaleDateString('en-IN', {
                                        weekday: 'short',
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                    }),
                                    events,
                                };
                            });

                            // Group events within a day by working hour slots
                            const getHourSlot = (timestamp: string) => {
                                const h = new Date(timestamp).getHours();
                                if (h < 11) return 'Before 11 AM';
                                if (h < 13) return '11 AM – 1 PM';
                                if (h < 15) return '1 PM – 3 PM';
                                if (h < 17) return '3 PM – 5 PM';
                                if (h < 19) return '5 PM – 7 PM';
                                return 'After 7 PM';
                            };

                            const slotOrder = [
                                'After 7 PM',
                                '5 PM – 7 PM',
                                '3 PM – 5 PM',
                                '1 PM – 3 PM',
                                '11 AM – 1 PM',
                                'Before 11 AM',
                            ];

                            const lastEvent = sortedEvents[0];
                            const lastActor =
                                lastEvent?.actorType === 'team'
                                    ? teamMembers.find(m => m.id === lastEvent.actor)?.name || lastEvent.actor
                                    : lastEvent?.actor;

                            return (
                                <div className={cn(isPhone ? 'p-0' : 'p-6')}>
                                    <div
                                        className={cn(
                                            'bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/10',
                                            isPhone ? 'rounded-none p-4' : 'rounded-[2rem] p-6'
                                        )}
                                    >
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="text-xs font-black uppercase tracking-widest text-slate-500">
                                                Timeline
                                            </div>
                                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                {quote.timeline.length} events
                                            </div>
                                        </div>
                                        {lastEvent && (
                                            <div className="mb-6 flex flex-wrap items-center gap-3 text-[9px] font-bold text-slate-400">
                                                <span className="px-2 py-1 rounded-lg bg-slate-50 dark:bg-white/[0.03] text-slate-500">
                                                    Last activity: {formatDate(lastEvent.timestamp)}
                                                </span>
                                                {lastActor && (
                                                    <span className="px-2 py-1 rounded-lg bg-slate-50 dark:bg-white/[0.03] text-slate-500">
                                                        By: {lastActor}
                                                    </span>
                                                )}
                                                <span
                                                    className={cn(
                                                        'px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest',
                                                        STATUS_CONFIG[quote.status || 'DRAFT']?.bg || 'bg-slate-100',
                                                        STATUS_CONFIG[quote.status || 'DRAFT']?.color ||
                                                            'text-slate-600'
                                                    )}
                                                >
                                                    {quote.status}
                                                </span>
                                            </div>
                                        )}

                                        {quote.timeline.length === 0 ? (
                                            <div className="py-12 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                No events recorded
                                            </div>
                                        ) : (
                                            <div className="space-y-6">
                                                {dayGroups.map(day => {
                                                    // Group events by hour slot within this day
                                                    const slotMap = new Map<string, typeof day.events>();
                                                    day.events.forEach(ev => {
                                                        const slot = getHourSlot(ev.timestamp);
                                                        if (!slotMap.has(slot)) slotMap.set(slot, []);
                                                        slotMap.get(slot)!.push(ev);
                                                    });

                                                    const activeSlots = slotOrder.filter(s => slotMap.has(s));

                                                    return (
                                                        <div key={day.dateKey}>
                                                            {/* Day Header */}
                                                            <div className="flex items-center gap-3 mb-3">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-500/10 px-2 py-0.5 rounded uppercase tracking-wider">
                                                                        Day {day.dayNum}
                                                                    </span>
                                                                    <span className="text-[10px] font-bold text-slate-400">
                                                                        {day.dateLabel}
                                                                    </span>
                                                                </div>
                                                                <div className="flex-1 h-px bg-slate-100 dark:bg-white/5" />
                                                            </div>

                                                            {/* Hour Slot Groups */}
                                                            <div className="ml-1 space-y-3">
                                                                {activeSlots.map(slot => (
                                                                    <div key={slot}>
                                                                        {/* Slot Label */}
                                                                        <div className="text-[8px] font-black uppercase tracking-widest text-slate-300 dark:text-slate-600 mb-1.5 ml-5">
                                                                            {slot}
                                                                        </div>
                                                                        {/* Events in this slot */}
                                                                        <div className="space-y-0">
                                                                            {slotMap.get(slot)!.map((event, eidx) => {
                                                                                const eventTime = new Date(
                                                                                    event.timestamp
                                                                                ).toLocaleTimeString('en-IN', {
                                                                                    hour: 'numeric',
                                                                                    minute: '2-digit',
                                                                                    hour12: true,
                                                                                });
                                                                                const isAction =
                                                                                    event.event.includes('Created') ||
                                                                                    event.event.includes('Sent') ||
                                                                                    event.event.includes('Approved');
                                                                                const dotColor = isAction
                                                                                    ? 'bg-emerald-500'
                                                                                    : event.actorType === 'customer'
                                                                                      ? 'bg-blue-500'
                                                                                      : 'bg-slate-300 dark:bg-slate-600';

                                                                                return (
                                                                                    <div
                                                                                        key={eidx}
                                                                                        className="flex items-start gap-4 py-2 group"
                                                                                    >
                                                                                        {/* Timeline dot + connector */}
                                                                                        <div className="flex flex-col items-center mt-1">
                                                                                            <div
                                                                                                className={`w-2 h-2 rounded-full ${dotColor} ring-2 ring-white dark:ring-[#0b0d10]`}
                                                                                            />
                                                                                        </div>
                                                                                        {/* Event content */}
                                                                                        <div className="flex-1 min-w-0">
                                                                                            <div className="flex items-center justify-between gap-2">
                                                                                                <span className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-tight">
                                                                                                    {event.event}
                                                                                                </span>
                                                                                                <span className="text-[9px] font-bold text-slate-400 tabular-nums shrink-0">
                                                                                                    {eventTime}
                                                                                                </span>
                                                                                            </div>

                                                                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                                                                                                {event.actor && (
                                                                                                    <div className="flex items-center gap-1.5">
                                                                                                        <span className="text-[10px] font-black text-slate-900 dark:text-white">
                                                                                                            {event.actorType ===
                                                                                                            'customer'
                                                                                                                ? '👤'
                                                                                                                : '🏢'}{' '}
                                                                                                            {(() => {
                                                                                                                if (
                                                                                                                    event.actorType ===
                                                                                                                    'team'
                                                                                                                ) {
                                                                                                                    const resolved =
                                                                                                                        teamMembers.find(
                                                                                                                            m =>
                                                                                                                                m.id ===
                                                                                                                                event.actor
                                                                                                                        )?.name;
                                                                                                                    return (
                                                                                                                        resolved ||
                                                                                                                        event.actor
                                                                                                                    );
                                                                                                                }
                                                                                                                return event.actor;
                                                                                                            })()}
                                                                                                        </span>
                                                                                                        {event.actorDesignation && (
                                                                                                            <span className="text-[8px] font-black text-indigo-500 bg-indigo-500/10 px-1.5 py-0.5 rounded uppercase tracking-widest">
                                                                                                                {
                                                                                                                    event.actorDesignation
                                                                                                                }
                                                                                                            </span>
                                                                                                        )}
                                                                                                        {event.actorOrg && (
                                                                                                            <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 italic">
                                                                                                                at{' '}
                                                                                                                {
                                                                                                                    event.actorOrg
                                                                                                                }
                                                                                                            </span>
                                                                                                        )}
                                                                                                    </div>
                                                                                                )}

                                                                                                <div className="flex items-center gap-2">
                                                                                                    {event.source && (
                                                                                                        <span className="text-[8px] font-black uppercase tracking-wider text-slate-300 dark:text-slate-600 border border-slate-100 dark:border-white/5 px-1 rounded">
                                                                                                            {
                                                                                                                event.source
                                                                                                            }
                                                                                                        </span>
                                                                                                    )}
                                                                                                    {event.reason && (
                                                                                                        <span className="text-[8px] font-bold text-amber-500 bg-amber-500/5 px-1.5 py-0.5 rounded">
                                                                                                            REASON:{' '}
                                                                                                            {
                                                                                                                event.reason
                                                                                                            }
                                                                                                        </span>
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}

                    {activeTab === 'HISTORY' && (
                        <div className={cn(isPhone ? 'p-0' : 'p-6')}>
                            <div
                                className={cn(
                                    'bg-white dark:bg-[#0b0d10] border border-slate-100 dark:border-white/10 overflow-hidden',
                                    isPhone ? 'rounded-none' : 'rounded-[2rem]'
                                )}
                            >
                                {/* Quotes Section */}
                                <TransactionSection
                                    title="Quotes"
                                    count={relatedQuotes.length}
                                    expanded={groups.transactionQuotes || false}
                                    onToggle={() => setGroups(g => ({ ...g, transactionQuotes: !g.transactionQuotes }))}
                                >
                                    {isPhone ? (
                                        /* ── PHONE: Vertical card layout ── */
                                        <div className="divide-y divide-slate-100 dark:divide-white/5">
                                            {relatedQuotes.length === 0 ? (
                                                <div className="py-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    No quotes found
                                                </div>
                                            ) : (
                                                relatedQuotes.map(q => (
                                                    <button
                                                        key={q.id}
                                                        onClick={() => {
                                                            if (slug)
                                                                window.location.href = `/app/${slug}/quotes/${q.id}`;
                                                        }}
                                                        className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                                                    >
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                                                {formatDisplayId(q.displayId)}
                                                            </span>
                                                            <span
                                                                className={cn(
                                                                    'px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest',
                                                                    STATUS_CONFIG[q.status || 'DRAFT']?.bg ||
                                                                        'bg-slate-100',
                                                                    STATUS_CONFIG[q.status || 'DRAFT']?.color ||
                                                                        'text-slate-600'
                                                                )}
                                                            >
                                                                {q.status}
                                                            </span>
                                                        </div>
                                                        <div className="text-[10px] font-bold text-slate-500 truncate">
                                                            {q.vehicleName ||
                                                                `${quote.vehicle?.brand} ${quote.vehicle?.model}`}
                                                            {q.vehicleColor ? (
                                                                <span className="text-slate-400">
                                                                    {' '}
                                                                    • {q.vehicleColor}
                                                                </span>
                                                            ) : (
                                                                ''
                                                            )}
                                                        </div>
                                                        <div className="flex items-center justify-between mt-1">
                                                            <span className="text-[10px] font-black text-slate-900 dark:text-white tabular-nums">
                                                                {q.onRoadPrice
                                                                    ? `₹${Number(q.onRoadPrice).toLocaleString('en-IN')}`
                                                                    : '—'}
                                                            </span>
                                                            <span className="text-[9px] font-bold text-slate-400">
                                                                {q.createdAt ? formatDate(q.createdAt) : '—'}
                                                            </span>
                                                        </div>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    ) : (
                                        /* ── DESKTOP: Wide table ── */
                                        <div className="w-full overflow-x-auto">
                                            <table className="w-full min-w-[700px] text-left border-collapse">
                                                <thead className="bg-slate-50/50 dark:bg-white/[0.02]">
                                                    <tr className="border-b border-slate-100 dark:border-white/5">
                                                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                            Date
                                                        </th>
                                                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                            ID
                                                        </th>
                                                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                            Vehicle
                                                        </th>
                                                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                            Total
                                                        </th>
                                                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                            Generated By
                                                        </th>
                                                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                            Status
                                                        </th>
                                                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">
                                                            Actions
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {relatedQuotes.map(q => (
                                                        <tr
                                                            key={q.id}
                                                            className="border-b border-slate-50 dark:border-white/[0.02] last:border-b-0 group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
                                                        >
                                                            <td className="px-4 py-3 text-[10px] font-bold text-slate-500">
                                                                {q.createdAt ? formatDate(q.createdAt) : '—'}
                                                            </td>
                                                            <td className="px-4 py-3 text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                                                {formatDisplayId(q.displayId)}
                                                            </td>
                                                            <td className="px-4 py-3 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                                                {q.vehicleName ||
                                                                    `${quote.vehicle?.brand} ${quote.vehicle?.model}`}
                                                                {q.vehicleColor ? (
                                                                    <span className="text-slate-400">
                                                                        {' '}
                                                                        • {q.vehicleColor}
                                                                    </span>
                                                                ) : (
                                                                    ''
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 text-[10px] font-black text-slate-900 dark:text-white tabular-nums">
                                                                {q.onRoadPrice
                                                                    ? `₹${Number(q.onRoadPrice).toLocaleString('en-IN')}`
                                                                    : '—'}
                                                            </td>
                                                            <td className="px-4 py-3 text-[10px] font-bold text-slate-500">
                                                                {q.createdBy
                                                                    ? teamMembers.find(m => m.id === q.createdBy)
                                                                          ?.name || '—'
                                                                    : '—'}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span
                                                                    className={cn(
                                                                        'px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest',
                                                                        STATUS_CONFIG[q.status || 'DRAFT']?.bg ||
                                                                            'bg-slate-100',
                                                                        STATUS_CONFIG[q.status || 'DRAFT']?.color ||
                                                                            'text-slate-600'
                                                                    )}
                                                                >
                                                                    {q.status}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-4 text-right">
                                                                <button
                                                                    onClick={() => {
                                                                        if (!slug) return;
                                                                        window.location.href = `/app/${slug}/quotes/${q.id}`;
                                                                    }}
                                                                    className="text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 transition-opacity"
                                                                >
                                                                    View →
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {relatedQuotes.length === 0 && (
                                                        <tr>
                                                            <td
                                                                colSpan={7}
                                                                className="py-12 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                                                            >
                                                                No quotes found
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </TransactionSection>

                                {/* Bookings Section */}
                                <TransactionSection
                                    title="Bookings"
                                    count={bookings.length}
                                    expanded={groups.transactionBookings || false}
                                    onToggle={() =>
                                        setGroups(g => ({ ...g, transactionBookings: !g.transactionBookings }))
                                    }
                                >
                                    {isPhone ? (
                                        /* ── PHONE: Vertical card layout ── */
                                        <div className="divide-y divide-slate-100 dark:divide-white/5">
                                            {bookings.length === 0 ? (
                                                <div className="py-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    No bookings found
                                                </div>
                                            ) : (
                                                bookings.map(b => (
                                                    <div key={b.id} className="px-4 py-3">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                                                {formatDisplayId(b.display_id || b.id)}
                                                            </span>
                                                            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 text-[8px] font-black uppercase tracking-widest">
                                                                {b.status}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between mt-1">
                                                            <span className="text-[10px] font-black text-slate-900 dark:text-white">
                                                                {formatCurrency(b.booking_amount_received || 0)}
                                                            </span>
                                                            <span className="text-[9px] font-bold text-slate-400">
                                                                {formatDate(b.created_at)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    ) : (
                                        /* ── DESKTOP: Wide table ── */
                                        <div className="w-full overflow-x-auto">
                                            <table className="w-full min-w-[600px] text-left border-collapse">
                                                <thead className="bg-slate-50/50 dark:bg-white/[0.02]">
                                                    <tr className="border-b border-slate-100 dark:border-white/5">
                                                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                            Date
                                                        </th>
                                                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                            Booking ID
                                                        </th>
                                                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                            Status
                                                        </th>
                                                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                            Amount
                                                        </th>
                                                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">
                                                            Actions
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {bookings.map(b => (
                                                        <tr
                                                            key={b.id}
                                                            className="border-b border-slate-50 dark:border-white/[0.02] last:border-b-0 group"
                                                        >
                                                            <td className="px-4 py-3 text-[10px] font-bold text-slate-500">
                                                                {formatDate(b.created_at)}
                                                            </td>
                                                            <td className="px-4 py-3 text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                                                {formatDisplayId(b.display_id || b.id)}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 text-[8px] font-black uppercase tracking-widest">
                                                                    {b.status}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 text-[10px] font-black text-slate-900 dark:text-white">
                                                                {formatCurrency(b.booking_amount_received || 0)}
                                                            </td>
                                                            <td className="py-3 text-right">
                                                                <button className="text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    Manage
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {bookings.length === 0 && (
                                                        <tr>
                                                            <td
                                                                colSpan={5}
                                                                className="py-12 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                                                            >
                                                                No bookings found
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </TransactionSection>

                                {/* Receipts Section */}
                                <TransactionSection
                                    title="Receipts"
                                    count={payments.length}
                                    expanded={groups.transactionPayments || false}
                                    onToggle={() =>
                                        setGroups(g => ({ ...g, transactionPayments: !g.transactionPayments }))
                                    }
                                >
                                    {isPhone ? (
                                        /* ── PHONE: Vertical card layout ── */
                                        <div className="divide-y divide-slate-100 dark:divide-white/5">
                                            {payments.length === 0 ? (
                                                <div className="py-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    No receipts found
                                                </div>
                                            ) : (
                                                payments.map(p => (
                                                    <button
                                                        key={p.id}
                                                        onClick={() => {
                                                            if (slug) router.push(`/app/${slug}/receipts/${p.id}`);
                                                        }}
                                                        className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                                                    >
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                                                {formatDisplayId(p.display_id || p.id)}
                                                            </span>
                                                            <span
                                                                className={cn(
                                                                    'px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest',
                                                                    p.status === 'captured' || p.status === 'success'
                                                                        ? 'bg-emerald-500/10 text-emerald-600'
                                                                        : 'bg-amber-500/10 text-amber-600'
                                                                )}
                                                            >
                                                                {p.status}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between mt-1">
                                                            <span className="text-[10px] font-black text-slate-900 dark:text-white">
                                                                {formatCurrency(p.amount)}
                                                            </span>
                                                            <span className="text-[9px] font-bold text-slate-400">
                                                                {p.method?.toUpperCase()} • {formatDate(p.created_at)}
                                                            </span>
                                                        </div>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    ) : (
                                        /* ── DESKTOP: Wide table ── */
                                        <div className="w-full overflow-x-auto">
                                            <table className="w-full min-w-[600px] text-left border-collapse">
                                                <thead className="bg-slate-50/50 dark:bg-white/[0.02]">
                                                    <tr className="border-b border-slate-100 dark:border-white/5">
                                                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                            Date
                                                        </th>
                                                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                            Receipt ID
                                                        </th>
                                                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                            Method
                                                        </th>
                                                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                            Amount
                                                        </th>
                                                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">
                                                            Status
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {payments.map(p => (
                                                        <tr
                                                            key={p.id}
                                                            className="border-b border-slate-50 dark:border-white/[0.02] last:border-b-0 group cursor-pointer"
                                                            onClick={() => {
                                                                if (slug) {
                                                                    router.push(`/app/${slug}/receipts/${p.id}`);
                                                                }
                                                            }}
                                                        >
                                                            <td className="px-4 py-3 text-[10px] font-bold text-slate-500">
                                                                {formatDate(p.created_at)}
                                                            </td>
                                                            <td className="px-4 py-3 text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                                                {formatDisplayId(p.display_id || p.id)}
                                                            </td>
                                                            <td className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">
                                                                {p.method}
                                                            </td>
                                                            <td className="px-4 py-3 text-[10px] font-black text-slate-900 dark:text-white">
                                                                {formatCurrency(p.amount)}
                                                            </td>
                                                            <td className="px-4 py-3 text-right">
                                                                <span
                                                                    className={cn(
                                                                        'px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest',
                                                                        p.status === 'captured' ||
                                                                            p.status === 'success'
                                                                            ? 'bg-emerald-500/10 text-emerald-600'
                                                                            : 'bg-amber-500/10 text-amber-600'
                                                                    )}
                                                                >
                                                                    {p.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {payments.length === 0 && (
                                                        <tr>
                                                            <td
                                                                colSpan={5}
                                                                className="py-12 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                                                            >
                                                                No receipts found
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </TransactionSection>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
