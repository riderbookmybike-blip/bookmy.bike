import { createClient } from '@/lib/supabase/server';
import { MigrationClient } from '@/components/admin/migration/MigrationClient';

export default async function MigrationStudioPage() {
    const supabase = await createClient();

    // Fetch unique root collections
    const { data: collections } = await supabase
        .from('firebase_antigravity')
        .select('root_collection')
        .neq('root_collection', null);

    // Get unique collection names
    const uniqueCollections = Array.from(new Set(collections?.map(c => c.root_collection) || [])).sort();

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)]">
            <div className="flex-none p-6 pb-2 border-b border-slate-200 dark:border-white/10">
                <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white mb-1">
                    Migration Studio
                </h1>
                <p className="text-sm font-medium text-slate-500">
                    Review, edit, and migrate staged data.
                </p>
            </div>

            <div className="flex-1 overflow-hidden p-6">
                <MigrationClient initialCollections={uniqueCollections} />
            </div>
        </div>
    );
}
