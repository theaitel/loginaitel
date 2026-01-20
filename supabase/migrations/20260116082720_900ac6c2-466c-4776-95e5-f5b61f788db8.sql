-- Drop the engineer-only view policy and create a public read policy for demo audio
DROP POLICY IF EXISTS "Engineers can view their own demo audio" ON storage.objects;

-- Allow anyone to view demo audio (since admins need to review it and the bucket is already public)
CREATE POLICY "Anyone can view demo audio"
ON storage.objects
FOR SELECT
USING (bucket_id = 'demo-audio');