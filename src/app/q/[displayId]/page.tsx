import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getQuoteByDisplayId } from '@/actions/crm';
import DossierClient from './DossierClient';
import '@/styles/dossier.css';

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
    const result = await getQuoteByDisplayId(displayId);

    if (!result.success || !result.data) {
        notFound();
    }

    const quote = result.data;

    return <DossierClient quote={quote} />;
}
