import React from 'react';
import { BankLocation } from '@/types/bankPartner';
import { MapPin, Phone } from 'lucide-react';

export default function LocationsTab({ locations }: { locations: BankLocation[] }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {locations.map((loc) => (
                <div key={loc.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl p-5 hover:border-slate-300 dark:hover:border-white/10 transition-colors shadow-sm dark:shadow-none">
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                            <MapPin size={18} className="text-blue-600 dark:text-blue-500" />
                            <h4 className="font-bold text-slate-900 dark:text-white">{loc.branchName}</h4>
                        </div>
                        {loc.isPrimary && (
                            <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase rounded border border-blue-100 dark:border-blue-500/20">Primary</span>
                        )}
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 leading-relaxed">
                        {loc.address}<br />
                        {loc.city}, {loc.state} - {loc.pincode}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-black/20 p-2 rounded-lg inline-block border border-slate-200 dark:border-transparent">
                        <Phone size={14} className="text-slate-500" />
                        {loc.contactNumber}
                    </div>
                </div>
            ))}
        </div>
    );
}
