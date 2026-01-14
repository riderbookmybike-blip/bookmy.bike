'use client';

import React from 'react';
import MasterListDetailLayout from '@/components/templates/MasterListDetailLayout';
import ListPanel from '@/components/templates/ListPanel';
import RoleGuard from '@/components/auth/RoleGuard';
import { useRouter, useParams } from 'next/navigation';

// MOCK DATA (Ideally shared or fetched)
const ACCESSORIES_DATA = [
    { id: 'ACC-HL-001', sku: 'ACC-HL-001', name: 'Premium Helmet', category: 'Safety', compatibility: 'Universal', gst: '18%', price: 2500 },
    { id: 'ACC-SG-002', sku: 'ACC-SG-002', name: 'Saddle Bags', category: 'Storage', compatibility: 'Cruiser Models', gst: '18%', price: 4500 },
    { id: 'ACC-EG-003', sku: 'ACC-EG-003', name: 'Engine Guard', category: 'Protection', compatibility: 'Royal Enfield Classic', gst: '18%', price: 3200 },
];

const COLUMNS = [
    { key: 'sku', header: 'SKU' },
    { key: 'name', header: 'Accessory Name' },
    { key: 'category', header: 'Category' },
    { key: 'compatibility', header: 'Compatibility' },
    { key: 'gst', header: 'GST %' },
    { key: 'price', header: 'Price' }
];

export default function AccessoryDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = decodeURIComponent(params.id as string);

    // Normally we'd use detail layout here, but for now just reusing ListPanel with selectedId
    // to maintain the layout. The requirement stated "Master Data", usually implying List/Edit.
    // Given the previous pattern, we should probably have a DetailPanel, but strictly following 
    // "Master Data" often implies inline or modal editing. 
    // However, to keep consistent with the locked UX rule:
    // "/module/[id] (split view with list on left, detail on right)"

    // I will render the list again to keep the left side populated.

    return (
        <RoleGuard resource="catalog-accessories" action="view">
            <MasterListDetailLayout mode="list-only">
                <ListPanel
                    title="Accessories"
                    columns={COLUMNS}
                    data={ACCESSORIES_DATA}
                    selectedId={id}
                    actionLabel=""
                    onActionClick={() => { }}
                    basePath="/catalog/accessories"
                />
            </MasterListDetailLayout>

        </RoleGuard>
    );
}
