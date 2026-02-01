import { createHash } from 'crypto';
import { adminClient } from '@/lib/supabase/admin';
import { MARKETPLACE_SOURCE_STRINGS } from '@/i18n/marketplaceSource';
import { PROTECTED_TERMS, TRANSLATION_LANGUAGES } from '@/i18n/languages';

const OPENAI_API_URL = 'https://api.openai.com/v1/responses';
const GOOGLE_TRANSLATE_API_URL = 'https://translation.googleapis.com/language/translate/v2';
const DEFAULT_MODEL = process.env.OPENAI_TRANSLATION_MODEL || 'gpt-4o-mini';

const BATCH_SIZE = 40;

const toHash = (value: string) => createHash('sha256').update(value).digest('hex');

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const protectText = (text: string) => {
    let output = text;
    PROTECTED_TERMS.forEach((term, index) => {
        const placeholder = `[[BMB_TERM_${index}]]`;
        if (/[^\w]/.test(term)) {
            output = output.split(term).join(placeholder);
        } else {
            const regex = new RegExp(`\\b${escapeRegExp(term)}\\b`, 'g');
            output = output.replace(regex, placeholder);
        }
    });
    return output;
};

const restoreText = (text: string) => {
    let output = text;
    PROTECTED_TERMS.forEach((term, index) => {
        const placeholder = `[[BMB_TERM_${index}]]`;
        output = output.split(placeholder).join(term);
    });
    return output;
};

const chunkArray = <T>(items: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += size) {
        chunks.push(items.slice(i, i + size));
    }
    return chunks;
};

const extractResponseText = (payload: unknown): string => {
    if (!payload || typeof payload !== 'object') return '';
    const p = payload as { output_text?: string; output?: { content: { type: string; text: string }[] }[] };

    if (typeof p.output_text === 'string') return p.output_text;
    const output = p.output?.[0]?.content || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const textItem = output.find((item: any) => item.type === 'output_text') || output[0];
    return textItem?.text || '';
};

const buildPrompt = (languageName: string, languageCode: string, strings: string[]) => {
    return {
        system: `You are a professional translator for an Indian two-wheeler marketplace UI. Translate each input string from English to ${languageName} (${languageCode}). Keep protected terms unchanged. Preserve punctuation, casing, spacing, emojis, and numbers. Do not translate all-caps tokens or alphanumeric codes. Output JSON only.`,
        user: JSON.stringify({
            targetLanguage: `${languageName} (${languageCode})`,
            protectedTerms: PROTECTED_TERMS,
            strings,
        }),
    };
};

