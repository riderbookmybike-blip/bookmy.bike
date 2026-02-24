'use client';

import { useEffect, useState } from 'react';
import { useTenant, Membership } from '@/lib/tenant/tenantContext';
import { useDealerSession } from '@/hooks/useDealerSession';
import { Building2, MapPin, CheckCircle2, Shield, Landmark, ChevronRight } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';

/**
 * DealershipGate — Full-screen overlay blocking marketplace for staff without active dealership.
 *
 * Shows when: isStaff === true && !sessionDealerId
 * Lists: memberships from useTenant() — dealerships for DEALER staff, financer-mapped dealers for BANK staff.
 * On select: calls setDealerContext() → persists in localStorage → gate closes.
 */
export function DealershipGate() {
    const { memberships, userRole, tenantType } = useTenant();
    const { dealerId: sessionDealerId, isLoaded, setDealerContext } = useDealerSession();
    const [selected, setSelected] = useState<string | null>(null);

    // Staff detection (same logic as LeadCaptureModal)
    const isStaff = userRole && userRole !== 'MEMBER' && userRole !== 'BMB_USER';

    // Don't render for non-staff or if dealer already active
    if (!isStaff || !isLoaded || sessionDealerId) return null;

    // Filter memberships to dealership-type tenants (type DEALER or DEALERSHIP)
    // For BANK staff, show dealer memberships they have access to
    const dealerMemberships = (memberships || []).filter((m: Membership) => {
        const tenantType = m.tenants?.type?.toUpperCase();
        return tenantType === 'DEALER' || tenantType === 'DEALERSHIP';
    });

    const financerMemberships = (memberships || []).filter((m: Membership) => {
        return m.tenants?.type?.toUpperCase() === 'BANK';
    });

    const isFinancer = tenantType === 'BANK' || financerMemberships.length > 0;

    // For financers, show all dealer memberships they have access to
    // For dealer staff, show their dealerships
    const displayMemberships = dealerMemberships.length > 0 ? dealerMemberships : financerMemberships;

    const handleSelect = (membership: Membership) => {
        const dealerId = membership.tenants?.id || membership.tenant_id;
        if (!dealerId) return;
        setSelected(dealerId);
        // Small delay for visual feedback
        setTimeout(() => {
            setDealerContext(dealerId);
        }, 300);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-500">
            <div className="w-full max-w-lg mx-4 animate-in zoom-in-95 slide-in-from-bottom-4 duration-700">
                {/* Header */}
                <div className="text-center mb-8 space-y-4">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-[1.75rem] bg-gradient-to-br from-brand-primary/20 to-brand-primary/5 border border-brand-primary/20 mb-2">
                        <Logo variant="icon" size={32} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white leading-none">
                            Select Dealership
                        </h2>
                        <p className="mt-2 text-sm font-bold text-slate-400 tracking-wide">
                            {isFinancer
                                ? 'Choose a dealership to access marketplace as financer'
                                : 'Activate a dealership context to browse marketplace'}
                        </p>
                    </div>
                    {isFinancer && (
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                            <Landmark className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">
                                Finance Partner Mode
                            </span>
                        </div>
                    )}
                </div>

                {/* Dealership List */}
                <div className="space-y-3 max-h-[60vh] overflow-y-auto px-1">
                    {displayMemberships.length === 0 ? (
                        <div className="text-center py-12 bg-white/5 rounded-3xl border border-white/10">
                            <Shield className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                            <p className="text-sm font-bold text-slate-500">No dealership memberships found</p>
                            <p className="text-xs text-slate-600 mt-1">Contact your administrator to get access</p>
                        </div>
                    ) : (
                        displayMemberships.map((m: Membership) => {
                            const dealerId = m.tenants?.id || m.tenant_id;
                            const isSelected = selected === dealerId;
                            const name = m.tenants?.name || 'Unknown Dealership';
                            const role = m.role || 'STAFF';
                            const type = m.tenants?.type?.toUpperCase() || 'DEALER';

                            return (
                                <button
                                    key={dealerId}
                                    onClick={() => handleSelect(m)}
                                    disabled={!!selected}
                                    className={`
                                        w-full group flex items-center gap-4 p-5 rounded-2xl border transition-all duration-300
                                        ${
                                            isSelected
                                                ? 'bg-brand-primary/10 border-brand-primary/40 scale-[0.98]'
                                                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 hover:translate-x-1'
                                        }
                                        disabled:opacity-50 active:scale-[0.97]
                                    `}
                                >
                                    {/* Icon */}
                                    <div
                                        className={`
                                        w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors
                                        ${
                                            isSelected
                                                ? 'bg-brand-primary text-black'
                                                : type === 'BANK'
                                                  ? 'bg-indigo-500/20 text-indigo-400'
                                                  : 'bg-emerald-500/20 text-emerald-400'
                                        }
                                    `}
                                    >
                                        {isSelected ? (
                                            <CheckCircle2 className="w-6 h-6 animate-in zoom-in-50 duration-300" />
                                        ) : type === 'BANK' ? (
                                            <Landmark className="w-5 h-5" />
                                        ) : (
                                            <Building2 className="w-5 h-5" />
                                        )}
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 text-left min-w-0">
                                        <p className="text-sm font-black text-white truncate tracking-tight">{name}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                                                {role}
                                            </span>
                                            {type === 'BANK' && (
                                                <>
                                                    <span className="text-slate-700">•</span>
                                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-500">
                                                        Financer
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Arrow */}
                                    {!isSelected && (
                                        <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <p className="text-center mt-6 text-[9px] font-bold uppercase tracking-[0.25em] text-slate-600">
                    Your selection persists across sessions
                </p>
            </div>
        </div>
    );
}
