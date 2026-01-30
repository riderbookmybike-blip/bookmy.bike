import React from 'react';
import BankFullDetail from '../BankFullDetail';

export default async function BankDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <BankFullDetail id={id} />;
}
