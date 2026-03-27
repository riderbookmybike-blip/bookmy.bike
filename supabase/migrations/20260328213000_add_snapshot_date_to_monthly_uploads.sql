-- Create the companion table for Daily Pacing (Rolling 35-day window)
CREATE TABLE IF NOT EXISTS public.vahan_two_wheeler_daily_snapshots (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    state_code TEXT NOT NULL,
    state_name TEXT,
    rto_code TEXT NOT NULL,
    rto_name TEXT,
    year INTEGER NOT NULL,
    month_no INTEGER NOT NULL,
    month_label TEXT,
    maker TEXT NOT NULL,
    units INTEGER NOT NULL DEFAULT 0,
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    source_file_name TEXT,
    fetched_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    -- Enforce 1 row per Maker per RTO per Snapshot Date
    CONSTRAINT vahan_two_wheeler_daily_snapshots_uq 
        UNIQUE (state_code, year, month_no, rto_code, maker, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_vahan_two_wheeler_daily_snapshot_date 
ON public.vahan_two_wheeler_daily_snapshots(snapshot_date);

-- Enable RLS
ALTER TABLE public.vahan_two_wheeler_daily_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable Read Access for All authenticated users"
ON public.vahan_two_wheeler_daily_snapshots FOR SELECT
TO authenticated
USING (true);
