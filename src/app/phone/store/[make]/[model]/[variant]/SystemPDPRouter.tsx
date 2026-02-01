'use client';

import React, { useState, useEffect } from 'react';
import { useSystemPDPLogic } from '@/hooks/SystemPDPLogic';
import { DesktopPDP } from '@/components/store/DesktopPDP';
import { PhonePDP } from '@/components/phone/pdp/PhonePDP';
import { LeadCaptureModal } from '@/components/leads/LeadCaptureModal';
import { EmailUpdateModal } from '@/components/auth/EmailUpdateModal';
import { createClient } from '@/lib/supabase/client';
import { useSearchParams, useRouter } from 'next/navigation';
import { createQuoteAction } from '@/actions/crm';
import { toast } from 'sonner';

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

export default function SystemPDPRouter({
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
    const searchParams = useSearchParams();
    const router = useRouter();
    const leadIdFromUrl = searchParams.get('leadId');
    const [leadContext, setLeadContext] = useState<{ id: string, name: string } | null>(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
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
                    .single();
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
        initialFinance
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [showReferralModal, setShowReferralModal] = useState(false);

    useEffect(() => {
        const hydrateDealerContext = async () => {
            if (typeof window === 'undefined') return;
            try {
                const cached = localStorage.getItem('bkmb_user_pincode');
                if (!cached) return;
                const parsed = JSON.parse(cached);
                const district = parsed?.district || parsed?.taluka || parsed?.city;
                const stateCode = parsed?.stateCode || (parsed?.state?.toUpperCase?.().includes('MAHARASHTRA') ? 'MH' : 'MH');
                if (!district) return;

                const supabase = createClient();
                const { data: offers } = await supabase.rpc('get_market_best_offers', {
                    p_district_name: district,
                    p_state_code: stateCode
                });
                if (!offers || offers.length === 0) return;

                const skuIds = (product.colors || []).map((c: any) => c.skuId).filter(Boolean);
                const relevantOffers = offers.filter((o: any) => skuIds.includes(o.vehicle_color_id));
                if (relevantOffers.length === 0) return;

                const winningDealerId = relevantOffers[0].dealer_id;
                const bundleIds = new Set(relevantOffers[0].bundle_ids || []);

                // Update color dealer offers
                const offerMap = new Map<string, number>();
                relevantOffers.forEach((o: any) => {
                    if (o.dealer_id === winningDealerId) {
                        offerMap.set(o.vehicle_color_id, Number(o.best_offer));
                    }
                });

                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const winningDealerName = relevantOffers[0].dealer_name;
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const studioDisplayLabel = winningDealerName?.startsWith('STUDIO') ? winningDealerName : `STUDIO ${winningDealerName}`;

                setClientColors((prev: any[]) =>
                    prev.map((c: any) => {
                        if (!c.skuId) return c;
                        const raw = offerMap.get(c.skuId) || 0;
                        const dealerOfferValue = raw < 0 ? Math.abs(raw) : 0;
                        return { ...c, dealerOffer: dealerOfferValue };
                    })
                );

                // Update accessories with dealer rules + bundle inclusion
                const accessoryIds = (initialAccessories || []).map((a: any) => a.id);
                if (accessoryIds.length > 0 && winningDealerId) {
                    const { data: rules } = await supabase
                        .from('id_dealer_pricing_rules')
                        .select('vehicle_color_id, offer_amount, inclusion_type')
                        .in('vehicle_color_id', accessoryIds)
                        .eq('tenant_id', winningDealerId)
                        .eq('state_code', stateCode);

                    const ruleMap = new Map<string, any>();
                    rules?.forEach((r: any) => ruleMap.set(r.vehicle_color_id, r));

                    const updatedAccessories = (initialAccessories || []).map((a: any) => {
                        const rule = ruleMap.get(a.id);
                        const offer = rule ? Number(rule.offer_amount) : 0;
                        const inclusionType = rule?.inclusion_type || (bundleIds.has(a.id) ? 'BUNDLE' : a.inclusionType || 'OPTIONAL');
                        const discountPrice = Math.max(0, Number(a.price) + offer);

                        return {
                            ...a,
                            inclusionType,
                            isMandatory: inclusionType === 'MANDATORY',
                            discountPrice
                        };
                    });

                    setClientAccessories(updatedAccessories);

                    if (!hasTouchedAccessories) {
                        const defaults = updatedAccessories
                            .filter((a: any) => a.isMandatory || a.inclusionType === 'BUNDLE')
                            .map((a: any) => a.id);
                        setSelectedAccessories(defaults);
                    }
                }
            } catch (err) {
                // Silent: PDP should still work with base pricing
            }
        };

        hydrateDealerContext();
    }, [hasTouchedAccessories, initialAccessories, product.colors, setSelectedAccessories]);

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

            const result = await createQuoteAction({
                tenant_id: product.tenant_id, // Ensure tenant_id is available
                lead_id: leadContext.id,
                variant_id: product.id,
                color_id: selectedColor, // Assuming selectedColor is the color_id/SKU ID
                commercials
            });

            if (result.success) {
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
        leadContext: leadContext || undefined
    };

    return (
        <>
            {isMobile ? (
                <PhonePDP
                    product={product}
                    data={data}
                    handlers={handlers}
                    initialLocation={initialLocation}
                />
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
