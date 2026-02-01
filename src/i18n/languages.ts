export type LanguageStatus = 'ACTIVE' | 'PLANNED' | 'PAUSED';
export type TranslationScope = 'marketplace';

export interface TranslationLanguage {
    code: string;
    name: string;
    nativeName: string;
    status: LanguageStatus;
    provider: 'openai' | 'google' | 'deepl' | 'aws';
}

export const TRANSLATION_LANGUAGES: TranslationLanguage[] = [
    { code: 'en', name: 'English', nativeName: 'English', status: 'ACTIVE', provider: 'openai' },
    { code: 'hi', name: 'Hindi', nativeName: 'Hindi', status: 'ACTIVE', provider: 'openai' },
    { code: 'mr', name: 'Marathi', nativeName: 'Marathi', status: 'PLANNED', provider: 'openai' },
    { code: 'gu', name: 'Gujarati', nativeName: 'Gujarati', status: 'PLANNED', provider: 'openai' },
];

export const TRANSLATION_SCOPES: TranslationScope[] = ['marketplace'];

export const PROTECTED_TERMS = [
    'BookMyBike',
    'BMB',
    'EMI',
    'ABS',
    'CBS',
    'SKU',
    'PDP',
    'API',
    'On-Road',
    'On Road',
    'RTO',
    'GST',
    'TVS',
    'Jupiter',
    'Yamaha',
    'Honda',
    'Bajaj',
    'Suzuki',
    'KTM',
    'Aprilia',
    'Ather',
    'Chetak',
    'Vespa',
    'Hero',
];
