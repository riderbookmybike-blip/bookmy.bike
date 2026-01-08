'use client';

import React from 'react';
import { ReferralSource } from '@/lib/referral';
import { Landmark, ShieldCheck, BadgePercent, Lock } from 'lucide-react';

export function FinanceEligibility({ source }: { source: ReferralSource }) {

    // Mock Banks
    const BANKS = [
        { id: 'BANK-KOTAK', name: 'Kotak Mahindra Bank', rate: '9.5%' },
        { id: 'BANK-HDFC', name: 'HDFC Bank', rate: '9.2%' },
        { id: 'BANK-SBI', name: 'State Bank of India', rate: '8.9%' },
        { id: 'BANK-ICICI', name: 'ICICI Bank', rate: '9.4%' },
    ];

    // Visibility Logic
    let visibleBanks = [];
    if (source.mode === 'BANK_ONLY') {
        visibleBanks = BANKS.filter(b => source.allowedBanks?.includes(b.id));
    } else {
        // OPEN - Show all (mock)
        visibleBanks = BANKS;
    }

    return (
        <div className="space-y-6">
            <div className={`p-4 rounded-lg flex items-center gap-3 ${source.mode === 'BANK_ONLY' ? 'bg-orange-50 text-orange-800' : 'bg-green-50 text-green-800'}`}>
                {source.mode === 'BANK_ONLY' ? <Lock size={20} /> : <BadgePercent size={20} />}
                <div>
                    <h3 className="font-bold text-sm">
                        {source.mode === 'BANK_ONLY' ? 'Exclusive Banking Offer' : 'Open Marketplace Offer'}
                    </h3>
                    <p className="text-xs opacity-80">
                        {source.mode === 'BANK_ONLY'
                            ? 'Finite banking partners available for this referral.'
                            : 'All banking partners available. Lowest EMI guaranteed.'}
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                    <h4 className="font-semibold text-gray-900 text-sm">Eligible Banks</h4>
                    <span className="text-xs bg-gray-200 px-2 py-0.5 rounded text-gray-600">
                        Total: {visibleBanks.length}
                    </span>
                </div>

                {visibleBanks.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                        <Lock className="mx-auto mb-2 opacity-50" />
                        <p>No banks available for this referral type.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {visibleBanks.map(bank => (
                            <div key={bank.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded">
                                        <Landmark size={18} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 text-sm">{bank.name}</p>
                                        <p className="text-xs text-gray-500">Base Rate: {bank.rate}</p>
                                    </div>
                                </div>

                                {source.mode === 'OPEN_LOWEST' && bank.id === 'BANK-SBI' && (
                                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded flex items-center gap-1">
                                        <ShieldCheck size={12} /> BEST OFFER
                                    </span>
                                )}

                                <button className="text-xs font-medium text-blue-600 hover:underline">
                                    Check Eligibility
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
