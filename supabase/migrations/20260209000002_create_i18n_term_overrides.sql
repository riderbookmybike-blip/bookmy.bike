-- Create term overrides for script-only display (brands/models/variants/colors)

CREATE TABLE IF NOT EXISTS public.i18n_term_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    term_type TEXT NOT NULL CHECK (term_type IN ('brand', 'model', 'variant', 'color')),
    source_text TEXT NOT NULL,
    language_code TEXT NOT NULL REFERENCES public.i18n_languages(code) ON DELETE CASCADE,
    translated_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (term_type, source_text, language_code)
);

CREATE INDEX IF NOT EXISTS idx_i18n_term_overrides_lang ON public.i18n_term_overrides(language_code, term_type);

ALTER TABLE public.i18n_term_overrides ENABLE ROW LEVEL SECURITY;
