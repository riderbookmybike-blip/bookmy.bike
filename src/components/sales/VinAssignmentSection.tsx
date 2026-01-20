'use client';

import React, { useState, useEffect } from 'react';
import { Booking } from '@/types/booking';
import { getVins, assignVinToBooking } from '@/lib/dataStore';
import { VehicleUnit } from '@/types/vehicleUnit';
import { Fingerprint, Check } from 'lucide-react';

export function VinAssignmentSection({ booking, onAssign }: { booking: Booking, onAssign: () => void }) {
    const [availableVins, setAvailableVins] = useState<VehicleUnit[]>([]);
    const [selectedVin, setSelectedVin] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        // Fetch VINs that match vaguely (for demo) and are AVAILABLE
        const allVins = getVins();
        const relevant = allVins.filter(v =>
            v.status === 'AVAILABLE' &&
            // In real app: v.sku === booking.sku
            // Demo: Match First 3 letters of Brand 'HND' etc.
            v.vin.startsWith(booking.brandName.substring(0, 3).toUpperCase())
        );
        setAvailableVins(relevant);
    }, [booking]);

    const handleAssign = () => {
        if (!selectedVin) return;
        try {
            assignVinToBooking(booking.id, selectedVin);
            onAssign();
        } catch (e: any) {
            setError(e.message);
        }
    };

    if (booking.assignedVin) {
        return (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h4 className="font-bold text-green-900 mb-2 flex items-center gap-2">
                    <Check size={18} /> VIN Assigned
                </h4>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <span className="text-xs text-green-600 block uppercase font-bold">Chassis Number (VIN)</span>
                        <span className="font-mono text-lg font-bold text-green-800">{booking.assignedVin}</span>
                    </div>
                    <div>
                        <span className="text-xs text-green-600 block uppercase font-bold">Engine Number</span>
                        <span className="font-mono text-lg font-bold text-green-800">{booking.assignedEngineNumber}</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg p-6">
            <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-4 flex items-center gap-2">
                <Fingerprint size={18} /> Assign VIN / Chassis
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                Booking is confirmed. Select a chassis from inventory to finalize the unit.
            </p>

            <div className="flex gap-2">
                <select
                    value={selectedVin}
                    onChange={(e) => setSelectedVin(e.target.value)}
                    className="flex-1 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-500/30 rounded px-3 py-2 text-sm font-mono text-slate-900 dark:text-white"
                >
                    <option value="">-- Select Chassis --</option>
                    {availableVins.map(v => (
                        <option key={v.id} value={v.vin}>
                            {v.vin} ({v.location})
                        </option>
                    ))}
                </select>
                <button
                    onClick={handleAssign}
                    disabled={!selectedVin}
                    className="px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    Assign
                </button>
            </div>
            {availableVins.length === 0 && (
                <p className="text-xs text-red-600 mt-2 font-medium">No matching VINs found in Available stock.</p>
            )}
            {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
        </div>
    );
}
