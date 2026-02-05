'use server';

import { createClient } from '@/lib/supabase/server';

export interface PageDebugInfo {
    found: boolean;
    pageName?: string;
    filePath?: string;
    description?: string;
    status?: string;
    isLocked?: boolean;
    lockReason?: string;
    usedTables?: string[];
    generatedPrompt?: string;
}

export async function getPageDebugInfo(pathname: string): Promise<PageDebugInfo> {
    const supabase = await createClient();

    // 1. Fetch all registered pages with route patterns
    const { data: pages } = (await supabase.from('sys_page_registry').select('*').not('route_pattern', 'is', null)) as {
        data: any[] | null;
    };

    if (!pages) return { found: false };

    // 2. Find matching route
    // Simple logic: Convert [param] to regex wildcards
    const matchedPage = pages.find(p => {
        if (!p.route_pattern) return false;

        // Escape special regex chars except brackets
        let pattern = p.route_pattern.replace(/[.+^$(){}|]/g, '\\$&');

        // Replace Next.js dynamic segments [slug] with Regex capture group ([^/]+)
        // Handle catch-all sequences like [...slug] if necessary, but keep simple for now
        pattern = pattern.replace(/\[\.\.\..*?\]/g, '.*'); // Catch-all
        pattern = pattern.replace(/\[.*?\]/g, '[^/]+'); // Single segment

        const regex = new RegExp(`^${pattern}$`);
        return regex.test(pathname);
    });

    if (!matchedPage) {
        return {
            found: false,
            generatedPrompt: `CONTEXT: User is on path '${pathname}'. This page is NOT registered in sys_page_registry.`,
        };
    }

    // 3. Construct the "Copy Paste" Prompt
    const prompt = `CONTEXT:
Current Page: ${matchedPage.page_name}
File: ${matchedPage.file_path}
Status: ${matchedPage.status}
Locked: ${matchedPage.is_locked ? 'YES' : 'NO'}
Tables Used: ${JSON.stringify(matchedPage.used_tables)}

TASK: [Describe your change here]`;

    return {
        found: true,
        pageName: matchedPage.page_name,
        filePath: matchedPage.file_path,
        description: matchedPage.description,
        status: matchedPage.status,
        isLocked: matchedPage.is_locked,
        lockReason: matchedPage.lock_reason,
        usedTables: matchedPage.used_tables,
        generatedPrompt: prompt,
    };
}
