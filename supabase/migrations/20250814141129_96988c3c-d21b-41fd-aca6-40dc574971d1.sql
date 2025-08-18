-- Add discord_name column to applications table
ALTER TABLE public.applications 
ADD COLUMN discord_name text;