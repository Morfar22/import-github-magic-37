-- Add missing fields to applications table if they don't exist
DO $$ 
BEGIN
    -- Check and add steam_name column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'steam_name') THEN
        ALTER TABLE public.applications ADD COLUMN steam_name TEXT;
    END IF;
    
    -- Check and add discord_name column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'discord_name') THEN
        ALTER TABLE public.applications ADD COLUMN discord_name TEXT;
    END IF;
    
    -- Check and add discord_tag column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'discord_tag') THEN
        ALTER TABLE public.applications ADD COLUMN discord_tag TEXT;
    END IF;
    
    -- Check and add fivem_name column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'fivem_name') THEN
        ALTER TABLE public.applications ADD COLUMN fivem_name TEXT;
    END IF;
    
    -- Check and add closed column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'closed') THEN
        ALTER TABLE public.applications ADD COLUMN closed BOOLEAN NOT NULL DEFAULT false;
    END IF;
    
    -- Check and add closed_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'closed_at') THEN
        ALTER TABLE public.applications ADD COLUMN closed_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Check and add closed_by column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'closed_by') THEN
        ALTER TABLE public.applications ADD COLUMN closed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Update existing applications with sample data from form_data
UPDATE public.applications 
SET 
  steam_name = COALESCE(form_data->>'steam_name', form_data->>'steamName', 'Unknown'),
  discord_name = COALESCE(form_data->>'discord_name', form_data->>'discordName', 'Unknown'),
  discord_tag = COALESCE(form_data->>'discord_tag', form_data->>'discordTag', 'Unknown#0000'),
  fivem_name = COALESCE(form_data->>'fivem_name', form_data->>'fivemName', 'Unknown')
WHERE steam_name IS NULL OR discord_name IS NULL OR discord_tag IS NULL OR fivem_name IS NULL;