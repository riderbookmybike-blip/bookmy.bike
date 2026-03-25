-- Create Blog Posts Table
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    author_id UUID REFERENCES auth.users(id),
    author_name TEXT, -- Fallback name
    image_url TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    read_time TEXT,
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public View Published Posts" ON public.blog_posts 
FOR SELECT USING (is_published = true OR auth.uid() = author_id);

CREATE POLICY "Admin CRUD Posts" ON public.blog_posts 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM memberships 
        WHERE user_id = auth.uid() 
        AND role IN ('SUPER_ADMIN', 'MARKETPLACE_ADMIN')
    )
);

-- Function to handle auto-slug if needed or just use UI
