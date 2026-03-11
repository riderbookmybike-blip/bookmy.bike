'use client';

import React from 'react';
import { ProductCard } from '@/components/store/desktop/ProductCard';
import type { ProductVariant } from '@/types/productMaster';
import type { VehicleCardViewMode, VehicleCollectionMode } from './vehicleModeConfig';
import { getSafeViewMode } from './vehicleModeConfig';

interface BaseVehicleCardAdapterProps {
    mode: VehicleCollectionMode;
    variant: ProductVariant;
    viewMode?: VehicleCardViewMode;
    downpayment: number;
    tenure: number;
    pricingMode?: 'cash' | 'finance';
    onTogglePricingMode?: () => void;
    offerMode?: 'BEST_OFFER' | 'FAST_DELIVERY';
    onOfferModeChange?: (mode: 'BEST_OFFER' | 'FAST_DELIVERY') => void;
    variantCount?: number;
    onExplore?: () => void;
    onExplodeColors?: () => void;
    onEditDownpayment?: () => void;
    onCompare?: () => void;
    isInCompare?: boolean;
    serviceability?: {
        status: 'loading' | 'serviceable' | 'unserviceable' | 'unset';
        location?: string;
        district?: string;
        distance?: number;
    };
    onLocationClick?: () => void;
    isTv?: boolean;
    isTvCompact?: boolean;
    leadId?: string;
    walletCoins?: number | null;
    showOClubPrompt?: boolean;
    showBcoinBadge?: boolean;
    bestOffer?: {
        price?: number;
        dealer?: string;
        dealerId?: string;
        isServiceable?: boolean;
        dealerLocation?: string;
        studio_id?: string;
        bundleValue?: number;
        bundlePrice?: number;
        tat_effective_hours?: number | null;
        delivery_tat_days?: number | null;
    } | null;
}

function BaseVehicleCardAdapter({
    mode,
    variant,
    viewMode,
    downpayment,
    tenure,
    pricingMode = 'finance',
    onTogglePricingMode,
    variantCount,
    onExplore,
    onExplodeColors,
    onEditDownpayment,
    onCompare,
    isInCompare,
    serviceability,
    onLocationClick,
    isTv,
    isTvCompact,
    leadId,
    walletCoins,
    showOClubPrompt,
    showBcoinBadge,
    offerMode,
    onOfferModeChange,
    bestOffer,
}: BaseVehicleCardAdapterProps) {
    const resolvedViewMode = getSafeViewMode(mode, viewMode);

    return (
        <ProductCard
            v={variant}
            viewMode={resolvedViewMode}
            downpayment={downpayment}
            tenure={tenure}
            pricingMode={pricingMode}
            onTogglePricingMode={onTogglePricingMode}
            variantCount={variantCount}
            onExplore={onExplore}
            onExplodeColors={onExplodeColors}
            onEditDownpayment={onEditDownpayment}
            onCompare={onCompare}
            isInCompare={isInCompare}
            serviceability={serviceability}
            onLocationClick={onLocationClick}
            isTv={isTv}
            isTvCompact={isTvCompact}
            leadId={leadId}
            walletCoins={walletCoins}
            showOClubPrompt={showOClubPrompt}
            showBcoinBadge={showBcoinBadge}
            offerMode={offerMode}
            onOfferModeChange={onOfferModeChange}
            bestOffer={bestOffer}
        />
    );
}

type CatalogCardAdapterProps = Omit<BaseVehicleCardAdapterProps, 'mode'>;
export function CatalogCardAdapter(props: CatalogCardAdapterProps) {
    return <BaseVehicleCardAdapter {...props} mode="catalog" />;
}

type FavoritesCardAdapterProps = Omit<BaseVehicleCardAdapterProps, 'mode'>;
export function FavoritesCardAdapter(props: FavoritesCardAdapterProps) {
    return <BaseVehicleCardAdapter {...props} mode="favorites" />;
}

type CompareCardAdapterProps = Omit<BaseVehicleCardAdapterProps, 'mode'>;
export function CompareCardAdapter(props: CompareCardAdapterProps) {
    return <BaseVehicleCardAdapter {...props} mode="compare" />;
}

type VariantCompareCardAdapterProps = Omit<BaseVehicleCardAdapterProps, 'mode'>;
export function VariantCompareCardAdapter(props: VariantCompareCardAdapterProps) {
    return <BaseVehicleCardAdapter {...props} mode="variant_compare" />;
}
