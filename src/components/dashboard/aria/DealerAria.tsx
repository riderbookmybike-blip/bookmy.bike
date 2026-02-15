import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ShoppingCart, Package, Timer, Truck, TrendingUp, Filter, Plus } from 'lucide-react';
import { AriaCard, AriaNumber, EnterpriseTable } from './AriaPanels';

export const DealerAria = ({ kpis }: { kpis: any }) => {
    const inventoryData = [
        { name: 'Suzuki', stock: 45, sold: 12 },
        { name: 'TVS', stock: 32, sold: 18 },
        { name: 'Yamaha', stock: 28, sold: 22 },
        { name: 'Royal', stock: 64, sold: 15 },
    ];

    const leadRows = [
        ['Rohan S.', 'Suzuki Access', 'Warm', 'Follow-up at 2 PM'],
        ['Ananya V.', 'Ntorq 125', 'Hot', 'Booking Pending'],
        ['Karan J.', 'Yamaha R15', 'Cold', 'Not interested'],
        ['Sneha P.', 'TVS Ronin', 'Warm', 'Test Ride Scheduled'],
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Showroom Status */}
            <AriaCard title="Sales Velocity" subtitle="Daily Performance" icon={TrendingUp} className="lg:col-span-1">
                <div className="mt-6 flex flex-col gap-4">
                    <AriaNumber value={kpis?.bookings?.total || 14} label="Today's Bookings" trend={5} />
                    <div className="h-px bg-slate-100" />
                    <AriaNumber value="₹8.4L" label="Showroom Revenue" />
                </div>
            </AriaCard>

            <AriaCard title="Showroom Logistics" subtitle="Stock Distribution" icon={Package} className="lg:col-span-2">
                <div className="h-[180px] mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={inventoryData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '12px',
                                    border: 'none',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                }}
                            />
                            <Bar dataKey="stock" fill="#696CFF" radius={[4, 4, 0, 0]} barSize={30} />
                            <Bar dataKey="sold" fill="#8592a3" radius={[4, 4, 0, 0]} barSize={30} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </AriaCard>

            <AriaCard title="Leads Funnel" subtitle="Pipeline Health" icon={Filter} className="lg:col-span-1">
                <div className="mt-6 flex flex-col gap-4">
                    <AriaNumber value={kpis?.leads?.total || 156} label="Total Pipeline" trend={12} />
                    <div className="h-px bg-slate-100" />
                    <div className="flex gap-2 mt-2">
                        <div className="flex-1 bg-rose-50 p-2 rounded-lg text-rose-600 text-center">
                            <p className="text-[10px] font-bold uppercase">Hot</p>
                            <p className="text-lg font-bold">14</p>
                        </div>
                        <div className="flex-1 bg-amber-50 p-2 rounded-lg text-amber-600 text-center">
                            <p className="text-[10px] font-bold uppercase">Warm</p>
                            <p className="text-lg font-bold">42</p>
                        </div>
                    </div>
                </div>
            </AriaCard>

            {/* Lead Operations */}
            <div className="lg:col-span-4 mt-4">
                <div className="flex justify-between items-center mb-6 px-2">
                    <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
                        <Timer size={20} className="text-[#696CFF]" />
                        Active Lead Sessions
                    </h2>
                    <div className="flex gap-2">
                        <button className="p-2 bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800">
                            <Plus size={18} />
                        </button>
                        <button className="text-[11px] font-bold text-white bg-[#696CFF] px-4 py-1.5 rounded-lg shadow-md shadow-[#696CFF]/20 hover:scale-105 transition-all">
                            Manage Lead Desk
                        </button>
                    </div>
                </div>
                <EnterpriseTable
                    headers={['Customer Name', 'Vehicle Interest', 'Heat Level', 'Current Status']}
                    rows={leadRows}
                />
            </div>
        </div>
    );
};
