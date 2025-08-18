-- Add server_online column to server_stats table
ALTER TABLE public.server_stats 
ADD COLUMN server_online BOOLEAN NOT NULL DEFAULT true;