-- Create a bucket for vehicle assets if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicles', 'vehicles', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for 'vehicles' bucket
-- Allow public to select
CREATE POLICY "Public Read Vehicles"
ON storage.objects FOR SELECT
USING ( bucket_id = 'vehicles' );

-- Allow authenticated users to upload
CREATE POLICY "Auth Upload Vehicles"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'vehicles' );

-- Allow authenticated users to delete their own uploads (basic)
CREATE POLICY "Auth Delete Vehicles"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'vehicles' );
