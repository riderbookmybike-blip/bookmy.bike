'use client';

import React from 'react';
import { X, Printer, Landmark, Wallet, CheckCircle2, User, Calendar } from 'lucide-react';

interface VoucherPrintModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: any;
    account: any;
}

export default function VoucherPrintModal({ isOpen, onClose, transaction, account }: VoucherPrintModalProps) {
    if (!isOpen || !transaction) return null;

    const handlePrint = () => {
        window.print();
    };

    const isReceipt = transaction.type === 'INFLOW';
    const title = isReceipt ? 'RECEIPT VOUCHER' : 'PAYMENT VOUCHER';
    const colorClass = isReceipt ? 'text-emerald-600' : 'text-rose-600';
    const bgClass = isReceipt ? 'bg-emerald-50' : 'bg-rose-50';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:p-0 print:bg-white print:backdrop-blur-none">
            <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] print:shadow-none print:max-h-full print:rounded-none">
                {/* Header (Hidden on Print) */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between print:hidden">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${bgClass}`}>
                            <Printer className={colorClass} size={20} />
                        </div>
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Print Preview</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Voucher Content */}
                <div className="flex-1 overflow-y-auto p-12 print:p-0 print:overflow-visible bg-slate-50 print:bg-white">
                    <div className="bg-white p-12 shadow-sm border border-slate-100 print:shadow-none print:border-none min-h-[600px] flex flex-col justify-between">
                        {/* Company & Voucher Header */}
                        <div>
                            <div className="flex justify-between items-start mb-12">
                                <div>
                                    <h1 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">
                                        BookMyBike Platform
                                    </h1>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                        Financial Operations Gateway
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className={`text-lg font-black uppercase italic ${colorClass} tracking-tight`}>
                                        {title}
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                        Ref: {transaction.displayId || transaction.id.slice(0, 8)}
                                    </p>
                                </div>
                            </div>

                            {/* Main Body */}
                            <div className="space-y-8">
                                <div className="grid grid-cols-2 gap-8 border-b border-slate-100 pb-8">
                                    <div>
                                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1.5">
                                            Date of Transaction
                                        </p>
                                        <div className="flex items-center gap-2 text-slate-700 font-bold">
                                            <Calendar size={14} className="text-slate-300" />
                                            {new Date(transaction.date).toLocaleDateString()} at{' '}
                                            {new Date(transaction.date).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1.5">
                                            Payment Method
                                        </p>
                                        <div className="flex items-center gap-2 justify-end text-slate-700 font-bold">
                                            <Wallet size={14} className="text-slate-300" />
                                            {transaction.method}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1.5">
                                        Description / Purpose
                                    </p>
                                    <p className="text-sm font-bold text-slate-700 leading-relaxed italic">
                                        {transaction.description}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-8 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                    <div>
                                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1.5">
                                            Bank Account / Ledger
                                        </p>
                                        <div className="flex items-center gap-2 text-slate-700 font-bold">
                                            <Landmark size={14} className="text-slate-300" />
                                            {account?.bank_name} ({account?.account_number?.slice(-4)})
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1.5">
                                            Amount Sent/Received
                                        </p>
                                        <div className={`text-xl font-black ${colorClass}`}>
                                            ₹{transaction.amount?.toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 pt-8 flex justify-between items-center opacity-70">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                        <CheckCircle2 size={14} className="text-emerald-500" />
                                        System Generated & Authenticated
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                                        <User size={14} />
                                        {transaction.member?.full_name || 'Customer/Vendor'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Signature Area */}
                        <div className="grid grid-cols-2 gap-12 mt-16 pb-4">
                            <div className="border-t-2 border-slate-100 pt-3 text-center">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                    Authorized Signatory
                                </p>
                            </div>
                            <div className="border-t-2 border-slate-100 pt-3 text-center">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                    Receiver Signature
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions (Hidden on Print) */}
                <div className="p-6 border-t border-slate-100 flex gap-4 print:hidden">
                    <button
                        onClick={onClose}
                        className="flex-1 px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                        Close
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex-[2] px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-2"
                    >
                        <Printer size={14} />
                        Print Voucher
                    </button>
                </div>
            </div>
        </div>
    );
}
