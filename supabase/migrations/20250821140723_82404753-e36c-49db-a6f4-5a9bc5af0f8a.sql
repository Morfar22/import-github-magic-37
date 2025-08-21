-- Create storage policies for design assets in user-avatars bucket
-- Allow staff to upload design assets (hero images, etc.)
CREATE POLICY "Staff can upload design assets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'user-avatars' 
  AND (storage.foldername(name))[1] = 'design' 
  AND is_staff(auth.uid())
);

-- Allow staff to update design assets
CREATE POLICY "Staff can update design assets" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'user-avatars' 
  AND (storage.foldername(name))[1] = 'design' 
  AND is_staff(auth.uid())
);

-- Allow staff to delete design assets
CREATE POLICY "Staff can delete design assets" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'user-avatars' 
  AND (storage.foldername(name))[1] = 'design' 
  AND is_staff(auth.uid())
);

-- Allow public access to view design assets (for displaying hero images)
CREATE POLICY "Public can view design assets" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'user-avatars' 
  AND (storage.foldername(name))[1] = 'design'
);