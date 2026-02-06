'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useSystemPDPLogic } from '@/hooks/SystemPDPLogic';
import { LeadCaptureModal } from '@/components/leads/LeadCaptureModal';
import { EmailUpdateModal } from '@/components/auth/EmailUpdateModal';
import { createClient } from '@/lib/supabase/client';
import { useSearchParams, useRouter } from 'next/navigation';
import { createQuoteAction } from '@/actions/crm';
import { toast } from 'sonner';
import { useSystemDealerContext } from '@/hooks/useSystemDealerContext';

import { InsuranceRule } from '@/types/insurance';

// Dynamic imports for heavy PDP components (bundle optimization)
const PDPSkeleton = () => (
    <div className="min-h-screen bg-black animate-pulse">
        <div className="h-16 bg-zinc-900 border-b border-zinc-800" />
        <div className="max-w-7xl mx-auto p-6 grid md:grid-cols-2 gap-8 mt-8">
            <div className="aspect-square bg-zinc-800 rounded-3xl" />
            <div className="space-y-4">
                <div className="h-12 bg-zinc-800 rounded-xl w-3/4" />
                <div className="h-8 bg-zinc-800 rounded-lg w-1/2" />
                <div className="h-32 bg-zinc-800 rounded-2xl mt-8" />
            </div>
        </div>
    </div>
);

const DesktopPDP = dynamic(() => import('@/components/store/DesktopPDP').then(mod => mod.DesktopPDP), {
    loading: () => <PDPSkeleton />,
    ssr: false,
});

const PhonePDPEnhanced = dynamic(
    () => import('@/components/phone/pdp/PhonePDPEnhanced').then(mod => mod.PhonePDPEnhanced),
    { loading: () => <PDPSkeleton />, ssr: false }
);

interface ProductClientProps {
    product: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    makeParam: string;
    modelParam: string;
    variantParam: string;
    initialLocation: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    initialPrice: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    insuranceRule?: InsuranceRule;
    registrationRule?: any; // Added
    initialAccessories?: any[];
    initialServices?: any[];
    initialFinance?: any;
    initialDealerId?: string | null;
}

