import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const memberId = userData.user.id;
    const { data: wallet, error } = await supabase
        .from('oclub_wallets')
        .select('available_system, available_referral, available_sponsored, locked_referral, pending_sponsored')
        .eq('member_id', memberId)
        .maybeSingle();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const walletData = wallet as any;
    const availableSystem = walletData?.available_system || 0;
    const availableReferral = walletData?.available_referral || 0;
    const availableSponsored = walletData?.available_sponsored || 0;
    const lockedReferral = walletData?.locked_referral || 0;
    const pendingSponsored = walletData?.pending_sponsored || 0;
    const availableCoins = availableSystem + availableReferral + availableSponsored;

    return NextResponse.json({
        wallet: {
            availableSystem,
            availableReferral,
            availableSponsored,
            lockedReferral,
            pendingSponsored,
            availableCoins,
        },
    });
}
