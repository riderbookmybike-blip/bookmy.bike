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
        <div className="h-full flex flex-col bg-white border-r border-gray-200">
            <div className="p-4 border-b border-gray-200 space-y-3">
                <h2 className="font-bold text-gray-700">All Bookings</h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search Bookings..."
                        className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="divide-y divide-gray-100">
                    {bookings.map(book => {
                        const isSelected = book.id === selectedId;
                        return (
                            <div
                                key={book.id}
                                onClick={() => onSelect(book)}
                                className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : 'border-l-4 border-transparent'}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`font-mono font-bold text-xs ${isSelected ? 'text-blue-700' : 'text-gray-500'}`}>{book.displayId}</span>
                                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${book.allotmentStatus === 'HARD_LOCK' ? 'bg-red-100 text-red-700' :
                                        book.allotmentStatus === 'SOFT_LOCK' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-gray-100 text-gray-600'
                                        }`}>
                                        {book.allotmentStatus}
                                    </span>
                                </div>
                                <h4 className="font-medium text-gray-900 text-sm truncate">{book.customerName}</h4>
                                <p className="text-xs text-gray-500 mt-1 truncate">{book.modelName}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
