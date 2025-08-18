-- Create rules table for dynamic rule management
CREATE TABLE public.rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.rules ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Everyone can view active rules" 
ON public.rules 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Staff can manage all rules" 
ON public.rules 
FOR ALL 
USING (is_staff(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_rules_updated_at
BEFORE UPDATE ON public.rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default rules
INSERT INTO public.rules (category, title, description, order_index) VALUES
('General Rules', 'Respect All Players', 'Be respectful to all players and staff members', 1),
('General Rules', 'No Metagaming', 'No metagaming, powergaming, or fail RP', 2),
('General Rules', 'Stay In Character', 'Stay in character at all times while in city', 3),
('General Rules', 'Use OOC Sparingly', 'Use /ooc sparingly and only when necessary', 4),
('General Rules', 'No RDM/VDM', 'No random deathmatch (RDM) or vehicle deathmatch (VDM)', 5),

('Roleplay Rules', 'Realistic Characters', 'Create realistic and believable characters', 1),
('Roleplay Rules', 'Fear for Life', 'Fear for your character''s life in dangerous situations', 2),
('Roleplay Rules', 'No Superhuman Abilities', 'No unrealistic stunts or superhuman abilities', 3),
('Roleplay Rules', 'Proper Initiation', 'Proper initiation required before hostile actions', 4),
('Roleplay Rules', 'New Life Rule', 'New Life Rule applies after death scenarios', 5),

('Crime & Police', 'Group Limit', 'Maximum 4 players per criminal group', 1),
('Crime & Police', 'Probable Cause', 'Police must have probable cause for searches', 2),
('Crime & Police', 'No Camping', 'No camping police stations or hospitals', 3),
('Crime & Police', 'Realistic Pursuits', 'Realistic police pursuits and procedures', 4),
('Crime & Police', 'Hostage RP', 'Hostage situations require proper RP buildup', 5),

('EMS & Medical', 'Allow EMS Work', 'Allow EMS to do their job without interference', 1),
('EMS & Medical', 'No Combat Logging', 'No combat logging to avoid medical RP', 2),
('EMS & Medical', 'Safe Zones', 'Respect medical facilities as safe zones', 3),
('EMS & Medical', 'Injury RP', 'Proper injury RP based on damage taken', 4),
('EMS & Medical', 'EMS Authority', 'EMS has final say on medical situations', 5);