const translateBatchOpenAI = async (languageName: string, languageCode: string, strings: string[]) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error('Missing OPENAI_API_KEY');
    }

    const { system, user } = buildPrompt(languageName, languageCode, strings);

    const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: DEFAULT_MODEL,
            input: [
                { role: 'system', content: [{ type: 'input_text', text: system }] },
                { role: 'user', content: [{ type: 'input_text', text: user }] },
            ],
            text: {
                format: {
                    type: 'json_schema',
                    name: 'translation_batch',
                    schema: {
                        type: 'object',
                        additionalProperties: false,
                        properties: {
                            translations: {
                                type: 'array',
                                items: { type: 'string' },
                            },
                        },
                        required: ['translations'],
                    },
                    strict: true,
                },
            },
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI translation failed: ${response.status} ${errorText}`);
    }

    const payload = await response.json();
    const rawText = extractResponseText(payload);
    if (!rawText) throw new Error('OpenAI translation response was empty');

    const parsed = JSON.parse(rawText);
    const translations = parsed?.translations;
    if (!Array.isArray(translations)) {
        throw new Error('OpenAI translation response missing translations array');
    }
    if (translations.length !== strings.length) {
        throw new Error('OpenAI translation count mismatch');
    }

    return translations as string[];
};

const translateBatchGoogle = async (languageCode: string, strings: string[]) => {
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    if (!apiKey) {
        throw new Error('Missing GOOGLE_TRANSLATE_API_KEY');
    }

    const response = await fetch(`${GOOGLE_TRANSLATE_API_URL}?key=${encodeURIComponent(apiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            q: strings,
            source: 'en',
            target: languageCode,
            format: 'text',
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google translate failed: ${response.status} ${errorText}`);
    }

    const payload = await response.json();
    const translations = payload?.data?.translations || [];
    if (translations.length !== strings.length) {
        throw new Error('Google translation count mismatch');
    }

    return translations.map((item: { translatedText: string }) => item.translatedText);
};

const getProvider = (languageProvider?: string) => {
    const override = process.env.TRANSLATION_PROVIDER;
    return (override || languageProvider || 'openai').toLowerCase();
};

const translateBatch = async ({
    languageName,
    languageCode,
    provider,
    strings,
}: {
    languageName: string;
    languageCode: string;
    provider: string;
    strings: string[];
}) => {
    const protectedStrings = strings.map(protectText);

    let translations: string[];
    if (provider === 'google') {
        translations = await translateBatchGoogle(languageCode, protectedStrings);
    } else {
        translations = await translateBatchOpenAI(languageName, languageCode, protectedStrings);
    }

    return translations.map(restoreText);
};

const ensureLanguages = async () => {
    const rows = TRANSLATION_LANGUAGES.map(lang => ({
        code: lang.code,
        name: lang.name,
        native_name: lang.nativeName,
        status: lang.status,
        provider: lang.provider,
        is_active: lang.status === 'ACTIVE',
        updated_at: new Date().toISOString(),
    }));

    await adminClient.from('i18n_languages').upsert(rows, { onConflict: 'code' });
};

export const syncMarketplaceLanguage = async ({
    languageCode,
    triggeredBy = 'admin',
}: {
    languageCode: string;
    triggeredBy?: string;
}) => {
    await ensureLanguages();

    if (languageCode === 'en') {
        return { ok: true, skipped: true, message: 'English is the source language.' };
    }

    const language = TRANSLATION_LANGUAGES.find(lang => lang.code === languageCode);
    if (!language) {
        throw new Error(`Unsupported language: ${languageCode}`);
    }

    const provider = getProvider(language.provider);

    const sourceRows = MARKETPLACE_SOURCE_STRINGS.map(text => ({
        text,
        hash: toHash(text),
    }));

    const { data: existingSources } = await adminClient
        .from('i18n_source_strings')
        .select('hash');

    const existingHashSet = new Set((existingSources || []).map(row => row.hash));
    const newSources = sourceRows.filter(row => !existingHashSet.has(row.hash));

    if (newSources.length) {
        await adminClient
            .from('i18n_source_strings')
            .upsert(newSources, { onConflict: 'hash' });
    }

    const { data: existingTranslations } = await adminClient
        .from('i18n_translations')
        .select('source_hash')
        .eq('language_code', languageCode);

    const translatedHashSet = new Set((existingTranslations || []).map(row => row.source_hash));
    const missingTranslations = sourceRows.filter(row => !translatedHashSet.has(row.hash));

    const { data: run } = await adminClient
        .from('i18n_sync_runs')
        .insert({
            language_code: languageCode,
            scope: 'marketplace',
            status: 'RUNNING',
            started_at: new Date().toISOString(),
            total_strings: sourceRows.length,
            new_strings: newSources.length,
            translated_strings: 0,
            errors: 0,
            details: {
                triggeredBy,
                newStrings: newSources.slice(0, 50),
            },
        })
        .select()
        .single();

    let translatedCount = 0;
    let errorCount = 0;

    const batches = chunkArray(missingTranslations, BATCH_SIZE);
    for (const batch of batches) {
        try {
            const batchStrings = batch.map(item => item.text);
            const translations = await translateBatch({
                languageName: language.name,
                languageCode: language.code,
                provider,
                strings: batchStrings,
            });

            const now = new Date().toISOString();
            const rows = translations.map((translatedText, index) => ({
                source_hash: batch[index].hash,
                language_code: languageCode,
                translated_text: translatedText,
                provider,
                source_text: batch[index].text,
                updated_at: now,
            }));

            await adminClient
                .from('i18n_translations')
                .upsert(rows, { onConflict: 'source_hash,language_code' });

            translatedCount += rows.length;
        } catch (error) {
            console.error('[i18n] Batch translation failed:', error);
            errorCount += batch.length;
        }
    }

    if (run?.id) {
        await adminClient
            .from('i18n_sync_runs')
            .update({
                status: errorCount > 0 ? 'COMPLETED_WITH_ERRORS' : 'COMPLETED',
                completed_at: new Date().toISOString(),
                translated_strings: translatedCount,
                errors: errorCount,
            })
            .eq('id', run.id);
    }

    return {
        ok: true,
        language: languageCode,
        totalStrings: sourceRows.length,
        newStrings: newSources.length,
        translatedStrings: translatedCount,
        errors: errorCount,
    };
};

export const syncMarketplaceAll = async () => {
    const targets = TRANSLATION_LANGUAGES.filter(lang => lang.status === 'ACTIVE' && lang.code !== 'en');
    const results = [];

    for (const lang of targets) {
        const result = await syncMarketplaceLanguage({ languageCode: lang.code, triggeredBy: 'bulk' });
        results.push(result);
    }

    return results;
};
