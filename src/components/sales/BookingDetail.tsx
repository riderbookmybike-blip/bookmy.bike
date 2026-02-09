'use client';

import React, { useState, useEffect } from 'react';
import DetailPanel from '@/components/templates/DetailPanel';
import { Booking, AllotmentStatus, OperationalStage, PdiStatus } from '@/types/booking';
import { InvoiceDocument } from '@/components/finance/InvoiceDocument';
import {
    Lock,
    Unlock,
    CheckCircle,
    Clock,
    Truck,
    UserCheck,
    Key,
    AlertCircle,
    ClipboardCheck,
    CheckSquare,
    ShieldCheck,
    FileText,
    CheckCircle2,
    Receipt as ReceiptIcon,
    Wallet,
    CreditCard,
    Banknote,
    Box,
    Shield,
    Info,
    ExternalLink,
    MapPin,
    Calendar,
    Smartphone,
    Mail,
    Hash,
    RefreshCcw,
    XCircle,
} from 'lucide-react';
import {
    updateBookingStatus,
    deliverBooking,
    completePDI,
    acknowledgeDocuments,
    generateInvoice,
    getInvoice,
    recordPayment,
    getReceiptsForInvoice,
} from '@/lib/dataStore';
import { VinAssignmentSection } from './VinAssignmentSection';
import { PaymentMode } from '@/types/payment';
import LifecycleSidebar from './LifecycleSidebar';
import { getLifecycleConfig } from './LifecycleManager';

interface BookingDetailProps {
    booking: Booking | null;
    onClose: () => void;
    onUpdate: () => void;
}

