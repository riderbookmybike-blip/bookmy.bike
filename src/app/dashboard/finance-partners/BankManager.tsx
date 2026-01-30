'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MasterListDetailLayout from '@/components/templates/MasterListDetailLayout';
import ListPanel from '@/components/templates/ListPanel';
import { BankPartner, MOCK_BANK_PARTNERS } from '@/types/bankPartner';
import BankDetailView from './BankDetailView';
import { Landmark } from 'lucide-react';

export default function BankManager({ selectedId }: { selectedId?: string }) {
    const router = useRouter();
    const [partners, setPartners] = useState<BankPartner[]>(MOCK_BANK_PARTNERS);

    // If selectedId is present, we find that partner.
    const selectedPartner = selectedId ? partners.find(p => p.id === selectedId) : null;

    const handleSelect = (id: string) => {
        // Navigate to the dynamic route
        router.push(`/dashboard/finance-partners/${id}`);
    };

    // Transform data to include custom rendered cells
    const tableData = partners.map(p => ({
        ...p,
        name: (
            <div>
                <div className="font-bold text-slate-200">{p.name}</div>
                <div className="text-[10px] font-mono text-slate-500 mt-0.5">{p.displayId}</div>
            </div>
        )
    }));

    return (
        <MasterListDetailLayout>
            <ListPanel
                title="Finance Partners"
                data={tableData}
                selectedId={selectedId}
                onItemClick={(item) => handleSelect(item.id)}
                columns={[
                    { key: 'name', header: 'Partner Details', width: '70%' },
                    { key: 'status', header: 'Status', type: 'badge', align: 'right' }
                ]}
            />
            <div className="flex-1 h-full bg-slate-900/50">
                {selectedPartner ? (
                    <BankDetailView partner={selectedPartner} />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 animate-in fade-in duration-500">
                        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-white/5">
                            <Landmark size={32} className="text-slate-600" />
                        </div>
                        <p className="font-medium text-lg">Select a partner to view details</p>
                        <p className="text-xs uppercase tracking-widest opacity-60 mt-1">Manage Schemes, Teams & Locations</p>
                    </div>
                )}
            </div>
        </MasterListDetailLayout>
    );
}
