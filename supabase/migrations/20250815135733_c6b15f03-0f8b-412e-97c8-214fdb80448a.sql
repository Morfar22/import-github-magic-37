-- Make age column nullable since custom forms might not have age fields
ALTER TABLE public.applications 
ALTER COLUMN age DROP NOT NULL;