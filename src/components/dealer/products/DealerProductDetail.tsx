'use client';

import React from 'react';
import DetailPanel from '@/components/templates/DetailPanel';
import { DealerProduct, ProductVariant, MOCK_VEHICLES, MOCK_ACCESSORIES, MOCK_SERVICES } from '@/types/productMaster';
import DealerProductForm from './DealerProductForm';

interface DealerProductDetailProps {
    dealerProduct: DealerProduct | null;
    onUpdate: (updated: DealerProduct) => void;
    onClose: () => void;
}

// Helper
const getMasterDetails = (variantId: string): ProductVariant | undefined => {
    return [...MOCK_VEHICLES, ...MOCK_ACCESSORIES, ...MOCK_SERVICES].find(p => p.id === variantId);
};

export default function DealerProductDetail({ dealerProduct, onUpdate, onClose }: DealerProductDetailProps) {
    if (!dealerProduct) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-50 text-gray-500">
                <div className="text-center">
                    <p>Select a product to view details</p>
                </div>
            </div>
        );
    }

    const master = getMasterDetails(dealerProduct.productVariantId);
    if (!master) return <div>Product Not Found</div>;

    const renderContent = (activeTab: string) => {
        switch (activeTab) {
            case 'Overview':
                return (
                    <DealerProductForm
                        dealerProduct={dealerProduct}
                        masterProduct={master}
                        onSave={onUpdate}
                        onCancel={() => { }} // No cancel action in Detail View usually, or maybe reset
                    />
                );
            case 'Transactions':
                return <div className="p-8 text-center text-gray-500">No transactions recorded yet.</div>;
            case 'Activity':
                return (
                    <div className="p-4 space-y-4">
                        <div className="flex gap-3 text-sm">
                            <div className="text-gray-400 font-mono w-32">{dealerProduct.lastUpdated}</div>
                            <div>
                                <span className="font-bold">{dealerProduct.updatedBy}</span> updated pricing.
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <DetailPanel
            title={master.label}
            status={dealerProduct.isActive ? 'Active' : 'Disabled'}
            onClose={onClose}
            tabs={['Overview', 'Transactions', 'Activity']}
            renderContent={renderContent}
        />
    );
}