export default function BookingDetail({ booking, onClose, onUpdate }: BookingDetailProps) {
    const [deliveryForm, setDeliveryForm] = useState({ receiver: '', notes: '', confirmed: false });
    const [pdiForm, setPdiForm] = useState({ inspector: '', odo: '', visual: false, access: false, notes: '' });
    const [docForm, setDocForm] = useState({ policyNo: '', confirmInvoice: false, confirmNote: false });
    const [activeTab, setActiveTab] = useState<string>('');

    // Derived State
    const currentStage = (booking?.operationalStage as OperationalStage) || 'QUOTE';
    const config = getLifecycleConfig(currentStage);
    const effectiveTabs = config.allowedTabs;

    // Sync activeTab with Stage changes
    useEffect(() => {
        if (!activeTab || !effectiveTabs.includes(activeTab)) {
            setActiveTab(config.primaryTab);
        }
    }, [currentStage, effectiveTabs, activeTab, config.primaryTab]);

    if (!booking) return null;

    // Handlers
    const handleStageSelect = (stageId: OperationalStage) => {
        const stageConfig = getLifecycleConfig(stageId);
        setActiveTab(stageConfig.primaryTab);
    };

    const handleAllotmentChange = (newStatus: AllotmentStatus) => {
        try {
            const updates: Partial<Booking> = { allotmentStatus: newStatus };
            let reason = `Allotment status set to ${newStatus}`;

            // Trigger Stage Promotion: Hard Lock -> COMPLIANCE
            if (newStatus === 'HARD_LOCK') {
                updates.operationalStage = 'COMPLIANCE';
                reason += '. Booking promoted to COMPLIANCE stage.';
            }

            updateBookingStatus(booking.id, updates, reason);
            onUpdate();
        } catch (e: any) {
            alert(`Stock Error: ${e.message}`);
        }
    };

    const handleRevokeAllotment = () => {
        if (!confirm('Are you sure you want to revoke the allotment? This will clear any assigned VIN and reset PDI.'))
            return;
        try {
            updateBookingStatus(
                booking.id,
                {
                    allotmentStatus: 'NONE',
                    assignedVin: undefined,
                    pdiStatus: 'PENDING',
                    pdiMeta: {},
                },
                'Allotment revoked. PDI Reset.'
            );
            onUpdate();
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handlePDI = (passed: boolean) => {
        if (passed) {
            if (!pdiForm.visual || !pdiForm.access || !pdiForm.inspector) {
                alert('Please complete all PDI checklist items before approving.');
                return;
            }
            try {
                // PDI Pass -> Becomes eligible for Hard Lock
                updateBookingStatus(
                    booking.id,
                    {
                        pdiStatus: 'PASSED',
                        pdiMeta: {
                            inspectorName: pdiForm.inspector,
                            odoReading: pdiForm.odo,
                            notes: pdiForm.notes,
                        },
                    },
                    'PDI Passed. Eligible for Hard Allotment.'
                );
                onUpdate();
            } catch (e: any) {
                alert(e.message);
            }
        } else {
            // PDI Rejected -> Allot Another (Refined logic)
            if (!confirm('PDI Rejected. Do you want to release this vehicle and allot another?')) return;
            try {
                updateBookingStatus(
                    booking.id,
                    {
                        allotmentStatus: 'NONE',
                        assignedVin: undefined,
                        pdiStatus: 'FAILED',
                        pdiMeta: { reason: 'PDI Rejected by user' },
                    },
                    'PDI Rejected. Allotment released.'
                );
                onUpdate();
                alert('Vehicle released. Please soft-lock another unit from the inventory.');
            } catch (e: any) {
                alert(e.message);
            }
        }
    };

    const handleConfirmPayment = () => {
        try {
            updateBookingStatus(
                booking.id,
                {
                    booking_amount_paid: true,
                    operationalStage: 'FINANCE', // Payment promotes to Finance
                },
                'Payment received. Transitioning to Finance.'
            );
            onUpdate();
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleStagePromotion = (nextStage: OperationalStage) => {
        try {
            updateBookingStatus(booking.id, { operationalStage: nextStage }, `Promoted to ${nextStage} stage.`);
            onUpdate();
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleDelivery = () => {
        if (!deliveryForm.confirmed || !deliveryForm.receiver) return;
        try {
            // Success Trigger: Compliance finished -> Delivered
            updateBookingStatus(
                booking.id,
                {
                    status: 'DELIVERED',
                    operationalStage: 'DELIVERED',
                    documents: {
                        ...booking.documents,
                        receiverName: deliveryForm.receiver,
                        deliveryNotes: deliveryForm.notes,
                        handedOverAt: new Date().toISOString(),
                    },
                } as any,
                `Vehicle Delivered to ${deliveryForm.receiver}`
            );
            onUpdate();
        } catch (e: any) {
            alert(e.message);
        }
    };

    // Tab Content Renderers
    const renderContent = () => {
        switch (activeTab) {
            case 'Quote':
                if (!booking.priceSnapshot)
                    return <div className="p-12 text-center text-slate-400">No price details found.</div>;
                const qs = booking.priceSnapshot;
                return (
                    <div className="space-y-6">
                        <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-2xl p-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <FileText size={20} className="text-blue-600 dark:text-blue-300" />
                                <div>
                                    <h3 className="font-bold text-blue-900 dark:text-blue-300 text-sm italic uppercase tracking-tighter">
                                        Active Sales Quote
                                    </h3>
                                    <p className="text-[10px] text-blue-700 dark:text-blue-300 font-medium font-mono uppercase opacity-60">
                                        Locked Pricing Bundle
                                    </p>
                                </div>
                            </div>
                            {currentStage === 'QUOTE' && (
                                <button
                                    onClick={() => handleStagePromotion('BOOKING')}
                                    className="px-5 py-2.5 bg-blue-600 dark:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all"
                                >
                                    Confirm Order
                                </button>
                            )}
                            {currentStage === 'FINANCE' && (
                                <button
                                    onClick={() => handleStagePromotion('ALLOTMENT')}
                                    className="px-5 py-2.5 bg-brand-primary text-black text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all"
                                >
                                    Approve Finance & Proceed
                                </button>
                            )}
                        </div>
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-8 shadow-sm">
                            <div className="space-y-1 mb-8">
                                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                    Financial Breakdown
                                </h4>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">
                                    Estimated On-Road Total
                                </p>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Ex-Showroom Price</span>
                                    <span className="font-mono font-bold">₹{qs.exShowroom.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">RTO ({qs.rtoCode})</span>
                                    <span className="font-mono font-bold">₹{qs.rtoCharges.toLocaleString()}</span>
                                </div>
                                <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex justify-between items-end">
                                    <span className="text-xs font-black uppercase text-slate-400">
                                        Total Est. Payable
                                    </span>
                                    <span className="text-3xl font-black italic text-slate-900 dark:text-white">
                                        ₹{qs.totalOnRoad.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'Order':
                return (
                    <div className="space-y-6">
                        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-6 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
                                <CheckCircle2 size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-emerald-900 dark:text-emerald-300 text-sm italic uppercase tracking-tight">
                                    Order Confirmed
                                </h3>
                                <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-mono uppercase opacity-60">
                                    Operations Lifecycle Active
                                </p>
                            </div>
                            {currentStage === 'BOOKING' && (
                                <button
                                    onClick={() => handleStagePromotion('PAYMENT')}
                                    className="ml-auto px-5 py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all"
                                >
                                    Confirm Details & Proceed to Payment
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl shadow-sm">
                                <span className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">
                                    AUMS ID
                                </span>
                                <span className="font-mono font-bold text-slate-900 dark:text-white text-lg italic">
                                    {booking.displayId}
                                </span>
                            </div>
                            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl shadow-sm">
                                <span className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">
                                    Vibe Owner
                                </span>
                                <span className="font-bold text-slate-900 dark:text-white text-lg uppercase tracking-tighter">
                                    {booking.customerName}
                                </span>
                            </div>
                        </div>
                    </div>
                );

            case 'Allotment':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div
                                className={`p-8 rounded-[40px] border-2 transition-all flex flex-col items-center gap-4 relative
                                ${
                                    booking.allotmentStatus === 'SOFT_LOCK' || booking.allotmentStatus === 'HARD_LOCK'
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/20'
                                        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 text-slate-300'
                                }
                            `}
                            >
                                <Lock size={32} className={booking.allotmentStatus === 'NONE' ? 'opacity-20' : ''} />
                                <div className="text-center">
                                    <span className="block text-xs font-black uppercase tracking-widest">
                                        Soft Lock
                                    </span>
                                    <span className="text-[10px] font-medium opacity-60 uppercase">
                                        {booking.allotmentStatus === 'NONE'
                                            ? 'Pending Requirement'
                                            : 'Vehicle Reserved'}
                                    </span>
                                </div>
                                {booking.allotmentStatus === 'NONE' && (
                                    <button
                                        onClick={() => handleAllotmentChange('SOFT_LOCK')}
                                        className="mt-4 px-6 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all"
                                    >
                                        Execute Soft Allot
                                    </button>
                                )}
                                {(booking.allotmentStatus === 'SOFT_LOCK' ||
                                    booking.allotmentStatus === 'HARD_LOCK') && (
                                    <button
                                        onClick={handleRevokeAllotment}
                                        className="mt-4 flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity"
                                    >
                                        <RefreshCcw size={10} /> Revoke Allotment
                                    </button>
                                )}
                            </div>

                            <div
                                className={`p-8 rounded-[40px] border-2 transition-all flex flex-col items-center gap-4 relative
                                ${
                                    booking.allotmentStatus === 'HARD_LOCK'
                                        ? 'bg-slate-900 dark:bg-indigo-600 border-slate-900 dark:border-indigo-600 text-white shadow-xl'
                                        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 text-slate-300'
                                }
                            `}
                            >
                                <ShieldCheck
                                    size={32}
                                    className={booking.allotmentStatus !== 'HARD_LOCK' ? 'opacity-20' : ''}
                                />
                                <div className="text-center">
                                    <span className="block text-xs font-black uppercase tracking-widest">
                                        Hard Lock
                                    </span>
                                    <span className="text-[10px] font-medium opacity-60 uppercase">
                                        {booking.allotmentStatus === 'HARD_LOCK'
                                            ? 'Chassis Finalized'
                                            : 'Awaiting PDI Approval'}
                                    </span>
                                </div>
                                {booking.allotmentStatus === 'SOFT_LOCK' && booking.pdiStatus === 'PASSED' && (
                                    <button
                                        onClick={() => handleAllotmentChange('HARD_LOCK')}
                                        className="mt-4 px-6 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all"
                                    >
                                        Confirm Hard Allot
                                    </button>
                                )}
                            </div>
                        </div>

                        {booking.allotmentStatus === 'SOFT_LOCK' && !booking.assignedVin && (
                            <div className="mt-8 animate-in slide-in-from-bottom-4 duration-500">
                                <VinAssignmentSection booking={booking} onAssign={onUpdate} />
                            </div>
                        )}

                        {booking.assignedVin && (
                            <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-[40px] p-8 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-600">
                                        <Truck size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black uppercase tracking-widest text-emerald-900 dark:text-emerald-400">
                                            Inventory Assigned
                                        </h4>
                                        <p className="text-[10px] text-emerald-700/60 font-mono italic">
                                            {booking.assignedVin}
                                        </p>
                                    </div>
                                </div>
                                {booking.pdiStatus !== 'PASSED' && (
                                    <button
                                        onClick={() => setActiveTab('PDI')}
                                        className="px-6 py-3 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg hover:scale-105 transition-all"
                                    >
                                        Proceed to PDI
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                );

            case 'PDI':
                if (!booking.assignedVin)
                    return (
                        <div className="p-20 text-center bg-slate-50 dark:bg-white/5 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-white/10">
                            <Box size={40} className="mx-auto mb-4 opacity-10" />
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                                VIN Required
                            </h4>
                            <p className="text-[10px] mt-2 text-slate-400 uppercase">
                                Please assign a vehicle in the Allotment tab first.
                            </p>
                        </div>
                    );

                if (booking.pdiStatus === 'PASSED') {
                    return (
                        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-[40px] p-10">
                            <div className="flex items-center gap-6 mb-8">
                                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 rounded-[28px] flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-lg">
                                    <ClipboardCheck size={32} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black italic text-emerald-900 dark:text-emerald-400 uppercase tracking-tighter">
                                        PDI Certified
                                    </h3>
                                    <p className="text-[10px] text-emerald-700/60 dark:text-emerald-400/60 font-black uppercase tracking-widest mt-1">
                                        Inspection Passed • VIN {booking.assignedVin}
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-6 bg-white dark:bg-slate-950/50 rounded-3xl border border-emerald-100 dark:border-emerald-900/30">
                                    <span className="block text-[8px] font-black text-emerald-600/50 uppercase tracking-[0.2em] mb-1">
                                        Inspector
                                    </span>
                                    <span className="font-bold text-slate-900 dark:text-white uppercase text-sm tracking-tighter">
                                        {booking.pdiMeta?.inspectorName}
                                    </span>
                                </div>
                                <div className="p-6 bg-white dark:bg-slate-950/50 rounded-3xl border border-emerald-100 dark:border-emerald-900/30">
                                    <span className="block text-[8px] font-black text-emerald-600/50 uppercase tracking-[0.2em] mb-1">
                                        Odometer
                                    </span>
                                    <span className="font-mono font-black text-slate-900 dark:text-white text-sm">
                                        {booking.pdiMeta?.odoReading} KM
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                }
                return (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[40px] p-10 space-y-8 shadow-xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-amber-600">
                                    <Info size={20} />
                                </div>
                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">
                                        Active PDI Inspection
                                    </h4>
                                    <p className="text-[10px] text-slate-400 italic font-mono uppercase">
                                        Assigned VIN: {booking.assignedVin}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => handlePDI(false)}
                                className="flex items-center gap-2 px-4 py-2 border border-rose-100 dark:border-rose-900/30 text-rose-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-colors"
                            >
                                <XCircle size={14} /> Reject & Allot Another
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2 px-1">
                                        Inspector Name
                                    </label>
                                    <input
                                        className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-2xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 transition-all"
                                        placeholder="Enter Name..."
                                        value={pdiForm.inspector}
                                        onChange={e => setPdiForm({ ...pdiForm, inspector: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2 px-1">
                                        Reading (KM)
                                    </label>
                                    <input
                                        className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-2xl px-5 py-3 text-sm font-mono font-bold"
                                        placeholder="0"
                                        value={pdiForm.odo}
                                        onChange={e => setPdiForm({ ...pdiForm, odo: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-3 pt-6">
                                <label className="flex items-center gap-4 p-5 bg-slate-50 dark:bg-white/5 rounded-3xl cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all border border-transparent hover:border-blue-100">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 rounded-lg border-none bg-slate-200 dark:bg-slate-800 text-blue-600"
                                        checked={pdiForm.visual}
                                        onChange={e => setPdiForm({ ...pdiForm, visual: e.target.checked })}
                                    />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">
                                        Zero Scratches confirmed
                                    </span>
                                </label>
                                <label className="flex items-center gap-4 p-5 bg-slate-50 dark:bg-white/5 rounded-3xl cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all border border-transparent hover:border-blue-100">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 rounded-lg border-none bg-slate-200 dark:bg-slate-800 text-blue-600"
                                        checked={pdiForm.access}
                                        onChange={e => setPdiForm({ ...pdiForm, access: e.target.checked })}
                                    />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">
                                        Accessories Verified
                                    </span>
                                </label>
                            </div>
                        </div>

                        <button
                            onClick={() => handlePDI(true)}
                            disabled={!pdiForm.visual || !pdiForm.access || !pdiForm.inspector}
                            className="w-full py-5 bg-slate-900 dark:bg-blue-600 text-white rounded-[32px] font-black uppercase tracking-[0.2em] text-xs shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-20"
                        >
                            Approve PDI Certification
                        </button>
                    </div>
                );

            case 'Insurance':
            case 'Registration':
            case 'HSRP':
                return (
                    <div className="space-y-6">
                        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-3xl p-8 relative overflow-hidden group">
                            <Shield
                                className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"
                                size={120}
                            />
                            <div className="relative z-10">
                                <h3 className="text-lg font-black italic text-amber-900 dark:text-amber-400 uppercase tracking-tighter mb-1">
                                    {activeTab} Compliance
                                </h3>
                                <p className="text-xs text-amber-700/60 dark:text-amber-400/60 mb-8 uppercase font-bold tracking-widest font-mono">
                                    Operations Tracking Unit
                                </p>

                                <div className="p-10 text-center border-2 border-dashed border-amber-200 dark:border-amber-500/20 rounded-[40px] bg-white dark:bg-slate-950">
                                    <Clock size={32} className="mx-auto mb-4 text-amber-400 animate-pulse" />
                                    <p className="text-xs font-black text-slate-900 dark:text-slate-300 uppercase tracking-widest">
                                        Compliance in Progress
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-2 uppercase">
                                        Physical documents are being finalized for VIN {booking.assignedVin}.
                                    </p>
                                </div>

                                {activeTab === 'HSRP' && (
                                    <button
                                        onClick={() => setActiveTab('Delivery')}
                                        className="mt-8 w-full py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-colors"
                                    >
                                        Clear Compliance & Move to Delivery
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                );

            case 'Ledger':
                return (
                    <div className="space-y-8">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-8 bg-slate-950 rounded-[40px] text-white shadow-2xl relative overflow-hidden group">
                                <div className="absolute -bottom-4 -right-4 bg-white/5 p-8 rounded-full group-hover:scale-125 transition-transform">
                                    <Wallet size={60} />
                                </div>
                                <span className="text-[10px] font-black uppercase opacity-40 block mb-1 tracking-widest">
                                    Received
                                </span>
                                <span className="text-3xl font-black italic">
                                    ₹{booking.booking_amount_paid ? '5,000' : '0'}
                                </span>
                                <div className="mt-4 flex items-center gap-2">
                                    <div
                                        className={`w-1.5 h-1.5 rounded-full ${booking.booking_amount_paid ? 'bg-emerald-500' : 'bg-red-500'}`}
                                    />
                                    <span className="text-[8px] font-bold uppercase tracking-widest opacity-60">
                                        Ledger Verified
                                    </span>
                                </div>
                            </div>
                            <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[40px] shadow-sm relative group overflow-hidden">
                                <span className="text-[10px] font-black uppercase text-slate-400 block mb-1 tracking-widest">
                                    Pending
                                </span>
                                <span className="text-3xl font-black italic text-slate-900 dark:text-white">
                                    ₹{booking.booking_amount_paid ? '0' : '5,000'}
                                </span>
                                <p className="text-[8px] mt-4 font-bold text-slate-400 uppercase tracking-widest">
                                    Quote Balance Due
                                </p>
                                <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-10 transition-opacity">
                                    <CreditCard size={40} />
                                </div>
                            </div>
                        </div>

                        {currentStage === 'PAYMENT' && !booking.booking_amount_paid && (
                            <button
                                onClick={handleConfirmPayment}
                                className="w-full py-5 bg-emerald-600 text-white rounded-[32px] font-black uppercase tracking-[0.2em] text-xs shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                Record Payment & Proceed to Finance
                            </button>
                        )}

                        {/* Controls */}
                        <div className="p-8 border-2 border-slate-100 dark:border-white/5 rounded-[40px] flex items-center justify-between group hover:border-rose-100 dark:hover:border-rose-900/20 transition-all">
                            <div>
                                <h4 className="text-sm font-black italic text-slate-900 dark:text-white uppercase tracking-tighter">
                                    Refund Control
                                </h4>
                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1">
                                    Initiate ledger reversal for cancellations.
                                </p>
                            </div>
                            <button className="px-6 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-rose-900/30 text-rose-500 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-colors">
                                Trigger Refund
                            </button>
                        </div>
                    </div>
                );

            case 'Delivery':
                if (booking.status === 'DELIVERED') {
                    return (
                        <div className="bg-slate-950 rounded-[50px] p-16 text-center text-white relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                            <Key size={60} className="mx-auto mb-8 text-blue-400 opacity-20" />
                            <h3 className="text-4xl font-black italic uppercase tracking-tighter mb-4">
                                Journey Started
                            </h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                Post-Delivery Protocol Active • VIN {booking.assignedVin}
                            </p>

                            <div className="mt-12 flex justify-center gap-12">
                                <div className="text-center">
                                    <span className="block text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">
                                        Chassis
                                    </span>
                                    <span className="font-mono text-xl font-black italic">{booking.assignedVin}</span>
                                </div>
                                <div className="text-center">
                                    <span className="block text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">
                                        Status
                                    </span>
                                    <span className="text-xl font-black italic text-emerald-400 uppercase">
                                        Delivered
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                }
                return (
                    <div className="p-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[40px] shadow-2xl space-y-8">
                        <div className="bg-blue-50 dark:bg-blue-500/10 p-6 rounded-3xl flex items-center gap-4">
                            <Truck className="text-blue-500" />
                            <div>
                                <h4 className="text-xs font-black uppercase tracking-widest text-blue-900 dark:text-blue-300">
                                    Handover Protocol
                                </h4>
                                <p className="text-[10px] text-blue-700/60 dark:text-blue-300/60 italic font-bold">
                                    Ensure physical receipt and document baseline.
                                </p>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2 px-1">
                                    Receiver Identity
                                </label>
                                <input
                                    className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-2xl px-5 py-3 text-sm font-bold"
                                    placeholder="Enter Name..."
                                    value={deliveryForm.receiver}
                                    onChange={e => setDeliveryForm({ ...deliveryForm, receiver: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center gap-4 py-4 px-2">
                                <input
                                    type="checkbox"
                                    className="w-6 h-6 rounded-lg text-blue-600 border-none bg-slate-100 dark:bg-slate-800"
                                    checked={deliveryForm.confirmed}
                                    onChange={e => setDeliveryForm({ ...deliveryForm, confirmed: e.target.checked })}
                                />
                                <span className="text-xs font-black italic text-slate-900 dark:text-white uppercase tracking-tighter">
                                    I certify structural handover of the unit.
                                </span>
                            </div>
                            <button
                                onClick={handleDelivery}
                                disabled={!deliveryForm.confirmed || !deliveryForm.receiver}
                                className="w-full py-5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-[32px] font-black uppercase tracking-[0.2em] text-xs shadow-xl active:scale-95 transition-all disabled:opacity-20"
                            >
                                Execute Final Delivery
                            </button>
                        </div>
                    </div>
                );

            case 'Invoice':
                const inv = getInvoice(booking.id);
                if (!inv) {
                    return (
                        <div className="p-16 text-center bg-slate-50 dark:bg-white/5 rounded-[50px] border-2 border-dashed border-slate-200 dark:border-white/10">
                            <ReceiptIcon size={48} className="mx-auto mb-6 text-slate-300 opacity-20" />
                            <h3 className="text-xl font-black italic uppercase tracking-tighter mb-2">
                                No Invoice Generated
                            </h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">
                                Generation standard: Post-Delivery Ledger normalization
                            </p>
                            <button
                                onClick={() => {
                                    generateInvoice(booking.id);
                                    onUpdate();
                                }}
                                className="px-10 py-4 bg-slate-900 dark:bg-blue-600 text-white text-xs font-black uppercase tracking-[0.2em] rounded-[28px] shadow-xl hover:scale-105 active:scale-95 transition-all"
                            >
                                Seed GST Invoice
                            </button>
                        </div>
                    );
                }
                return (
                    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-700">
                        <div className="grid grid-cols-3 gap-6">
                            <div className="p-8 bg-slate-950 rounded-[40px] text-white">
                                <span className="text-[8px] font-black uppercase opacity-40 block mb-2 tracking-[0.2em]">
                                    Payable
                                </span>
                                <span className="text-2xl font-black italic">
                                    ₹{inv.totals.grandTotal.toLocaleString()}
                                </span>
                            </div>
                            <div className="p-8 bg-emerald-500 rounded-[40px] text-white">
                                <span className="text-[8px] font-black uppercase opacity-60 block mb-2 tracking-[0.2em]">
                                    Resolved
                                </span>
                                <span className="text-2xl font-black italic">₹{inv.amountPaid.toLocaleString()}</span>
                            </div>
                            <div className="p-8 bg-slate-100 dark:bg-white/5 rounded-[40px] flex items-center justify-center">
                                <span className="text-xs font-black uppercase italic text-slate-900 dark:text-white tracking-widest">
                                    Status: {inv.paymentStatus}
                                </span>
                            </div>
                        </div>
                        <div className="p-1 bg-slate-100 dark:bg-white/5 rounded-[44px]">
                            <div className="bg-white dark:bg-slate-900 rounded-[40px] p-1 shadow-2xl overflow-hidden max-h-[400px] overflow-y-auto custom-scrollbar">
                                <InvoiceDocument invoice={inv} />
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="flex h-full overflow-hidden bg-slate-50 dark:bg-[#0b0d10]">
            <LifecycleSidebar currentStage={currentStage} status={booking.status} onStageSelect={handleStageSelect} />

            <div className="flex-1 min-w-0 bg-white dark:bg-[#0b0d10] border-l border-slate-100 dark:border-white/5 animate-in slide-in-from-right-4 duration-700">
                <DetailPanel
                    title={`Order Detail • ${booking.displayId}`}
                    status={booking.status}
                    onClose={onClose}
                    tabs={effectiveTabs}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    renderContent={renderContent}
                />
            </div>
        </div>
    );
}
