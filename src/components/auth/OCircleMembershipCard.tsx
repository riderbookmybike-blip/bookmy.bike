'use client';

import React from 'react';
import { MembershipCard, type WalletData } from '@/components/auth/MembershipCard';
import { resolveMembershipCardIdentity } from '@/lib/oclub/membershipCardIdentity';

const O_CIRCLE_CARD_SIZE_PRESETS = {
    sidebar: 'max-w-[432px] mx-auto',
    dossier: 'max-w-[432px] mx-auto',
    hero: 'max-w-[380px] lg:max-w-[460px] mx-auto',
    profile: 'max-w-[340px] lg:max-w-[380px] mx-auto',
    compact: 'max-w-[300px] mx-auto',
    showcase: 'max-w-[475px] mx-auto',
} as const;

export type OCircleCardSizePreset = keyof typeof O_CIRCLE_CARD_SIZE_PRESETS;

interface OCircleMembershipCardProps {
    memberName?: string | null;
    memberCode?: string | null;
    wallet?: WalletData | null;
    validity?: string;
    compact?: boolean;
    isActive?: boolean;
    sizePreset?: OCircleCardSizePreset;
    maxWidthClassName?: string;
}

/**
 * Canonical O'Circle card wrapper.
 * Use this component everywhere to keep card data + visual style in sync.
 */
export function OCircleMembershipCard({
    memberName,
    memberCode,
    wallet = null,
    validity = '∞',
    compact = true,
    isActive = false,
    sizePreset = 'sidebar',
    maxWidthClassName = '',
}: OCircleMembershipCardProps) {
    const identity = resolveMembershipCardIdentity({
        memberName,
        memberCode,
    });
    const containerClass = maxWidthClassName || O_CIRCLE_CARD_SIZE_PRESETS[sizePreset];

    return (
        <div className={`w-full ${containerClass}`.trim()}>
            <MembershipCard
                name={identity.name}
                id={identity.code}
                validity={validity}
                compact={compact}
                isActive={isActive}
                wallet={wallet}
                showChip={false}
                interactive={false}
            />
        </div>
    );
}

export type { WalletData };
