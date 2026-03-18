'use client';

import { useEffect, useMemo, useState } from 'react';
import type { AdminDealerOfferRow, DealerOfferFilterOption } from '@/app/aums/actions/getAllDealerOffers';
import { updateDealerOffer, updateDealerOfferBulk } from '@/app/aums/actions/updateDealerOffer';

interface EditOfferPanelProps {
    row: AdminDealerOfferRow | null;
    dealerships: DealerOfferFilterOption[];
    onClose: () => void;
    onSaved: (updatedCount: number) => void;
}

const money = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

function formatAmount(value: number) {
    if (!Number.isFinite(value)) return '0';
    return money.format(Math.trunc(value));
}

export default function EditOfferPanel({ row, dealerships, onClose, onSaved }: EditOfferPanelProps) {
    const [offerDelta, setOfferDelta] = useState<number>(row?.offerAmount || 0);
    const [isActive, setIsActive] = useState<boolean>(row?.isActive ?? true);
    const [inclusionType, setInclusionType] = useState<'MANDATORY' | 'OPTIONAL' | 'BUNDLE'>(
        (row?.inclusionType as 'MANDATORY' | 'OPTIONAL' | 'BUNDLE') || 'OPTIONAL'
    );
    const [tatDays, setTatDays] = useState<number>(row?.tatDays || 0);
    const [broadcast, setBroadcast] = useState(false);
    const [selectedTenantIds, setSelectedTenantIds] = useState<string[]>(row ? [row.tenantId] : []);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!row) return;
        setOfferDelta(row.offerAmount || 0);
        setIsActive(row.isActive ?? true);
        setInclusionType((row.inclusionType as 'MANDATORY' | 'OPTIONAL' | 'BUNDLE') || 'OPTIONAL');
        setTatDays(row.tatDays || 0);
        setBroadcast(false);
        setSelectedTenantIds([row.tenantId]);
        setError('');
    }, [row]);

    const preview = useMemo(() => {
        if (!row) return 0;
        return Number(row.baseExShowroom || 0) + Number(offerDelta || 0);
    }, [row, offerDelta]);

    if (!row) return null;

    const toggleTenant = (tenantId: string) => {
        setSelectedTenantIds(prev =>
            prev.includes(tenantId) ? prev.filter(id => id !== tenantId) : [...prev, tenantId]
        );
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');

        const payload = {
            skuId: row.skuId,
            stateCode: row.stateCode,
            offerDelta,
            isActive,
            inclusionType,
            tatDays,
        } as const;

        const res = broadcast
            ? await updateDealerOfferBulk({
                  ...payload,
                  tenantIds: selectedTenantIds,
              })
            : await updateDealerOffer({
                  ...payload,
                  tenantId: row.tenantId,
              });

        if (!res.success) {
            setError(res.message || 'Failed to save offer');
            setSaving(false);
            return;
        }

        onSaved(res.updatedCount || 1);
        setSaving(false);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950/30 backdrop-blur-sm">
            <div className="absolute right-0 top-0 h-full w-full max-w-xl border-l border-slate-200 bg-white p-6 shadow-2xl">
                <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-black text-slate-900">Edit Dealer Offer</h2>
                        <p className="text-sm text-slate-500">
                            {row.dealershipName} • {row.skuName} • {row.stateCode}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg px-2 py-1 text-sm font-bold text-slate-500 hover:bg-slate-100"
                    >
                        Close
                    </button>
                </div>

                <div className="space-y-4">
                    <label className="block">
                        <span className="mb-1 block text-xs font-black uppercase tracking-widest text-slate-500">
                            Offer Delta (₹)
                        </span>
                        <input
                            type="number"
                            value={offerDelta}
                            onChange={e => setOfferDelta(Number(e.target.value || 0))}
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-slate-900"
                        />
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                        <label className="block">
                            <span className="mb-1 block text-xs font-black uppercase tracking-widest text-slate-500">
                                Inclusion
                            </span>
                            <select
                                value={inclusionType}
                                onChange={e => setInclusionType(e.target.value as 'MANDATORY' | 'OPTIONAL' | 'BUNDLE')}
                                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-slate-900"
                            >
                                <option value="OPTIONAL">OPTIONAL</option>
                                <option value="MANDATORY">MANDATORY</option>
                                <option value="BUNDLE">BUNDLE</option>
                            </select>
                        </label>

                        <label className="block">
                            <span className="mb-1 block text-xs font-black uppercase tracking-widest text-slate-500">
                                TAT Days
                            </span>
                            <input
                                type="number"
                                min={0}
                                value={tatDays}
                                onChange={e => setTatDays(Number(e.target.value || 0))}
                                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-slate-900"
                            />
                        </label>
                    </div>

                    <label className="flex items-center gap-2 rounded-xl border border-slate-200 p-3">
                        <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
                        <span className="text-sm font-semibold text-slate-800">Offer active</span>
                    </label>

                    <div className="rounded-xl bg-slate-50 p-3 text-sm">
                        <p className="font-semibold text-slate-600">Base: ₹{formatAmount(row.baseExShowroom)}</p>
                        <p className="font-black text-slate-900">After Offer: ₹{formatAmount(preview)}</p>
                    </div>

                    <label className="flex items-center gap-2 rounded-xl border border-slate-200 p-3">
                        <input type="checkbox" checked={broadcast} onChange={e => setBroadcast(e.target.checked)} />
                        <span className="text-sm font-semibold text-slate-800">Broadcast to multiple dealerships</span>
                    </label>

                    {broadcast ? (
                        <div className="max-h-44 space-y-2 overflow-auto rounded-xl border border-slate-200 p-3">
                            {dealerships.map(dealer => (
                                <label key={dealer.id} className="flex items-center gap-2 text-sm text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={selectedTenantIds.includes(dealer.id)}
                                        onChange={() => toggleTenant(dealer.id)}
                                    />
                                    <span>{dealer.label}</span>
                                </label>
                            ))}
                        </div>
                    ) : null}

                    {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}

                    <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                            onClick={onClose}
                            className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-700"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving || (broadcast && selectedTenantIds.length === 0)}
                            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-black uppercase tracking-wider text-white disabled:opacity-60"
                        >
                            {saving ? 'Saving...' : 'Save Offer'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
