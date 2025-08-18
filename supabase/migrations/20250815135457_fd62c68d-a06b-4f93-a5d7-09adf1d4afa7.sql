-- Add a form_data column to store custom application form responses
ALTER TABLE public.applications 
ADD COLUMN form_data jsonb DEFAULT '{}'::jsonb;

-- Make the fixed columns nullable since custom forms might not have them
ALTER TABLE public.applications 
ALTER COLUMN steam_name DROP NOT NULL,
ALTER COLUMN discord_tag DROP NOT NULL,
ALTER COLUMN fivem_name DROP NOT NULL,
ALTER COLUMN character_backstory DROP NOT NULL,
ALTER COLUMN rp_experience DROP NOT NULL;