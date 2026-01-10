'use client';

import { useTenant } from '@/lib/tenant/tenantContext';
import { ChevronsUpDown, Check, Building2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export function WorkspaceSwitcher() {
    const { memberships, tenantId } = useTenant();
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [ref]);

    if (!memberships || memberships.length <= 1) return null; // Hide if only one workspace or error

    const activeTenant = memberships.find((m: any) => m.tenant_id === tenantId)?.tenants;

    const handleSwitch = (subdomain: string) => {
        // Construct URL based on current env
        // Production: https://[subdomain].bookmy.bike/dashboard
        // Dev: http://[subdomain].localhost:3000/dashboard (Need logic)

        const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'bookmy.bike';
        const protocol = window.location.protocol;
        const port = window.location.port ? `:${window.location.port}` : '';

        // If localhost, we assume subdomain.localhost format
        // If rootDomain is bookmy.bike, we assume subdomain.bookmy.bike

        const newUrl = `${protocol}//${subdomain}.${rootDomain}${port}/dashboard`;
        window.location.href = newUrl;
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
                <div className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded flex items-center justify-center">
                    <Building2 size={14} />
                </div>
                <span className="hidden md:inline max-w-[150px] truncate">{activeTenant?.name || 'Select Workspace'}</span>
                <ChevronsUpDown size={14} className="text-slate-400" />
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Switch Workspace</div>
                    {memberships.map((m: any) => {
                        const t = m.tenants;
                        const isActive = m.tenant_id === tenantId;
                        return (
                            <button
                                key={m.id}
                                onClick={() => handleSwitch(t.subdomain)}
                                className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between hover:bg-slate-50 transition-colors ${isActive ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700'}`}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${isActive ? 'bg-white text-indigo-700 shadow-sm' : 'bg-slate-100 text-slate-500'}`}>
                                        {t.name.charAt(0)}
                                    </div>
                                    <div className="flex flex-col truncate">
                                        <span className="truncate">{t.name}</span>
                                        <span className="text-[10px] text-slate-400 font-normal uppercase">{m.role.replace('_', ' ')}</span>
                                    </div>
                                </div>
                                {isActive && <Check size={16} />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
