-- Create chat sessions table
CREATE TABLE public.chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  visitor_name TEXT,
  visitor_email TEXT,
  status TEXT NOT NULL DEFAULT 'waiting',
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_status CHECK (status IN ('waiting', 'active', 'ended'))
);

-- Create chat messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_type TEXT NOT NULL DEFAULT 'user',
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_sender_type CHECK (sender_type IN ('user', 'staff', 'visitor'))
);

-- Enable RLS
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Chat sessions policies
CREATE POLICY "Users can view their own sessions" 
ON public.chat_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all sessions" 
ON public.chat_sessions 
FOR SELECT 
USING (is_staff(auth.uid()));

CREATE POLICY "Staff can update sessions" 
ON public.chat_sessions 
FOR UPDATE 
USING (is_staff(auth.uid()));

CREATE POLICY "Anyone can create sessions" 
ON public.chat_sessions 
FOR INSERT 
WITH CHECK (true);

-- Chat messages policies
CREATE POLICY "Users can view messages from their sessions" 
ON public.chat_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.chat_sessions 
    WHERE id = session_id AND user_id = auth.uid()
  ) OR is_staff(auth.uid())
);

CREATE POLICY "Users can create messages in their sessions" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_sessions 
    WHERE id = session_id AND (user_id = auth.uid() OR user_id IS NULL)
  ) OR is_staff(auth.uid())
);

CREATE POLICY "Staff can create messages in any session" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (is_staff(auth.uid()) AND sender_type = 'staff');

-- Create trigger for updated_at
CREATE TRIGGER update_chat_sessions_updated_at
BEFORE UPDATE ON public.chat_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add chat settings to server_settings
INSERT INTO public.server_settings (setting_key, setting_value) 
VALUES ('chat_settings', '{"enabled": false, "auto_assign": true, "max_concurrent_chats": 5}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

-- Set up realtime
ALTER TABLE public.chat_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;