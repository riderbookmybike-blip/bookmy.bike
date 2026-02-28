import React from 'react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

interface DossierPageProps {
    params: { displayId: string };
}

export async function generateMetadata({ params }: DossierPageProps): Promise<Metadata> {
    const { displayId } = await params;
    return {
        title: `Quote Dossier | ${displayId}`,
        description: 'Your premium digital quote dossier from BookMyBike.',
        robots: 'noindex, nofollow',
    };
}

export default async function QuoteDossierPage({ params }: DossierPageProps) {
    const { displayId } = await params;
    redirect(`/dossier/${encodeURIComponent(displayId)}`);
}
