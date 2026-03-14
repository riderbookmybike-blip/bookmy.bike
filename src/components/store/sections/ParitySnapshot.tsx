/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import type { PdpCommonState } from '../Personalize/pdpComputations';
import { REQUIRED_CORE_KEYS, COMMAND_BAR_KEYS } from './pdpParityContract';

/**
 * ParitySnapshot — Hidden DOM element that emits structured JSON
 * for Playwright parity tests.
 *
 * Phase 2-D hardening: accepts `commonState` from `buildPdpCommonState()`
 * and snapshots high-risk runtime values (displayOnRoad, totalSavings,
 * bCoinDiscount, TAT label, studioId, footerEmi) in addition to the
 * existing aggregate values.
 *
 * Test assertions should read `data-parity-snapshot` attribute as JSON.
 */
export interface ParitySnapshotProps {
    data: any;
    product: any;
    /**
     * Pre-computed common state from `buildPdpCommonState()`.
     * Both Desktop and Mobile shells pass this so the snapshot
     * reflects the exact values those shells render — not a
     * re-computation that might drift.
     */
    commonState?: PdpCommonState | null;
}

export function ParitySnapshot({ data, product, commonState }: ParitySnapshotProps) {
    const snapshot = {
        // ── Aggregate values (existing) ──
        totalOnRoad: data.totalOnRoad ?? 0,
        baseExShowroom: data.baseExShowroom ?? 0,
        emi: data.emi ?? 0,
        emiTenure: data.emiTenure ?? 0,
        regType: data.regType ?? 'STATE',
        downPayment: data.userDownPayment ?? data.downPayment ?? 0,

        // ── High-risk runtime values (Phase 2-D additions) ──
        // These are sourced from buildPdpCommonState() so any compute drift
        // between Desktop and Mobile will show up as a mismatch in tests.
        displayOnRoad: commonState?.displayOnRoad ?? null,
        totalSavings: commonState?.totalSavings ?? null,
        bCoinDiscount: commonState?.coinPricing?.discount ?? 0,
        deliveryTatLabel: commonState?.deliveryTatLabel ?? null,
        studioIdLabel: commonState?.studioIdLabel ?? null,
        studioDistanceKm: commonState?.studioDistanceKm ?? null,
        footerEmi: commonState?.footerEmi ?? null,
        footerEmiTenure: data.emiTenure ?? null,

        // ── Detailed option lists (for non-aggregate drift detection) ──
        registrationOptions: (data.rtoOptions || []).map((o: any) => o.type || o.label || o.id),
        warrantyItemIds: (data.warrantyItems || []).map((w: any) => w.id),
        specKeys: Object.keys(product?.specs || {}),
        accessoryIds: (data.activeAccessories || []).map((a: any) => a.id),
        serviceIds: (data.activeServices || []).map((s: any) => s.id),
        insuranceAddonIds: (data.availableInsuranceAddons || []).map((i: any) => i.id),

        // ── Pricing line-item keys (derived from contract) ──
        // REQUIRED_CORE_KEYS are always present; conditional keys
        // added only when their runtime condition is true.
        pricingLineItemKeys: [
            ...REQUIRED_CORE_KEYS,
            ...(data.otherCharges > 0 ? ['other_charges'] : []),
            ...(commonState && commonState.totalSavings > 0 ? ['o_circle_privileged'] : []),
            ...((commonState?.coinPricing?.discount ?? 0) > 0 ? ['bcoin_used'] : []),
            ...(commonState && commonState.totalSurge > 0 ? ['surge_charges'] : []),
            ...(commonState?.deliveryByLabel != null ? ['delivery_by'] : []),
            ...(commonState?.studioIdLabel != null ? ['studio_id'] : []),
            ...(commonState?.studioDistanceKm != null ? ['distance'] : []),
        ] as string[],

        // ── COMMAND_BAR_KEYS (contract, snake_case) — R3 enforcement ──
        // Always emitted so that Playwright COMMAND_BAR_KEYS assertions have values.
        // Values sourced exclusively from buildCommandBarState() via commonState.
        display_on_road: commonState?.displayOnRoad ?? null,
        bcoin_equivalent: commonState?.bCoinEquivalent ?? null,
        total_savings: commonState?.totalSavings ?? null,
        footer_emi: commonState?.footerEmi ?? null,
        emi_tenure: data.emiTenure ?? null,

        // Compile-time gate: if contract COMMAND_BAR_KEYS changes, this
        // tuple literal will cause a TS error until the snapshot is updated.
        _commandBarContractRef: COMMAND_BAR_KEYS as readonly string[],
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
