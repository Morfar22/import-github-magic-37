-- Create table for Twitch streamers
CREATE TABLE public.twitch_streamers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL,
  twitch_username TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable Row Level Security
ALTER TABLE public.twitch_streamers ENABLE ROW LEVEL SECURITY;

-- Create policies for public access to view active streamers
CREATE POLICY "Everyone can view active streamers" 
ON public.twitch_streamers 
FOR SELECT 
USING (is_active = true);

-- Create policies for staff to manage streamers
CREATE POLICY "Staff can manage streamers" 
ON public.twitch_streamers 
FOR ALL 
USING (is_staff(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_twitch_streamers_updated_at
BEFORE UPDATE ON public.twitch_streamers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();