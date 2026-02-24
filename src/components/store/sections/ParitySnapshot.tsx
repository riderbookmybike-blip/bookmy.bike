/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';

/**
 * ParitySnapshot — Hidden DOM element that emits structured JSON
 * for Playwright parity tests.
 *
 * Rendered by both Desktop and Mobile shells, guaranteeing identical
 * output because the same component + same data is used.
 *
 * Asserts: totalOnRoad, emi, emiTenure, regType, specKeys,
 * accessoryIds, serviceIds, insuranceAddonIds, warrantyItemIds,
 * registrationOptions, pricingLineItemKeys.
 */
export interface ParitySnapshotProps {
    data: any;
    product: any;
}

export function ParitySnapshot({ data, product }: ParitySnapshotProps) {
    const snapshot = {
        // Aggregate values
        totalOnRoad: data.totalOnRoad ?? 0,
        baseExShowroom: data.baseExShowroom ?? 0,
        emi: data.emi ?? 0,
        emiTenure: data.emiTenure ?? 0,
        regType: data.regType ?? 'STATE',
        downPayment: data.userDownPayment ?? data.downPayment ?? 0,

        // Detailed option lists (for non-aggregate drift detection)
        registrationOptions: (data.rtoOptions || []).map((o: any) => o.type || o.label || o.id),
        warrantyItemIds: (data.warrantyItems || []).map((w: any) => w.id),
        specKeys: Object.keys(product?.specs || {}),
        accessoryIds: (data.activeAccessories || []).map((a: any) => a.id),
        serviceIds: (data.activeServices || []).map((s: any) => s.id),
        insuranceAddonIds: (data.availableInsuranceAddons || []).map((i: any) => i.id),
        pricingLineItemKeys: [
            'ex_showroom',
            'registration',
            'insurance',
            'insurance_addons',
            'mandatory_accessories',
            'optional_accessories',
            'services',
            ...(data.otherCharges > 0 ? ['other_charges'] : []),
        ],
    };

    return (
        <div
            data-testid="pdp-parity-json"
            data-parity-snapshot={JSON.stringify(snapshot)}
            style={{ display: 'none' }}
            aria-hidden="true"
        />
    );
}
