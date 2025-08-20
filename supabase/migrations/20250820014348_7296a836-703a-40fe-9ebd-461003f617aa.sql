-- Add Discord connection columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS discord_connected_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS discord_access_token text,
ADD COLUMN IF NOT EXISTS discord_refresh_token text,
ADD COLUMN IF NOT EXISTS discord_username text,
ADD COLUMN IF NOT EXISTS discord_discriminator text;