'use server';

import { cookies } from 'next/headers';

const COOKIE_NAME = 'bmb_dealer_session';

export type DealerSessionCookiePayload = {
    mode: 'TEAM';
    activeDealerTenantId?: string | null;
    activeFinanceTenantId?: string | null;
};

export async function setDealerSessionCookie(payload: DealerSessionCookiePayload) {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, JSON.stringify(payload), {
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
    });
}

export async function clearDealerSessionCookie() {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
}
