'use client';

import { useParams } from 'next/navigation';
import MembersPage from '@/components/modules/members/MembersPage';

export default function MemberDetailRoute() {
    const params = useParams();
    const memberId = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';

    return <MembersPage initialMemberId={memberId || undefined} />;
}
