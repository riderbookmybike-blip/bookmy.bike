import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import {
    ShieldCheck,
    Wallet,
    Landmark,
    PieChart as PieIcon,
    ShieldAlert,
    CreditCard,
    ChevronRight,
} from 'lucide-react';
import { AriaCard, AriaNumber, EnterpriseTable } from './AriaPanels';

export const FinancerAria = ({ kpis }: { kpis: any }) => {
    const riskData = [
        { name: 'Low Risk', value: 450, color: '#696CFF' },
        { name: 'Medium Risk', value: 300, color: '#ffab00' },
        { name: 'High Risk', value: 120, color: '#ff3e1d' },
    ];

    const financeRows = [
        ['APP-9021', 'Rohan S.', '₹45,000', 'Approved'],
        ['APP-9022', 'Ananya V.', '₹1,20,000', 'Reviewing'],
        ['APP-9023', 'Karan J.', '₹2,10,000', 'Disbursed'],
        ['APP-9024', 'Sneha P.', '₹85,000', 'Pending'],
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Capital Oversight */}
            <AriaCard title="Capital Displacement" subtitle="Total Portfolio" icon={Wallet} className="lg:col-span-1">
                <div className="mt-6 flex flex-col gap-4">
                    <AriaNumber value="₹1.2 Cr" label="Disbursed (YTD)" trend={15} />
                    <div className="h-px bg-slate-100" />
                    <AriaNumber value="₹12.4L" label="Avg Loan Size" />
                </div>
            </AriaCard>

            <AriaCard
                title="Risk Distribution"
                subtitle="Portfolio Analytics"
                icon={ShieldCheck}
                className="lg:col-span-2"
            >
                <div className="flex items-center h-[180px] mt-2">
                    <div className="w-1/2 h-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: 'none',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                    }}
                                />
                                <Pie
                                    data={riskData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                >
                                    {riskData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="w-1/2 space-y-3 pl-4">
                        {riskData.map((d, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                                <span className="text-[11px] font-bold text-slate-500 uppercase">{d.name}</span>
                                <span className="text-xs font-bold text-slate-700 ml-auto">{d.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </AriaCard>

            <AriaCard title="Workflow Health" subtitle="Approval Tunnel" icon={CreditCard} className="lg:col-span-1">
                <div className="mt-6 flex flex-col gap-4">
                    <AriaNumber value="4.2 Days" label="Avg Turnaround" trend={-12} />
                    <div className="h-px bg-slate-100" />
                    <div className="flex items-center justify-between group cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-all">
                        <span className="text-[11px] font-bold text-slate-400 uppercase">Pending Review</span>
                        <div className="flex items-center gap-1 text-rose-500 font-bold">
                            24 <ChevronRight size={14} />
                        </div>
                    </div>
                </div>
            </AriaCard>

            {/* Financial Ledger */}
            <div className="lg:col-span-4 mt-4">
                <div className="flex justify-between items-center mb-6 px-2">
                    <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
                        <Landmark size={20} className="text-[#696CFF]" />
                        Recent Loan Applications
                    </h2>
                    <button className="text-[11px] font-bold text-[#696CFF] uppercase border border-[#696CFF]/20 px-3 py-1 rounded hover:bg-[#696CFF] hover:text-white transition-all">
                        Download Ledger (CSV)
                    </button>
                </div>
                <EnterpriseTable
                    headers={['Application ID', 'Customer Profile', 'Principal Amount', 'Status Status']}
                    rows={financeRows}
                />
            </div>
        </div>
    );
};
