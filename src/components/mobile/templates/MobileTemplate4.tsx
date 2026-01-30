'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, PieChart, ArrowUpRight, Plus, Bell, CircleDollarSign } from 'lucide-react';

const FintechHeader = () => {
    return (
        <div className="fixed top-0 left-0 right-0 z-50 px-6 py-4 pt-12 bg-white flex justify-between items-center border-b border-zinc-100">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-black">
                    B
                </div>
                <div>
                    <h1 className="text-sm font-bold text-zinc-900 leading-none">Savings Account</h1>
                    <p className="text-[10px] text-zinc-500 font-medium">Available Limit: ₹2,50,000</p>
                </div>
            </div>
            <button className="relative p-2 bg-zinc-50 rounded-full">
                <Bell size={18} className="text-zinc-600" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
        </div>
    );
};

const FintechDock = () => {
    return (
        <div className="fixed bottom-6 left-6 right-6 z-50 bg-zinc-900 text-white p-2 rounded-[2rem] shadow-2xl flex justify-between items-center px-6 border border-zinc-800">
            <button className="p-3 bg-zinc-800 rounded-full text-blue-400">
                <Wallet size={20} />
            </button>
            <button className="p-3 hover:bg-zinc-800 rounded-full text-zinc-400">
                <PieChart size={20} />
            </button>
            <button className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center -mt-8 border-4 border-[#F5F5F7] shadow-lg">
                <Plus size={24} />
            </button>
            <button className="p-3 hover:bg-zinc-800 rounded-full text-zinc-400">
                <CircleDollarSign size={20} />
            </button>
            <button className="p-3 hover:bg-zinc-800 rounded-full text-zinc-400">
                <div className="w-5 h-5 rounded-full bg-zinc-700" />
            </button>
        </div>
    );
};

export const MobileTemplate4 = () => {
    return (
        <div className="bg-[#F5F5F7] min-h-screen text-zinc-900 font-sans pb-32">
            <FintechHeader />

            <div className="pt-24 px-6 space-y-6">
                {/* Main Offer Card */}
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-zinc-200/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-10 -mt-10" />

                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Pre-Approved</p>
                    <h2 className="text-4xl font-black text-zinc-900 mb-1">₹2,200<span className="text-lg text-zinc-400 font-medium">/mo</span></h2>
                    <p className="text-sm text-zinc-500 mb-6">Lowest EMI guarantee for Honda Activa.</p>

                    <div className="flex gap-2">
                        <button className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200">
                            Apply Now
                        </button>
                        <button className="py-3 px-4 bg-zinc-50 text-zinc-900 rounded-xl font-bold text-sm border border-zinc-100">
                            Details
                        </button>
                    </div>
                </div>

                {/* Market Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-zinc-200/50">
                        <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center mb-3">
                            <ArrowUpRight size={16} className="text-green-600" />
                        </div>
                        <p className="text-2xl font-black text-zinc-900">380+</p>
                        <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Live Inventory</p>
                    </div>
                    <div className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-zinc-200/50">
                        <div className="w-8 h-8 bg-purple-50 rounded-full flex items-center justify-center mb-3">
                            <PieChart size={16} className="text-purple-600" />
                        </div>
                        <p className="text-2xl font-black text-zinc-900">8.5%</p>
                        <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Interest Rate</p>
                    </div>
                </div>

                {/* List View */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-zinc-900">Recent Transactions</h3>
                        <button className="text-xs font-bold text-blue-600">See All</button>
                    </div>
                    <div className="space-y-3">
                        {[
                            { name: 'KTM Duke 200', date: 'Today, 2:40 PM', price: '- ₹1.90L', icon: '🏍️' },
                            { name: 'Suzuki Access', date: 'Yesterday', price: '- ₹94,000', icon: '🛵' },
                            { name: 'Credit Report', date: 'Jan 28', price: 'Free', icon: '📄' },
                        ].map((item, i) => (
                            <div key={i} className="bg-white p-4 rounded-2xl flex items-center justify-between border border-zinc-100">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center text-lg">
                                        {item.icon}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-zinc-900">{item.name}</p>
                                        <p className="text-xs text-zinc-400">{item.date}</p>
                                    </div>
                                </div>
                                <span className={`text-sm font-bold ${item.price === 'Free' ? 'text-green-600' : 'text-zinc-900'}`}>{item.price}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <FintechDock />
        </div>
    );
};
