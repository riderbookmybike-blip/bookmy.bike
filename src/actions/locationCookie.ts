'use server';

import { cookies } from 'next/headers';

const COOKIE_NAME = 'bkmb_user_pincode';

export async function setLocationCookie(location: string | Record<string, unknown>) {
    const cookieStore = await cookies();
    const value = typeof location === 'string' ? JSON.stringify({ pincode: location }) : JSON.stringify(location);
    cookieStore.set(COOKIE_NAME, value, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
        httpOnly: true, // Not accessible via JS (secure)
        sameSite: 'lax',
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
