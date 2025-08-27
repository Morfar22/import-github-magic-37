-- Enable real-time for server stats tables
ALTER PUBLICATION supabase_realtime ADD TABLE server_stats;
ALTER PUBLICATION supabase_realtime ADD TABLE individual_server_stats;

-- Set replica identity for proper real-time updates
ALTER TABLE server_stats REPLICA IDENTITY FULL;
ALTER TABLE individual_server_stats REPLICA IDENTITY FULL;