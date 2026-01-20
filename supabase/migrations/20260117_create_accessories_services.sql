-- Create Accessories Table
CREATE TABLE IF NOT EXISTS public.accessories (
    id TEXT PRIMARY KEY, -- Using text ID to match frontend constants (e.g. 'acc-lock')
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    discount_price NUMERIC DEFAULT 0,
    max_qty INTEGER DEFAULT 1,
    is_mandatory BOOLEAN DEFAULT FALSE,
    image_url TEXT,
    category TEXT DEFAULT 'GENERAL',
    
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for Accessories
ALTER TABLE public.accessories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public View Accessories" ON public.accessories FOR SELECT USING (true);

CREATE POLICY "Admin Manage Accessories" ON public.accessories FOR ALL USING (
    EXISTS (SELECT 1 FROM memberships WHERE user_id = auth.uid() AND role IN ('SUPER_ADMIN', 'MARKETPLACE_ADMIN'))
);

-- Seed Accessories (From usePDPData.ts)
INSERT INTO public.accessories (id, name, description, price, discount_price, max_qty, is_mandatory, category)
VALUES 
    ('acc-lock', 'Smart Lock Security', 'GPS-enabled anti-theft locking system with mobile alerts.', 1200, 0, 1, true, 'SAFETY'),
    ('acc-numberplate', 'HSRP Number Plate', 'Government mandated high security registration plate.', 850, 0, 1, true, 'LEGAL'),
    ('acc-guard', 'Chrome Crash Guard', 'Heavy-duty stainless steel protection for engine and body.', 2400, 2100, 1, false, 'PROTECTION'),
    ('acc-cover', 'All-Weather Cover', 'Waterproof styling cover with UV protection coating.', 950, 0, 2, false, 'PROTECTION'),
    ('acc-grips', 'Comfort Palm Grips', 'Ergonomic rubber grips for reduced vibration fatigue.', 450, 0, 2, false, 'COMFORT'),
    ('acc-seat', 'Touring Seat Overlay', 'Gel-padded seat cover for long distance comfort.', 1500, 1250, 1, false, 'COMFORT')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    description = EXCLUDED.description;


-- Create Services Table
CREATE TABLE IF NOT EXISTS public.services (
    id TEXT PRIMARY KEY, -- e.g. 'srv-amc'
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    discount_price NUMERIC DEFAULT 0,
    max_qty INTEGER DEFAULT 1,
    duration_months INTEGER,
    
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for Services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public View Services" ON public.services FOR SELECT USING (true);

CREATE POLICY "Admin Manage Services" ON public.services FOR ALL USING (
    EXISTS (SELECT 1 FROM memberships WHERE user_id = auth.uid() AND role IN ('SUPER_ADMIN', 'MARKETPLACE_ADMIN'))
);

-- Seed Services (From usePDPData.ts)
INSERT INTO public.services (id, name, description, price, discount_price, max_qty, duration_months)
VALUES
    ('srv-amc', 'Annual Maintenance Contract', 'Pre-paid service package for 1 year including consumables.', 2500, 2000, 3, 12),
    ('srv-teflon', '3M Teflon Coating', 'Paint protection treatment for long-lasting shine.', 1200, 0, 1, NULL)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    description = EXCLUDED.description;
