import React from 'react';
import TvCatalog from '@/components/store/tv/TvCatalog';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'TV Catalog | BookMyBike',
    description: 'Cinematic gallery view for BookMyBike TV experience.',
};

export default function TvCatalogPage() {
    return <TvCatalog />;
}
