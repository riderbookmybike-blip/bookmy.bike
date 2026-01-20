'use client';

import React from 'react';
import { Booking } from '@/types/booking';
import { Search } from 'lucide-react';

interface BookingListProps {
    bookings: Booking[];
    selectedId: string | null;
    onSelect: (booking: Booking) => void;
}

export default function BookingList({ bookings, selectedId, onSelect }: BookingListProps) {
    return (
        <div className="h-full flex flex-col bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-white/10">
            <div className="p-4 border-b border-gray-200 dark:border-white/10 space-y-3">
                <h2 className="font-bold text-gray-700 dark:text-slate-200">All Bookings</h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={16} />
                    <input
                        type="text"
                        placeholder="Search Bookings..."
                        className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 dark:border-white/10 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-slate-950 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="divide-y divide-gray-100 dark:divide-white/10">
                    {bookings.map(book => {
                        const isSelected = book.id === selectedId;
                        return (
                            <div
                                key={book.id}
                                onClick={() => onSelect(book)}
                                className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-white/5 ${isSelected ? 'bg-blue-50 dark:bg-blue-500/10 border-l-4 border-blue-600' : 'border-l-4 border-transparent'}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`font-mono font-bold text-xs ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-slate-400'}`}>{book.displayId}</span>
                                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${book.allotmentStatus === 'HARD_LOCK' ? 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400' :
                                        book.allotmentStatus === 'SOFT_LOCK' ? 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400' :
                                            'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-slate-400'
                                        }`}>
                                        {book.allotmentStatus}
                                    </span>
                                </div>
                                <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">{book.customerName}</h4>
                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 truncate">{book.modelName}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
