import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export type FinanceWinner = {
    scheme_id: string;
    scheme_code: string;
    lender_name: string;
    roi: number;
    monthly_emi: number;
    processing_fee: number;
    processing_fee_type: string;
};

export function useFinanceWinner(skuId: string | null, downpayment: number, tenure: number) {
    const [winner, setWinner] = useState<FinanceWinner | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!skuId || downpayment < 0 || tenure <= 0) {
            setWinner(null);
            return;
        }

        let isCancelled = false;

        const fetchWinner = async () => {
            setLoading(true);
            setError(null);
            try {
                const supabase = createClient();
                // @ts-ignore - Supabase types out of sync with new M8 RPC
                const { data, error: rpcError } = await supabase.rpc('get_fin_winner', {
                    p_sku_id: skuId,
                    p_downpayment: downpayment,
                    p_tenure: tenure,
                });

                if (isCancelled) return;

                if (rpcError) throw rpcError;

                const responseData = data as any[];
                if (responseData && responseData.length > 0) {
                    setWinner(responseData[0] as FinanceWinner);
                } else {
                    setWinner(null);
                }
            } catch (err: any) {
                if (!isCancelled) {
                    console.error('Failed to fetch finance winner:', err);
                    setError(err.message || 'Error occurred');
                    setWinner(null);
                }
            } finally {
                if (!isCancelled) {
                    setLoading(false);
                }
            }
        };

        const timeoutId = setTimeout(() => {
            fetchWinner();
        }, 400); // 400ms debounce

        return () => {
            isCancelled = true;
            clearTimeout(timeoutId);
        };
    }, [skuId, downpayment, tenure]);

    return { winner, loading, error };
}
