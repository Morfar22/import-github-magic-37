-- Fix individual_server_stats table to match what the edge function expects
ALTER TABLE individual_server_stats ADD COLUMN IF NOT EXISTS last_updated timestamp with time zone DEFAULT now();