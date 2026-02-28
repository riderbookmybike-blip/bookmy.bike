import React from 'react';
import TvPdp from '@/components/store/tv/TvPdp';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'TV Product Detail | BookMyBike',
    description: 'Cinematic cockpit view for BookMyBike TV experience.',
};

export default function TvPdpPage() {
    return <TvPdp />;
}
