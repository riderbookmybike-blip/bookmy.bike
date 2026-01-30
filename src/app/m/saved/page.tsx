import { MobileLayout } from '@/components/mobile/layout/MobileLayout';

export default function MobileSavedPage() {
    return (
        <MobileLayout>
            <div className="p-4">
                <h1 className="text-2xl font-black mb-2">Saved Bikes</h1>
                <p className="text-slate-600">Your favorite bikes will appear here</p>
            </div>
        </MobileLayout>
    );
}
