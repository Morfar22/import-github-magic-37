-- Fix profiles table by adding created_at column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Update existing profiles to have created_at values
UPDATE public.profiles 
SET created_at = updated_at 
WHERE created_at IS NULL;