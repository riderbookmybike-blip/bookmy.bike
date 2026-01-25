'use client';

import React, { useState } from 'react';
import { usePDPData } from '@/hooks/usePDPData';
import { MasterPDP } from '@/components/store/MasterPDP';
import { LeadCaptureModal } from '@/components/leads/LeadCaptureModal';
import { EmailUpdateModal } from '@/components/auth/EmailUpdateModal';
import { createClient } from '@/lib/supabase/client';

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
    initialServices = []
}: ProductClientProps) {
    const { data, actions } = usePDPData({
        initialPrice,
        colors: product.colors, // Passing colors from product
        insuranceRule,
        registrationRule,
        initialAccessories,
        initialServices,
        product
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
        const accessory = data.activeAccessories.find((a: any) => a.id === id);
        if (accessory?.isMandatory) return;
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
        handleSaveQuote: () => setShowQuoteSuccess(true),
        handleBookingRequest,
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
        handlers
    };

    return (
        <>
            <MasterPDP {...commonProps} />

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
                    taluka: initialLocation?.taluka || initialLocation?.city
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
