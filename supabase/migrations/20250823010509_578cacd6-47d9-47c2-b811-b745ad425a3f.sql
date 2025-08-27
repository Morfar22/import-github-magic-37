-- Create user-avatars storage bucket for profile images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-avatars', 'user-avatars', true);

-- Create RLS policies for user-avatars bucket
CREATE POLICY "Users can view all avatars" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'user-avatars');

CREATE POLICY "Users can upload their own avatar" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'user-avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'user-avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'user-avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);