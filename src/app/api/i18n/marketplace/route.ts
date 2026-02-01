import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const lang = (searchParams.get('lang') || 'en').toLowerCase();

    if (lang === 'en') {
        return NextResponse.json({ language: 'en', translations: {} });
    }

    const { data, error } = await adminClient
        .from('i18n_translations')
        .select('source_text, translated_text')
        .eq('language_code', lang);

    if (error) {
        return NextResponse.json({ language: lang, translations: {}, error: error.message }, { status: 500 });
    }

    const translations: Record<string, string> = {};
    (data || []).forEach(row => {
        if (row.source_text && row.translated_text) {
            translations[row.source_text] = row.translated_text;
        }
    });

    return NextResponse.json({ language: lang, translations });
}
