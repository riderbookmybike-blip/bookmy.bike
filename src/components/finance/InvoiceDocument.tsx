import React from 'react';
import { Invoice } from '@/types/invoice';
import { ShieldCheck, Calendar, MapPin, Receipt } from 'lucide-react';

interface InvoiceDocumentProps {
    invoice: Invoice;
}

export const InvoiceDocument: React.FC<InvoiceDocumentProps> = ({ invoice }) => {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-white/10 overflow-hidden font-sans">
            {/* Header */}
            <div className="bg-gray-50 dark:bg-slate-950 p-8 border-b border-gray-200 dark:border-white/10 flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Receipt className="text-blue-600" size={24} />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">TAX INVOICE</h2>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-slate-400 font-mono">{invoice.displayId}</p>
                    <div className="mt-4 text-xs text-gray-400 dark:text-slate-500">
                        <span className="block font-bold text-gray-600 dark:text-slate-300 uppercase">Supplier Context</span>
                        State: {invoice.gstContext.supplyState} ({invoice.gstContext.registrationType.replace('_', ' ')})
                    </div>
                </div>
                <div className="text-right">
                    <div className="flex items-center justify-end gap-2 text-gray-500 dark:text-slate-400 mb-1">
                        <Calendar size={14} />
                        <span className="text-sm">Date</span>
                    </div>
                    <div className="font-bold text-gray-900 dark:text-white mb-4">{invoice.generatedAt.split('T')[0]}</div>

                    <span className="inline-block px-3 py-1 bg-green-100 dark:bg-green-500/10 text-green-800 dark:text-green-300 rounded-full text-xs font-bold uppercase tracking-wider">
                        {invoice.status} - IMMUTABLE
                    </span>
                </div>
            </div>

            {/* Parties */}
            <div className="p-8 grid grid-cols-2 gap-12 border-b border-gray-100 dark:border-white/10">
                <div>
                    <h4 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Billed To</h4>
                    <p className="font-bold text-lg text-gray-900 dark:text-white">{invoice.customerName}</p>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Booking: {invoice.bookingDisplayId}</p>
                </div>
                <div>
                    <h4 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Vehicle Details</h4>
                    <p className="font-medium text-gray-900 dark:text-white">{invoice.pricingSnapshotRef.variantLabel}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-slate-400 font-mono">
                        <ShieldCheck size={12} />
                        Snapshot: {invoice.pricingSnapshotRef.snapshotId}
                    </div>
                </div>
            </div>

            {/* Line Items */}
            <div className="p-8">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-gray-500 dark:text-slate-400 border-b-2 border-gray-100 dark:border-white/10">
                            <th className="text-left pb-4 font-bold uppercase text-xs tracking-wider">Description</th>
                            <th className="text-center pb-4 font-bold uppercase text-xs tracking-wider">HSN</th>
                            <th className="text-center pb-4 font-bold uppercase text-xs tracking-wider">Taxable</th>
                            <th className="text-center pb-4 font-bold uppercase text-xs tracking-wider">Rate</th>
                            <th className="text-center pb-4 font-bold uppercase text-xs tracking-wider">Tax</th>
                            <th className="text-right pb-4 font-bold uppercase text-xs tracking-wider">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-white/10">
                        {invoice.lineItems.map((item, idx) => (
                            <tr key={idx}>
                                <td className="py-4 font-medium text-gray-900 dark:text-white">
                                    {item.label}
                                    <span className="block text-xs text-gray-400 dark:text-slate-500 font-normal">{item.type}</span>
                                </td>
                                <td className="py-4 text-center text-gray-500 dark:text-slate-400 font-mono text-xs">8711</td>
                                <td className="py-4 text-center font-mono text-gray-900 dark:text-white">₹{item.taxableValue.toLocaleString()}</td>
                                <td className="py-4 text-center text-xs">
                                    {item.gstRate}%
                                    {item.gstRate > 0 && (
                                        <span className="block text-[10px] text-gray-400 dark:text-slate-500">
                                            {invoice.gstContext.registrationType === 'INTRA_STATE'
                                                ? `(C:${item.cgstRate}% S:${item.sgstRate}%)`
                                                : `(I:${item.igstRate}%)`}
                                        </span>
                                    )}
                                </td>
                                <td className="py-4 text-center font-mono text-xs text-gray-600 dark:text-slate-400">
                                    ₹{(item.cgstAmount + item.sgstAmount + item.igstAmount).toLocaleString()}
                                </td>
                                <td className="py-4 text-right font-bold text-gray-900 dark:text-white">₹{item.total.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Totals & Footer */}
            <div className="bg-gray-50 dark:bg-slate-950 p-8 border-t border-gray-200 dark:border-white/10">
                <div className="flex justify-end">
                    <div className="w-64 space-y-3 text-sm">
                        <div className="flex justify-between text-gray-600 dark:text-slate-400">
                            <span>Taxable Total</span>
                            <span className="font-mono">₹{invoice.totals.taxableTotal.toLocaleString()}</span>
                        </div>
                        {invoice.totals.cgstTotal > 0 && (
                            <div className="flex justify-between text-gray-600 dark:text-slate-400">
                                <span>CGST Total</span>
                                <span className="font-mono">₹{invoice.totals.cgstTotal.toLocaleString()}</span>
                            </div>
                        )}
                        {invoice.totals.sgstTotal > 0 && (
                            <div className="flex justify-between text-gray-600 dark:text-slate-400">
                                <span>SGST Total</span>
                                <span className="font-mono">₹{invoice.totals.sgstTotal.toLocaleString()}</span>
                            </div>
                        )}
                        {invoice.totals.igstTotal > 0 && (
                            <div className="flex justify-between text-gray-600 dark:text-slate-400">
                                <span>IGST Total</span>
                                <span className="font-mono">₹{invoice.totals.igstTotal.toLocaleString()}</span>
                            </div>
                        )}

                        <div className="flex justify-between pt-4 border-t border-gray-300">
                            <span className="font-bold text-lg text-gray-900">Grand Total</span>
                            <span className="font-bold text-lg text-blue-600">₹{invoice.totals.grandTotal.toLocaleString()}</span>
                        </div>
                        <div className="text-[10px] text-gray-400 text-right pt-2 uppercase tracking-widest">
                            Authorized Signature
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
