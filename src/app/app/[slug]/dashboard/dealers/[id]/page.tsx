'use client';

import React, { useState, useEffect } from 'react';
import DealerProfileContent from '@/components/dealers/DealerProfileContent';

export default function DealerProfilePage({ params }: { params: Promise<{ slug: string, id: string }> }) {
    const [id, setId] = useState<string>('');
    const [slug, setSlug] = useState<string>('');

    useEffect(() => {
        const init = async () => {
            const resolvedParams = await params;
            setId(resolvedParams.id);
            setSlug(resolvedParams.slug);
        };
        init();
    }, [params]);

    if (!id) return <div className="p-10 text-center text-slate-400">Loading Route...</div>;

    return (
        <DealerProfileContent
            dealerId={id}
            superAdminMode={true}
            currentTenantSlug={slug}
        />
    );
}
