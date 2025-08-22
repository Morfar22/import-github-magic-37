-- Enable real-time for chat_banned_users table
ALTER TABLE public.chat_banned_users REPLICA IDENTITY FULL;

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_banned_users;