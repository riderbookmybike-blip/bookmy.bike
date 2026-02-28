'use client';

import React, { useEffect } from 'react';
import { DesktopCatalog } from '@/components/store/DesktopCatalog';
import { useCatalogFilters } from '@/hooks/useCatalogFilters';
import type { ProductVariant } from '@/types/productMaster';

interface TvCatalogClientProps {
    initialItems: ProductVariant[];
    basePath?: string;
}

export function TvCatalogClient({ initialItems, basePath = '/store' }: TvCatalogClientProps) {
    const filters = useCatalogFilters(initialItems);

    useEffect(() => {
        // Force TV viewport data attribute
        document.documentElement.dataset.tv = '1';

        // Clean up on unmount if needed, though for a dedicated /tv page it might stay
        return () => {
            // document.documentElement.dataset.tv = '0';
        };
    }, []);

    return (
        <div className="tv-viewport-container">
            <style jsx global>{`
                body {
                    background: #000;
                    overflow: hidden;
                }
                .tv-viewport-container {
                    width: 100vw;
                    height: 100vh;
                    background: #f8fafc;
                    overflow: auto;
                }
                /* Hide scrollbars for a cleaner TV look */
                .tv-viewport-container::-webkit-scrollbar {
                    display: none;
                }
            `}</style>

            <DesktopCatalog filters={filters} items={initialItems} variant="tv" basePath={basePath} mode="smart" />
        </div>
    );
}
