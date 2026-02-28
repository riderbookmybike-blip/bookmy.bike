import React from 'react';
import TvHome from '@/components/store/tv/TvHome';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'BookMyBike Showroom | TV Experience',
    description: 'Standalone cinematic showroom experience for BookMyBike.',
};

export default function TvCatalogPage() {
    return <TvHome />;
}
