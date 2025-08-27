-- Create chat_messages table for live chat functionality
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('visitor', 'staff')),
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add missing fields to applications table
ALTER TABLE public.applications 
ADD COLUMN steam_name TEXT,
ADD COLUMN discord_name TEXT,
ADD COLUMN discord_tag TEXT,
ADD COLUMN fivem_name TEXT,
ADD COLUMN closed BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN closed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN closed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Enable RLS on chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for chat_messages
CREATE POLICY "Staff can view all chat messages" 
ON public.chat_messages 
FOR SELECT 
USING (is_staff(auth.uid()));

CREATE POLICY "Staff can insert chat messages" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (is_staff(auth.uid()) AND sender_type = 'staff');

CREATE POLICY "Visitors can view messages in their session" 
ON public.chat_messages 
FOR SELECT 
USING (
  session_id IN (
    SELECT id FROM public.chat_sessions 
    WHERE user_id = auth.uid() OR (user_id IS NULL AND auth.uid() IS NULL)
  )
);

CREATE POLICY "Visitors can insert messages in their session" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (
  sender_type = 'visitor' AND 
  session_id IN (
    SELECT id FROM public.chat_sessions 
    WHERE user_id = auth.uid() OR (user_id IS NULL AND auth.uid() IS NULL)
  )
);

-- Create trigger for chat_messages updated_at
CREATE TRIGGER update_chat_messages_updated_at
  BEFORE UPDATE ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at);
CREATE INDEX idx_applications_steam_name ON public.applications(steam_name);
CREATE INDEX idx_applications_discord_name ON public.applications(discord_name);
CREATE INDEX idx_applications_closed ON public.applications(closed);

-- Update existing applications with sample data from form_data
UPDATE public.applications 
SET 
  steam_name = COALESCE(form_data->>'steam_name', form_data->>'steamName', 'Unknown'),
  discord_name = COALESCE(form_data->>'discord_name', form_data->>'discordName', 'Unknown'),
  discord_tag = COALESCE(form_data->>'discord_tag', form_data->>'discordTag', 'Unknown#0000'),
  fivem_name = COALESCE(form_data->>'fivem_name', form_data->>'fivemName', 'Unknown')
WHERE steam_name IS NULL;