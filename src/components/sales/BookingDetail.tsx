'use client';

import React, { useState } from 'react';
import DetailPanel from '@/components/templates/DetailPanel';
import { Booking, AllotmentStatus } from '@/types/booking';
import { InvoiceDocument } from '@/components/finance/InvoiceDocument';
import { Lock, Unlock, CheckCircle, Clock } from 'lucide-react';
import { updateBookingStatus, getBookings, deliverBooking, completePDI, acknowledgeDocuments, generateInvoice, getInvoice, recordPayment, getReceiptsForInvoice, Invoice } from '@/lib/dataStore';
import { VinAssignmentSection } from './VinAssignmentSection';
import { Truck, UserCheck, Key, AlertCircle, ClipboardCheck, CheckSquare, ShieldCheck, FileText, CheckCircle2, Receipt as ReceiptIcon, Wallet, CreditCard, Banknote } from 'lucide-react';
// import { Invoice } from '@/types/invoice';
import { PaymentMode, Receipt } from '@/types/payment';

interface BookingDetailProps {
    booking: Booking | null;
    onClose: () => void;
    onUpdate: () => void; // Refresh parent
}

export default function BookingDetail({ booking, onClose, onUpdate }: BookingDetailProps) {
    const [deliveryForm, setDeliveryForm] = useState({ receiver: '', notes: '', confirmed: false });
    const [pdiForm, setPdiForm] = useState({ inspector: '', odo: '', visual: false, access: false, notes: '' });
    const [docForm, setDocForm] = useState({ policyNo: '', confirmInvoice: false, confirmNote: false });
    const [payForm, setPayForm] = useState<{ show: boolean; amount: string; mode: PaymentMode; ref: string }>({ show: false, amount: '', mode: 'UPI', ref: '' });

    if (!booking) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-50 text-gray-500">
                <div className="text-center">
                    <p>Select a booking to view details & allotment</p>
                </div>
            </div>
        );
    }

    const handleAllotmentChange = (newStatus: AllotmentStatus) => {
        try {
            updateBookingStatus(booking.id, { allotmentStatus: newStatus }, `Status changed to ${newStatus}`);
            onUpdate();
        } catch (e: any) {
            alert(`Stock Error: ${e.message}`);
        }
    };

    const handleDelivery = () => {
        if (!deliveryForm.confirmed || !deliveryForm.receiver) return;
        try {
            deliverBooking(booking.id, { receiverName: deliveryForm.receiver, notes: deliveryForm.notes });
            onUpdate();
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handlePDI = () => {
        if (!pdiForm.visual || !pdiForm.access || !pdiForm.inspector) return;
        try {
            completePDI(booking.id, { inspectorName: pdiForm.inspector, odoReading: pdiForm.odo, notes: pdiForm.notes });
            onUpdate();
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleDocs = () => {
        if (!docForm.confirmInvoice || !docForm.confirmNote || !docForm.policyNo) return;
        try {
            acknowledgeDocuments(booking.id, { insurancePolicyNo: docForm.policyNo });
            onUpdate();
        } catch (e: any) {
            alert(e.message);
        }
    };

    const renderContent = (activeTab: string) => {
        switch (activeTab) {
            case 'Allotment':
                return (
                    <div className="space-y-6">
                        {/* Status Card */}
                        <div className={`p-6 rounded-xl border ${booking.allotmentStatus === 'HARD_LOCK' ? 'bg-red-50 border-red-100' :
                            booking.allotmentStatus === 'SOFT_LOCK' ? 'bg-yellow-50 border-yellow-100' :
                                'bg-gray-50 border-gray-200'
                            }`}>
                            <div className="flex items-center gap-3 mb-2">
                                {booking.allotmentStatus === 'HARD_LOCK' ? <Lock className="text-red-600" /> :
                                    booking.allotmentStatus === 'SOFT_LOCK' ? <Clock className="text-yellow-600" /> :
                                        <Unlock className="text-gray-400" />}
                                <h3 className={`text-lg font-bold ${booking.allotmentStatus === 'HARD_LOCK' ? 'text-red-900' :
                                    booking.allotmentStatus === 'SOFT_LOCK' ? 'text-yellow-900' :
                                        'text-gray-700'
                                    }`}>
                                    {booking.allotmentStatus === 'HARD_LOCK' ? 'Hard Locked (Confirmed)' :
                                        booking.allotmentStatus === 'SOFT_LOCK' ? 'Soft Locked (Holding)' :
                                            'No Allotment'}
                                </h3>
                            </div>
                            <p className="text-sm opacity-80 mb-6">
                                {booking.allotmentStatus === 'HARD_LOCK' ? 'Vehicle is strictly assigned. Insurance and RTO workflows are active.' :
                                    booking.allotmentStatus === 'SOFT_LOCK' ? 'Internal reservation. Confirmed to customer but not finalized.' :
                                        'Vehicle not yet reserved.'}
                            </p>

                            {/* Actions */}
                            <div className="flex items-center gap-3">
                                {booking.allotmentStatus === 'NONE' && (
                                    <button
                                        onClick={() => handleAllotmentChange('SOFT_LOCK')}
                                        className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold rounded-lg shadow-sm transition-colors"
                                    >
                                        Soft Lock (Reserve)
                                    </button>
                                )}
                                {booking.allotmentStatus === 'SOFT_LOCK' && (
                                    <>
                                        <button
                                            onClick={() => handleAllotmentChange('NONE')}
                                            className="px-4 py-2 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 border border-gray-300 dark:border-white/10 font-bold rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                        >
                                            Release Hold
                                        </button>
                                        <button
                                            onClick={() => handleAllotmentChange('HARD_LOCK')}
                                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-sm transition-colors"
                                        >
                                            Hard Lock (Confirm)
                                        </button>
                                    </>
                                )}
                                {booking.allotmentStatus === 'HARD_LOCK' && (
                                    <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-medium bg-red-100 dark:bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-500/20">
                                        <Lock size={14} /> Locked. Cannot change.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Vehicle Details */}
                        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg p-6">
                            <h4 className="font-bold text-gray-900 dark:text-white mb-4">Vehicle Configuration</h4>
                            <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                                <div>
                                    <span className="block text-gray-500 dark:text-slate-400">Brand</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{booking.brandName}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-500 dark:text-slate-400">Model</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{booking.modelName}</span>
                                </div>
                                <div className="col-span-2">
                                    <span className="block text-gray-500 dark:text-slate-400">Variant Details</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{booking.variantName}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-500 dark:text-slate-400">Final Price</span>
                                    <span className="font-mono font-bold text-green-700 dark:text-green-400">₹{booking.price.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* STEP 9: VIN ASSIGNMENT */}
                        {booking.allotmentStatus === 'HARD_LOCK' && (
                            <VinAssignmentSection booking={booking} onAssign={onUpdate} />
                        )}
                    </div>
                );

            case 'Pricing':
                if (!booking.priceSnapshot) {
                    return (
                        <div className="text-center py-12 text-gray-400">
                            <AlertCircle size={48} className="mx-auto mb-4 opacity-50" />
                            <p>No Locked Pricing Snapshot found for this booking.</p>
                        </div>
                    );
                }
                const snap = booking.priceSnapshot;
                return (
                    <div className="space-y-6">
                        {/* Locked Banner */}
                        <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Lock size={20} className="text-blue-600 dark:text-blue-300" />
                                <div>
                                    <h3 className="font-bold text-blue-900 dark:text-blue-300 text-sm">Locked at Booking Confirmation</h3>
                                    <p className="text-xs text-blue-700 dark:text-blue-300">All downstream calculations use these values.</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-blue-600 font-mono">Snapshot ID: {snap.id}</div>
                                <div className="text-xs text-blue-500">{snap.calculatedAt.split('T')[0]}</div>
                            </div>
                        </div>

                        {/* Cost Breakdown */}
                        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg p-6">
                            <h4 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <FileText size={18} /> On-Road Price Breakdown
                            </h4>

                            <div className="space-y-4 text-sm">
                                <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-white/10">
                                    <span className="text-gray-600 dark:text-slate-400">Ex-Showroom Price</span>
                                    <span className="font-mono font-medium text-gray-900 dark:text-white">₹{snap.exShowroom.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-white/10">
                                    <span className="text-gray-600 dark:text-slate-400">RTO Charges ({snap.rtoCode})</span>
                                    <span className="font-mono font-medium text-gray-900 dark:text-white">₹{snap.rtoCharges.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-white/10">
                                    <span className="text-gray-600 dark:text-slate-400">Insurance (Base + {snap.insuranceAddons.length} Addons)</span>
                                    <span className="font-mono font-medium text-gray-900 dark:text-white">₹{snap.insuranceBase.toLocaleString()}</span>
                                </div>
                                {snap.accessoryBundle.length > 0 && (
                                    <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-white/10">
                                        <span className="text-gray-600 dark:text-slate-400">Accessories</span>
                                        <span className="font-mono font-medium text-gray-900 dark:text-white">Included</span>
                                    </div>
                                )}

                                <div className="flex justify-between items-center pt-2 text-lg font-bold text-gray-900">
                                    <span>Total On-Road</span>
                                    <span>₹{snap.totalOnRoad.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="text-xs text-gray-400 text-center italic">
                            Rule Version: {snap.ruleVersion}
                        </div>
                    </div>
                );

            case 'PDI':
                if (!booking.assignedVin) {
                    return (
                        <div className="text-center py-12 text-gray-400">
                            <AlertCircle size={48} className="mx-auto mb-4 opacity-50" />
                            <h3 className="text-lg font-bold text-gray-700">Vehicle Not Ready</h3>
                            <p className="text-sm mt-2">
                                VIN assignment is required before PDI.
                            </p>
                        </div>
                    );
                }

                if (booking.pdiStatus === 'APPROVED') {
                    return (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-8">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                    <ShieldCheck size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-green-900">PDI Approved</h3>
                                    <p className="text-green-700 text-sm">Vehicle is inspected and ready for delivery.</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm text-green-800 bg-green-100/50 p-4 rounded-lg">
                                <div>
                                    <span className="block opacity-70 uppercase text-xs font-bold">Inspector</span>
                                    <span className="font-bold">{booking.pdiDetails?.inspectorName}</span>
                                </div>
                                <div>
                                    <span className="block opacity-70 uppercase text-xs font-bold">Odometer</span>
                                    <span className="font-bold">{booking.pdiDetails?.odoReading} km</span>
                                </div>
                                <div className="col-span-2">
                                    <span className="block opacity-70 uppercase text-xs font-bold">Notes</span>
                                    <span className="italic">"{booking.pdiDetails?.notes}"</span>
                                </div>
                            </div>
                        </div>
                    );
                }

                return (
                    <div className="space-y-6">
                        <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-lg p-6 flex items-start gap-4">
                            <ClipboardCheck className="text-yellow-600 dark:text-yellow-300 mt-1" size={24} />
                            <div>
                                <h3 className="font-bold text-yellow-900 dark:text-yellow-300">Pre-Delivery Inspection</h3>
                                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                                    Mandatory inspection for VIN <strong>{booking.assignedVin}</strong>.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1">Inspector Name</label>
                                <input
                                    className="w-full border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                    placeholder="e.g., Service Tech Name"
                                    value={pdiForm.inspector}
                                    onChange={e => setPdiForm({ ...pdiForm, inspector: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1">Odometer Reading (km)</label>
                                <input
                                    className="w-full border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                    placeholder="e.g., 5"
                                    value={pdiForm.odo}
                                    onChange={e => setPdiForm({ ...pdiForm, odo: e.target.value })}
                                />
                            </div>

                            <div className="space-y-3 pt-2">
                                <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-950 rounded-lg border border-gray-100 dark:border-white/10 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-100">
                                    <input
                                        type="checkbox"
                                        checked={pdiForm.visual}
                                        onChange={e => setPdiForm({ ...pdiForm, visual: e.target.checked })}
                                        className="w-5 h-5 text-blue-600 rounded"
                                    />
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">Visual Inspection Only (No Scratches/Dents)</span>
                                </label>
                                <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-950 rounded-lg border border-gray-100 dark:border-white/10 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-100">
                                    <input
                                        type="checkbox"
                                        checked={pdiForm.access}
                                        onChange={e => setPdiForm({ ...pdiForm, access: e.target.checked })}
                                        className="w-5 h-5 text-blue-600 rounded"
                                    />
                                    <span className="text-sm font-medium text-gray-900">Standard Accessories Fitted</span>
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Notes</label>
                                <textarea
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm h-16"
                                    placeholder="Any remarks..."
                                    value={pdiForm.notes}
                                    onChange={e => setPdiForm({ ...pdiForm, notes: e.target.value })}
                                />
                            </div>

                            <button
                                onClick={handlePDI}
                                disabled={!pdiForm.visual || !pdiForm.access || !pdiForm.inspector}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <CheckSquare size={18} /> Approve PDI
                            </button>
                        </div>
                    </div>
                );

            case 'Delivery':
                // State 1: Delivered
                if (booking.status === 'DELIVERED') {
                    return (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center mt-4">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                                <Key size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-green-900">Vehicle Delivered</h3>
                            <p className="text-green-700 mt-2">
                                Handover complete. This booking is now closed.
                            </p>
                            <div className="mt-6 flex justify-center gap-8 text-sm text-green-800">
                                <div>
                                    <span className="block opacity-70 uppercase text-xs font-bold">Chassis</span>
                                    <span className="font-mono font-bold">{booking.assignedVin}</span>
                                </div>
                                <div>
                                    <span className="block opacity-70 uppercase text-xs font-bold">Status</span>
                                    <span className="font-bold">DELIVERED</span>
                                </div>
                            </div>
                        </div>
                    );
                }

                // State 2: Not Ready (No VIN)
                if (!booking.assignedVin) {
                    return (
                        <div className="text-center py-12 text-gray-400">
                            <AlertCircle size={48} className="mx-auto mb-4 opacity-50" />
                            <h3 className="text-lg font-bold text-gray-700">Vehicle Not Ready</h3>
                            <p className="text-sm mt-2">
                                You must <strong>Assign a VIN</strong> in the Allotment tab before initiating delivery.
                            </p>
                        </div>
                    );
                }

                // Step 11: Gate - PDI Check
                if (booking.pdiStatus !== 'APPROVED') {
                    return (
                        <div className="text-center py-12 text-gray-400">
                            <ClipboardCheck size={48} className="mx-auto mb-4 opacity-50 text-yellow-500" />
                            <h3 className="text-lg font-bold text-gray-700">PDI Pending</h3>
                            <p className="text-sm mt-2 max-w-xs mx-auto">
                                Pre-Delivery Inspection must be <strong>Approved</strong> before handing over the vehicle.
                            </p>
                            <button
                                onClick={() => alert("Switch to PDI Tab to complete inspection")}
                                className="mt-4 text-blue-600 font-bold hover:underline"
                            >
                                Go to PDI Tab
                            </button>
                        </div>
                    );
                }

                // State 3: Ready for Delivery
                return (
                    <div className="space-y-6 mt-4">
                        <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg p-6 flex items-start gap-4">
                            <Truck className="text-blue-600 dark:text-blue-300 mt-1" size={24} />
                            <div>
                                <h3 className="font-bold text-blue-900 dark:text-blue-300">Ready for Handover</h3>
                                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                    VIN <strong>{booking.assignedVin}</strong> is assigned and ready.
                                    Complete the form below to finalize delivery.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1">Receiver Name</label>
                                <input
                                    className="w-full border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                    placeholder="e.g., Customer or Representative Name"
                                    value={deliveryForm.receiver}
                                    onChange={e => setDeliveryForm({ ...deliveryForm, receiver: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1">Notes </label>
                                <textarea
                                    className="w-full border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm h-20 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                    placeholder="e.g., Key handed over, Helmet pending..."
                                    value={deliveryForm.notes}
                                    onChange={e => setDeliveryForm({ ...deliveryForm, notes: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center gap-3 py-2">
                                <input
                                    type="checkbox"
                                    id="confirm"
                                    checked={deliveryForm.confirmed}
                                    onChange={e => setDeliveryForm({ ...deliveryForm, confirmed: e.target.checked })}
                                    className="w-5 h-5 text-blue-600 rounded"
                                />
                                <label htmlFor="confirm" className="text-sm font-medium text-gray-900 dark:text-white">
                                    I confirm that the physical vehicle has been handed over.
                                </label>
                            </div>

                            <button
                                onClick={handleDelivery}
                                disabled={!deliveryForm.confirmed || !deliveryForm.receiver}
                                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <UserCheck size={18} /> Confirm Delivery
                            </button>
                        </div>
                    </div>
                );

            case 'Invoice':
                // State 1: Before Delivery
                if (booking.status !== 'DELIVERED') {
                    return (
                        <div className="text-center py-12 text-gray-400">
                            <Lock size={48} className="mx-auto mb-4 opacity-50" />
                            <h3 className="text-lg font-bold text-gray-700">Invoice Locked</h3>
                            <p className="text-sm mt-2">
                                Tax Invoice can only be generated <strong>after Delivery</strong>.
                            </p>
                        </div>
                    );
                }

                // State 2: Ready to Generate
                if (!booking.invoiceId) {
                    return (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
                            <ReceiptIcon size={48} className="mx-auto mb-4 text-blue-600" />
                            <h3 className="text-xl font-bold text-blue-900">Generate Tax Invoice</h3>
                            <p className="text-blue-700 mt-2 mb-6">
                                Create an immutable GST Invoice based on the locked price snapshot.
                            </p>
                            <button
                                onClick={() => {
                                    try {
                                        generateInvoice(booking.id);
                                        onUpdate();
                                    } catch (e: any) { alert(e.message); }
                                }}
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg flex items-center gap-2 mx-auto"
                            >
                                <ReceiptIcon size={18} /> Generate Invoice
                            </button>
                        </div>
                    );
                }

                // State 3: View Invoice & Payments
                const invoice = getInvoice(booking.id);
                if (!invoice) return <div>Loading Invoice...</div>;

                const receipts = getReceiptsForInvoice(invoice.id);

                const getStatusColor = (s: string) => {
                    switch (s) {
                        case 'PAID': return 'bg-green-100 text-green-800';
                        case 'PARTIALLY_PAID': return 'bg-yellow-100 text-yellow-800';
                        case 'OVERPAID': return 'bg-blue-100 text-blue-800';
                        default: return 'bg-red-100 text-red-800';
                    }
                };

                return (
                    <div className="max-w-4xl mx-auto space-y-8">
                        {/* 1. Payment Summary */}
                        <div className="grid grid-cols-4 gap-4">
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Total Amount</span>
                                <p className="text-xl font-bold text-gray-900 mt-1">₹{invoice.totals.grandTotal.toLocaleString()}</p>
                            </div>
                            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                                <span className="text-xs text-green-700 uppercase tracking-wider font-bold">Paid</span>
                                <p className="text-xl font-bold text-green-700 mt-1">₹{invoice.amountPaid.toLocaleString()}</p>
                            </div>
                            <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                                <span className="text-xs text-red-700 uppercase tracking-wider font-bold">Due</span>
                                <p className="text-xl font-bold text-red-700 mt-1">₹{Math.max(0, invoice.amountDue).toLocaleString()}</p>
                            </div>
                            <div className="flex items-center justify-center p-4">
                                <span className={`px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(invoice.paymentStatus)}`}>
                                    {invoice.paymentStatus.replace('_', ' ')}
                                </span>
                            </div>
                        </div>

                        {/* 2. Actions & List */}
                        <div className="flex gap-8 items-start">
                            {/* Left: Invoice Preview */}
                            <div className="flex-1">
                                <h3 className="text-sm font-bold text-gray-500 uppercase mb-4">Invoice Document</h3>
                                <div className="scale-[0.85] origin-top-left border border-gray-200 shadow-sm rounded-lg">
                                    <InvoiceDocument invoice={invoice} />
                                </div>
                            </div>

                            {/* Right: Payments */}
                            <div className="w-1/3 space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-bold text-gray-500 uppercase">Receipts</h3>
                                    <button
                                        onClick={() => setPayForm({ ...payForm, show: !payForm.show })}
                                        className="text-sm text-blue-600 font-bold hover:underline"
                                    >
                                        + Record Payment
                                    </button>
                                </div>

                                {/* Payment Form */}
                                {payForm.show && (
                                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                                        <h4 className="text-sm font-bold text-blue-900">New Payment</h4>
                                        <div>
                                            <label className="text-xs font-bold text-blue-700">Amount</label>
                                            <input
                                                type="number"
                                                value={payForm.amount}
                                                onChange={e => setPayForm({ ...payForm, amount: e.target.value })}
                                                className="w-full text-sm p-2 border rounded"
                                                placeholder="Enter amount"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-blue-700">Mode</label>
                                            <select
                                                value={payForm.mode}
                                                onChange={e => setPayForm({ ...payForm, mode: e.target.value as PaymentMode })}
                                                className="w-full text-sm p-2 border rounded"
                                            >
                                                <option value="UPI">UPI</option>
                                                <option value="CASH">Cash</option>
                                                <option value="BANK_TRANSFER">Bank Transfer</option>
                                                <option value="CHEQUE">Cheque</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-blue-700">Reference</label>
                                            <input
                                                type="text"
                                                value={payForm.ref}
                                                onChange={e => setPayForm({ ...payForm, ref: e.target.value })}
                                                className="w-full text-sm p-2 border rounded"
                                                placeholder="Txn ID / Ref #"
                                            />
                                        </div>
                                        <div className="flex justify-end gap-2 pt-2">
                                            <button
                                                onClick={() => setPayForm({ ...payForm, show: false })}
                                                className="px-3 py-1 text-xs font-bold text-gray-500"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => {
                                                    try {
                                                        const amt = parseFloat(payForm.amount);
                                                        if (isNaN(amt) || amt <= 0) throw new Error("Invalid amount");
                                                        recordPayment(invoice.id, amt, payForm.mode, payForm.ref);
                                                        setPayForm({ show: false, amount: '', mode: 'UPI', ref: '' });
                                                        onUpdate();
                                                    } catch (e: any) { alert(e.message); }
                                                }}
                                                className="px-3 py-1 text-xs font-bold bg-blue-600 text-white rounded"
                                            >
                                                Confirm
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* List */}
                                <div className="space-y-3">
                                    {receipts.length === 0 ? (
                                        <p className="text-sm text-gray-400 dark:text-slate-500 italic">No payments recorded.</p>
                                    ) : (
                                        receipts.map(r => (
                                            <div key={r.id} className="p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg shadow-sm">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-mono text-xs font-bold text-gray-500 dark:text-slate-400">{r.displayId}</span>
                                                    <span className="text-sm font-bold text-green-700 dark:text-green-400">₹{r.amount.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-xs text-gray-600 dark:text-slate-400">
                                                    <div className="flex items-center gap-1">
                                                        {r.mode === 'CASH' ? <Banknote size={12} /> :
                                                            r.mode === 'UPI' ? <Wallet size={12} /> :
                                                                <CreditCard size={12} />}
                                                        {r.mode}
                                                    </div>
                                                    <span>{r.receivedAt.split('T')[0]}</span>
                                                </div>
                                                {r.reference && <div className="text-[10px] text-gray-400 mt-1 truncate">Ref: {r.reference}</div>}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'Documents':
                if (booking.status !== 'DELIVERED') {
                    return (
                        <div className="text-center py-12 text-gray-400">
                            <AlertCircle size={48} className="mx-auto mb-4 opacity-50" />
                            <h3 className="text-lg font-bold text-gray-700">Not Available</h3>
                            <p className="text-sm mt-2">
                                Documents can be processed only after <strong>Delivery</strong>.
                            </p>
                        </div>
                    );
                }

                if (booking.documents?.customerAck) {
                    return (
                        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg divide-y divide-gray-100 dark:divide-white/10">
                            <div className="p-6 bg-gray-50 dark:bg-slate-950 flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/10 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300">
                                    <CheckCircle2 size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-blue-900 dark:text-blue-300">All Documents Acknowledged</h3>
                                    <p className="text-blue-700 dark:text-blue-300 text-sm">Customer has received all papers.</p>
                                </div>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600 dark:text-slate-400">Invoice</span>
                                    <span className="font-bold text-green-700 dark:text-green-400 flex items-center gap-2">
                                        <CheckCircle2 size={16} /> Acknowledged
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600 dark:text-slate-400">Delivery Note</span>
                                    <span className="font-bold text-green-700 dark:text-green-400 flex items-center gap-2">
                                        <CheckCircle2 size={16} /> Acknowledged
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">Insurance Policy</span>
                                    <span className="font-mono font-bold">{booking.documents.insurancePolicyNo}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">RC Status</span>
                                    <span className="font-bold px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs uppercase">
                                        {booking.documents.rcStatus}
                                    </span>
                                </div>
                                <div className="pt-4 text-xs text-gray-400 text-right">
                                    Last Updated: {booking.documents.ackDate?.split('T')[0]}
                                </div>
                            </div>
                        </div>
                    );
                }

                return (
                    <div className="space-y-6">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 flex items-start gap-4">
                            <FileText className="text-blue-600 mt-1" size={24} />
                            <div>
                                <h3 className="font-bold text-blue-900">Document Handover</h3>
                                <p className="text-sm text-blue-700 mt-1">
                                    Confirm the handover of critical documents to the customer.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1">Insurance Policy Number</label>
                                <input
                                    className="w-full border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                    placeholder="Enter Policy #"
                                    value={docForm.policyNo}
                                    onChange={e => setDocForm({ ...docForm, policyNo: e.target.value })}
                                />
                            </div>

                            <div className="space-y-3 pt-2">
                                <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-950 rounded-lg border border-gray-100 dark:border-white/10 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-100">
                                    <input
                                        type="checkbox"
                                        checked={docForm.confirmInvoice}
                                        onChange={e => setDocForm({ ...docForm, confirmInvoice: e.target.checked })}
                                        className="w-5 h-5 text-blue-600 rounded"
                                    />
                                    <span className="text-sm font-medium text-gray-900">Tax Invoice Handed Over</span>
                                </label>
                                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer hover:bg-blue-50 hover:border-blue-100">
                                    <input
                                        type="checkbox"
                                        checked={docForm.confirmNote}
                                        onChange={e => setDocForm({ ...docForm, confirmNote: e.target.checked })}
                                        className="w-5 h-5 text-blue-600 rounded"
                                    />
                                    <span className="text-sm font-medium text-gray-900">Delivery Note Signed & Handed Over</span>
                                </label>
                            </div>

                            <button
                                onClick={handleDocs}
                                disabled={!docForm.confirmInvoice || !docForm.confirmNote || !docForm.policyNo}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <CheckSquare size={18} /> Confirm Acknowledgement
                            </button>
                        </div>
                    </div>
                );

            case 'Activity':
                return (
                    <div className="space-y-4 pt-2">
                        {booking.history.map((h, i) => (
                            <div key={i} className="flex gap-3 text-sm">
                                <div className="text-gray-400 font-mono w-24 shrink-0 text-xs mt-0.5">
                                    {h.timestamp.split('T')[1]?.slice(0, 5)}
                                </div>
                                <div className="pb-4 border-b border-gray-100 flex-1">
                                    <span className="font-bold text-gray-900 block">{h.action}</span>
                                    <span className="text-xs text-gray-500">by {h.user}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case 'Customer': return <>Customer Info would go here</>;
            case 'Finance': return <>Finance Info would go here</>;
            default: return null;
        }
    };

    return (
        <DetailPanel
            title={`Booking ${booking.displayId}`}
            status={booking.status}
            onClose={onClose}
            tabs={['Allotment', 'Pricing', 'PDI', 'Delivery', 'Invoice', 'Documents', 'Customer', 'Finance', 'Activity']}
            renderContent={renderContent}
        />
    );
}
