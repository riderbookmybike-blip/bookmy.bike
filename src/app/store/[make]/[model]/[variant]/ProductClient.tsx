'use client';

import React, { useState } from 'react';
import { usePDPData, mandatoryAccessories, optionalAccessories, mandatoryInsurance, insuranceAddons, serviceOptions, offerOptions, productColors } from '@/hooks/usePDPData';
import { DeviceLayout } from '@/components/layout/DeviceLayout';
import { PDPMobile } from '@/components/store/PDPMobile';
import { PDPTablet } from '@/components/store/PDPTablet';
import { PDPDesktop } from '@/components/store/PDPDesktop';
import { LeadCaptureModal } from '@/components/leads/LeadCaptureModal';
import { EmailUpdateModal } from '@/components/auth/EmailUpdateModal';
import { createClient } from '@/lib/supabase/client';

interface ProductClientProps {
    product: any;
    makeParam: string;
    modelParam: string;
    variantParam: string;
    initialLocation: any;
    initialPrice: any;
}

export default function ProductClient({
    product,
    makeParam,
    modelParam,
    variantParam,
    initialLocation,
    initialPrice
}: ProductClientProps) {
    const data = usePDPData(initialPrice);
    const {
        setSelectedColor,
        selectedColor,
        totalOnRoad,
        initialLocation: loc, // Not using loc directly but data has it indirectly
        selectedAccessories,
        setSelectedAccessories,
        selectedInsuranceAddons,
        setSelectedInsuranceAddons,
        selectedServices,
        setSelectedServices,
        selectedOffers,
        setSelectedOffers,
        quantities,
        setQuantities,
        isReferralActive,
        setIsReferralActive
    } = data;

    const [showQuoteSuccess, setShowQuoteSuccess] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [showReferralModal, setShowReferralModal] = useState(false);

    const handleShareQuote = () => {
        const url = new URL(window.location.href);
        url.searchParams.set('color', selectedColor);
        if (initialLocation?.pincode) url.searchParams.set('pincode', initialLocation.pincode);

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
        if (mandatoryAccessories.some(a => a.id === id)) return;
        setSelectedAccessories(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const toggleInsuranceAddon = (id: string) => {
        if (mandatoryInsurance.some(i => i.id === id)) return;
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
        handleSaveQuote: () => setShowQuoteSuccess(true),
        handleBookingRequest,
        toggleAccessory,
        toggleInsuranceAddon,
        toggleService,
        toggleOffer,
        updateQuantity
    };

    const commonProps = {
        product,
        variantParam,
        data,
        handlers
    };

    return (
        <>
            <DeviceLayout
                mobile={<PDPMobile {...commonProps} />}
                tablet={<PDPTablet {...commonProps} />}
                desktop={<PDPDesktop {...commonProps} />}
            />

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
                    city: initialLocation?.city
                }}
            />

            <EmailUpdateModal
                isOpen={showEmailModal}
                onClose={() => setShowEmailModal(false)}
            />
        </>
    );
}
