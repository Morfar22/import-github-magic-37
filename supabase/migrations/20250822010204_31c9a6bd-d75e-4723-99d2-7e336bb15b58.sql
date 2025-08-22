-- Add banned users table for live chat
CREATE TABLE public.chat_banned_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  visitor_email TEXT,
  visitor_name TEXT,
  banned_by UUID NOT NULL,
  banned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reason TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_banned_users ENABLE ROW LEVEL SECURITY;

-- Staff can manage bans
CREATE POLICY "Staff can manage chat bans" 
ON public.chat_banned_users 
FOR ALL 
USING (is_staff(auth.uid()));

-- Add constraint to ensure either user_id or visitor_email is provided
ALTER TABLE public.chat_banned_users 
ADD CONSTRAINT check_user_identification 
CHECK (user_id IS NOT NULL OR visitor_email IS NOT NULL);