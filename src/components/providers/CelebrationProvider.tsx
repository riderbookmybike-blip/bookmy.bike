'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTenant } from '@/lib/tenant/tenantContext';
import CelebrateEffect, { CelebrationType } from '@/components/common/CelebrateEffect';

interface CelebrationContextType {
    triggerCelebration: (type: CelebrationType) => void;
}

const CelebrationContext = createContext<CelebrationContextType | undefined>(undefined);

export function CelebrationProvider({ children }: { children: React.ReactNode }) {
    const { tenantId } = useTenant();
    const [activeCelebration, setActiveCelebration] = useState<CelebrationType | null>(null);
    const supabase = createClient();

    useEffect(() => {
        if (!tenantId) return;

        // Use a tenant-specific channel for broadcasting celebrations
        const channelName = `tenant-celebrations-${tenantId}`;
        const channel = supabase.channel(channelName, {
            config: {
                broadcast: { self: true },
            },
        });

        channel
            .on('broadcast', { event: 'celebrate' }, (payload) => {
                console.log('Celebration received:', payload);
                if (payload.payload && payload.payload.type) {
                    setActiveCelebration(payload.payload.type);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [tenantId, supabase]);

    const triggerCelebration = (type: CelebrationType) => {
        if (!tenantId) return;

        const channelName = `tenant-celebrations-${tenantId}`;
        supabase.channel(channelName).send({
            type: 'broadcast',
            event: 'celebrate',
            payload: { type },
        });
    };

    return (
        <CelebrationContext.Provider value={{ triggerCelebration }}>
            {children}
            <CelebrateEffect
                type={activeCelebration}
                onComplete={() => setActiveCelebration(null)}
            />
        </CelebrationContext.Provider>
    );
}

export const useCelebration = () => {
    const context = useContext(CelebrationContext);
    if (context === undefined) {
        throw new Error('useCelebration must be used within a CelebrationProvider');
    }
    return context;
};
