-- Create a dedicated bucket for design images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'design-assets',
  'design-assets', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']::text[]
);

-- Create RLS policies for design assets bucket
CREATE POLICY "Staff can upload design assets"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'design-assets' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'moderator')
  )
);

CREATE POLICY "Anyone can view design assets"
ON storage.objects
FOR SELECT
USING (bucket_id = 'design-assets');

CREATE POLICY "Staff can update design assets"
ON storage.objects  
FOR UPDATE
USING (
  bucket_id = 'design-assets'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'moderator')
  )
);

CREATE POLICY "Staff can delete design assets"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'design-assets'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'moderator')
  )
);