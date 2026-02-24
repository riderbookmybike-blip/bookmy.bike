/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import TechSpecsSection from '../Personalize/TechSpecsSection';

export interface PdpSpecsSectionProps {
    layout: 'desktop' | 'mobile';
    product: any;
    data: any;
}

export function PdpSpecsSection({ layout: _layout, product, data: _data }: PdpSpecsSectionProps) {
    const specs = product?.specs || {};
    const specCount = Object.keys(specs).length;
    if (!specs || specCount === 0) return null;

    return (
        <div data-parity-section="specs">
            <TechSpecsSection
                specs={specs}
                modelName={product?.modelName || product?.displayModel}
                variantName={product?.variantName || product?.displayVariant}
            />
        </div>
    );
}
