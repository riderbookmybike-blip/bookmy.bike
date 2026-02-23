'use client';

import React from 'react';
// Legacy mock type — kept locally for demo UI compatibility
interface InventoryItem {
    id: string;
    sku: string;
    brand: string;
    model: string;
    variant: string;
    color: string;
    totalStock: number;
    reserved: number;
    allotted: number;
    available: number;
    lastUpdated: string;
}
import { Box, ShieldCheck, Zap, BarChart4 } from 'lucide-react';
import ListPanel from '@/components/templates/ListPanel';

interface InventoryListProps {
    items: InventoryItem[];
    onSelect: (item: InventoryItem) => void;
    selectedId?: string;
}

export default function InventoryList({ items, onSelect, selectedId }: InventoryListProps) {
    const tableData = items.map(item => ({
        ...item,
        statusDisplay: item.available > 0 ? 'IN STOCK' : 'OUT OF STOCK',
    }));

    const metrics = (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-8 mb-4">
            {[
                {
                    label: 'Total Units',
                    value: items.reduce((acc, i) => acc + i.totalStock, 0),
                    icon: Box,
                    color: 'text-blue-500',
                },
                {
                    label: 'Available',
                    value: items.reduce((acc, i) => acc + i.available, 0),
                    icon: ShieldCheck,
                    color: 'text-emerald-500',
                },
                {
                    label: 'Reserved',
                    value: items.reduce((acc, i) => acc + i.reserved, 0),
                    icon: Zap,
                    color: 'text-amber-500',
                },
                {
                    label: 'Allotted',
                    value: items.reduce((acc, i) => acc + i.allotted, 0),
                    icon: BarChart4,
                    color: 'text-rose-500',
                },
            ].map((stat, i) => (
                <div
                    key={i}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[32px] p-4 flex flex-col justify-center relative overflow-hidden group shadow-sm"
                >
                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                        {stat.label}
                    </span>
                    <div className="flex items-center gap-2">
                        <stat.icon size={16} className={stat.color} />
                        <span className="text-xl font-black italic text-slate-800 dark:text-white tracking-tighter">
                            {stat.value}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <ListPanel
            title="Inventory Catalog"
            data={tableData}
            selectedId={selectedId}
            onItemClick={item => onSelect(item)}
            actionLabel="Add New Stock"
            metrics={metrics}
            columns={[
                { key: 'sku', header: 'SKU ID', type: 'id' as const, width: '120px' },
                {
                    key: 'model',
                    header: 'Product Details',
                    type: 'rich' as const,
                    icon: Box,
                    subtitle: (item: any) => `${item.variant} • ${item.color}`,
                },
                { key: 'totalStock', header: 'Total', align: 'center' as const, width: '100px' },
                { key: 'available', header: 'Available', align: 'center' as const, width: '100px' },
                {
                    key: 'statusDisplay',
                    header: 'Status',
                    type: 'badge' as const,
                    align: 'right' as const,
                    width: '120px',
                },
            ]}
        />
    );
}
