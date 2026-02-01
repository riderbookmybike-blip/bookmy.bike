'use client';

import React, { useState, useEffect } from 'react';
import { useSystemPDPLogic } from '@/hooks/SystemPDPLogic';
import { DesktopPDP } from '@/components/store/DesktopPDP';
import { LeadCaptureModal } from '@/components/leads/LeadCaptureModal';
import { EmailUpdateModal } from '@/components/auth/EmailUpdateModal';
import { createClient } from '@/lib/supabase/client';
import { useSearchParams, useRouter } from 'next/navigation';
import { createQuoteAction } from '@/actions/crm';
import { toast } from 'sonner';
import { useSystemDealerContext } from '@/hooks/useSystemDealerContext';
import { PhonePDPEnhanced } from '@/components/phone/pdp/PhonePDPEnhanced';

import { InsuranceRule } from '@/types/insurance';

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
    initialFinance
}: ProductClientProps) {
    const [clientAccessories, setClientAccessories] = useState(initialAccessories);
    const [clientColors, setClientColors] = useState(product.colors);
    const [hasTouchedAccessories, setHasTouchedAccessories] = useState(false);
    // SSPP v1: Local state to bridge serverPricing from useSystemDealerContext to useSystemPDPLogic
    const [ssppServerPricing, setSsppServerPricing] = useState<any>(null);
    const searchParams = useSearchParams();
    const router = useRouter();
    const leadIdFromUrl = searchParams.get('leadId');
    const [leadContext, setLeadContext] = useState<{ id: string, name: string } | null>(null);
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
                const { data: lead } = await supabase
                    .from('crm_leads')
                    .select('id, full_name')
                    .eq('id', leadIdFromUrl)
                    .single() as { data: { id: string, full_name: string } | null, error: any };

                if (lead) {
                    setLeadContext({ id: lead.id, name: lead.full_name });
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
        serverPricing: ssppServerPricing // SSPP v1: Pass server-calculated pricing for Single Source of Truth
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
        baseExShowroom
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
        setUserDownPayment
    } = actions;

    const [showQuoteSuccess, setShowQuoteSuccess] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [showReferralModal, setShowReferralModal] = useState(false);

    // Unified Dealer Context Hook
    const { dealerColors, dealerAccessories, bestOffer, resolvedLocation, serverPricing } = useSystemDealerContext({
        product,
        initialAccessories,
        initialLocation,
        selectedColor // This relies on the color state from useSystemPDPLogic, but wait... 
        // Circular dependency risk: useSystemPDPLogic needs 'colors', but 'dealerColors' comes from hook.
        // Solution: Pass 'dealerColors' to useSystemPDPLogic. 
        // 'selectedColor' is state managed BY useSystemPDPLogic, so initially it might be undefined/default.
    });

    // Update client state when hook returns new data
    useEffect(() => {
        if (dealerColors && dealerColors.length > 0) {
            setClientColors(dealerColors);
        }
    }, [dealerColors]);

    // SSPP v1: Sync serverPricing from useSystemDealerContext to local state
    useEffect(() => {
        if (serverPricing) {
            setSsppServerPricing(serverPricing);
        }
    }, [serverPricing]);

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


    const handleShareQuote = () => {
        const url = new URL(window.location.href);
        url.searchParams.set('color', selectedColor);
        if (initialLocation?.pincode) url.searchParams.set('pincode', initialLocation.pincode);
        if (leadIdFromUrl) url.searchParams.set('leadId', leadIdFromUrl);

        if (navigator.share) {
            navigator.share({
                title: `${product.model} Configuration`,
                text: `Check out ${product.model} on BookMyBike! Price: ₹${totalOnRoad.toLocaleString()}`,
                url: url.toString(),
            });
        } else {
            navigator.clipboard.writeText(url.toString());
            alert('URL copied!');
        }
    };

    const handleConfirmQuote = async () => {
        if (!leadContext) return;

        try {
            const commercials = {
                label: `${product.model} ${variantParam} (${selectedColor})`,
                ex_showroom: baseExShowroom,
                grand_total: totalOnRoad,
                pricing_snapshot: {
                    accessories: selectedAccessories,
                    services: selectedServices,
                    insurance_addons: selectedInsuranceAddons,
                    rto_type: data.regType,
                    emi_tenure: data.emiTenure,
                    down_payment: data.userDownPayment
                }
            };

            const result: any = await createQuoteAction({
                tenant_id: product.tenant_id, // Ensure tenant_id is available
                lead_id: leadContext.id,
                variant_id: product.id,
                color_id: selectedColor, // Assuming selectedColor is the color_id/SKU ID
                commercials
            });

            if (result?.success) {
                toast.success(`Quote saved for ${leadContext.name}`);
                router.back(); // Go back to leads
            } else {
                toast.error('Failed to save quote');
            }
        } catch (error) {
            console.error('Save quote error:', error);
            toast.error('An error occurred while saving the quote');
        }
    };

    const handleBookingRequest = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

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
        setSelectedAccessories(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const toggleInsuranceAddon = (id: string) => {
        const addon = data.availableInsuranceAddons.find((i: any) => i.id === id);
        if (addon?.isMandatory) return;
        setSelectedInsuranceAddons(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const toggleService = (id: string) => {
        setSelectedServices(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const toggleOffer = (id: string) => {
        setSelectedOffers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
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
        setUserDownPayment
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
        serverPricing // SSPP v1: Server-calculated pricing breakdown
    };

    return (
        <>
            {isMobile ? (
                <PhonePDPEnhanced {...commonProps} />
            ) : (
                <DesktopPDP {...commonProps} basePath="/phone/store" />
            )}

            <LeadCaptureModal
                isOpen={showQuoteSuccess}
                onClose={() => setShowQuoteSuccess(false)}
                productName={`${product.make} ${product.model}`}
                model={product.model}
                variant={variantParam}
                color={selectedColor}
                priceSnapshot={{
                    exShowroom: data.baseExShowroom,
                    onRoad: data.totalOnRoad,
                    taluka: initialLocation?.taluka || initialLocation?.city,
                    schemeId: initialFinance?.scheme?.id
                }}
            />

            <EmailUpdateModal
                isOpen={showEmailModal}
                onClose={() => setShowEmailModal(false)}
                onSuccess={() => setShowEmailModal(false)}
            />
        </>
    );
}
