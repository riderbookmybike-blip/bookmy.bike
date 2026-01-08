'use client';

import React from 'react';
import { Package, ShoppingCart, FileText, Shield, DollarSign } from 'lucide-react';

interface DependencyMapPanelProps {
    entity: {
        name: string;
        id: string;
    };
    dependencies?: {
        bookings?: number;
        inventory?: number;
        priceLists?: number;
        registrations?: number;
        insurance?: number;
    };
}

/**
 * DependencyMapPanel - Shows where entity is used across the system
 */
export const DependencyMapPanel: React.FC<DependencyMapPanelProps> = ({
    entity,
    dependencies = {
        bookings: 0,
        inventory: 0,
        priceLists: 0,
        registrations: 0,
        insurance: 0
    }
}) => {
    const deps = [
        { icon: ShoppingCart, label: 'Active Bookings', count: dependencies.bookings, color: 'text-blue-500' },
        { icon: Package, label: 'Inventory Locations', count: dependencies.inventory, color: 'text-green-500' },
        { icon: DollarSign, label: 'Price Lists', count: dependencies.priceLists, color: 'text-yellow-500' },
        { icon: FileText, label: 'Registration Rules', count: dependencies.registrations, color: 'text-purple-500' },
        { icon: Shield, label: 'Insurance Plans', count: dependencies.insurance, color: 'text-orange-500' }
    ];

    return (
        <div className="bg-slate-900 rounded-2xl border border-white/10 p-6 space-y-4">
            <div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">Usage Map</p>
                <h4 className="text-sm font-black text-white">{entity.name}</h4>
            </div>

            <div className="space-y-3">
                {deps.map((dep, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <dep.icon size={14} className={dep.color} />
                            <span className="text-xs font-medium text-slate-300">{dep.label}</span>
                        </div>
                        <span className={`text-xs font-black ${(dep.count || 0) > 0 ? 'text-white' : 'text-slate-600'}`}>
                            {dep.count}
                        </span>
                    </div>
                ))}
            </div>

            {Object.values(dependencies).every(v => v === 0) && (
                <div className="pt-4 border-t border-white/5">
                    <p className="text-xs text-slate-500 italic">No dependencies yet</p>
                </div>
            )}
        </div>
    );
};

export default DependencyMapPanel;
