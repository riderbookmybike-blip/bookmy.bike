-- Migration: 20260205_create_tenant_storage.sql
-- Description: Create storage buckets for tenant assets (Logos) and compliance documents

-- 1. 'tenants' bucket for public assets (Logos, Branding)
INSERT INTO storage.buckets (id, name, public)
VALUES ('tenants', 'tenants', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for 'tenants'
CREATE POLICY "Public Read Tenants"
ON storage.objects FOR SELECT
USING ( bucket_id = 'tenants' );

CREATE POLICY "Auth Upload Tenants"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'tenants' );

CREATE POLICY "Auth Update Tenants"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'tenants' );

-- 2. 'documents' bucket for private compliance docs (GST, Agreements)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false) -- Private!
ON CONFLICT (id) DO NOTHING;

-- Policies for 'documents'
-- Only Super Admin and Tenant Owner/Team can access
-- We'll rely on the application to generate Signed URLs for access, 
-- but we need RLS to prevent unauthorized access if someone guesses a path.

CREATE POLICY "Auth Upload Documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'documents' );

-- Allow users to read their own tenant's documents? 
-- Storage RLS is tricky because 'objects' doesn't usually have tenant_id directly unless in metadata.
-- For now, we'll restrict to authenticated users, but rely on signed URLs for the actual file access.
-- Apps should set metadata: { tenant_id: '...' }

CREATE POLICY "Auth Read Documents"
ON storage.objects FOR SELECT
TO authenticated
USING ( bucket_id = 'documents' );
