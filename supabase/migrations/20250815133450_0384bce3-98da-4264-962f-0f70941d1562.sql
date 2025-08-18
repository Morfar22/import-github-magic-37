-- Check and fix the foreign key relationship between applications and profiles
-- First, let's see what foreign keys exist
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='applications';

-- Drop the existing foreign key if it exists (to recreate it properly)
ALTER TABLE public.applications 
DROP CONSTRAINT IF EXISTS applications_user_id_fkey;

-- Add the correct foreign key constraint
ALTER TABLE public.applications 
ADD CONSTRAINT applications_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;