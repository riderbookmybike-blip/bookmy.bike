'use client';

import React, { useState } from 'react';
import { BankPartner } from '@/types/bankPartner';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Unused
import { Building2, MapPin, Users, Calculator } from 'lucide-react';
import OverviewTab from './tabs/OverviewTab';
import LocationsTab from './tabs/LocationsTab';
import TeamTab from './tabs/TeamTab';
import SchemesTab from './tabs/SchemesTab';

interface BankDetailViewProps {
    partner: BankPartner;
}

export default function BankDetailView({ partner }: BankDetailViewProps) {
    const [activeTab, setActiveTab] = useState('overview');

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-white/10 bg-slate-900/80 backdrop-blur-md">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold mb-1">{partner.name}</h1>
                        <p className="text-slate-400 text-sm font-mono">{partner.displayId}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${partner.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'
                        }`}>
                        {partner.status}
                    </span>
                </div>

                {/* Tab Navigation */}
                <div className="flex items-center gap-1 mt-8 border-b border-white/5">
                    {[
                        { id: 'overview', label: 'Overview', icon: Building2 },
                        { id: 'locations', label: 'Locations', icon: MapPin },
                        { id: 'team', label: 'Team', icon: Users },
                        { id: 'schemes', label: 'Schemes', icon: Calculator },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                ? 'border-blue-500 text-blue-400'
                                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-white/10'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'overview' && <OverviewTab partner={partner} />}
                {activeTab === 'locations' && <LocationsTab locations={partner.locations} />}
                {activeTab === 'team' && <TeamTab team={partner.team} />}
                {activeTab === 'schemes' && <SchemesTab schemes={partner.schemes} />}
            </div>
        </div>
    );
}
