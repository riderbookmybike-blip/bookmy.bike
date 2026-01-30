import { MobileLayout } from '@/components/mobile/layout/MobileLayout';

export default function MobileQuotesPage() {
    return (
        <MobileLayout>
            <div className="p-4">
                <h1 className="text-2xl font-black mb-2">My Quotes</h1>
                <p className="text-slate-600">Your quote requests will appear here</p>
            </div>
        </MobileLayout>
    );
}
