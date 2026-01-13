import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function WishlistPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    return (
        <div className="container mx-auto px-4 py-16">
            <div className="max-w-2xl mx-auto text-center">
                <h1 className="text-4xl font-bold mb-4">My Wishlist</h1>
                <p className="text-gray-600 mb-8">Coming Soon</p>
                <div className="bg-gray-50 p-8 rounded-lg">
                    <p className="text-sm text-gray-500">Saved bikes and favorites will be available here.</p>
                </div>
            </div>
        </div>
    );
}
