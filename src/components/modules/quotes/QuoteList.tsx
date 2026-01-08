'use client';

import React from 'react';
import { Quote } from '@/lib/dataStore';
import { Search, Plus } from 'lucide-react';

interface QuoteListProps {
    quotes: Quote[];
    selectedId: string | null;
    onSelect: (quote: Quote) => void;
    onNewQuote: () => void;
}

export default function QuoteList({ quotes, selectedId, onSelect, onNewQuote }: QuoteListProps) {
    return (
        <div className="h-full flex flex-col bg-white border-r border-gray-200">
            {/* Header / Search */}
            <div className="p-4 border-b border-gray-200 space-y-3">
                <div className="flex justify-between items-center">
                    <h2 className="font-bold text-gray-700">All Quotes</h2>
                    <button
                        onClick={onNewQuote}
                        className="p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                        title="Create New Quote"
                    >
                        <Plus size={18} />
                    </button>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search Quotes..."
                        className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                <div className="divide-y divide-gray-100">
                    {quotes.map(quote => {
                        const isSelected = quote.id === selectedId;
                        return (
                            <div
                                key={quote.id}
                                onClick={() => onSelect(quote)}
                                className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : 'border-l-4 border-transparent'}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`font-mono font-bold text-xs ${isSelected ? 'text-blue-700' : 'text-gray-500'}`}>{quote.displayId}</span>
                                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${quote.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                                        quote.status === 'Converted to Order' ? 'bg-purple-100 text-purple-700' :
                                            'bg-gray-100 text-gray-600'
                                        }`}>
                                        {quote.status}
                                    </span>
                                </div>
                                <h4 className="font-medium text-gray-900 text-sm truncate">{quote.customerName}</h4>
                                <p className="text-xs text-gray-500 mt-1 truncate">{quote.productName}</p>
                                <p className="text-xs font-mono font-medium text-gray-700 mt-2">₹{quote.price.toLocaleString()}</p>
                            </div>
                        );
                    })}
                    {quotes.length === 0 && (
                        <div className="p-8 text-center text-gray-400 text-sm">
                            <p>No quotes found.</p>
                            <button onClick={onNewQuote} className="text-blue-600 font-bold hover:underline mt-1">Create one</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
