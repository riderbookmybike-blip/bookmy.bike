'use client';

import type { AdminDealerOfferRow } from '@/app/aums/actions/getAllDealerOffers';

interface OfferTableProps {
    rows: AdminDealerOfferRow[];
    onEdit: (row: AdminDealerOfferRow) => void;
    onRemove: (row: AdminDealerOfferRow) => void;
}

const money = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

function formatAmount(value: number) {
    if (!Number.isFinite(value)) return '0';
    return money.format(Math.trunc(value));
}

function getOfferTag(offerAmount: number, isActive: boolean) {
    if (!isActive) return { label: 'Inactive', classes: 'bg-slate-100 text-slate-700' };
    if (offerAmount < 0) return { label: 'Discount', classes: 'bg-emerald-100 text-emerald-700' };
    if (offerAmount > 0) return { label: 'Surge', classes: 'bg-rose-100 text-rose-700' };
    return { label: 'Flat', classes: 'bg-amber-100 text-amber-700' };
}

export default function OfferTable({ rows, onEdit, onRemove }: OfferTableProps) {
    if (rows.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500">
                No dealer offers found for current filters.
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="max-h-[68vh] overflow-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="sticky top-0 z-10 bg-slate-50">
                        <tr className="text-left text-[11px] font-black uppercase tracking-widest text-slate-500">
                            <th className="px-4 py-3">Dealership</th>
                            <th className="px-4 py-3">SKU</th>
                            <th className="px-4 py-3">State</th>
                            <th className="px-4 py-3">Offer</th>
                            <th className="px-4 py-3">Base</th>
                            <th className="px-4 py-3">After Offer</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {rows.map(row => {
                            const tag = getOfferTag(row.offerAmount, row.isActive);
                            return (
                                <tr key={row.id} className="hover:bg-slate-50/60">
                                    <td className="px-4 py-3">
                                        <p className="font-bold text-slate-900">{row.dealershipName}</p>
                                        <p className="text-xs text-slate-500">{row.dealershipSlug || '—'}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="font-semibold text-slate-800">{row.skuName}</p>
                                        <p className="text-xs text-slate-500">
                                            {row.brandName} • {row.modelName}
                                        </p>
                                    </td>
                                    <td className="px-4 py-3 font-bold text-slate-700">{row.stateCode}</td>
                                    <td
                                        className={`px-4 py-3 font-black ${
                                            row.offerAmount < 0
                                                ? 'text-emerald-700'
                                                : row.offerAmount > 0
                                                  ? 'text-rose-700'
                                                  : 'text-slate-700'
                                        }`}
                                    >
                                        {row.offerAmount > 0 ? '+' : ''}₹{formatAmount(row.offerAmount)}
                                    </td>
                                    <td className="px-4 py-3 font-semibold text-slate-700">
                                        ₹{formatAmount(row.baseExShowroom)}
                                    </td>
                                    <td className="px-4 py-3 font-semibold text-slate-900">
                                        ₹{formatAmount(row.priceAfterOffer)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${tag.classes}`}
                                        >
                                            {tag.label}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => onEdit(row)}
                                                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-100"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => onRemove(row)}
                                                className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-rose-700 transition hover:bg-rose-50"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
