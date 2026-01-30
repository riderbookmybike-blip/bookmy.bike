import { MobileLayout } from '@/components/mobile/layout/MobileLayout';

export default function MobileProfilePage() {
    return (
        <MobileLayout>
            <div className="p-4">
                <h1 className="text-2xl font-black mb-2">Profile</h1>
                <p className="text-slate-600">Your profile and settings</p>
            </div>
        </MobileLayout>
    );
}
