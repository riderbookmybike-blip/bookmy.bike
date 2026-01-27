-- Create Analytics Sessions Table
CREATE TABLE IF NOT EXISTS public.analytics_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    user_agent TEXT,
    ip_address TEXT,
    taluka TEXT,
    country TEXT,
    latitude FLOAT,
    longitude FLOAT,
    device_type TEXT,
    os_name TEXT,
    browser_name TEXT,
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (but allow public insert via admin client usually, or robust policy)
ALTER TABLE public.analytics_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (since session is created by client/middleware) 
-- OR strictly API side. The route uses `adminClient` which bypasses RLS.
-- So we strictly need RLS to prevent public access if exposed.
-- But for now, let's keep policies simple or empty since route uses adminClient.

-- Create Analytics Events Table
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.analytics_sessions(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    page_path TEXT,
    event_name TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON public.analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_user_id ON public.analytics_sessions(user_id);
