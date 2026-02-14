'use client';

import { useEffect, useState } from 'react';

export interface OClubWalletSummary {
    availableCoins: number;
    lockedReferral: number;
    pendingSponsored: number;
    availableSystem: number;
    availableReferral: number;
    availableSponsored: number;
}

export function useOClubWallet() {
    const [wallet, setWallet] = useState<OClubWalletSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        const load = async () => {
            try {
                const res = await fetch('/api/me/oclub-wallet');
                if (!res.ok) {
                    if (active) {
                        setWallet(null);
                        setLoading(false);
                    }
                    return;
                }
                const data = await res.json();
                if (!active) return;
                if (data.wallet) {
                    const w = data.wallet;
                    setWallet({
                        availableCoins: Number(w.availableCoins || 0),
                        availableSystem: Number(w.availableSystem || 0),
                        availableReferral: Number(w.availableReferral || 0),
                        availableSponsored: Number(w.availableSponsored || 0),
                        lockedReferral: Number(w.lockedReferral || 0),
                        pendingSponsored: Number(w.pendingSponsored || 0),
                    });
                } else {
                    setWallet(null);
                }
            } catch {
                if (active) setWallet(null);
            } finally {
                if (active) setLoading(false);
            }
        };
        load();
        return () => {
            active = false;
        };
    }, []);

    return {
        wallet,
        loading,
        isLoggedIn: wallet !== null,
        availableCoins: wallet?.availableCoins || 0,
    };
}
