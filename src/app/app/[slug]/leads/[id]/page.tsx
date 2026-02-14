'use client';

import { useParams } from 'next/navigation';
import LeadsPage from '@/components/modules/leads/LeadsPage';

export default function LeadDetailRoute() {
    const params = useParams();
    const leadId = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';

    return <LeadsPage initialLeadId={leadId || undefined} />;
}
