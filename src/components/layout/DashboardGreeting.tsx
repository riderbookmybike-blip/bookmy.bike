'use client';

import React, { useState, useEffect } from 'react';
import { Sun, CloudSun, Moon, Sunrise } from 'lucide-react';

export const DashboardGreeting = ({ userName = '' }: { userName?: string }) => {
    const [greeting, setGreeting] = useState('');
    const [icon, setIcon] = useState<React.ReactNode>(null);

    useEffect(() => {
        const updateGreeting = () => {
            const hour = new Date().getHours();
            if (hour >= 5 && hour < 12) {
                setGreeting('Good Morning');
                setIcon(<Sunrise size={18} className="text-amber-500" />);
            } else if (hour >= 12 && hour < 17) {
                setGreeting('Good Afternoon');
                setIcon(<Sun size={18} className="text-orange-500" />);
            } else if (hour >= 17 && hour < 21) {
                setGreeting('Good Evening');
                setIcon(<CloudSun size={18} className="text-indigo-400" />);
            } else {
                setGreeting('Good Night');
                setIcon(<Moon size={18} className="text-blue-400" />);
            }
        };

        updateGreeting();
        // Update every minute to keep it accurate
        const timer = setInterval(updateGreeting, 60000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-700">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm">
                {icon}
            </div>
            <div className="flex flex-col">
                <span className="text-sm font-black tracking-tight text-slate-900 dark:text-white leading-none">
                    {greeting}
                </span>
            </div>
        </div>
    );
};
