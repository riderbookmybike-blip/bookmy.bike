import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Globe, Users, ShoppingCart, DollarSign, ArrowUpRight, Server, Activity } from 'lucide-react';
import { AriaCard, AriaNumber, EnterpriseTable } from './AriaPanels';

export const AUMSAria = ({ kpis }: { kpis: any }) => {
    const data = [
        { name: 'Mon', usage: 400 },
        { name: 'Tue', usage: 300 },
        { name: 'Wed', usage: 200 },
        { name: 'Thu', usage: 278 },
        { name: 'Fri', usage: 189 },
        { name: 'Sat', usage: 239 },
        { name: 'Sun', usage: 349 },
    ];

    const tenantRows = [
        ['Apex Motors', 'Active', '12 (New)', '₹4.5L'],
        ['Autofin Hub', 'Provisioning', '2 (Pending)', '₹1.2L'],
        ['Global Bikes', 'Active', '45 (Growth)', '₹12.8L'],
        ['Zenith Riders', 'Suspended', '-', '-'],
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Global Oversight */}
            <AriaCard title="Total Ecosystem" subtitle="Network Nodes" icon={Globe} className="lg:col-span-1">
                <div className="mt-6 flex flex-col gap-4">
                    <AriaNumber value={124} label="Active Sites" trend={12} />
                    <div className="h-px bg-slate-100" />
                    <AriaNumber value="99.98%" label="SLA Performance" suffix="" />
                </div>
            </AriaCard>

            <AriaCard
                title="Commercial Yield"
                subtitle="Aggregated Revenue"
                icon={DollarSign}
                className="lg:col-span-1"
                variant="accent"
            >
                <div className="mt-6 flex flex-col gap-4">
                    <AriaNumber value="₹42.8L" label="MTD Volume" trend={8} />
                    <div className="h-px bg-white/20" />
                    <AriaNumber value="₹12.4K" label="Avg Ticket" />
                </div>
            </AriaCard>

            {/* Network Traffic */}
            <AriaCard title="Global Traffic" subtitle="Usage Spike Analysis" icon={Activity} className="lg:col-span-2">
                <div className="h-[180px] mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#696CFF" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#696CFF" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '12px',
                                    border: 'none',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="usage"
                                stroke="#696CFF"
                                fillOpacity={1}
                                fill="url(#colorUsage)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </AriaCard>

            {/* Tenant Health Table */}
            <div className="lg:col-span-4 mt-4">
                <div className="flex justify-between items-center mb-6 px-2">
                    <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
                        <Server size={20} className="text-[#696CFF]" />
                        Active Tenant Instances
                    </h2>
                    <button className="text-[11px] font-bold text-[#696CFF] uppercase border border-[#696CFF]/20 px-3 py-1 rounded hover:bg-[#696CFF] hover:text-white transition-all">
                        View All Infrastructure
                    </button>
                </div>
                <EnterpriseTable
                    headers={['Tenant Name', 'Instance Status', 'Recent Leads', 'Revenue Contrib']}
                    rows={tenantRows}
                />
            </div>
        </div>
    );
};
