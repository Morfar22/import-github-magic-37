-- Enable real-time for individual_server_stats table if not already added
ALTER PUBLICATION supabase_realtime ADD TABLE individual_server_stats;

-- Set replica identity for proper real-time updates (if not already set)
ALTER TABLE individual_server_stats REPLICA IDENTITY FULL;