export default function ProductClient({
    product,
    makeParam,
    modelParam,
    variantParam,
    initialLocation,
    initialPrice,
    insuranceRule,
    registrationRule, // Added
    initialAccessories = [],
    initialServices = [],
    initialFinance,
    initialDealerId = null,
}: ProductClientProps) {
    const [clientAccessories, setClientAccessories] = useState(initialAccessories);
    const [clientColors, setClientColors] = useState(product.colors);
    const [hasTouchedAccessories, setHasTouchedAccessories] = useState(false);
    const initialServerPricing =
        initialPrice?.breakdown && typeof initialPrice.breakdown === 'object' ? initialPrice.breakdown : null;
    const hasResolvedDealer = Boolean(initialDealerId || initialServerPricing?.dealer?.id);
    // SSPP v1: Local state to bridge serverPricing from useSystemDealerContext to useSystemPDPLogic
    const [ssppServerPricing, setSsppServerPricing] = useState<any>(initialServerPricing);
    const searchParams = useSearchParams();
    const router = useRouter();
    const leadIdFromUrl = searchParams.get('leadId');
    const [leadContext, setLeadContext] = useState<{ id: string; name: string } | null>(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (leadIdFromUrl) {
            const fetchLead = async () => {
                const supabase = createClient();
                const { data: lead } = (await supabase
                    .from('crm_leads')
                    .select('id, customer_name')
                    .eq('id', leadIdFromUrl)
                    .single()) as { data: { id: string; customer_name: string } | null; error: any };

                if (lead) {
                    setLeadContext({ id: lead.id, name: lead.customer_name });
                }
            };
            fetchLead();
        }
    }, [leadIdFromUrl]);

    const { data, actions } = useSystemPDPLogic({
        initialPrice,
        colors: clientColors, // Passing colors from product (client-aware)
        insuranceRule,
        registrationRule,
        initialAccessories: clientAccessories,
        initialServices,
        product,
        initialFinance,
        serverPricing: ssppServerPricing, // SSPP v1: Pass server-calculated pricing for Single Source of Truth
    });

    const {
        selectedColor,
        totalOnRoad,
        selectedAccessories,
        selectedInsuranceAddons,
        selectedServices,
        selectedOffers,
        quantities,
        isReferralActive,
        baseExShowroom,
    } = data;

    const {
        setSelectedColor,
        setSelectedAccessories,
        setSelectedInsuranceAddons,
        setSelectedServices,
        setSelectedOffers,
        setQuantities,
        setIsReferralActive,
        setRegType,
        setEmiTenure,
        setConfigTab,
        setUserDownPayment,
    } = actions;

    const [showQuoteSuccess, setShowQuoteSuccess] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [showReferralModal, setShowReferralModal] = useState(false);

    // Unified Dealer Context Hook
    const { dealerColors, dealerAccessories, bestOffer, resolvedLocation, serverPricing } = useSystemDealerContext({
        product,
        initialAccessories,
        initialLocation,
        selectedColor, // This relies on the color state from useSystemPDPLogic
        overrideDealerId: initialDealerId, // Prioritize this dealer
        disabled: hasResolvedDealer,
        prefetchedPricing: initialServerPricing,
        prefetchedLocation: initialLocation,
    });

    // Update client state when hook returns new data
    useEffect(() => {
        if (dealerColors && dealerColors.length > 0) {
            setClientColors(dealerColors);
        }
    }, [dealerColors]);

    // SSPP v1: Sync serverPricing from useSystemDealerContext to local state
    useEffect(() => {
        if (!hasResolvedDealer && serverPricing) {
            setSsppServerPricing(serverPricing);
        }
    }, [serverPricing, hasResolvedDealer]);

    useEffect(() => {
        if (dealerAccessories && dealerAccessories.length > 0) {
            setClientAccessories(dealerAccessories);

            // Only auto-select mandatory/bundled if user hasn't touched yet
            if (!hasTouchedAccessories) {
                const defaults = dealerAccessories
                    .filter((a: any) => a.isMandatory || a.inclusionType === 'BUNDLE')
                    .map((a: any) => a.id);
                setSelectedAccessories(defaults);
            }
        }
    }, [dealerAccessories, hasTouchedAccessories, setSelectedAccessories]);

    const shareInFlightRef = useRef(false);

    const handleShareQuote = async () => {
        if (shareInFlightRef.current) return;
        const url = new URL(window.location.href);
        url.searchParams.set('color', selectedColor);

        // Remove legacy pincode if it somehow exists
        url.searchParams.delete('pincode');

        if (initialLocation?.district) {
            url.searchParams.set('district', initialLocation.district);
        } else if (initialLocation?.pincode) {
            url.searchParams.set('district', initialLocation.pincode);
        }

        const existingState = url.searchParams.get('state');
        if (!existingState) {
            let stateValue: string | null = initialLocation?.state || null;
            if (!stateValue && typeof window !== 'undefined') {
                const cached = localStorage.getItem('bkmb_user_pincode');
                if (cached) {
                    try {
                        const parsed = JSON.parse(cached);
                        stateValue = parsed?.stateCode || parsed?.state || null;
                    } catch {
                        stateValue = null;
                    }
                }
            }
            if (stateValue) {
                url.searchParams.set('state', stateValue);
            }
        }
        if (leadIdFromUrl) url.searchParams.set('leadId', leadIdFromUrl);

        if (navigator.share) {
            try {
                shareInFlightRef.current = true;
                await navigator.share({
                    title: `${product.model} Configuration`,
                    text: `Check out ${product.model} on BookMyBike! Price: ₹${totalOnRoad.toLocaleString()}`,
                    url: url.toString(),
                });
            } catch (err: any) {
                if (err?.name !== 'AbortError' && err?.name !== 'InvalidStateError') {
                    console.error('Share failed:', err);
                }
            } finally {
                shareInFlightRef.current = false;
            }
        } else {
            try {
                await navigator.clipboard.writeText(url.toString());
                alert('URL copied!');
            } catch (err) {
                console.error('Clipboard copy failed:', err);
            }
        }
    };

    // SSPP v1: Map color slug to actual SKU UUID for database operations
    const colorSkuId =
        clientColors?.find((c: any) => c.id === selectedColor || c.name === selectedColor)?.skuId || selectedColor;

    const buildCommercials = () => {
        const resolvedColor =
            data.colors?.find(
                (c: any) => c.id === selectedColor || c.skuId === selectedColor || c.name === selectedColor
            ) ||
            clientColors?.find(
                (c: any) => c.id === selectedColor || c.skuId === selectedColor || c.name === selectedColor
            );
        const colorName = resolvedColor?.name || selectedColor;
        const variantName = product.variant || variantParam;
        const labelBase = [product.model, variantName].filter(Boolean).join(' ');
        const displayLabel = `${labelBase}${colorName ? ` (${colorName})` : ''}`;

        const selectedAccessoryItems = (data.activeAccessories || [])
            .filter((a: any) => selectedAccessories.includes(a.id))
            .map((a: any) => ({
                id: a.id,
                name: a.description || a.displayName || a.name,
                price: a.price,
                discountPrice: a.discountPrice,
                inclusionType: a.inclusionType,
            }));

        const selectedServiceItems = (data.activeServices || [])
            .filter((s: any) => selectedServices.includes(s.id))
            .map((s: any) => ({
                id: s.id,
                name: s.name,
                price: s.price,
                discountPrice: s.discountPrice,
            }));

        const selectedInsuranceAddonItems = (data.availableInsuranceAddons || [])
            .filter((i: any) => selectedInsuranceAddons.includes(i.id))
            .map((i: any) => ({
                id: i.id,
                name: i.name,
                price: i.price,
                discountPrice: i.discountPrice,
                inclusionType: i.inclusionType,
            }));

        const insuranceTotal = (data.baseInsurance || 0) + (data.insuranceAddonsPrice || 0);
        const colorDelta = (data.colorSurge || 0) - (data.colorDiscount || 0);
        const offersDelta = data.offersDiscount || 0;

        return {
            brand: product.make,
            model: product.model,
            variant: variantName,
            label: displayLabel,
            color_name: colorName,
            color_hex: resolvedColor?.hexCode || resolvedColor?.hex || resolvedColor?.hex_primary,
            color_is_default: (data.colors || []).length <= 1,
            image_url: resolvedColor?.imageUrl || resolvedColor?.image_url || product.imageUrl,
            ex_showroom: baseExShowroom,
            grand_total: totalOnRoad,
            finance: {
                bank_id: data.initialFinance?.bank?.id || null,
                bank_name: data.initialFinance?.bank?.name || null,
                scheme_id: data.initialFinance?.scheme?.id || null,
                scheme_code: data.initialFinance?.scheme?.name || null,
                ltv: data.initialFinance?.scheme?.maxLTV || null,
                roi: (data.annualInterest || 0) * 100,
                tenure_months: data.emiTenure || null,
                down_payment: data.userDownPayment || data.downPayment || 0,
                loan_amount: data.loanAmount || 0,
                loan_addons: 0,
                processing_fee: data.financeCharges?.reduce((sum: number, c: any) => sum + (c.value || 0), 0) || 0,
                charges_breakup: data.financeCharges || [],
                emi: data.emi || 0,
                status: 'IN_PROCESS',
            },
            pricing_snapshot: {
                pricing_source: data.pricingSource,
                location: serverPricing?.location || resolvedLocation || null,
                dealer: serverPricing?.dealer || bestOffer || null,
                sku_id: colorSkuId,
                color_name: colorName,
                color_is_default: (data.colors || []).length <= 1,
                color_delta: colorDelta,
                ex_showroom: baseExShowroom,
                rto_type: data.regType,
                rto_total: data.rtoEstimates || 0,
                rto_breakdown: data.rtoBreakdown || [],
                insurance_base: data.baseInsurance || 0,
                insurance_addons_total: data.insuranceAddonsPrice || 0,
                insurance_total: insuranceTotal,
                insurance_breakdown: data.insuranceBreakdown || [],
                offers: selectedOffers,
                offers_delta: offersDelta,
                accessories_total: data.accessoriesPrice || 0,
                accessories_discount: data.accessoriesDiscount || 0,
                accessories_surge: data.accessoriesSurge || 0,
                services_total: data.servicesPrice || 0,
                services_discount: data.servicesDiscount || 0,
                services_surge: data.servicesSurge || 0,
                insurance_addons_discount: data.insuranceAddonsDiscount || 0,
                insurance_addons_surge: data.insuranceAddonsSurge || 0,
                total_savings: data.totalSavings || 0,
                total_surge: data.totalSurge || 0,
                accessories: selectedAccessories,
                accessory_items: selectedAccessoryItems,
                services: selectedServices,
                service_items: selectedServiceItems,
                insurance_addons: selectedInsuranceAddons,
                insurance_addon_items: selectedInsuranceAddonItems,
                emi_tenure: data.emiTenure,
                down_payment: data.userDownPayment || data.downPayment, // Use calculated downPayment if user hasn't explicitly set it
                // Finance Integration
                finance_scheme_id: data.initialFinance?.scheme?.id || null,
                finance_bank_name: data.initialFinance?.bank?.name || null,
                finance_emi: data.emi || 0,
                finance_roi: (data.annualInterest || 0) * 100,
                finance_loan_amount: data.loanAmount || 0,
                finance_processing_fees:
                    data.financeCharges?.reduce((sum: number, c: any) => sum + (c.value || 0), 0) || 0,
            },
        };
    };

    const handleConfirmQuote = async () => {
        if (!leadContext) return;

        try {
            const commercials = buildCommercials();

            const result: any = await createQuoteAction({
                tenant_id: product.tenant_id, // Ensure tenant_id is available
                lead_id: leadContext.id,
                variant_id: product.id,
                color_id: colorSkuId,
                commercials,
                source: 'STORE_PDP',
            });

            if (result?.success) {
                toast.success(`Quote saved for ${leadContext.name}`);
                router.back(); // Go back to leads
            } else {
                console.error('Server reported failure saving quote in PDP:', result);
                toast.error(result?.message || 'Failed to save quote');
            }
        } catch (error) {
            console.error('Save quote error:', error);
            toast.error('An error occurred while saving the quote');
        }
    };

    const handleBookingRequest = async () => {
        const supabase = createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (user?.email?.endsWith('@bookmy.bike')) {
            setShowEmailModal(true);
            return;
        }

        if (!isReferralActive) {
            setShowQuoteSuccess(true); // Simplified for now
        } else {
            setShowQuoteSuccess(true);
        }
    };

    const toggleAccessory = (id: string) => {
        const accessory = data.activeAccessories.find((a: any) => a.id === id);
        if (accessory?.isMandatory) return;
        setHasTouchedAccessories(true);
        setSelectedAccessories(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
    };

    const toggleInsuranceAddon = (id: string) => {
        const addon = data.availableInsuranceAddons.find((i: any) => i.id === id);
        if (addon?.isMandatory) return;
        setSelectedInsuranceAddons(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
    };

    const toggleService = (id: string) => {
        setSelectedServices(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
    };

    const toggleOffer = (id: string) => {
        setSelectedOffers(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
    };

    const updateQuantity = (id: string, delta: number, max: number = 1) => {
        setQuantities(prev => {
            const current = prev[id] || 1;
            const next = Math.min(Math.max(1, current + delta), max);
            return { ...prev, [id]: next };
        });
    };

    const handlers = {
        handleColorChange: setSelectedColor,
        handleShareQuote,
        handleSaveQuote: leadIdFromUrl ? handleConfirmQuote : () => setShowQuoteSuccess(true),
        handleBookingRequest: leadIdFromUrl ? handleConfirmQuote : handleBookingRequest,
        toggleAccessory,
        toggleInsuranceAddon,
        toggleService,
        toggleOffer,
        updateQuantity,
        setRegType,
        setEmiTenure,
        setConfigTab,
        setUserDownPayment,
    };

    const commonProps = {
        product,
        makeParam,
        modelParam,
        variantParam,
        data,
        handlers,
        leadContext: leadContext || undefined,
        initialLocation: resolvedLocation || initialLocation,
        bestOffer, // Passing bestOffer to children
        serverPricing, // SSPP v1: Server-calculated pricing breakdown
    };

    return (
        <>
            {isMobile ? <PhonePDPEnhanced {...commonProps} /> : <DesktopPDP {...commonProps} basePath="/phone/store" />}

            <LeadCaptureModal
                isOpen={showQuoteSuccess}
                onClose={() => setShowQuoteSuccess(false)}
                productName={`${product.make} ${product.model}`}
                model={product.model}
                variant={variantParam}
                variantId={product.id}
                colorId={colorSkuId}
                commercials={buildCommercials()}
                source="STORE_PDP"
            />

            <EmailUpdateModal
                isOpen={showEmailModal}
                onClose={() => setShowEmailModal(false)}
                onSuccess={() => setShowEmailModal(false)}
            />
        </>
    );
}
