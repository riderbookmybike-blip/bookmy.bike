import { createClient } from '@/lib/supabase/server';

export default async function HelpPage() {
    return (
        <div className="container mx-auto px-4 py-16">
            <div className="max-w-2xl mx-auto text-center">
                <h1 className="text-4xl font-bold mb-4 text-slate-900 dark:text-white">Help & Support</h1>
                <p className="text-gray-600 dark:text-slate-400 mb-8">How can we help you today?</p>
                <div className="bg-gray-50 dark:bg-slate-950 p-8 rounded-lg text-left space-y-4">
                    <div className="p-4 bg-white dark:bg-slate-900 rounded-md border border-gray-100 dark:border-white/10">
                        <h3 className="font-semibold">Contact Support</h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400">Email us at support@bookmy.bike</p>
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-900 rounded-md border border-gray-100 dark:border-white/10">
                        <h3 className="font-semibold">FAQs</h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400">Common questions about bookings and payments.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
