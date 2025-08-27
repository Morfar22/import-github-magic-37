-- Enable real-time updates for chat messages
ALTER TABLE chat_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- Also enable for chat sessions to get status updates
ALTER TABLE chat_sessions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_sessions;