-- Enable realtime for server_stats table
ALTER PUBLICATION supabase_realtime ADD TABLE server_stats;
ALTER TABLE server_stats REPLICA IDENTITY FULL;

-- Also enable realtime for individual_server_stats
ALTER PUBLICATION supabase_realtime ADD TABLE individual_server_stats;  
ALTER TABLE individual_server_stats REPLICA IDENTITY FULL;