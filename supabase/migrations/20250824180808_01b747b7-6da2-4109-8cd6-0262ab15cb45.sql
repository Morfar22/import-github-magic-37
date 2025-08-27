-- Add image_url column to packages table
ALTER TABLE public.packages 
ADD COLUMN image_url TEXT;