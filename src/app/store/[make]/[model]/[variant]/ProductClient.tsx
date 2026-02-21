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
import { useDealerSession } from '@/hooks/useDealerSession';
import { useOClubWallet } from '@/hooks/useOClubWallet';
import { useBreakpoint } from '@/hooks/useBreakpoint';

import { InsuranceRule } from '@/types/insurance';

const SKU_UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

const MobilePDP = dynamic(() => import('@/components/store/mobile/MobilePDP').then(mod => mod.MobilePDP), {
    loading: () => <PDPSkeleton />,
    ssr: false,
});

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
    const [isTeamMember, setIsTeamMember] = useState(false);
    const { availableCoins, isLoggedIn } = useOClubWallet();
    const { dealerId: sessionDealerId } = useDealerSession();
    const { device } = useBreakpoint();
    const [forceMobileLayout, setForceMobileLayout] = useState(false);

    // Authority: Determine if team member is gated (Marketplace without lead context)
    const isGated = isTeamMember && !leadIdFromUrl;

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const isCoarsePointer =
            window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(hover: none)').matches;
        const isMobileUA = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');

        // Always treat detected phones as mobile PDP, even if browser is in desktop-site mode.
        const isPhoneDevice = device === 'phone';
        setForceMobileLayout(isPhoneDevice || (device !== 'desktop' && (isCoarsePointer || isMobileUA)));
    }, [device]);

    useEffect(() => {
        const checkUser = async () => {
            const supabase = createClient();
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (user?.email?.endsWith('@bookmy.bike')) {
                setIsTeamMember(true);
            }
        };
        checkUser();
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
        selectedSkuId,
        hasValidColorSku,
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
    const shouldForcePhoneCapture = isTeamMember;

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
        if (selectedColor) {
            url.searchParams.set('color', selectedColor);
        } else {
            url.searchParams.delete('color');
        }

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

    // SSPP v1: Enforce canonical SKU UUID for all persistence actions.
    const colorSkuId = SKU_UUID_REGEX.test(String(selectedSkuId || '')) ? String(selectedSkuId) : null;

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
                qty: Number(quantities?.[a.id] || 1),
            }));

        const selectedServiceItems = (data.activeServices || [])
            .filter((s: any) => selectedServices.includes(s.id))
            .map((s: any) => ({
                id: s.id,
                name: s.name,
                price: s.price,
                discountPrice: s.discountPrice,
                qty: Number(quantities?.[s.id] || 1),
            }));

        const selectedInsuranceAddonItems = (data.availableInsuranceAddons || [])
            .filter((i: any) => selectedInsuranceAddons.includes(i.id))
            .map((i: any) => ({
                id: i.id,
                name: i.name,
                price: i.price,
                discountPrice: i.discountPrice,
                inclusionType: i.inclusionType,
                breakdown: i.breakdown,
                selected: true,
            }));

        const insuranceTotal = (data.baseInsurance || 0) + (data.insuranceAddonsPrice || 0);
        const colorDelta = (data.colorSurge || 0) - (data.colorDiscount || 0);
        const offersDelta = data.offersDiscount || 0;
        const referralBonus = data.isReferralActive ? 5000 : 0;

        const financeChargesDetailed = (data.financeCharges || []).map((c: any) => ({
            id: c.id,
            label: c.label,
            amount: Number(c.value || 0),
            impact: c.impact || 'UPFRONT',
            type: c.type,
            calculationBasis: c.calculationBasis,
            taxStatus: c.taxStatus,
            taxRate: c.taxRate,
            rawValue: c.rawValue,
            basisAmount: c.basisAmount,
            helpText: c.helpText,
        }));
        const upfrontChargesTotal = financeChargesDetailed
            .filter(c => (c.impact || 'UPFRONT') === 'UPFRONT')
            .reduce((sum, c) => sum + (c.amount || 0), 0);
        const fundedChargesTotal = financeChargesDetailed
            .filter(c => (c.impact || 'UPFRONT') === 'FUNDED')
            .reduce((sum, c) => sum + (c.amount || 0), 0);
        const grossLoanAmount = (data.loanAmount || 0) + fundedChargesTotal;

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
                scheme_name: data.initialFinance?.scheme?.name || null,
                scheme_interest_rate: data.initialFinance?.scheme?.interestRate || null,
                scheme_interest_type: data.initialFinance?.scheme?.interestType || null,
                selection_logic: data.initialFinance?.logic || null,
                ltv: data.initialFinance?.scheme?.maxLTV || null,
                roi: (data.annualInterest || 0) * 100,
                tenure_months: data.emiTenure || null,
                down_payment: data.userDownPayment || data.downPayment || 0,
                loan_amount: data.loanAmount || 0,
                loan_addons: fundedChargesTotal,
                gross_loan_amount: grossLoanAmount,
                processing_fee: upfrontChargesTotal,
                charges_breakup: financeChargesDetailed,
                emi: data.emi || 0,
                status: 'IN_PROCESS',
            },
            delivery: {
                serviceable: bestOffer?.isServiceable ?? serverPricing?.dealer?.is_serviceable ?? null,
                pincode: resolvedLocation?.pincode || null,
                taluka: resolvedLocation?.taluka || null,
                district: resolvedLocation?.district || null,
                stateCode: resolvedLocation?.stateCode || null,
                delivery_tat_days: 7,
                checked_at: new Date().toISOString(),
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
                insurance_od: data.insuranceOD || 0,
                insurance_tp: data.insuranceTP || 0,
                insurance_gst: Math.round(
                    (((data.insuranceOD || 0) + (data.insuranceTP || 0)) * (data.insuranceGstRate || 18)) / 100
                ),
                insurance_gst_rate: data.insuranceGstRate || 18,
                insurance_addons_total: data.insuranceAddonsPrice || 0,
                insurance_total: insuranceTotal,
                insurance_breakdown: data.insuranceBreakdown || [],
                insurance_required_items: data.insuranceRequiredItems || [],
                offers: selectedOffers,
                offers_items: data.offersItems || [],
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
                warranty_items: data.warrantyItems || [],
                emi_tenure: data.emiTenure,
                down_payment: data.userDownPayment || data.downPayment, // Use calculated downPayment if user hasn't explicitly set it
                referral_applied: data.isReferralActive || false,
                referral_bonus: referralBonus,
                rto_options: data.rtoOptions || [],
                // Finance Integration
                finance_scheme_id: data.initialFinance?.scheme?.id || null,
                finance_scheme_name: data.initialFinance?.scheme?.name || null,
                finance_bank_id: data.initialFinance?.bank?.id || null,
                finance_bank_name: data.initialFinance?.bank?.name || null,
                finance_emi: data.emi || 0,
                finance_roi: (data.annualInterest || 0) * 100,
                finance_interest_type: data.initialFinance?.scheme?.interestType || null,
                finance_loan_amount: data.loanAmount || 0,
                finance_gross_loan_amount: grossLoanAmount,
                finance_funded_addons: fundedChargesTotal,
                finance_upfront_charges: upfrontChargesTotal,
                finance_charges_breakup: financeChargesDetailed,
                finance_processing_fees: upfrontChargesTotal,
            },
        };
    };

    const handleConfirmQuote = async () => {
        if (!leadContext) return;
        if (!colorSkuId) {
            toast.error('Selected color SKU is unavailable. Please refresh or choose another color.');
            return;
        }

        try {
            const commercials = buildCommercials();

            const result: any = await createQuoteAction({
                tenant_id: sessionDealerId || product.tenant_id || '', // Ensure tenant_id is available
                lead_id: leadContext.id,
                variant_id: product.id,
                color_id: colorSkuId || undefined,
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
        if (!colorSkuId) {
            toast.error('Selected color SKU is unavailable. Please refresh or choose another color.');
            return;
        }

        const supabase = createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (user?.email?.endsWith('@bookmy.bike')) {
            setShowEmailModal(true);
            return;
        }

        // Check if user is authenticated and has complete profile
        if (user?.id) {
            try {
                const { data: member } = await supabase
                    .from('id_members')
                    .select('full_name, primary_phone, pincode, aadhaar_pincode, latitude, longitude, whatsapp')
                    .eq('id', user.id)
                    .maybeSingle();

                // Profile is complete if: name exists + (phone OR GPS coordinates)
                const hasPhone = member?.primary_phone || member?.whatsapp;
                const hasLocation = member?.latitude && member?.longitude;
                const hasName = member?.full_name;

                // If user has required data, skip modal and create quote directly
                if (hasName && (hasPhone || hasLocation)) {
                    const { createLeadAction } = await import('@/actions/crm');

                    toast.loading('Creating your quote...', { id: 'create-quote' });

                    // Extract phone number (normalize if needed)
                    let phoneForLead = member?.primary_phone || member?.whatsapp || '';
                    if (!phoneForLead && user.phone) {
                        // Fallback to auth phone, normalize to 10 digits
                        const digits = user.phone.replace(/\D/g, '');
                        phoneForLead = digits.length >= 10 ? digits.slice(-10) : user.phone;
                    }

                    if (!member) return;

                    const leadResult = await createLeadAction({
                        customer_name: member.full_name || 'Unknown',
                        customer_phone: phoneForLead,
                        customer_pincode: (member.pincode || member.aadhaar_pincode || undefined) as string | undefined,
                        customer_id: user.id, // Pass logged-in user's ID directly!
                        model: product.model || '',
                        owner_tenant_id: (product.tenant_id || undefined) as string | undefined,
                        selected_dealer_id: (sessionDealerId || undefined) as string | undefined,
                        source: 'PDP_QUICK_QUOTE',
                    });

                    if (leadResult.success && (leadResult as any).leadId) {
                        const commercials = buildCommercials();
                        const quoteResult: any = await createQuoteAction({
                            tenant_id: sessionDealerId || product.tenant_id || '',
                            lead_id: (leadResult as any).leadId,
                            variant_id: product.id,
                            color_id: colorSkuId || undefined,
                            commercials,
                            source: 'STORE_PDP',
                        });

                        toast.dismiss('create-quote');

                        if (quoteResult?.success) {
                            const displayId = quoteResult.data?.display_id || quoteResult.data?.id;
                            toast.success(`Quote ${displayId} created successfully! 🎉`);
                            // Optionally redirect to quotes page or show success message
                            router.push('/profile?tab=quotes');
                            return;
                        } else {
                            toast.error(quoteResult?.message || 'Failed to create quote');
                        }
                    } else {
                        toast.dismiss('create-quote');
                        toast.error(leadResult.message || 'Failed to process request');
                    }
                    return;
                }
            } catch (error) {
                console.error('Auto-quote creation error:', error);
                toast.error('Failed to create quote automatically');
            }
        }

        // Fallback: Show modal for non-logged-in users or incomplete profiles
        if (!isReferralActive) {
            setShowQuoteSuccess(true);
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
        handleSaveQuote:
            shouldForcePhoneCapture || !leadIdFromUrl ? () => setShowQuoteSuccess(true) : handleConfirmQuote,
        handleBookingRequest: shouldForcePhoneCapture
            ? () => setShowQuoteSuccess(true)
            : leadIdFromUrl
              ? handleConfirmQuote
              : handleBookingRequest,
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
        walletCoins: isLoggedIn ? availableCoins : null,
        showOClubPrompt: !isLoggedIn,
        isGated,
        forceMobileLayout,
    };

    if (!hasValidColorSku) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white p-8">
                <div className="max-w-md rounded-3xl border border-amber-400/30 bg-white/5 backdrop-blur-xl p-8 text-center">
                    <h1 className="text-2xl font-black tracking-tight mb-3">
                        COLOR SKU <span className="text-amber-400">UNAVAILABLE</span>
                    </h1>
                    <p className="text-sm text-slate-300">
                        This variant does not have a valid purchasable color SKU right now. Try another color or open
                        catalog again.
                    </p>
                    <a
                        href="/store/catalog"
                        className="inline-block mt-6 px-5 py-3 rounded-xl border border-white/20 text-xs font-bold uppercase tracking-[0.16em] hover:bg-white/10"
                    >
                        Back To Catalog
                    </a>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Condition on forceMobileLayout to trigger MobilePDP */}
            {forceMobileLayout ? <MobilePDP {...commonProps} /> : <DesktopPDP {...commonProps} />}

            <LeadCaptureModal
                isOpen={showQuoteSuccess}
                onClose={() => setShowQuoteSuccess(false)}
                productName={`${product.make} ${product.model}`}
                model={product.model}
                variant={variantParam}
                variantId={product.id}
                colorId={colorSkuId || undefined}
                commercials={buildCommercials()}
                source={leadIdFromUrl ? 'LEADS' : 'STORE_PDP'}
            />

            <EmailUpdateModal
                isOpen={showEmailModal}
                onClose={() => setShowEmailModal(false)}
                onSuccess={() => setShowEmailModal(false)}
            />
        </>
    );
}
