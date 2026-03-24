'use client';

import type { MemberEventType } from '@/lib/constants/member-tracking';

export type MemberTrackingDetail = {
    eventType: MemberEventType;
    payload?: Record<string, unknown>;
};

export function emitMemberTrackingEvent(eventType: MemberEventType, payload: Record<string, unknown> = {}) {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
        new CustomEvent<MemberTrackingDetail>('bmb:track', {
            detail: { eventType, payload },
        })
    );
}
