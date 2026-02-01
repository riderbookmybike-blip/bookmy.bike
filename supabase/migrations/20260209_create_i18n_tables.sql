-- Create i18n translation management tables

CREATE TABLE IF NOT EXISTS public.i18n_languages (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    native_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PLANNED',
    provider TEXT NOT NULL DEFAULT 'openai',
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.i18n_source_strings (
    hash TEXT PRIMARY KEY,
    text TEXT NOT NULL,
    context TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.i18n_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_hash TEXT NOT NULL REFERENCES public.i18n_source_strings(hash) ON DELETE CASCADE,
    language_code TEXT NOT NULL REFERENCES public.i18n_languages(code) ON DELETE CASCADE,
    translated_text TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT 'openai',
    source_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (source_hash, language_code)
);

CREATE TABLE IF NOT EXISTS public.i18n_sync_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language_code TEXT NOT NULL REFERENCES public.i18n_languages(code) ON DELETE CASCADE,
    scope TEXT NOT NULL DEFAULT 'marketplace',
    status TEXT NOT NULL DEFAULT 'RUNNING',
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    total_strings INT NOT NULL DEFAULT 0,
    new_strings INT NOT NULL DEFAULT 0,
    translated_strings INT NOT NULL DEFAULT 0,
    errors INT NOT NULL DEFAULT 0,
    details JSONB
);

CREATE INDEX IF NOT EXISTS idx_i18n_translations_language ON public.i18n_translations(language_code);
CREATE INDEX IF NOT EXISTS idx_i18n_sync_runs_language ON public.i18n_sync_runs(language_code, started_at DESC);

ALTER TABLE public.i18n_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.i18n_source_strings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.i18n_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.i18n_sync_runs ENABLE ROW LEVEL SECURITY;

-- Seed default languages
INSERT INTO public.i18n_languages (code, name, native_name, status, provider, is_active)
VALUES
    ('en', 'English', 'English', 'ACTIVE', 'openai', TRUE),
    ('hi', 'Hindi', 'Hindi', 'ACTIVE', 'openai', TRUE),
    ('mr', 'Marathi', 'Marathi', 'PLANNED', 'openai', FALSE),
    ('gu', 'Gujarati', 'Gujarati', 'PLANNED', 'openai', FALSE)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    native_name = EXCLUDED.native_name,
    status = EXCLUDED.status,
    provider = EXCLUDED.provider,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();
