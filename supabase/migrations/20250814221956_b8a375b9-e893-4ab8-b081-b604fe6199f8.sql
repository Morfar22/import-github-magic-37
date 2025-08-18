-- Create team_members table for the Our Team page
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  bio TEXT,
  image_url TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Everyone can view active team members" 
ON public.team_members 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Staff can manage team members" 
ON public.team_members 
FOR ALL 
USING (is_staff(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_team_members_updated_at
BEFORE UPDATE ON public.team_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();