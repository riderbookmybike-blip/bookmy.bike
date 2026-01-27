'use server';

import { cookies } from 'next/headers';

const COOKIE_NAME = 'bkmb_user_pincode';

export async function setLocationCookie(pincode: string) {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, pincode, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
        httpOnly: true, // Not accessible via JS (secure)
        sameSite: 'lax'
    });
}

export async function removeLocationCookie() {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
}

export async function getLocationCookie() {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(COOKIE_NAME);
    return cookie?.value || null;
}
