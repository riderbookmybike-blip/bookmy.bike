import React from 'react';
import { Quote } from './QuoteList';
import { Printer, Download, Share2, ChevronLeft, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuoteDetailProps {
    quote: Quote;
    onBack?: () => void;
}

export default function QuoteDetail({ quote, onBack }: QuoteDetailProps) {
    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950/50">
            {/* Header */}
            <div className="p-8 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-white/[0.02] backdrop-blur-3xl sticky top-0 z-30">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-6">
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="p-3 hover:bg-white/10 text-slate-400 hover:text-slate-900 dark:text-white/40 dark:hover:text-white transition-all rounded-2xl border border-transparent dark:border-white/5 hover:border-slate-200 active:scale-90 lg:hidden"
                            >
                                <ChevronLeft size={20} />
                            </button>
                        )}
                        <div>
                            <div className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-1.5 flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-indigo-500" />
                                {quote.displayId}
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                                {quote.customerName}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl">
                            <Printer size={16} />
                        </Button>
                        <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl">
                            <Download size={16} />
                        </Button>
                        <Button className="h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs">
                            Convert to Booking
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Status</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{quote.status}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Date</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{quote.date}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Amount</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(quote.price)}</span>
                    </div>
                </div>
            </div>

            {/* Content - "Paper" View */}
            <div className="flex-1 overflow-y-auto p-10 flex justify-center">
                <div className="w-full max-w-3xl bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-lg shadow-2xl p-16 min-h-[800px]">
                    {/* Placeholder for actual invoice design */}
                    <div className="flex justify-between items-start mb-16">
                        <div className="h-12 w-32 bg-slate-100 dark:bg-white/5 rounded" />
                        <div className="text-right">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">QUOTATION</h2>
                            <p className="text-slate-500 font-mono text-sm">{quote.displayId}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-12 mb-16">
                        <div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Bill To</h3>
                            <p className="text-lg font-bold text-slate-900 dark:text-white">{quote.customerName}</p>
                        </div>
                        <div className="text-right">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Vehicle Details</h3>
                            <p className="text-lg font-bold text-slate-900 dark:text-white">{quote.productName}</p>
                            <p className="text-sm text-slate-500">{quote.productSku}</p>
                        </div>
                    </div>

                    <div className="border-t border-b border-slate-200 dark:border-white/10 py-4 mb-4">
                        <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-500">
                            <span>Description</span>
                            <span>Amount</span>
                        </div>
                    </div>

                    <div className="space-y-4 mb-8">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-900 dark:text-white">Ex-Showroom Price</span>
                            <span className="text-sm font-bold text-slate-900 dark:text-white">₹ ---</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-900 dark:text-white">Insurance</span>
                            <span className="text-sm font-bold text-slate-900 dark:text-white">₹ ---</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-900 dark:text-white">RTO / Registration</span>
                            <span className="text-sm font-bold text-slate-900 dark:text-white">₹ ---</span>
                        </div>
                    </div>

                    <div className="border-t border-slate-200 dark:border-white/10 pt-4">
                        <div className="flex justify-between items-center text-xl font-black text-slate-900 dark:text-white">
                            <span>Total</span>
                            <span>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(quote.price)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
