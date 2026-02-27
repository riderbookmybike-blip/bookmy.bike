import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getQuoteByDisplayId } from '@/actions/crm';
import { getOClubWallet, getOClubLedger } from '@/actions/oclub';
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

    // Guarded O-Club wallet + ledger fetch
    const memberId = quote.member_id || quote.lead?.customer_id || null;
    let wallet: any = null;
    let ledger: any[] = [];

    if (memberId) {
        try {
            const [walletRes, ledgerRes] = await Promise.all([getOClubWallet(memberId), getOClubLedger(memberId, 5)]);
            wallet = walletRes.success ? (walletRes as any).wallet : null;
            ledger = ledgerRes.success ? (ledgerRes as any).ledger || [] : [];
        } catch {
            // Degrade gracefully — dossier still renders without wallet data
        }
    }

    return <DossierClient quote={quote} wallet={wallet} ledger={ledger} />;
}
